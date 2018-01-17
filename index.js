var cluster = require('cluster');
var fs = require('fs');
var config = require('./config.js');
config = loadSettings();
var run = require('./run.js');
var numNodes = config.nodes.length;
var numTests = config.tests.length;

if (cluster.isMaster) {
  let numWorkers = numNodes;
  let workers = [];
  let testIndex = 0;
  let intervalID = null;
  let date = new Date();
  let dateString = date.getUTCFullYear() + '_' + 
    (date.getUTCMonth() + 1) + '_' + date.getUTCDate() + '-' + 
    date.getUTCHours() + '_' + date.getUTCMinutes();
  if (!fs.existsSync(config.logPathRoot)) {
    fs.mkdirSync(config.logPathRoot);
  } 
  let numLogDirs = getNumDirsIn(config.logPathRoot);

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
      workers[index].send({command: 'initialize', params: [index, dateString, numLogDirs]});
      // Also initialize the master thread's instance of run.Results
      run.Initialize(index, dateString, numLogDirs, function(err, res){});
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

  function startFetchingProbeData() {
    if (config.probeDataFetchPeriod > 0) {
      intervalID = setInterval(function() {
        for (let index = 0; index < numWorkers; index++) {
          run.Results[index].metrics.Fetch(run.Results[index], function(){});
        }
      }, config.probeDataFetchPeriod);
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
            startFetchingProbeData();
            startAllWorkers();
          }
        } else if (res.msg.command == 'execute') {
          if (isLastWorkerToBeFinished(worker)) {
            console.log("Exiting...")
            cluster.disconnect(function() {
              clearInterval(intervalID);
              console.log("Bye!");
            });
          }
        }
      }
    });
    workers.push(worker);
  }
  displaySettings(numLogDirs, dateString);
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
      dateString = msg.params[1];
      numLogDirs = msg.params[2];
      res.nodeIndex = nodeIndex;
      res.dateString = dateString;
      res.numLogDirs = numLogDirs;
      res.msg = msg;
      run.Initialize(nodeIndex, dateString, numLogDirs, handleWorkCompleted);
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

function loadSettings() {
  let env = process.env;

  /*  Path to the root log directory
  */
  let path = require('path');
  config.logPathRoot = env.LOG_PATH_ROOT ? env.LOG_PATH_ROOT : path.resolve(__dirname, 'logs');

  config.clientType = config.clientType ? config.clientType : 'ethereumjs-testrpc';
  config.clientType = env.CLIENT_TYPE ? env.CLIENT_TYPE : config.clientType;

  /*  When using testrpc, the number of accounts
      will need to be specified when testrpc is
      started (use the -a=... option), and these 
      accounts will all be unlocked automatically.
  */
  /*  Number of accounts on test node that are always
      automatically unlocked when node starts (this is
      a node setting, so numInitiallyUnlockedAccounts
      should correspond with how the node is set up)
  */
  let numInitiallyUnlockedAccounts = 0;  
  if (config.clientType == 'ethereumjs-testrpc') {
    numInitiallyUnlockedAccounts = 10; // this is the default for testrpc
  }
  config.numInitiallyUnlockedAccounts = env.NUM_INITIALLY_UNLOCKED_ACCOUNTS ? env.NUM_INITIALLY_UNLOCKED_ACCOUNTS : numInitiallyUnlockedAccounts;
  /*  These can be changed if the necessary accounts 
      have already been created/unlocked
      These will typically be false when using testrpc
      and true when using quorum
  */
  let doAccountCreation = true;
  let doAccountUnlocking = true;
  let doEtherRedistribution = true;
  if (config.clientType == 'ethereumjs-testrpc') {
    doAccountCreation = false;
    doAccountUnlocking = false;
    doEtherRedistribution = false;
  }
  config.doAccountCreation = env.DO_ACCOUNT_CREATION ? env.DO_ACCOUNT_CREATION : doAccountCreation;
  config.doAccountUnlocking = env.DO_ACCOUNT_UNLOCKING ? env.DO_ACCOUNT_UNLOCKING : doAccountUnlocking;
  config.doEtherRedistribution = env.DO_ETHER_REDISTRIBUTION ? env.DO_ETHER_REDISTRIBUTION : doEtherRedistribution;

  /*  Miscellaneous settings
  */
  config.web3RPCInitTimeoutMillis = 10000; // exits with error if it takes longer than this
  config.accountUnlockThreadLimit = 5;    // number of concurrent threads limited to this

  /*  Remote Probe settings
  */
  config.probeDataFetchPeriod = env.PROBE_DATA_FETCH_PERIOD ? env.PROBE_DATA_FETCH_PERIOD : 0; // a value of 0 disables fetching of probe data

  /*  Specify a max number of errors to be logged (checked individually per node). 
      Prevents error log file being spammed when something breaks.
  */
  config.maxNumErrors = env.MAX_NUM_ERRORS ? env.MAX_NUM_ERRORS : 10000;

  return config;
}

function getNumDirsIn(dir) {
  let { join } = require('path');
  let { lstatSync, readdirSync } = require('fs');
  let fs = require('fs');
  let dirs = fs.readdirSync(dir);
  return (dirs.length + 1);
}

function displaySettings(numLogDirs, dateString) {
  console.log("Started with the following settings:");
  console.log();
  console.log("CLIENT_TYPE =", config.clientType);
  console.log("NUM_INITIALLY_UNLOCKED_ACCOUNTS =", config.numInitiallyUnlockedAccounts);
  console.log("DO_ACCOUNT_CREATION =", config.doAccountCreation);
  console.log("DO_ACCOUNT_UNLOCKING =", config.doAccountUnlocking);
  console.log("DO_ETHER_REDISTRIBUTION =", config.doEtherRedistribution);
  console.log("LOG_PATH_ROOT =", config.logPathRoot);
  console.log("MAX_NUM_ERRORS =", config.maxNumErrors);
  console.log("PROBE_DATA_FETCH_PERIOD =", config.probeDataFetchPeriod);
  console.log();
  console.log("Connecting to " + config.nodes.length + " node(s)");
  console.log("Running tests: ", config.tests);
  console.log("Data can be found in " + config.logPathRoot + "/" + numLogDirs + "-" + dateString);
  console.log();
}
