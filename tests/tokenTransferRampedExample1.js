var scheduler = require('../scheduler.js');
var ERC20 = require('../contracts/ERC20.js');

var outerIterations = 10
var outerFrequency = 1/30
var blockFetchFrequency = 50

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
    contracts.Deployed[0].transfer(accounts.Unlocked[1], 10000000, {from: accounts.Unlocked[0]});
    contracts.Deployed[0].transfer(accounts.Unlocked[2], 10000000, {from: accounts.Unlocked[0]});
    contracts.Deployed[0].transfer(accounts.Unlocked[3], 10000000, {from: accounts.Unlocked[0]});
    contracts.Deployed[0].transfer(accounts.Unlocked[4], 10000000, {from: accounts.Unlocked[0]});
    contracts.Deployed[0].transfer(accounts.Unlocked[5], 10000000, {from: accounts.Unlocked[0]});
    contracts.Deployed[0].transfer(accounts.Unlocked[6], 10000000, {from: accounts.Unlocked[0]});
    contracts.Deployed[0].transfer(accounts.Unlocked[7], 10000000, {from: accounts.Unlocked[0]});
    contracts.Deployed[0].transfer(accounts.Unlocked[8], 10000000, {from: accounts.Unlocked[0]});
    contracts.Deployed[0].transfer(accounts.Unlocked[9], 10000000, {from: accounts.Unlocked[0]});
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
      let txIterations = Math.floor(((1/outerFrequency)/3)/(1/txFrequency)); // submit tx for 1/5 of the time
      scheduler.Repeat(function(repeater1) {
        let transactions = result.transactions;
        let contracts = result.contracts;
        let accounts = result.accounts;
        result.repeater = repeater1;
        result.txOptions = {
          transactions: []
        };
        // specifying a gas amount avoids an estimate from being done - saves time
        let tx1 = contracts.Deployed[0].transfer.getTx(accounts.Unlocked[0], 1, 
          {from: accounts.Unlocked[1], gas: 100000});
        let tx2 = contracts.Deployed[0].transfer.getTx(accounts.Unlocked[1], 1, 
          {from: accounts.Unlocked[2], gas: 100000});
        let tx3 = contracts.Deployed[0].transfer.getTx(accounts.Unlocked[2], 1, 
          {from: accounts.Unlocked[3], gas: 100000});
        let tx4 = contracts.Deployed[0].transfer.getTx(accounts.Unlocked[3], 1, 
          {from: accounts.Unlocked[4], gas: 100000});
        let tx5 = contracts.Deployed[0].transfer.getTx(accounts.Unlocked[4], 1, 
          {from: accounts.Unlocked[5], gas: 100000});
        let tx6 = contracts.Deployed[0].transfer.getTx(accounts.Unlocked[5], 1, 
          {from: accounts.Unlocked[6], gas: 100000});
        let tx7 = contracts.Deployed[0].transfer.getTx(accounts.Unlocked[6], 1, 
          {from: accounts.Unlocked[7], gas: 100000});
        let tx8 = contracts.Deployed[0].transfer.getTx(accounts.Unlocked[7], 1, 
          {from: accounts.Unlocked[8], gas: 100000});
        let tx9 = contracts.Deployed[0].transfer.getTx(accounts.Unlocked[8], 1, 
          {from: accounts.Unlocked[9], gas: 100000});
        let tx10 = contracts.Deployed[0].transfer.getTx(accounts.Unlocked[9], 1, 
          {from: accounts.Unlocked[0], gas: 100000});
        result.txOptions.transactions.push(tx1);
        result.txOptions.transactions.push(tx2);
        result.txOptions.transactions.push(tx3);
        result.txOptions.transactions.push(tx4);
        result.txOptions.transactions.push(tx5);
        result.txOptions.transactions.push(tx6);
        result.txOptions.transactions.push(tx7);
        result.txOptions.transactions.push(tx8);
        result.txOptions.transactions.push(tx9);
        result.txOptions.transactions.push(tx10);
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
