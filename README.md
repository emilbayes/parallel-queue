# `parallel-queue`

[![Build Status](https://travis-ci.org/emilbayes/parallel-queue.svg?branch=master)](https://travis-ci.org/emilbayes/parallel-queue)

> Queue for parallel tasks that can cancel and is destoryable

## Usage

```js
var parallelQueue = require('parallel-queue')

var pq = parallelQueue(4, function (args, done) {
  setTimeout(done, args.wait)
})

pq.push({wait: 30000})

// Cancel all pending tasks, and invoke callback on all running tasks with error
pq.destroy()
```

## API

### `var queue = parallelQueue(parallel, worker)`

Create a queue that is limited to `limit` concurrent workers. `worker` will be
invoked with `(task, cb)`.

### `var cancel = queue.push(task, cb)`

Queue `task` and call `cb` when done.  `queue.push` will return a function that
you can invoke to cancel the task, which in turn will invoke `cb` with a `Error`
with `err.cancel === true`. If the `queue` has been `destroy`ed the callback
will be invoked immediately with an error.

### `queue.destroy([err])`

Cancel all pending tasks, and call the callback of all running tasks with an
error. If `err` is not given, the default error will be used (see above).

### `queue.parallel`

Number of tasks that can run in parallel

### `queue.pending`

Number of tasks pending in the queue

### `queue.destroyed`

Boolean set after `destroy` has finished

## Install

```sh
npm install parallel-queue
```

## License

[ISC](LICENSE.md)
