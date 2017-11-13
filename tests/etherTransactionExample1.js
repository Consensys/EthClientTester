var scheduler = require('../scheduler.js');

module.exports.prepare = function(seq) {
  seq.push(function(result, cb) {
    result.accountOptions = {
      numRequiredAccounts: 10
    }
    result.accounts.Create(result, cb);
  });
  seq.push(function(result, cb) {
    result.accounts.Unlock(result, cb);
  });
}

module.exports.start = function(seq) {
  seq.push(function(result, cb) {
    scheduler.Repeat(function(repeater) {
      let transactions = result.transactions;
      result.repeater = repeater;
      result.txOptions = {
        numBatchTransactions: 10,//number of transactions in batch (also number of accounts used)
        txValue: 10,// transaction value
      };
      transactions.SendBatch(result);
    }, 50, 10, function() {
      cb(null, result);
    });
  });
  seq.push(function(result, cb) {
    result.transactions.Confirm(result, cb) ;
  });
  return seq;
}
