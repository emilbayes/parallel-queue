var test = require('tape')
var queue = require('.')

test('pending', function (assert) {
  assert.plan(4)
  var q = queue(1, function pending (wait, cb) {
    process.nextTick(cb, null, wait)
  })

  q.push(1, function (err, value) {
    assert.error(err)
  })

  q.push(2, function (err) {
    assert.error(err)
  })

  assert.equal(q.pending, 2)
  assert.equal(q.running, 0)
})

test('running', function (assert) {
  assert.plan(8)
  var q = queue(1, function pending (wait, cb) {
    assert.equal(q.pending, 2 - wait)
    assert.equal(q.running, 1)
    process.nextTick(cb, null, wait)
  })

  q.push(1, function (err, value) {
    assert.error(err)
  })

  q.push(2, function (err) {
    assert.error(err)
  })

  process.nextTick(function () {
    assert.equal(q.pending, 1)
    assert.equal(q.running, 1)
  })
})

test('run then cancel', function (assert) {
  assert.plan(2)
  var q = queue(1, function pending (wait, cb) {
    process.nextTick(cb, null, wait)
  })

  q.push(1, function (err, value) {
    assert.error(err)

    ;(q.push(2, function (err) {
      assert.ok(err.cancel)
    }))()
  })
})

test('push push then cancel', function (assert) {
  assert.plan(2)
  var q = queue(1, function cancel (wait, cb) {
    process.nextTick(cb, null, wait)
  })

  q.push(1, function (err) {
    assert.error(err)
  })

  ;(q.push(2, function (err) {
    assert.ok(err.cancel)
  }))()
})

test('cancel immediately', function cancelNow (assert) {
  var q = queue(1, function (wait, cb) {
    process.nextTick(cb, null, wait)
  })

  ;(q.push(1, function (err) {
    assert.ok(err.cancel)
    assert.end()
  }))()
})

test('destory', function (assert) {
  assert.plan(5)

  var q = queue(1, function destory (wait, cb) {
    process.nextTick(cb, null, wait)
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

  var q = queue(1, function customError (wait, cb) {
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
  var q = queue(1, function pushAfterDestory (wait, cb) {
    process.nextTick(cb, null, wait)
  })

  q.destroy()

  q.push(0, function (err) {
    assert.ok(err)
    assert.end()
  })
})

function cancel (id, q, assert, e) {
  var completed = false
  return q.push(id, function (err, iid) {
    if (completed === true) return assert.fail('called twice')
    completed = true
    if (e) assert.equal(err, e, 'errors should be equal')
    else assert.ok(err, 'should get error ' + id)
    assert.equal(iid, null, 'ids should be equal ' + iid)
  })
}

function complete (id, q, assert) {
  var completed = false
  q.push(id, function (err, iid) {
    if (completed === true) return assert.fail('called twice')
    completed = true
    assert.error(err, 'errored by getting err ' + iid)
    assert.equal(iid, id, 'ids should be equal ' + iid)
  })
  return function () {}
}

// I don't think this fuzzing is right
test.skip('fuzz', function (assert) {
  var que = queue(25, function fuzz (id, cb) {
    process.nextTick(cb, null, id)
  })

  debugger

  ;[
    complete(0, que, assert),
    cancel(1, que, assert),
    cancel(2, que, assert),
    cancel(3, que, assert),
    cancel(4, que, assert),
    cancel(5, que, assert),
    complete(6, que, assert),
    complete(7, que, assert),
    cancel(8, que, assert),
    complete(9, que, assert),
    cancel(10, que, assert),
    complete(11, que, assert),
    cancel(12, que, assert),
    cancel(13, que, assert),
    cancel(14, que, assert),
    complete(15, que, assert),
    complete(16, que, assert),
    complete(17, que, assert),
    complete(18, que, assert),
    complete(19, que, assert),
    complete(20, que, assert),
    complete(21, que, assert),
    complete(22, que, assert),
    complete(23, que, assert),
    complete(24, que, assert),
    complete(25, que, assert),
    complete(26, que, assert),
    complete(27, que, assert),
    complete(28, que, assert),
    complete(29, que, assert),
    complete(30, que, assert),
    complete(31, que, assert),
    complete(32, que, assert),
    complete(33, que, assert),
    complete(34, que, assert),
    cancel(35, que, assert),
    cancel(36, que, assert),
    cancel(37, que, assert),
    cancel(38, que, assert),
    cancel(39, que, assert),
    cancel(40, que, assert)
  ].forEach(function (fn) {
    fn()
  })

  setTimeout(function () {
    que.destroy()

    que.push(999, function (err) {
      assert.ok(err)
      assert.end()
    })
  }, 250) // defer at least a couple of ticks
})
