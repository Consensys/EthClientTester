var scheduler = require('../scheduler.js');
var ERC20 = require('../contracts/ERC20.js');

let frequency = 1/120;
let numIterations = 5000000;

module.exports.prepare = function(seq) {
  seq.push(function(result, cb) {
    result.accountOptions = {
      numRequiredAccounts: 2
    }
    result.accounts.Create(result, cb);
  });
  seq.push(function(result, cb) {
    result.accounts.Unlock(result, cb);
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
    contracts.Deployed[0].transfer(accounts.Unlocked[1], 50, {from: accounts.Unlocked[0]});
    cb(null, result);
  });
}

module.exports.execute = function(seq) {
  seq.push(function(result, cb) {
    result.countOuter = 0;
    scheduler.Repeat(function(repeaterO) {
      result.countOuter++;
      result.frequencyInner = 5 + 2*result.countOuter; // increase frequency by 2 x the number of tx in batch
      result.numIterationsInner = result.frequencyInner*60;
      scheduler.Repeat(function(repeaterI) {
        let transactions = result.transactions;
        let contracts = result.contracts;
        let accounts = result.accounts;
        result.repeater = repeaterI;
        result.txOptions = {
          transactions: []
        };
        // specifying a gas amount avoids an estimate from being done - saves time
        let tx1 = contracts.Deployed[0].transfer.getTx(accounts.Unlocked[1], 1, 
          {from: accounts.Unlocked[0], gas: 100000});
        let tx2 = contracts.Deployed[0].transfer.getTx(accounts.Unlocked[0], 1, 
          {from: accounts.Unlocked[1], gas: 100000});
        let tx3 = contracts.Deployed[0].transfer.getTx(accounts.Unlocked[1], 1, 
          {from: accounts.Unlocked[0], gas: 100000});
        let tx4 = contracts.Deployed[0].transfer.getTx(accounts.Unlocked[0], 1, 
          {from: accounts.Unlocked[1], gas: 100000});
        let tx5 = contracts.Deployed[0].transfer.getTx(accounts.Unlocked[1], 1, 
          {from: accounts.Unlocked[0], gas: 100000});
        let tx6 = contracts.Deployed[0].transfer.getTx(accounts.Unlocked[0], 1, 
          {from: accounts.Unlocked[1], gas: 100000});
        let tx7 = contracts.Deployed[0].transfer.getTx(accounts.Unlocked[1], 1, 
          {from: accounts.Unlocked[0], gas: 100000});
        let tx8 = contracts.Deployed[0].transfer.getTx(accounts.Unlocked[0], 1, 
          {from: accounts.Unlocked[1], gas: 100000});
        let tx9 = contracts.Deployed[0].transfer.getTx(accounts.Unlocked[1], 1, 
          {from: accounts.Unlocked[0], gas: 100000});
        let tx10 = contracts.Deployed[0].transfer.getTx(accounts.Unlocked[0], 1, 
          {from: accounts.Unlocked[1], gas: 100000});
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
      }, result.numIterationsInner, result.frequencyInner, function() {
        repeaterO.completed();
      });
    }, numIterations, frequency, function() {
      cb(null, result);
    });
  });
}
