var async = require('async');
var config = require('./config.js');

var balances = [];
var totalBalance = 0;

function create(result, cb) {
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

function unlock(result, cb) {
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

function getBalances(result, cb) {
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
				balances[existingAccounts.indexOf(account)] = res.toNumber(); 
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
		if (balances[i] > 0) {
			requestCount++;
			let tx = {from: existingAccounts[i], to: existingAccounts[0], value: balances[i]};
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

function distributeFunds(result, cb) {
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

exports.Balances = balances;
exports.TotalBalance = totalBalance;

exports.Create = create;
exports.Unlock = unlock;
exports.GetBalances = getBalances;
exports.CollectFunds = collectFunds;
exports.DistributeFunds = distributeFunds;
