
var pull = require('pull-stream')
var blockRange = require('../')
var test = require('tape')
var range = blockRange.range

var array = []
var l = 1000
var blockSize = 100
var blocks = l / blockSize
var accessed = {}

while (l --)
  array.push(Math.random())
array.sort()
 
var getStream = pull.pipeableSource(function (n) {
    var i = n * blockSize
    console.log(i)
    return function (end, cb) {
      accessed[n] = (accessed[n] || 0) + 1
      if(end) return cb(end)
      if(i >= array.length) return cb(true)
      cb(null, array[i++])
    }
  })

 
function makeTest (min, max, check) {
  var _min = min != null ? Math.min(min, max) : null
  var _max = max != null ? Math.max(min, max) : null
  min = _min; max = _max

  test('random array (' + min + ', ' + max + ')', function (t) {

  /*
    function createComparator(target) {
      return function (a) {
        return ( a < target ? -1 
               : a > target ?  1 
               :               0 )
      } 
    }
  */

  /*
    var min = Math.random()
    var max = min + (Math.random()/3)
  */

    blockRange(getStream, blocks, min, max)
      .pipe(pull.writeArray(function (end, actual) {
        var accessed1 = accessed
        accessed = {}
        console.log(accessed)
        getStream(0)
          .pipe(range(min, max, false))
          .pipe(pull.writeArray(function (end, expected) {
            t.equal(actual.length, expected.length)
            if(!min && !max)
              t.notDeepEqual(actual, [])
            t.deepEqual(actual, expected)
            console.log('RETRIVED:', actual.length)
            if(check) check(t, actual, expected)
            t.end()
          }))
      }))
  })
}

makeTest(0.5, 0.6)
makeTest(Math.random(), Math.random())
makeTest(Math.random(), Math.random())
makeTest(Math.random(), Math.random())
makeTest(Math.random(), Math.random())
makeTest(Math.random(), Math.random())
makeTest(Math.random(), Math.random())
makeTest(0.95, 1)
makeTest(0.99, 1)
makeTest(0.1, 0.99)
makeTest(0, 0.1)
makeTest(-1, -1)

function makeExactTest () {
  var r = array[~~(Math.random() * array.length)]
  makeTest(r, r, function (t, actual, expected) {
    t.deepEqual([r], actual, "EXACT")
  }) //EXACT

}

makeExactTest()
makeExactTest()
makeExactTest()
makeExactTest()
makeExactTest()
makeExactTest()

//makeTest(-1, 0)

makeTest(null, null)

