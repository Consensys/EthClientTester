var scheduler = require('../scheduler.js');
var ERC20 = require('../contracts/ERC20.js');

/*  This test procedure sends tokens from one address to another, one token
    at a time, until the sender has only one left, after which the token
    receiver now becomes the sender, and sends all of its tokens back,
    one at a time. This sequence repeats.
*/

let frequency = 1;
let numIterations = 99999999999;

module.exports.prepare = function(seq) {
  seq.push(function(result, cb) {
    result.accountOptions = {
      numRequiredAccounts: 2
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
    contracts.Deployed[0].transfer(accounts.Unlocked[1], 50, {from: accounts.Unlocked[0]});
    cb(null, result);
  });
}

module.exports.execute = function(seq) {
  seq.push(function(result, cb) {
    result.counter = 0;
    scheduler.Repeat(function(repeater) {
      let transactions = result.transactions;
      let contracts = result.contracts;
      let accounts = result.accounts;
      result.repeater = repeater;
      result.txOptions = {
        transactions: []
      };
      result.counter++;
      // specifying a gas amount avoids an estimate from being done - saves time
      let tx1 = contracts.Deployed[0].transfer.getTx(accounts.Unlocked[(Math.floor(result.counter/50) + 1) % 2], 1, 
        {from: accounts.Unlocked[Math.floor(result.counter/50) % 2], gas: 100000});
      result.txOptions.transactions.push(tx1);
      transactions.SendBatch(result); // no cb passed to indicate that called from within repeater
    }, numIterations, frequency, function() {
      cb(null, result);
    });
  });
}
