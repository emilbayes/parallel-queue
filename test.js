var test = require('tape')
var queue = require('.')

test('pending', function (assert) {
  assert.plan(3)
  var q = queue(1, function (wait, cb) {
    setTimeout(cb, wait)
  })

  q.push(1, function (err) {
    assert.error(err)
  })

  q.push(2, function (err) {
    assert.error(err)
  })

  assert.equal(q.pending, 1)
})

test('push push then cancel', function (assert) {
  assert.plan(2)
  var q = queue(1, function (wait, cb) {
    process.nextTick(cb, null)
  })

  q.push(1, function (err) {
    assert.error(err)
  })

  ;(q.push(2, function (err) {
    assert.ok(err.cancel)
  }))()
})

test('cancel immediately', function (assert) {
  var q = queue(1, function (wait, cb) {
    process.nextTick(cb, null)
  })

  ;(q.push(1, function (err) {
    assert.ok(err.cancel)
    assert.end()
  }))()
})

test('destory', function (assert) {
  assert.plan(5)

  var q = queue(1, function (wait, cb) {
    process.nextTick(cb)
  })

  q.push(1001, function (err) { assert.ok(err.cancel, 1) })
  q.push(1002, function (err) { assert.ok(err.cancel, 2) })
  q.push(1003, function (err) { assert.ok(err.cancel, 3) })
  q.push(1004, function (err) { assert.ok(err.cancel, 4) })
  q.push(1005, function (err) { assert.ok(err.cancel, 5) })

  q.destroy()
})

test('destroy with custom error', function (assert) {
  assert.plan(5)

  var q = queue(1, function (wait, cb) {
    process.nextTick(cb, null, wait)
  })

  q.push(1, function (err) {
    assert.ok(err.custom)
  })
  q.push(1, function (err) {
    assert.ok(err.custom)
  })
  q.push(1000, function (err) {
    assert.ok(err.custom)
  })
  q.push(1000, function (err) {
    assert.ok(err.custom)
  })
  q.push(1000, function (err) {
    assert.ok(err.custom)
  })

  var e = new Error('custom')
  e.custom = true
  q.destroy(e)
})

test('push after destroyed', function (assert) {
  var q = queue(1, function (wait, cb) {
    setTimeout(cb, wait)
  })

  q.destroy()

  q.push(0, function (err) {
    assert.ok(err)
    assert.end()
  })
})
