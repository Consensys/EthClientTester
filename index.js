var async = require('async');
var init = require('./init.js');
var config = require('./config.js');
var accounts = require('./accounts.js');

var sentTxHashes = [];
var numSubmittedTransaction = 0;
var numSendErrors = 0;
var numQueryErrors = 0;
var actualTxElapsedTime = 0;
var actualQueryElapsedTime = 0;

function confirmTransactions(result, cb) {
	let stdout = process.stdout;
	let web3 = result.web3;
	let numConfirmedTransactions = 0;	
	let responseCount = 0;
	let requestCount = 0;

	function displayProgress() {
		stdout.write(`\r[INFO] Errors: ` + numSendErrors + `, Failed: ` + 
			(responseCount-numConfirmedTransactions) + `, Confirmed: ` + 
			numConfirmedTransactions + ` / ` + numSubmittedTransactions);
	}

	function handleTransactionReceiptResponse(err, res) {
		responseCount++;
		if (err) { console.log("ERROR", err); }
		let isConfirmed = !((res == undefined) || (res.blockNumber == null));
		if (isConfirmed) 
		{
			numConfirmedTransactions++; 
		}
		displayProgress();
		if (responseCount == requestCount) {
			console.log();
			cb(null, result);
		}
	}

	async.eachLimit(sentTxHashes, 25, function(txHash, callback) {
		requestCount++;
		web3.eth.getTransactionReceipt(txHash, function(err, res) {
			handleTransactionReceiptResponse(err, res);
			callback(err, res);
		});
	}, function (err) {
	});
}

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
			numSubmittedTransactions/(actualTxElapsedTime/1000) + 
			" / s averaged over " + (actualTxElapsedTime/1000) + " s");
	}

	function displayProgress() {
		stdout.write(`\r[INFO] Submitted ` + numSubmittedTransactions + 
			` transactions at ` + totalTxRate + ` / s`);
	}

	function handleSendTransactionResponse(err, res) {
		let txHash = res;
		responseCount++;
		prevTime = currentTime;
		currentTime = (new Date()).getTime();
		actualTxElapsedTime += currentTime - prevTime;
		if(err) { 
			numSendErrors++;
		} else {
			sentTxHashes.push(txHash);
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
		numSubmittedTransactions = batchCount*numRequiredAccounts;
		if (batchCount % txRatePerAccount === 0) {
			stdout.write(`\r[INFO] Submitted ` + numSubmittedTransactions + 
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

function queryBlockchain(result, cb) {
	let stdout = process.stdout;
	let web3 = result.web3;
	let addresses = web3.eth.accounts;
	let queryOptions = config.queryOptions;
	let maxTimeMillis = queryOptions.maxTimeMillis;
	let queryBatchRate = queryOptions.batchRate;
	let numQueriesPerBatch = queryOptions.numQueriesPerBatch;
	let timeBetweenBatches = Math.round(1000/queryBatchRate);
	let totalQueryRate = queryBatchRate*numQueriesPerBatch;

	let batchCount = 0;
	let elapsedTime = 0;
	let responseCount = 0;
	let requestCount = 0;
	let prevTime;
	let currentTime;

	function displayProgress() {
			stdout.write(`\r[INFO] Submitted ` + numSubmittedQueries + 
				` queries at ` + totalQueryRate + ` / s`);
	}

	function displaySummary() {
		console.log("[INFO] Actual query rate: " + 
			numSubmittedQueries/(actualQueryElapsedTime/1000) + 
			" / s averaged over " + (actualQueryElapsedTime/1000) + " s");
	}

	function handleGetTransactionResponse(err, res) {
		responseCount++;
		prevTime = currentTime;
		currentTime = (new Date()).getTime();
		actualQueryElapsedTime += currentTime - prevTime;
		if(err) { 
			numQueryErrors++;
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
		for (let i = 0; i < numQueriesPerBatch; i++) {
			requestCount++;
			let index = i*numQueriesPerBatch+requestCount-1;
			batch.add(web3.eth.getTransaction.request(sentTxHashes[index], function(err, res) {
				handleGetTransactionResponse(err, res);
			}));
		}
		if (batchCount == 1) {
			prevTime = (new Date()).getTime();
			currentTime = prevTime;
		}
		batch.execute();
		numSubmittedQueries = batchCount*numQueriesPerBatch;
		if (batchCount % queryBatchRate === 0) {
			displayProgress();
		}
	}

	let intervalID = setInterval(function() {
		batchCount++;
		elapsedTime = batchCount*timeBetweenBatches;
		if (elapsedTime <= maxTimeMillis) {
			createAndExecuteBatch();
		} else if (timeBetweenBatches > maxTimeMillis) {
			console.log("Query rate not high enough for specified maxTimeMillis! Exiting...");
			clearInterval(intervalID);
			cb(null, result);
		}
	}, timeBetweenBatches);	
}

function start() {
	let seqInit = async.seq(
		init.Web3RPCTimeout,
		init.ExtendWeb3,
		accounts.Create,
		accounts.Unlock,
		accounts.GetBalances,
		accounts.CollectFunds,
		accounts.DistributeFunds
	);
	
	let seqRun = async.seq(
		sendTransactions,
		queryBlockchain,
		confirmTransactions
	);

	let result = {};

	seqInit(result, function(err, res) {
		if (err) { 
			console.log("ERROR", err) 
		} else {
			seqRun(result, function(err, result) {
				if (err) { 
					console.log("ERROR", err) 
				} else {
					console.log("[INFO] Done. Exiting...");
				}
			});
		}
	});
}

start();
