var scheduler = require('../scheduler.js');

// total transaction rate = numAccounts * frequency [tx/s]
// test run time = numIterations / frequency [s]
let numAccounts = 20;
let txValue = 1;
let frequency = 1000;
let numIterations = 1000;

module.exports.prepare = function(seq) {
  seq.push(function(result, cb) {
    result.accountOptions = {
      numRequiredAccounts: numAccounts
    }
    result.accounts.CreateRequired(result, cb);
  });
  seq.push(function(result, cb) {
    result.accounts.UnlockRequired(result, cb);
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

module.exports.execute = function(seq) {
  console.log('=== Running transactions ===')
  console.log('Attempted transaction rate:', numAccounts*frequency, '[tx/s]')
  console.log('Run time at attempted rate:', numIterations/frequency, '[s]')
  console.log('=== Running transactions ===')
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
      transactions.SendBatch(result); // no cb passed to indicate that called from within repeater
    }, numIterations, frequency, function() {
      console.log('transactions.SendBatch cb called')
      cb(null, result);
    });
  });
  seq.push(function(result, cb) {
    console.log('result.blockchain:', result.blockchain)
    result.blockchain.getBlocks(result, function(){
      cb(null, result)
    })
  });
  return seq;
}
