var async = require('async');
var init = require('./init.js');
var accounts = require('./accounts.js');
var transactions = require('./transactions.js');
var blockchain = require('./blockchain.js');
var contracts = require('./contracts.js');

function run() {
  let seqInit = async.seq(
    init.Web3RPCTimeout,
    init.ExtendWeb3,
    accounts.Create,
    accounts.Unlock,
    //accounts.GetBalances,
    //accounts.CollectFunds,
    //accounts.DistributeFunds
    contracts.DeployContracts
  );
  
  let seqRun = async.seq(
    //transactions.Send
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
          //console.log(contracts.DeployedContracts[0]);
          //console.log(contracts.DeployedContracts[0].balanceOf(result.web3.eth.accounts[0]).toNumber());
          //console.log(contracts.DeployedContracts[1].balanceOf(result.web3.eth.accounts[1]).toNumber());
          //console.log(contracts.DeployedContracts[2].balanceOf(result.web3.eth.accounts[2]).toNumber());
          //console.log(contracts.DeployedContracts[3].balanceOf(result.web3.eth.accounts[3]).toNumber());
          console.log("[INFO] Done. Exiting...");
        }
      });
    }
  });
}

run();
