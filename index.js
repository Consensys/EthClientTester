var async = require('async')
var init = require('./init.js');
var config = require('./config.js')

var sentTxHashes = [];
var accountBalances = [];
var totalBalance = 0;
var numSubmittedTransaction = 0;
var numSendErrors = 0;
var numQueryErrors = 0;
var actualTxElapsedTime = 0;
var actualQueryElapsedTime = 0;

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
				stdout.write(`\r[INFO] Creating accounts: ` + numCurrentAccounts + 
					` / ` + numRequiredAccounts);
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
	
	stdout.write(`\r[INFO] Unlocking accounts: ` + numUnlockedAccounts + 
		` / ` + numRequiredAccounts);
	async.eachLimit(requiredAccounts, config.accountUnlockThreadLimit, 
	function(account, callback) {
		web3.personal.unlockAccount(account, "", 100000, function(err, res) {
			numUnlockedAccounts++;
			stdout.write(`\r[INFO] Unlocking accounts: ` + numUnlockedAccounts + 
				` / ` + numRequiredAccounts);
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

function getAccountBalances(result, cb) {
	let stdout = process.stdout;
	let web3 = result.web3;
	let numExistingAccounts = web3.eth.accounts.length;
	let existingAccounts = web3.eth.accounts;
	let responseCount = 0;
	let requestCount = 0;
	async.eachLimit(existingAccounts, 5, function(account, callback) {
		requestCount++;
		web3.eth.getBalance(account, function(err, res) {
			if (err) { 
				console.log("ERROR", err); 
			} else { 
				responseCount++;
				accountBalances[existingAccounts.indexOf(account)] = res.toNumber(); 
				totalBalance += res.toNumber();
			}
			stdout.write(`\r[INFO] Getting account balances: ` + responseCount + 
				` / ` + numExistingAccounts);
			if (responseCount == requestCount) {
				console.log();
				cb(null, result);
			}
			callback(err, res);
		});
	}, function (err) {
	});
}

function collectFunds(result, cb) {
	let stdout = process.stdout;
	let web3 = result.web3;
	let numExistingAccounts = web3.eth.accounts.length;
	let existingAccounts = web3.eth.accounts;
	let responseCount = 0;
	let requestCount = 0;
	let batch = web3.createBatch();
	for (let i = 1; i < numExistingAccounts; i++) {
		if (accountBalances[i] > 0) {
			requestCount++;
			let tx = {from: existingAccounts[i], to: existingAccounts[0], value: accountBalances[i]};
			batch.add(web3.eth.sendTransaction.request(tx, function(err, txHash) {
				responseCount++;
				if(err) { 
					cb(err, null);
				} else {
					stdout.write(`\r[INFO] Collecting funds: ` + responseCount + 
						` / ` + requestCount);
					if (responseCount == requestCount) {
						console.log();
						cb(null, result);
					}
				}
			}));
		}
	}
	if (requestCount > 0) {
		batch.execute();
	} else {
		cb(null, result);
	}
}

function fundAccounts(result, cb) {
	let stdout = process.stdout;
	let web3 = result.web3;
	let addresses = web3.eth.accounts;
	let numExistingAccounts = web3.eth.accounts.length;
	let txOptions = config.txOptions;
	let numRequiredAccounts = txOptions.numAccounts;
	let requiredAccounts = web3.eth.accounts.slice(0, numRequiredAccounts);
	let requiredAccountBalances = Math.floor(totalBalance/numRequiredAccounts);
	let responseCount = 0;
	let requestCount = 0;
	let batch = web3.createBatch();
	stdout.write(`\r[INFO] Accounts funded: ` + 1 + 
		` / ` + numRequiredAccounts);
	for (let i = 1; i < numRequiredAccounts; i++) {
		requestCount++;
		let tx = { from: addresses[0], to: addresses[i], value: requiredAccountBalances };
		batch.add(web3.eth.sendTransaction.request(tx, function(err, txHash) {
			responseCount++;
			if(err) { 
				cb(err, null);
			} else {
				stdout.write(`\r[INFO] Funding Accounts: ` + (responseCount+1) + 
					` / ` + numRequiredAccounts);
				if (responseCount == requestCount) {
					console.log();
					cb(null, result);
				}
			}
		}));
	}
	if (requestCount > 0) {
		batch.execute();
	} else {
		console.log();
		cb(null, result);
	}
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
			stdout.write(`\r[INFO] Errors: ` + numSendErrors + `, Failed: ` + 
				(responseCount-numConfirmedTransactions)+ `, Confirmed: ` + 
				numConfirmedTransactions + ` / ` + numSubmittedTransactions);
			if (responseCount == requestCount) {
				console.log();
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

	let intervalID = setInterval(function() {
		batchCount++;
		elapsedTime = batchCount*timeBetweenBatches;
		if (elapsedTime <= maxTimeMillis) {
			let batch = web3.createBatch();
			for (let i = 0; i < numRequiredAccounts; i++) {
				requestCount++;
				let tx = { from: addresses[i], to: addresses[i], value: txValue };
				batch.add(web3.eth.sendTransaction.request(tx, function(err, txHash) {
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
						stdout.write(`\r[INFO] Submitted ` + numSubmittedTransactions + 
							` transactions at ` + totalTxRate + ` / s`);
						console.log();
						console.log("[INFO] Actual tx rate: " + 
							numSubmittedTransactions/(actualTxElapsedTime/1000) + 
							" / s averaged over " + (actualTxElapsedTime/1000) + " s");
						clearInterval(intervalID);
						cb(null, result);
					}
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

	let intervalID = setInterval(function() {
		batchCount++;
		elapsedTime = batchCount*timeBetweenBatches;
		if (elapsedTime <= maxTimeMillis) {
			let batch = web3.createBatch();
			for (let i = 0; i < numQueriesPerBatch; i++) {
				requestCount++;
				batch.add(web3.eth.getTransaction.request(sentTxHashes[i*numQueriesPerBatch+requestCount-1], function(err, res) {
					responseCount++;
					prevTime = currentTime;
					currentTime = (new Date()).getTime();
					actualQueryElapsedTime += currentTime - prevTime;
					if(err) { 
						numQueryErrors++;
					} else {
						//sentTxHashes.push(txHash);
					}
					if ((elapsedTime >= maxTimeMillis) && (responseCount == requestCount)) {
						stdout.write(`\r[INFO] Submitted ` + numSubmittedQueries + 
							` queries at ` + totalQueryRate + ` / s`);
						console.log();
						console.log("[INFO] Actual query rate: " + 
							numSubmittedQueries/(actualQueryElapsedTime/1000) + 
							" / s averaged over " + (actualQueryElapsedTime/1000) + " s");
						clearInterval(intervalID);
						cb(null, result);
					}
				}));
			}
			if (batchCount == 1) {
				prevTime = (new Date()).getTime();
				currentTime = prevTime;
			}
			batch.execute();
			numSubmittedQueries = batchCount*numQueriesPerBatch;
			if (batchCount % queryBatchRate === 0) {
				stdout.write(`\r[INFO] Submitted ` + numSubmittedQueries + 
					` queries at ` + totalQueryRate + ` / s`);
			}
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
		createAccounts,
		unlockAccounts,
		getAccountBalances,
		collectFunds,
		fundAccounts
	);
	
	let seqRun = async.seq(
		sendTransactions,
		queryBlockchain
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
