function transactions() {
  let async = require('async');
  let metrics = require('./metrics.js');
  let accounts = require('./accounts.js');
  let config = require('./config.js');
  let object = {};

  object.NumSendErrors = 0;
  object.NumConfirmedTransactions = 0;
  object.SentTxHashes = [];

  function sendBatch(result, cb) {
    let stdout = process.stdout;
    let web3 = result.web3;
    let txOptions = result.txOptions;
    let numRequiredAccounts = txOptions.numBatchTransactions;
    let doAccountCreation = config.doAccountCreation;
    let doAccountUnlocking = config.doAccountUnlocking;
    let txValue = txOptions.txValue;
    let requestCount = 0;
    let responseCount = 0;
    let stopInterval = false;
    let distributeEther = false;
    let numBalances = numRequiredAccounts;
    //initialize a new task list for performing the required setup
    let tasks = [function(callback) { callback(null, result); }];

    //settings passed along to the queued functions
    result.accountOptions = {
      numRequiredAccounts: numRequiredAccounts,
      doAccountCreation: doAccountCreation,
      doAccountUnlocking: doAccountUnlocking
    };

    function handleTransactionResponse(err, res) {
      let txHash = res;
      responseCount++;
      if(err) { 
        console.log(err);
        object.NumSendErrors++;
      } else {
        object.SentTxHashes.push(txHash);
      }
      if (responseCount == requestCount) {
        // signal to the repeater that this task has been completed.
        if (result.repeater) {
          result.repeater.completed();
        }
        if(cb) { cb(null, result); }
      }
    }

    function createAndExecuteBatch() {
      let batch = web3.createBatch();
      for (let i = 0; i < numRequiredAccounts; i++) {
        requestCount++;
        let tx = { from: accounts.Unlocked[i], to: accounts.Unlocked[i], value: txValue };
        batch.add(web3.eth.sendTransaction.request(tx, function(err, res) {
          handleTransactionResponse(err, res);
        }));
      }
      batch.execute();
      if (result.repeater) {
        result.repeater.displayProgress("Sending Transaction Batch");
      }
    }

    //create accounts
    if ((config.doAccountCreation === undefined) || (config.doAccountCreation != false)) {
      stopInterval = true;
      tasks.push(accounts.Create);
    }
    //unlock accounts
    if ((config.doAccountUnlocking === undefined) || (config.doAccountUnlocking != false)) {
      if (accounts.Unlocked.length < numRequiredAccounts) {
        stopInterval = true;
        tasks.push(accounts.Unlock);
      }
    } else { 
      if ((!accounts.Unlocked) || accounts.Unlocked.length < numRequiredAccounts) {
        stopInterval = true;
        /*if not unlocking accounts, it is assumed that all 
          the needed accounts are already unlocked*/
        tasks.push(accounts.UpdateRequiredToUnlocked);
      }
    }
    
    //collect/distribute ether
    if ((config.doEtherRedistribution === undefined) || (config.doEtherRedistribution != false)) {
      if (accounts.Existing.length < numRequiredAccounts) {
        numBalances = accounts.Existing.length;
      }
      for (let i = 0; i < numBalances; i++) {
        if (accounts.Balances[i] < txValue) {
          distributeEther = true;
        }
      }
      if (distributeEther) {
        stopInterval = true;
        tasks.push(accounts.CollectFunds);
        tasks.push(accounts.DistributeFunds);
      }
    }

    //pause (wait) until initialization is completed before resuming
    if (result.repeater && stopInterval) { result.repeater.pause(); }
    async.waterfall(tasks, function(err, res) {
      if (!err) {
        createAndExecuteBatch();
        if (result.repeater) { result.repeater.resume(); }
      } else {
        cb(err, null);
      }
    });
  }

  function confirmTransactions(result, cb) {
    let stdout = process.stdout;
    let web3 = result.web3;
    let responseCount = 0;
    let requestCount = 0;

    function handleTransactionReceiptResponse(err, res) {
      responseCount++;
      if (err) { console.log("ERROR", err); }
      let isConfirmed = !((res == undefined) || (res.blockNumber == null));
      if (isConfirmed) 
      {
        object.NumConfirmedTransactions++; 
      }
      if (responseCount == requestCount) {
        stdout.write(`\r[INFO] Summary: Errors=` + object.NumSendErrors + `, Failed=` + 
          (responseCount-object.NumConfirmedTransactions) + `, Confirmed=` + 
          object.NumConfirmedTransactions + ` out of ` + object.SentTxHashes.length + `\n`);
        // signal to the repeater that this task has been completed.
        if (result.repeater) {
          result.repeater.completed();
        }
        if(cb) { cb(null, result); }
      }
    }

    async.eachLimit(object.SentTxHashes, 25, function(txHash, callback) {
      requestCount++;
      web3.eth.getTransactionReceipt(txHash, function(err, res) {
        handleTransactionReceiptResponse(err, res);
        callback(err, res);
      });
    }, function (err) {
    });
  }

  object.SendBatch = sendBatch;
  object.ConfirmTransactions = confirmTransactions;

  return object;
}

module.exports = transactions;
