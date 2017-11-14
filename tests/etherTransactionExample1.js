var scheduler = require('../scheduler.js');

let numAccounts = 6;
let txValue = 10;
let frequency = 10;
let numIterations = 100;

module.exports.prepare = function(seq) {
  seq.push(function(result, cb) {
    result.accountOptions = {
      numRequiredAccounts: numAccounts
    }
    result.accounts.Create(result, cb);
  });
  seq.push(function(result, cb) {
    result.accounts.Unlock(result, cb);
  });
  seq.push(function(result, cb) {
    result.accounts.GetBalances(result, cb);
  });
  seq.push(function(result, cb) {
    result.accounts.CollectEther(result, cb);
  });
  seq.push(function(result, cb) {
    result.accounts.DistributeEther(result, cb);
  });
}

module.exports.start = function(seq) {
  seq.push(function(result, cb) {
    scheduler.Repeat(function(repeater) {
      let transactions = result.transactions;
      result.repeater = repeater;
      result.txOptions = {
        transactions: []
      };
      for (let i = 0; i < numAccounts; i++) {
        result.txOptions.transactions.push({
          from: result.accounts.Unlocked[i],
          to: result.accounts.Unlocked[i],
          value: txValue
        });
      }
      transactions.SendBatch(result); // no cb passed to indicate called from within repeater
    }, numIterations, frequency, function() {
      cb(null, result);
    });
  });
  seq.push(function(result, cb) {
    result.transactions.Confirm(result, cb) ;
  });
  return seq;
}
