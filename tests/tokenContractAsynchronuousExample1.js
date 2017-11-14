var scheduler = require('../scheduler.js');
var ERC20 = require('../contracts/ERC20.js');

let frequency = 50;
let numIterations = 50;

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
}

module.exports.execute = function(seq) {
  seq.push(function(result, cb) {
    let contracts = result.contracts;
    let accounts = result.accounts;
    console.log("Balance 0:" + contracts.Deployed[0].balanceOf(accounts.Unlocked[0]));
    console.log("Balance 1:" + contracts.Deployed[0].balanceOf(accounts.Unlocked[1]));
    cb(null, result);
  });
  seq.push(function(result, cb) {
    scheduler.Repeat(function(repeater) {
      let transactions = result.transactions;
      let contracts = result.contracts;
      let accounts = result.accounts;
      result.repeater = repeater;
      result.txOptions = {
        transactions: []
      };
      let tx = contracts.Deployed[0].transfer.getTx(accounts.Unlocked[1], 1, 
        {from: accounts.Unlocked[0], gas: 100000});
      result.txOptions.transactions.push(tx);
      transactions.SendBatch(result); // no cb passed to indicate that called from within repeater
    }, numIterations, frequency, function() {
      cb(null, result);
    });
  });
  seq.push(function(result, cb) {
    let contracts = result.contracts;
    let accounts = result.accounts;
    console.log("Balance 0:" + contracts.Deployed[0].balanceOf(accounts.Unlocked[0]));
    console.log("Balance 1:" + contracts.Deployed[0].balanceOf(accounts.Unlocked[1]));
    cb(null, result);
  });
}
