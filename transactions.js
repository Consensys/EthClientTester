var async = require('async');
var metrics = require('./metrics.js');
var config = require('./config.js');

function sendTransactions(result, cb) {
  let stdout = process.stdout;
  let web3 = result.web3;
  let addresses = web3.eth.accounts;
  let txOptions = config.txOptions;
  let txValue = txOptions.value;
  let maxTimeMillis = txOptions.maxTimeMillis;
  let txRatePerAccount = txOptions.txRatePerAccount;
  let numRequiredAccounts = txOptions.numAccounts;
  let timeBetweenBatches = Math.round(1000/txRatePerAccount);
  let totalTxRate = txRatePerAccount*numRequiredAccounts;

  let batchCount = 0;
  let elapsedTime = 0;
  let responseCount = 0;
  let requestCount = 0;
  let prevTime;
  let currentTime;

  function displaySummary() {
    console.log("[INFO] Actual tx rate: " + 
      metrics.NumSubmittedTransactions/(metrics.ActualTxElapsedTime/1000) + 
      " / s averaged over " + (metrics.ActualTxElapsedTime/1000) + " s");
  }

  function displayProgress() {
    stdout.write(`\r[INFO] Submitted ` + metrics.NumSubmittedTransactions + 
      ` transactions at ` + totalTxRate + ` / s`);
  }

  function handleSendTransactionResponse(err, res) {
    let txHash = res;
    responseCount++;
    prevTime = currentTime;
    currentTime = (new Date()).getTime();
    metrics.ActualTxElapsedTime += currentTime - prevTime;
    if(err) { 
      metrics.NumSendErrors++;
    } else {
      metrics.SentTxHashes.push(txHash);
    }
    if ((elapsedTime >= maxTimeMillis) && (responseCount == requestCount)) {
      displayProgress();
      console.log();
      displaySummary();
      clearInterval(intervalID);
      cb(null, result);
    }
  }

  function createAndExecuteBatch() {
    let batch = web3.createBatch();
    for (let i = 0; i < numRequiredAccounts; i++) {
      requestCount++;
      let tx = { from: addresses[i], to: addresses[i], value: txValue };
      batch.add(web3.eth.sendTransaction.request(tx, function(err, res) {
        handleSendTransactionResponse(err, res);
      }));
    }
    if (batchCount == 1) {
      prevTime = (new Date()).getTime();
      currentTime = prevTime;
    }
    batch.execute();
    metrics.NumSubmittedTransactions = batchCount*numRequiredAccounts;
    if (batchCount % txRatePerAccount === 0) {
      stdout.write(`\r[INFO] Submitted ` + metrics.NumSubmittedTransactions + 
        ` transactions at ` + totalTxRate + ` / s`);
    }
  } 

  let intervalID = setInterval(function() {
    batchCount++;
    elapsedTime = batchCount*timeBetweenBatches;
    if (elapsedTime <= maxTimeMillis) {
      createAndExecuteBatch();
    } else if (timeBetweenBatches > maxTimeMillis) {
      console.log("TX rate not high enough for specified maxTimeMillis! Exiting...");
      clearInterval(intervalID);
      cb(null, result);
    }
  }, timeBetweenBatches); 
}

function confirmTransactions(result, cb) {
  let stdout = process.stdout;
  let web3 = result.web3;
  let responseCount = 0;
  let requestCount = 0;

  function displayProgress() {
    stdout.write(`\r[INFO] Errors: ` + metrics.NumSendErrors + `, Failed: ` + 
      (responseCount-metrics.NumConfirmedTransactions) + `, Confirmed: ` + 
      metrics.NumConfirmedTransactions + ` / ` + metrics.NumSubmittedTransactions);
  }

  function handleTransactionReceiptResponse(err, res) {
    responseCount++;
    if (err) { console.log("ERROR", err); }
    let isConfirmed = !((res == undefined) || (res.blockNumber == null));
    if (isConfirmed) 
    {
      metrics.NumConfirmedTransactions++; 
    }
    displayProgress();
    if (responseCount == requestCount) {
      console.log();
      cb(null, result);
    }
  }

  async.eachLimit(metrics.SentTxHashes, 25, function(txHash, callback) {
    requestCount++;
    web3.eth.getTransactionReceipt(txHash, function(err, res) {
      handleTransactionReceiptResponse(err, res);
      callback(err, res);
    });
  }, function (err) {
  });
}

exports.Send = sendTransactions;
exports.Confirm = confirmTransactions;
