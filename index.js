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

Object.defineProperty(ParallelQueue.prototype, 'running', {
  enumerable: true,
  get: function () {
    return this._running.length
  }
})

ParallelQueue.prototype.push = function (task, cb) {
  if (this.destroyed === true) return cb(new Error('Already destroyed'))
  var args = {
    task: task,
    cb: cb
  }

  this._queue.push(args)

  process.nextTick(this._kick.bind(this))

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
  var self = this
  if (self._running.length >= self.parallel) return

  var args = self._queue.shift()
  if (args == null) return

  self._running.push(args)

  self._worker(args.task, done)

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
