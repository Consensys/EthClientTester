var cluster = require('cluster');
var config = require('./config.js');
var run = require('./run.js');

let numNodes = config.nodes.length;
let numTests = config.tests.length;

if (cluster.isMaster) {
  let numWorkers = numNodes;
  let workers = [];
  let testIndex = 0;

  function isLastWorkerToBeInitialized(worker) {
    let isLastToBeInitialized = false;
    let initializedCount = numWorkers;
    for (let index = 0; index < numWorkers; index++) {
      if (!workers[index].isInitialized) {
        initializedCount--;
      }
    }
    if (initializedCount == numWorkers - 1) {
      isLastToBeInitialized = true;
    }
    worker.isInitialized = true;
    return isLastToBeInitialized;
  }

  function isLastWorkerToBePrepared(worker) {
    let isLastToBePrepared = false;
    let preparedCount = numWorkers;
    for (let index = 0; index < numWorkers; index++) {
      if (!workers[index].isPrepared) {
        preparedCount--;
      }
    }
    if (preparedCount == numWorkers - 1) {
      isLastToBePrepared = true;
    }
    worker.isPrepared = true;
    return isLastToBePrepared;
  }

  function prepareAllWorkers() {
    for (let index = 0; index < numWorkers; index++) {
      workers[index].send({command: 'prepare', params: [testIndex]});
    }
  }

  function startAllWorkers() {
    for (let index = 0; index < numWorkers; index++) {
      workers[index].send({command: 'start', params: [testIndex]});
    }
  }
  
  for (let index = 0; index < numWorkers; index++) {
    let worker = cluster.fork();
    worker.isInitialized = false;
    worker.isPrepared = false;
    worker.isStarted = false;
    worker.on('message', function(res) {
      if (res.completed == true) {
        if (res.msg.command == 'initialize') {
          if (isLastWorkerToBeInitialized(worker)) {
            prepareAllWorkers();
          }
        } else if (res.msg.command == 'prepare') {
          if (isLastWorkerToBePrepared(worker)) {
            startAllWorkers();
          }
        }
      }
    });
    workers.push(worker);
    worker.send({command: 'initialize', params: [index]});
  }
  
} else {
  let nodeIndex = -1;
  let testIndex = -1;
  let res;
  
  function handleWorkCompleted() {
    res.completed = true;
    process.send(res);
  }

  process.on('message', function(msg) {
    res = {};
    if (msg.command == 'initialize') {
      nodeIndex = msg.params[0];
      console.log("Initializing " + nodeIndex);
      res.nodeIndex = nodeIndex;
      res.msg = msg;
      run.Initialize(nodeIndex, handleWorkCompleted);
    } else if (msg.command == 'prepare') {
      testIndex = msg.params[0];
      console.log("Preparing " + nodeIndex);
      res.nodeIndex = nodeIndex;
      res.testIndex = testIndex;
      res.msg = msg;
      run.Prepare(nodeIndex, testIndex, handleWorkCompleted);
    } else if (msg.command == 'start') {
      testIndex = msg.params[0];
      console.log("Starting " + nodeIndex);
      res.testIndex = testIndex;
      res.nodeIndex = nodeIndex;
      res.msg = msg;
      //run.Start(nodeIndex, testIndex, handleWorkCompleted);
    }
  });
}
