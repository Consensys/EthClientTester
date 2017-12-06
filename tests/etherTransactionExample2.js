var scheduler = require('../scheduler.js');

// total transaction rate = numAccounts * frequency [tx/s]
// test run time = numIterations / frequency [s]
let numAccounts = 10;
let txValue = 1;
let frequency = 50;
let numIterations = 500;
let blockFetchFrequency = 20;

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
  seq.push(function(result, cb) {
    result.blockchain.Sync(result, cb);
  });
}

module.exports.execute = function(seq) {
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
      setTimeout(function() {
        cb(null, result);
      }, 5000); //wait 5 seconds for transactions to finish processing
    });
  });
  seq.push(function(result, cb) {
    result.blockchain.Sync(result, cb);
  });
  seq.push(function(result, cb) {
    let blockCount = result.blockchain.NumNewBlocksSincePreviousSync;
    result.blockchain.PreviousBlockNumber = result.blockchain.LastBlockNumber - blockCount;
    scheduler.Repeat(function(repeater) {
      result.repeater = repeater;
      result.blockchain.LogBlockStats(result);
    }, blockCount, blockFetchFrequency, function() {
      cb(null, result);
    });
  });
  return seq;
}

