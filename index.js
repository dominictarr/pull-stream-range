var pull = require('pull-stream')

exports = module.exports = 
pull.pipeableSource(function (getStream, compare, length, min, max) {
  if(!compare) throw new Error('must provide compare(a, b)')
  if(min == null)
    return getStream(0)
      .pipe(range(min, max, compare))
  //getStream(n) returns an iterator (pull-stream style)
  //that starts in the nth block.
  //length is the number of blocks.
  //compare is a sort function like Array#sort(comparator)
  
  var defer = pull.defer()

  if(length !== Math.round(length))
    throw new Error('length must be whole number')

  ;(function recurse (left, right, lStream, rStream, lPeek, rPeek) {
    if(left + 1 === right) {
      return defer.resolve(lStream || rStream)
    }

    var middle = Math.round((left + right) / 2)
    middle = Math.min(Math.max(0, middle), length)

    var mStream =
      getStream(middle)
      .pipe(peek(function (end, mPeek) {

      if(end) {
        throw new Error('empty stream should never happen')
      }
        if(compare(mPeek, min) === 0)
          return defer.resolve(mStream)
        else if(compare(mPeek, min) > 0)
          recurse(left, middle, lStream, mStream, lPeek, mPeek)
        else
          recurse(middle, right, mStream, rStream, mPeek, rPeek)
      }))

  })(-1, length)

  return defer.pipe(range(min, max, compare))
})

var range = exports.range = function (min, max, compare) {
  compare = compare || function (a, b) {
    return ( a < b ? -1 
           : a > b ?  1 
           :          0 )
  } 
  return pull.filter(function (data) {
    if(!data) return false
    return min == null || (compare(min, data) <= 0) // && compare(data, max) <= 0)
  }).pipe(pull.take(function (data) {
    return max == null || (compare(data, max) <= 0)
  }))
}


//get the first item from a stream,
//and return a new stream that 

var peek = exports.peek = pull.pipeable(function (read, cb) {
  var ended, _cb, _data, ready = false

  read(null, function (end, data) {
    ended = ended || end
    _data = data
    //incase read has responded syncly,
    //delay the callback so some one can recieve the returned read!)
    process.nextTick(function () {
      cb(ended, _data)
      ready = true
      if(_cb) _cb(ended, _data)
    })
  })

  return function (end, cb) {
    //end immediately, if ending...
    if(end) return read(end, cb)
    //only allow one peek!
    if(_cb && !ready)
      throw new Error('read must not be called until after callback')
    if(!ready)    _cb = cb
    else if(!_cb) _cb = true, cb(ended, _data)
    else          read(end, cb)

  }
})


