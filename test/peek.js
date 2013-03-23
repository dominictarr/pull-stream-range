
var pull = require('pull-stream')
var peek = require('../').peek
var test = require('tape')

test('peek', function (t) {

  var array = [Math.random(), Math.random(), Math.random()]

  var ra = pull.readArray(array)
  var peeked = false

  ra
  .pipe(peek(function (end, data) {
    t.equal(end, null)
    t.equal(data, array[0])
    peeked = true
  }))
  .pipe(pull.writeArray(function (err, _array) {
    t.ok(peeked)
    t.deepEqual(_array, array)
    t.end()
  }))
})


test('peek with async pipe', function (t) {

  var array = [Math.random(), Math.random(), Math.random()]

  var ra = pull.readArray(array)
  var peeked = false

  ra = 
  ra.pipe(peek(function (end, data) {
    t.equal(end, null)
    t.equal(data, array[0])
    peeked = true
    ra.pipe(pull.writeArray(function (err, _array) {
      t.ok(peeked)
      t.deepEqual(_array, array)
      t.end()
    }))
  }))

})

