var scheduler = require('../scheduler.js');

module.exports.add = function(tasks) {
  tasks.push(function(result, cb) {
    scheduler.Repeat(function(repeater) {
      let transactions = result.transactions;
      result.repeater = repeater;
      result.txOptions = {
        numBatchTransactions: 1,//number of transactions in batch (also number of accounts used)
        txValue: 10,// transaction value
      };
      transactions.SendBatch(result);
    }, 20, 10, function() {
      cb(null, result);
    });
  });
  tasks.push(function(result, cb) {
    result.transactions.Confirm(result, cb) ;
  });
  return tasks;
}
