var scheduler = require('../scheduler.js');
var ERC20 = require('../contracts/ERC20.js');

var outerIterations = 20
var outerFrequency = 1/30
var blockFetchFrequency = 50
var numBatchTx = 10

module.exports.prepare = function(seq) {
  seq.push(function(result, cb) {
    result.accountOptions = {
      numRequiredAccounts: 10
    }
    result.accounts.CreateRequired(result, cb);
  });
  seq.push(function(result, cb) {
    result.accounts.UnlockRequired(result, cb);
  });
  seq.push(function(result, cb) {
    let contract1DeploymentAccountIndex = 0;
    result.contractOptions = {
      contractDataArray: [
        result.contracts.GatherInfo(ERC20, contract1DeploymentAccountIndex)
      ]
    }
    result.contracts.Deploy(result, cb);
  });
  seq.push(function(result, cb) {
    let contracts = result.contracts;
    let accounts = result.accounts;
    for (let i = 1; i < numBatchTx; i++) {
      contracts.Deployed[0].transfer(accounts.Unlocked[i], 10000000, {from: accounts.Unlocked[0]});
    }
    cb(null, result);
  });
  seq.push(function(result, cb) {
    result.blockchain.Sync(result, cb);
  });
  seq.push(function(result, cb) {
    let lastBlockNumber = result.blockchain.LastBlockNumber;
    result.blockchain.PreviousBlockNumber = lastBlockNumber-1;
    result.blockchain.LogBlockStats(result, cb);
  });
}

module.exports.execute = function(seq) {
  seq.push(function(result, cb) {
    var alternateCount = 0;
    scheduler.Alternate(function(repeater) { // do tx
      let txFrequency = 5 + 1*alternateCount;
      let txIterations = Math.floor(((1/outerFrequency)/4)/(1/txFrequency)); // submit tx for 1/4 of the time
      scheduler.Repeat(function(repeater1) {
        let transactions = result.transactions;
        let contracts = result.contracts;
        let accounts = result.accounts;
        result.repeater = repeater1;
        result.txOptions = {
          transactions: []
        };
        // specifying a gas amount avoids an estimate from being done - saves time
        let tx = [];
        for (let i = 0; i < numBatchTx; i++) {
          tx[i] = contracts.Deployed[0].transfer.getTx(accounts.Unlocked[i], 1, 
          {from: accounts.Unlocked[(i+1)%numBatchTx], gas: 100000});
        }
        //  {from: accounts.Unlocked[0], gas: 100000});
        for (let i = 0; i < numBatchTx; i++) {
          result.txOptions.transactions.push(tx[i]);
        }
        transactions.SendBatch(result); // no cb passed to indicate that called from within repeater
      }, txIterations, txFrequency, function() {
        repeater.completed();
      });
    }, function(repeater) { // collect data
      result.blockchain.Sync(result, function(err, result1) {
        let blockCount = result.blockchain.NumNewBlocksSincePreviousSync;
        prevBlockNumber = result1.blockchain.LastBlockNumber - blockCount + 1;
        result1.blockchain.PreviousBlockNumber = prevBlockNumber;
        scheduler.Repeat(function(repeater1) {
          result1.repeater = repeater1;
          result1.blockchain.LogBlockStats(result1);
        }, blockCount, blockFetchFrequency, function() {
          repeater.completed();
          alternateCount++;
        });
      });
    }, outerIterations, outerFrequency, function() { 
      cb(null, result);
    });
  });
}
