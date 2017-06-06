# `parallel-queue`

[![Build Status](https://travis-ci.org/emilbayes/parallel-queue.svg?branch=master)](https://travis-ci.org/emilbayes/parallel-queue)

> Run tasks in parallel, but queue after a certain limit

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

### `var queue = parallelQueue(limit, worker)`

### `var cancel = queue.push(task, cb)`

### `queue.destroy([err])`

## Install

```sh
npm install parallel-queue
```

## License

[ISC](LICENSE.md)
