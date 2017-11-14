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

  function isLastWorkerToBeFinished(worker) {
    let isLastToBeFinished = false;
    let finishedCount = numWorkers;
    for (let index = 0; index < numWorkers; index++) {
      if (!workers[index].isFinished) {
        finishedCount--;
      }
    }
    if (finishedCount == numWorkers - 1) {
      isLastToBeFinished = true;
    }
    worker.isFinished = true;
    return isLastToBeFinished;
  }

  function initializeAllWorkers() {
    console.log("Initializing...");
    for (let index = 0; index < numWorkers; index++) {
      workers[index].send({command: 'initialize', params: [index]});
    }
  }

  function prepareAllWorkers() {
    console.log("Preparing...");
    for (let index = 0; index < numWorkers; index++) {
      workers[index].send({command: 'prepare', params: [testIndex]});
    }
  }

  function startAllWorkers() {
    console.log("Executing...");
    for (let index = 0; index < numWorkers; index++) {
      workers[index].send({command: 'execute', params: [testIndex]});
    }
  }
  
  for (let index = 0; index < numWorkers; index++) {
    let worker = cluster.fork();
    worker.isInitialized = false;
    worker.isPrepared = false;
    worker.isStarted = false;
    worker.isFinished = false;
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
        } else if (res.msg.command == 'execute') {
          //worker.kill()
          if (isLastWorkerToBeFinished(worker)) {
            console.log("Exiting...")
            cluster.disconnect(function() {
              console.log("Bye!");
            });
          }
        }
      }
    });
    workers.push(worker);
  }

  initializeAllWorkers();
  
} else {
  let nodeIndex = -1;
  let testIndex = -1;
  let res;
  
  function handleWorkCompleted() {
    res.completed = true;
    console.log("[" + config.nodes[nodeIndex].name + "@" + 
      config.nodes[nodeIndex].web3RPCHost + ":" + 
      config.nodes[nodeIndex].web3RPCPort + "]: <" + 
      res.msg.command + "> completed");
    process.send(res);
  }

  process.on('message', function(msg) {
    res = {};
    if (msg.command == 'initialize') {
      nodeIndex = msg.params[0];
      res.nodeIndex = nodeIndex;
      res.msg = msg;
      run.Initialize(nodeIndex, handleWorkCompleted);
    } else if (msg.command == 'prepare') {
      testIndex = msg.params[0];
      res.nodeIndex = nodeIndex;
      res.testIndex = testIndex;
      res.msg = msg;
      run.Prepare(nodeIndex, testIndex, handleWorkCompleted);
    } else if (msg.command == 'execute') {
      testIndex = msg.params[0];
      res.testIndex = testIndex;
      res.nodeIndex = nodeIndex;
      res.msg = msg;
      run.Execute(nodeIndex, testIndex, handleWorkCompleted);
    }
  });

  process.on('disconnect', function() {
    console.log("[" + config.nodes[nodeIndex].name + "@" + 
      config.nodes[nodeIndex].web3RPCHost + ":" + 
      config.nodes[nodeIndex].web3RPCPort + "]: exited");
  });
}
