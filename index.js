var async = require('async');
var init = require('./init.js');
var accounts = require('./accounts.js');
var transactions = require('./transactions.js');
var blockchain = require('./blockchain.js');

function run() {
  let seqInit = async.seq(
    init.Web3RPCTimeout,
    init.ExtendWeb3,
    accounts.Create,
    accounts.Unlock,
    accounts.GetBalances,
    accounts.CollectFunds,
    accounts.DistributeFunds
  );
  
  let seqRun = async.seq(
    transactions.Send
    //blockchain.Query,
    //transactions.Confirm
  );

  let result = {};

  seqInit(result, function(err, res) {
    if (err) { 
      console.log("ERROR", err) 
    } else {
      seqRun(result, function(err, result) {
        if (err) { 
          console.log("ERROR", err) 
        } else {
          console.log("[INFO] Done. Exiting...");
        }
      });
    }
  });
}

run();
