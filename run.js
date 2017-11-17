var async = require('async');
var init = require('./init.js');
var config = require('./config.js');

var results = [];
var date = new Date();
var dateString = date.getUTCFullYear() + '-' + 
  date.getUTCMonth() + '-' + date.getUTCDay() + '_' + 
  date.getUTCHours() + '-' + date.getUTCMinutes();

for (let index = 0; index < config.nodes.length; index++) {
  let name = config.nodes[index].name;
  let host = config.nodes[index].web3RPCHost;
  let port = config.nodes[index].web3RPCPort;
  let instanceString = name + '_' + host + '_' + port;
  results[index] = {};
  results[index].name = name;
  results[index].web3RPCHost = host;
  results[index].web3RPCPort = port;
  results[index].logOptions = {
    logPathRoot: config.logPathRoot,
    logDirTest: dateString,
    logDirInstance: instanceString
  };
  /*  logs, accounts, contracts, and transactions are initialized here
      as non-singleton objects. Since they will be used in different
      threads (one for each node), this is not really necessary, but
      just makes it a little clearer that each thread has its own
      copy that will not be touched by any other thread.
  */
  results[index].log = new (require('./log.js'));
  results[index].accounts = new (require('./accounts.js'));
  results[index].contracts = new (require('./contracts.js'));
  results[index].transactions = new (require('./transactions.js'));
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

function initialize(nodeIndex, cb) {
  let result = results[nodeIndex];
  let seq = [
    function(callback) { callback(null, result) },
    init.Web3RPCTimeout,
    init.ExtendWeb3,
    result.log.Initialize,
    result.accounts.Sync
  ];
  doSequence(seq, cb);
}

function prepare(nodeIndex, testIndex, cb) {
  let numTests = config.tests.length;
  let result = results[nodeIndex];
  let seq = [function(callback) { callback(null, result); }];
  config.tests[testIndex].prepare(seq);
  doSequence(seq, cb);
}

function execute(nodeIndex, testIndex, cb) {
  let numTests = config.tests.length;
  let result = results[nodeIndex];
  let seq = [function(callback) { callback(null, result); }];
  config.tests[testIndex].execute(seq);
  doSequence(seq, cb);
}

module.exports.Initialize = initialize;
module.exports.Prepare = prepare;
module.exports.Execute = execute;
