var async = require('async')
var Web3RPC = require('web3quorum')
var Web3Admin = require('web3admin')
var config = require('./config.js')

var sentTxHashes = []
var submittedCount = 0;
var sendErrors = 0;
var actualElapsedTime = 0;

function initWeb3RPCTimeout(result, cb) {
	result.web3.eth.getBlockNumber(function(err, res) {
		cb(null, result);
	});
}

function initWeb3RPC(result, cb) {
	var host = config.web3RPCHost;
	var port = config.web3RPCPort;
	var httpProvider = Web3RPC.providers.HttpProvider;
	result.web3 = new Web3RPC(new httpProvider("http://" + host + ":" + port));
	let wrapped = async.timeout(initWeb3RPCTimeout, 5000);
	wrapped(result, function (err, res) {
		if (err) { 
			console.log("[ERROR] Failed to initialize Web3 RPC: timeout");
			cb(err, null);
		} else { 
			console.log("[INFO] Web3 RPC initialized: Connected to " + host + ":" + port);
			cb(null, result);
		}
	});
}

function extendWeb3(result, cb) {
	setTimeout(function() {
		Web3Admin.extend(result.web3);
	}, 1000);
	cb(null, result);
}

function listAccounts(result, cb) {
	console.log(result.web3.eth.accounts);
	cb(null, result);
}

function createAccounts(result, cb) {
	let txOptions = config.txOptions;
	let web3 = result.web3;
	let stdout = process.stdout;

	var numAccounts = txOptions.numAccounts;
	let numExistingAccounts = result.web3.eth.accounts.length;

	var count = numExistingAccounts;
	if (count < numAccounts) {
		async.whilst(function() {
			return (count < numAccounts);
		}, function(callback) {
			count++;
			web3.personal.newAccount("", function(err, res) {
				stdout.write(`\r[INFO] Creating accounts: ` + count + ` / ` + numAccounts);
				callback(err, res);
			});
		}, function(err) {
			if (err) {
				cb(err, null);
			} else {
				console.log();
				cb(null, result);
			}
		});
	} else {
		console.log("[INFO] Skipping account creation: No additional accounts needed");
		cb(null, result);
	}
}

function unlockAccounts(result, cb) {
	let txOptions = config.txOptions;
	let web3 = result.web3;
	let stdout = process.stdout;
	
	var numAccounts = txOptions.numAccounts;
	let numExistingAccounts = result.web3.eth.accounts.length;

	var count = 0;
	stdout.write(`\r[INFO] Unlocking accounts: ` + count + ` / ` + numAccounts);
	async.eachLimit(web3.eth.accounts.slice(0, numAccounts), 5, function(account, callback) {
		count++;
		web3.personal.unlockAccount(account, "", 100000, function(err, res) {
			stdout.write(`\r[INFO] Unlocking accounts: ` + count + ` / ` + numAccounts);
			callback(err, res);
		});			
	}, function(err) {
		if (err) {
			cb(err, null);
		} else {
			console.log();
			cb(null, result);
		}
	});
}

function confirmTransactions(result, cb) {
	let web3 = result.web3;
	let stdout = process.stdout;
	var confirmedTransactions = 0;	

	var responseCount = 0;
	var sentCount = 0;
	async.eachLimit(sentTxHashes, 25, function(txHash, callback) {
		sentCount++;
		web3.eth.getTransactionReceipt(txHash, function(err, res) {
			responseCount++;
			if (err) { console.log("ERROR", err); }
			if (!((res == undefined) || (res.blockNumber == null))) { confirmedTransactions++; }
			stdout.write(`\r[INFO] Errors: ` + sendErrors + `, Failed: ` + (responseCount-confirmedTransactions)+ `, Confirmed: ` + confirmedTransactions + ` / ` + submittedCount);
			if (responseCount == sentCount) {
				console.log();
				console.log("[INFO] Actual (average) tx rate: " + confirmedTransactions/(actualElapsedTime/1000) + " / s over " + (actualElapsedTime/1000) + " s");
				cb(null, result);
			}
			callback(err, res);
		});
	}, function (err) {
	});
}

function sendTransactions(result, cb) {
	let txOptions = config.txOptions;
	let web3 = result.web3;
	let stdout = process.stdout;

	let txRatePerAccount = txOptions.txRatePerAccount;
	let txValue = txOptions.value;
	let addresses = web3.eth.accounts;
	let timeBetweenBatches = Math.round(1000/txRatePerAccount);

	var numAccounts = txOptions.numAccounts;

	var batchCount = 0;
	var totalTxRate = txRatePerAccount*numAccounts;
	var elapsedTime = 0;
	var responseCount = 0;
	var sentCount = 0;

	var prevTime = (new Date()).getTime();
	var currentTime = (new Date()).getTime();

	var intervalID = setInterval(function() {
		batchCount++;
		elapsedTime = batchCount*timeBetweenBatches/1000;
		if (elapsedTime <= config.maxTime) {
			let batch = web3.createBatch();
			for (let i = 0; i < numAccounts; i++) {
				sentCount++;
				let tx = { from: addresses[i], to: addresses[i], value: txValue };
				batch.add(web3.eth.sendTransaction.request(tx, function(err, txHash) {
					responseCount++;
					prevTime = currentTime;
					currentTime = (new Date()).getTime();
					actualElapsedTime += currentTime - prevTime;
					if(err) { 
						sendErrors++;
					} else {
						sentTxHashes.push(txHash);
					}
					if ((elapsedTime >= config.maxTime) && (responseCount == sentCount)) {
						console.log();
						clearInterval(intervalID);
						cb(null, result);
					}
				}));
			}
			batch.execute();
			submittedCount = batchCount*numAccounts;
			if (batchCount % txRatePerAccount === 0) {
				stdout.write(`\r[INFO] Submitted ` + submittedCount + ` transactions at ` + totalTxRate + ` / s`);
			}
		}
	}, timeBetweenBatches);	
}

function start() {
	let seqInit = async.seq(
		initWeb3RPC,
		extendWeb3,
		createAccounts,
		unlockAccounts
	);
	
	let seqRun = async.seq(
		sendTransactions,
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
