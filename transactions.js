function transactions() {
  let async = require('async');
  let config = require('./config.js');
  let object = {};

  object.NumSendErrors = 0;
  object.NumConfirmedTransactions = 0;
  object.SentTxHashes = [];

  function sendBatch(result, cb) {
    let stdout = process.stdout;
    let web3 = result.web3;
    let txOptions = result.txOptions;
    let accounts = result.accounts;
    let requestCount = 0;
    let responseCount = 0;
    let batchRequestTimestamp;

    let transactions = txOptions.transactions;

    function handleTransactionResponse(err, res) {
      let txHash = res;
      responseCount++;
      if(err) { 
        result.log.AppendError({
          msg: 'ERROR in transactions.sendBatch: ' + err
        });
        object.NumSendErrors++;
      } else {
        //object.SentTxHashes.push(txHash);
        result.log.AppendTxHashRequest({
          timestamp: batchRequestTimestamp,
          msg: txHash
        });
        result.log.AppendTxHashResponse({
          msg: txHash
        });
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
      for (let i = 0; i < transactions.length; i++) {
        requestCount++;
        let tx = transactions[i];
        batch.add(web3.eth.sendTransaction.request(tx, function(err, res) {
          handleTransactionResponse(err, res);
        }));
      }
      result.log.AppendStatusUpdate({
        msg: 'Sending Transaction Batch...'
      });
      batchRequestTimestamp = Date.now();
      batch.execute();
      result.log.AppendStatusUpdate({
        msg: 'Done.'
      });
    }
    createAndExecuteBatch();
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
        //stdout.write(`\r[INFO] Summary: Errors=` + object.NumSendErrors + `, Failed=` + 
        //  (responseCount-object.NumConfirmedTransactions) + `, Confirmed=` + 
        //  object.NumConfirmedTransactions + ` out of ` + object.SentTxHashes.length + `\n`);
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
  object.Confirm = confirmTransactions;

  return object;
}

module.exports = transactions;
