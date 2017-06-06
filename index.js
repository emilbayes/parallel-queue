module.exports = ParallelQueue

function ParallelQueue (parallel, worker) {
  if (!(this instanceof ParallelQueue)) return new ParallelQueue(parallel, worker)

  this._worker = worker
  this._queue = []
  this._running = []
  this.parallel = parallel
  this.destroyed = false
}

Object.defineProperty(ParallelQueue.prototype, 'pending', {
  enumerable: true,
  get: function () {
    return this._queue.length
  }
})

ParallelQueue.prototype.push = function (task, cb) {
  if (this.destroyed === true) return cb(new Error('Already destroyed'))
  var args = {
    task: task,
    cb: cb
  }

  this._queue.push(args)

  this._kick()

  return this._cancel.bind(this, args)
}

ParallelQueue.prototype.destroy = function (err) {
  while (this._queue.length) this._cancel(this._queue[0], err)
  while (this._running.length) this._cancel(this._running[0], err)
  this.destroyed = true
}

ParallelQueue.prototype._cancel = function (args, err) {
  var qidx = this._queue.indexOf(args)
  if (qidx >= 0) {
    this._queue.splice(qidx, 1)
  }

  var ridx = this._running.indexOf(args)
  if (ridx >= 0) {
    this._running.splice(ridx, 1)
  }

  if (ridx < 0 && qidx < 0) return

  if (err == null) {
    err = new Error('Cancelled operation')
    err.cancel = true
  }

  process.nextTick(args.cb, err, null)
}

ParallelQueue.prototype._kick = function () {
  if (this._running.length >= this.parallel) return

  var args = this._queue.shift()
  if (args == null) return

  this._running.push(args)

  this._worker(args.task, done)

  var self = this
  function done (err, res1, res2, res3) {
    var idx = self._running.indexOf(args)
    if (idx >= 0) {
      self._running.splice(idx, 1)
    }

    process.nextTick(function () {
      if (idx >= 0) args.cb(err, res1, res2, res3)
      self._kick()
    })
  }
}
