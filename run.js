var async = require('async');
var init = require('./init.js');
var config = require('./config.js');

var results = [];

function requireTest(testName) {
  return require('./tests/' + testName);
}

function doSequence(seq, cb) {
  async.waterfall(seq, function(err, res) {
    if (err) { 
      cb(err, null); 
    } else {
      cb(null, res); 
    }
  });
}

function initialize(nodeIndex, dateString, numLogDirs, cb) {
  let result = {};
  let name = config.nodes[nodeIndex].name;
  let host = config.nodes[nodeIndex].web3RPCHost;
  let port = config.nodes[nodeIndex].web3RPCPort;
  let instanceString = name + '_' + host + '_' + port;
  result.name = name;
  result.web3RPCHost = host;
  result.web3RPCPort = port;
  result.logOptions = {
    logPathRoot: config.logPathRoot,
    logDirTest: numLogDirs + "-" + dateString,
    logDirInstance: instanceString
  };
  /*  logs, accounts, contracts, and transactions are initialized here
      as non-singleton objects. Since they will be used in different
      threads (one for each node), this is not really necessary, but
      just makes it a little clearer that each thread has its own
      copy that will not be touched by any other thread.
  */
  result.log = new (require('./log.js'));
  result.accounts = new (require('./accounts.js'));
  result.contracts = new (require('./contracts.js'));
  result.transactions = new (require('./transactions.js'));
  result.metrics = new (require('./metrics.js'));
  result.blockchain = new (require('./blockchain.js'));
  results[nodeIndex] = result;
  let seq = [
    function(callback) { callback(null, result) },
    result.log.Initialize,
    init.Web3RPCTimeout,
    init.ExtendWeb3,
    result.accounts.Sync
  ];
  doSequence(seq, cb);
}

function prepare(nodeIndex, testIndex, cb) {
  let result = results[nodeIndex];
  if (config.nodes[nodeIndex].genTraffic === true) {
    let numTests = config.tests.length;
    let seq = [function(callback) { callback(null, result); }];
    let test = requireTest(config.tests[testIndex])
    test.prepare(seq);
    doSequence(seq, cb);
  } else {
    cb(null, result);
  }
}

function execute(nodeIndex, testIndex, cb) {
  let result = results[nodeIndex];
  if (config.nodes[nodeIndex].genTraffic === true) {
    let numTests = config.tests.length;
    let seq = [function(callback) { callback(null, result); }];
    let test = requireTest(config.tests[testIndex])
    test.execute(seq);
    doSequence(seq, cb);
  } else {
    cb(null, result);
  }
}

module.exports.Initialize = initialize;
module.exports.Prepare = prepare;
module.exports.Execute = execute;
module.exports.Results = results;
