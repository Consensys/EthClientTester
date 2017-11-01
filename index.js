var async = require('async');
var init = require('./init.js');
var run = require('./run.js');
var accounts = require('./accounts.js');

function start() {
  let result = {};
  let seqInitTasks = [
    function(callback) { callback(null, result) },
    init.Web3RPCTimeout,
    init.ExtendWeb3,
    accounts.Sync
  ];
  let seqRunTasks = [
    function(callback) { callback(null, result) }
  ];  
  
  seqRunTasks = run.Configure(seqRunTasks);

  async.waterfall(seqInitTasks, function(err, res) {
    if (err) { 
      console.log("ERROR", err) 
    } else {
      async.waterfall(seqRunTasks, function(err, res) {
        if (err) { 
          console.log("ERROR", err) 
        } else {
          console.log("[INFO] Completed. Exiting...");
        }
      });
    }
  });
}

start();
