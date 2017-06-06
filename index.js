module.exports = ParallelQueue

function ParallelQueue (limit, worker) {
  if (!(this instanceof ParallelQueue)) return new ParallelQueue(limit, worker)

  this._queue = []
  this._running = []
  this.parallel = limit
}

Object.defineProperty(ParallelQueue.prototype, 'pending', {
  enumerable: true,
  get: function () {
    return this._queue.length
  }
})

ParallelQueue.prototype.push = function (task, cb) {
  var args = {
    task: task,
    cb: cb
  }

  this._queue.push(args)

  this._kick()

  return this._cancel.bind(this, args)
}

ParallelQueue.prototype.destroy = function (err) {
  var i
  for (i = 0; i < this._queue.length; i++) this._cancel(this._queue[i], err)
  for (i = 0; i < this._running.length; i++) this._cancel(this._running[i], err)
}

ParallelQueue.prototype._cancel = function (args, err) {
  var idx = this._queue.indexOf(args)
  if (idx < 0) {
    // Look in _running if not in _queue
    idx = this._running.indexOf(args)
    if (idx < 0) return
  }

  this._queue.splice(idx, 1)

  if (err == null) {
    err = new Error('Cancelled operation')
    err.cancel = true
  }

  process.nextTick(args.cb, err, null)
}

ParallelQueue.prototype._kick = function () {
  if (this._running >= this.parallel) return

  var args = this._queue.shift()
  if (args == null) return

  this._running.push(args)

  this._worker(args.task, done)

  var self = this
  function done (err, res1, res2, res3) {
    process.nextTick(function () {
      var idx = self._running.indexOf(args)
      if (idx >= 0) {
        self._running.splice(idx, 1)
        args.cb(err, res1, res2, res3)
      }

      self._kick()
    })
  }
}
