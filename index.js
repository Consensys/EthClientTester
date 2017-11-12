var async = require('async');
var init = require('./init.js');
var run = require('./run.js');
var accounts = require('./accounts.js');
var config = require('./config.js');

function start() {
  let results = [];
  for (let index = 0; index < config.nodes.length; index++) {
    results[index] = {};
    results[index].web3RPCHost = config.nodes[index].web3RPCHost;
    results[index].web3RPCPort = config.nodes[index].web3RPCPort;
  }

  let parTasks = [];
  for (let index = 0; index < results.length; index++) {
    parTasks.push(function(callback) {
      let result = results[index];
      let seqTasks = [
        function(callback) { callback(null, result) },
        init.Web3RPCTimeout,
        init.ExtendWeb3,
        accounts.Sync
      ];
      seqTasks = run.Configure(seqTasks);
      async.waterfall(seqTasks, function(err, res) {
        if (err) { 
          console.log("ERROR in parallel task " + index, err);
          callback(err, null); 
        } else {
          //console.log("[INFO] Completed. Exiting...");
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
