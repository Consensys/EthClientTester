var async = require('async')
var Web3RPC = require('web3quorum')
var Web3Admin = require('web3admin')
var config = require('./config.js')

var sentTxHashes = []
var numSubmittedTransaction = 0;
var numSendErrors = 0;
var actualElapsedTime = 0;

function initWeb3RPC(result, cb) {
	let host = config.web3RPCHost;
	let port = config.web3RPCPort;
	let httpProvider = Web3RPC.providers.HttpProvider;
	result.web3 = new Web3RPC(new httpProvider("http://" + host + ":" + port));
	result.web3.eth.getBlockNumber(function(err, res) {
		console.log("[INFO] Web3 RPC initialized: Connected to " + host + ":" + port);
		cb(null, result);
	});
}

function initWeb3RPCTimeout(result, cb) {
	let wrappedInitWeb3RPC = async.timeout(initWeb3RPC, config.web3RPCInitTimeoutMillis);
	wrappedInitWeb3RPC(result, function (err, res) {
		if (err) { 
			console.log("[ERROR] Failed to initialize Web3 RPC: timeout");
			cb(err, null);
		} else { 
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
	let stdout = process.stdout;
	let web3 = result.web3;
	let numExistingAccounts = web3.eth.accounts.length;
	let numCurrentAccounts = numExistingAccounts;
	let txOptions = config.txOptions;
	let numRequiredAccounts = txOptions.numAccounts;
	
	if (numCurrentAccounts < numRequiredAccounts) {
		async.whilst(function() {
			return (numCurrentAccounts < numRequiredAccounts);
		}, function(callback) {
			web3.personal.newAccount("", function(err, res) {
				numCurrentAccounts++;
				stdout.write(`\r[INFO] Creating accounts: ` + numCurrentAccounts + ` / ` + numRequiredAccounts);
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
	let stdout = process.stdout;
	let web3 = result.web3;
	let numExistingAccounts = web3.eth.accounts.length;
	let txOptions = config.txOptions;
	let numRequiredAccounts = txOptions.numAccounts;
	let requiredAccounts = web3.eth.accounts.slice(0, numRequiredAccounts);
	let numUnlockedAccounts = 0;
	
	stdout.write(`\r[INFO] Unlocking accounts: ` + numUnlockedAccounts + ` / ` + numRequiredAccounts);
	async.eachLimit(requiredAccounts, config.accountUnlockThreadLimit, function(account, callback) {
		web3.personal.unlockAccount(account, "", 100000, function(err, res) {
			numUnlockedAccounts++;
			stdout.write(`\r[INFO] Unlocking accounts: ` + numUnlockedAccounts + ` / ` + numRequiredAccounts);
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
	let stdout = process.stdout;
	let web3 = result.web3;
	let numConfirmedTransactions = 0;	
	let responseCount = 0;
	let requestCount = 0;
	async.eachLimit(sentTxHashes, 25, function(txHash, callback) {
		requestCount++;
		web3.eth.getTransactionReceipt(txHash, function(err, res) {
			responseCount++;
			if (err) { console.log("ERROR", err); }
			if (!((res == undefined) || (res.blockNumber == null))) { numConfirmedTransactions++; }
			stdout.write(`\r[INFO] Errors: ` + numSendErrors + `, Failed: ` + (responseCount-numConfirmedTransactions)+ `, Confirmed: ` + numConfirmedTransactions + ` / ` + numSubmittedTransactions);
			if (responseCount == requestCount) {
				console.log();
				console.log("[INFO] Actual (average) tx rate: " + numConfirmedTransactions/(actualElapsedTime/1000) + " / s over " + (actualElapsedTime/1000) + " s");
				cb(null, result);
			}
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
	let txRatePerAccount = txOptions.txRatePerAccount;
	let numRequiredAccounts = txOptions.numAccounts;
	let timeBetweenBatches = Math.round(1000/txRatePerAccount);
	let totalTxRate = txRatePerAccount*numRequiredAccounts;

	let batchCount = 0;
	let elapsedTime = 0;
	let responseCount = 0;
	let requestCount = 0;
	let prevTime = (new Date()).getTime();
	let currentTime = (new Date()).getTime();

	let intervalID = setInterval(function() {
		batchCount++;
		elapsedTime = batchCount*timeBetweenBatches/1000;
		if (elapsedTime <= config.maxTime) {
			let batch = web3.createBatch();
			for (let i = 0; i < numRequiredAccounts; i++) {
				requestCount++;
				let tx = { from: addresses[i], to: addresses[i], value: txValue };
				batch.add(web3.eth.sendTransaction.request(tx, function(err, txHash) {
					responseCount++;
					prevTime = currentTime;
					currentTime = (new Date()).getTime();
					actualElapsedTime += currentTime - prevTime;
					if(err) { 
						numSendErrors++;
					} else {
						sentTxHashes.push(txHash);
					}
					if ((elapsedTime >= config.maxTime) && (responseCount == requestCount)) {
						console.log();
						clearInterval(intervalID);
						cb(null, result);
					}
				}));
			}
			batch.execute();
			numSubmittedTransactions = batchCount*numRequiredAccounts;
			if (batchCount % txRatePerAccount === 0) {
				stdout.write(`\r[INFO] Submitted ` + numSubmittedTransactions + ` transactions at ` + totalTxRate + ` / s`);
			}
		}
	}, timeBetweenBatches);	
}

function start() {
	let seqInit = async.seq(
		initWeb3RPCTimeout,
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
