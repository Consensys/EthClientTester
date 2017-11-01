var async = require('async');
var config = require('./config.js');

var unlocked = [];
var existing = [];
var balances = [];
var totalBalance = 0;

function sync(result, cb) {
  let stdout = process.stdout;
  let web3 = result.web3;
  stdout.write(`\r[INFO] Synchronizing account data... `);
  existing = web3.eth.accounts;
  result.showProgressGetAllBalances = false;
  getAllBalances(result, cb);
  console.log("Done.");
}

function create(result, cb) {
  let stdout = process.stdout;
  let web3 = result.web3;
  existing = web3.eth.accounts;
  let numExistingAccounts = existing.length;
  let numCurrentAccounts = numExistingAccounts;
  let accountOptions = result.accountOptions;
  let numRequiredAccounts = accountOptions.numRequiredAccounts;
  
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
        existing = web3.eth.accounts;
        console.log();
        cb(null, result);
      }
    });
  } else {
    //console.log("[INFO] Skipping account creation: No additional accounts needed");
    cb(null, result);
  }
}

function unlock(result, cb) {
  let stdout = process.stdout;
  let web3 = result.web3;
  let numExistingAccounts = existing.length;
  let accountOptions = result.accountOptions;
  let numRequiredAccounts = accountOptions.numRequiredAccounts;
  // at this point it should not be possible to have numRequiredAccounts > existing.length
  let requiredAccounts = existing.slice(0, numRequiredAccounts);
  let numUnlockedAccounts = unlocked.length;
  
  stdout.write(`\r[INFO] Unlocking accounts: ` + numUnlockedAccounts + 
    ` / ` + numRequiredAccounts);
  async.eachLimit(requiredAccounts, config.accountUnlockThreadLimit, 
  function(account, callback) {
    web3.personal.unlockAccount(account, "", 100000, function(err, res) {
      unlocked[existing.indexOf(account)] = account;
      numUnlockedAccounts++;
      stdout.write(`\r[INFO] Unlocking accounts: ` + numUnlockedAccounts + 
        ` / ` + numRequiredAccounts);
      callback(err);
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

/*This function assumes that the required accounts are already unlocked on the node,
  but just not yet added to the local list of unlocked accounts*/
function updateRequiredToUnlocked(result, cb) {
  let stdout = process.stdout;
  let numExistingAccounts = existing.length;
  let accountOptions = result.accountOptions;
  let numRequiredAccounts = accountOptions.numRequiredAccounts;
  // at this point it should not be possible to have numRequiredAccounts > existing.length
  let requiredAccounts = existing.slice(0, numRequiredAccounts);
  let numUnlockedAccounts = unlocked.length;
    
  //stdout.write(`\r[INFO] Unlocking accounts: ` + numUnlockedAccounts + 
  //  ` / ` + numRequiredAccounts);
  async.eachLimit(requiredAccounts, config.accountUnlockThreadLimit,
  function(account, callback) {
    unlocked[existing.indexOf(account)] = account;
    numUnlockedAccounts++;
    //stdout.write(`\r[INFO] Unlocking accounts: ` + numUnlockedAccounts + 
    //  ` / ` + numRequiredAccounts);
    callback(null);
  }, function(err) {
    if (err) {
      cb(err, null);
    } else {
      //console.log();
      cb(null, result);
    }
  });
}

/*This function assumes that the existing accounts are already unlocked on the node,
  but just not yet added to the local list of unlocked accounts*/
function updateAllExistingToUnlocked(result, cb) {
  let stdout = process.stdout;
  let numExistingAccounts = existing.length;
  let accountOptions = result.accountOptions;
  let numRequiredAccounts = accountOptions.numRequiredAccounts;
  // at this point it should not be possible to have numRequiredAccounts > existing.length
  let requiredAccounts = existing.slice(0, numRequiredAccounts);
  let numUnlockedAccounts = unlocked.length;
    
  //stdout.write(`\r[INFO] Unlocking accounts: ` + numUnlockedAccounts + 
  //  ` / ` + numRequiredAccounts);
  async.eachLimit(requiredAccounts, config.accountUnlockThreadLimit,
  function(account, callback) {
    unlocked[existing.indexOf(account)] = account;
    numUnlockedAccounts++;
    //stdout.write(`\r[INFO] Unlocking accounts: ` + numUnlockedAccounts + 
    //  ` / ` + numRequiredAccounts);
    callback(null);
  }, function(err) {
    if (err) {
      cb(err, null);
    } else {
      //console.log();
      cb(null, result);
    }
  });
}

function unlockAll(result, cb) {
  let stdout = process.stdout;
  let web3 = result.web3;
  let numExistingAccounts = existing.length;
  let numUnlockedAccounts = unlocked.length;
  
  stdout.write(`\r[INFO] Unlocking accounts: ` + numUnlockedAccounts + 
    ` / ` + numExistingAccounts);
  async.eachLimit(existing, config.accountUnlockThreadLimit, 
  function(account, callback) {
    web3.personal.unlockAccount(account, "", 100000, function(err, res) {
      unlocked[existing.indexOf(account)] = account;
      numUnlockedAccounts++;
      stdout.write(`\r[INFO] Unlocking accounts: ` + numUnlockedAccounts + 
        ` / ` + numExistingAccounts);
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
  let numExistingAccounts = existing.length;
  let accountOptions = result.accountOptions;
  let numRequiredAccounts = accountOptions.numRequiredAccounts;
  // at this point it should not be possible to have numRequiredAccounts > existing.length
  let requiredAccounts = existing.slice(0, numRequiredAccounts);
  let responseCount = 0;
  let requestCount = 0;
  async.eachLimit(requiredAccounts, 5, function(account, callback) {
    requestCount++;
    web3.eth.getBalance(account, function(err, res) {
      if (err) { 
        console.log("ERROR", err); 
      } else { 
        responseCount++;
        balances[existing.indexOf(account)] = res.toNumber(); 
        totalBalance += res.toNumber();
      }
      stdout.write(`\r[INFO] Getting account balances: ` + responseCount + 
        ` / ` + numRequiredAccounts);
      if (responseCount == requestCount) {
        console.log();
        cb(null, result);
      }
      callback(err, res);
    });
  }, function (err) {
  });
}

function getAllBalances(result, cb) {
  let stdout = process.stdout;
  let web3 = result.web3;
  let numExistingAccounts = existing.length;
  let showProgress = true;
  if (result.showProgressGetAllBalances == false) {
    showProgress = false;
  }
  let responseCount = 0;
  let requestCount = 0;
  async.eachLimit(existing, 5, function(account, callback) {
    requestCount++;
    web3.eth.getBalance(account, function(err, res) {
      if (err) { 
        console.log("ERROR", err); 
      } else { 
        responseCount++;
        balances[existing.indexOf(account)] = res.toNumber(); 
        totalBalance += res.toNumber();
      }
      if (showProgress) {
        stdout.write(`\r[INFO] Getting account balances: ` + responseCount + 
          ` / ` + numExistingAccounts);
      }
      if (responseCount == requestCount) {
        if (showProgress) { console.log(); }
        cb(null, result);
      }
      callback(err, res);
    });
  }, function (err) {
  });
}

function collectEther(result, cb) {
  let stdout = process.stdout;
  let web3 = result.web3;
  let numExistingAccounts = existing.length;
  let accountOptions = result.accountOptions;
  let numRequiredAccounts = accountOptions.numRequiredAccounts;
  // at this point it should not be possible to have numRequiredAccounts > existing.length
  let requiredAccounts = existing.slice(0, numRequiredAccounts);
  let responseCount = 0;
  let requestCount = 0;
  let batch = web3.createBatch();
  for (let i = 1; i < numRequiredAccounts; i++) {
    if (balances[i] > 0) {
      requestCount++;
      let tx = {from: requiredAccounts[i], to: requiredAccounts[0], value: balances[i]};
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

function collectAllEther(result, cb) {
  let stdout = process.stdout;
  let web3 = result.web3;
  let numExistingAccounts = existing.length;
  let responseCount = 0;
  let requestCount = 0;
  let batch = web3.createBatch();
  for (let i = 1; i < numExistingAccounts; i++) {
    if (balances[i] > 0) {
      requestCount++;
      let tx = {from: existing[i], to: existing[0], value: balances[i]};
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

function distributeEther(result, cb) {
  let stdout = process.stdout;
  let web3 = result.web3;
  let numExistingAccounts = existing.length;
  let accountOptions = result.accountOptions;
  let numRequiredAccounts = accountOptions.numRequiredAccounts;
  // at this point it should not be possible to have numRequiredAccounts > existing.length
  let requiredAccounts = existing.slice(0, numRequiredAccounts);
  let requiredAccountBalances = Math.floor(totalBalance/numRequiredAccounts);
  let responseCount = 0;
  let requestCount = 0;
  let batch = web3.createBatch();
  stdout.write(`\r[INFO] Accounts funded: ` + 1 + 
    ` / ` + numRequiredAccounts);
  for (let i = 1; i < numRequiredAccounts; i++) {
    requestCount++;
    let tx = { from: existing[0], to: existing[i], value: requiredAccountBalances };
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

exports.Existing = existing;
exports.Unlocked = unlocked;
exports.Balances = balances;
exports.TotalBalance = totalBalance;

exports.Sync = sync;
exports.Create = create;
exports.Unlock = unlock;
exports.UpdateRequiredToUnlocked = updateRequiredToUnlocked;
exports.UpdateAllExistingToUnlocked = updateAllExistingToUnlocked;
exports.UnlockAll = unlockAll;
exports.GetBalances = getBalances;
exports.GetAllBalances = getAllBalances;
exports.CollectEther = collectEther;
exports.CollectAllEther = collectAllEther;
exports.DistributeEther = distributeEther;
