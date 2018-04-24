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

Create a queue that is limited to `parallel` concurrent workers. `worker` will be
invoked with `(task, next)`, where `task` is whatever is `push`ed onto the queue
and `next` is a normal callback function, passed an optional error as the first
argument and up to three return values from succeeding arguments. These
arguments will be passed on to the `done` callback in `push`.

### `var cancel = queue.push(task, done)`

Queue `task` and call `cb` when done.  `queue.push` will return a function that
you can invoke to cancel the task, which in turn will invoke `cb` with a `Error`
with `err.cancel === true`. If the task has already started, there is no way
to cancel it, and it will not release a slot in the queue until done. If the
`queue` has been `destroy`ed, tasks will not be queued and `done` will be
invoked immediately with an error.

**Note**: The task will not be executed before the `nextTick` as to avoid the
`worker` function from plugging the event loop. This means you can `.push` and
`cancel` as many tasks as you want synchronously, also from within the callback.

**Note 2**: You can cancel a running task, but that does not mean the actual work
done by the `worker` is stopped, just that the `cb` supplied to `.push` is
removed from the queue and called with an `Error`. The slot in the queue will be
released as soon as the running worker calls the supplied `next` callback.

### `queue.destroy([err])`

Cancel all pending tasks, and call the callback of all running tasks with an
error. If `err` is not given, the default error will be used (see above).

### `queue.parallel`

Number of tasks that can run in parallel. This is read-only

### `queue.pending`

Number of tasks pending in the queue. This is excluding the current task
if accessed from within the worker function

### `queue.running`

Number of tasks running in the queue. This is including the current task
if accessed from within the worker function.

### `queue.destroyed`

Boolean set after `destroy` has finished

## Install

```sh
npm install parallel-queue
```

## License

[ISC](LICENSE.md)
