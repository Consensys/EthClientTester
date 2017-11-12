var async = require('async');
var init = require('./init.js');
var config = require('./config.js');

function start() {
  let results = [];
  for (let index = 0; index < config.nodes.length; index++) {
    results[index] = {};
    results[index].web3RPCHost = config.nodes[index].web3RPCHost;
    results[index].web3RPCPort = config.nodes[index].web3RPCPort;
    results[index].accounts = new (require('./accounts.js'));
    results[index].contracts = new (require('./contracts.js'));
    results[index].transactions = new (require('./transactions.js'));
  }

  let parTasks = [];
  for (let index = 0; index < results.length; index++) {
    parTasks.push(function(callback) {
      let result = results[index];
      let seqTasks = [
        function(callback) { callback(null, result) },
        init.Web3RPCTimeout,
        init.ExtendWeb3,
        result.accounts.Sync
      ];
      for (let index = 0; index < config.tests.length; index++) {
        seqTasks = config.tests[index].add(seqTasks);
        if (index < config.tests.length-1) {
          seqTasks.push(function(result, cb) {
            result.accounts.Sync(result,cb);
          });
        }
      }
      async.waterfall(seqTasks, function(err, res) {
        if (err) { 
          console.log("ERROR in parallel task " + index, err);
          callback(err, null); 
        } else {
          callback(null, 1); 
        }
      });
    });
  }

  async.parallel(parTasks, function(err, res) {
    if (err) {
    } else {
      console.log("[INFO] All tasks sucessfully completed. Exiting...");
    }
  });
}

start();
