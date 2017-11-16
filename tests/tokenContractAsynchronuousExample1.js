var scheduler = require('../scheduler.js');
var ERC20 = require('../contracts/ERC20.js');

let frequency = 10;
let numIterations = 50000000000;

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
    scheduler.Repeat(function(repeater) {
      let transactions = result.transactions;
      let contracts = result.contracts;
      let accounts = result.accounts;
      result.repeater = repeater;
      result.txOptions = {
        transactions: []
      };
      // specifying a gas amount avoids an estimate from being done - saves time
      let tx1 = contracts.Deployed[0].transfer.getTx(accounts.Unlocked[1], 1, 
        {from: accounts.Unlocked[0], gas: 100000});
      let tx2 = contracts.Deployed[0].transfer.getTx(accounts.Unlocked[0], 1, 
        {from: accounts.Unlocked[1], gas: 100000});
      result.txOptions.transactions.push(tx1);
      result.txOptions.transactions.push(tx2);
      transactions.SendBatch(result); // no cb passed to indicate that called from within repeater
    }, numIterations, frequency, function() {
      cb(null, result);
    });
  });
}
