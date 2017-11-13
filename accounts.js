function accounts() {
  var async = require('async');
  var config = require('./config.js');

  let object = {};

  object.Unlocked = [];
  object.Existing = [];
  object.Balances = [];
  object.TotalBalance = 0;

  function sync(result, cb) {
    let stdout = process.stdout;
    let web3 = result.web3;
    stdout.write(`\r[INFO] Synchronizing account data... `);
    object.Existing = web3.eth.accounts;
    result.showProgressGetAllBalances = false;
    object.GetAllBalances(result, cb);
    console.log("Done.");
  }

  function create(result, cb) {
    let stdout = process.stdout;
    let web3 = result.web3;
    //object.Existing = web3.eth.accounts;
    let numExistingAccounts = object.Existing.length;
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
          object.Existing = web3.eth.accounts;
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
    let numExistingAccounts = object.Existing.length;
    let accountOptions = result.accountOptions;
    let numRequiredAccounts = accountOptions.numRequiredAccounts;
    // at object point it should not be possible to have numRequiredAccounts > existing.length
    let requiredAccounts = object.Existing.slice(0, numRequiredAccounts);
    let numUnlockedAccounts = object.Unlocked.length;
    
    stdout.write(`\r[INFO] Unlocking accounts: ` + numUnlockedAccounts + 
      ` / ` + numRequiredAccounts);
    async.eachLimit(requiredAccounts, config.accountUnlockThreadLimit, 
    function(account, callback) {
      web3.personal.unlockAccount(account, "", 100000, function(err, res) {
        object.Unlocked[object.Existing.indexOf(account)] = account;
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
    let numExistingAccounts = object.Existing.length;
    let accountOptions = result.accountOptions;
    let numRequiredAccounts = accountOptions.numRequiredAccounts;
    // at object point it should not be possible to have numRequiredAccounts > existing.length
    let requiredAccounts = object.Existing.slice(0, numRequiredAccounts);
    let numUnlockedAccounts = object.Unlocked.length;
      
    //stdout.write(`\r[INFO] Unlocking accounts: ` + numUnlockedAccounts + 
    //  ` / ` + numRequiredAccounts);
    async.eachLimit(requiredAccounts, config.accountUnlockThreadLimit,
    function(account, callback) {
      object.Unlocked[object.Existing.indexOf(account)] = account;
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
    let numExistingAccounts = object.Existing.length;
    let accountOptions = result.accountOptions;
    let numRequiredAccounts = accountOptions.numRequiredAccounts;
    // at object point it should not be possible to have numRequiredAccounts > existing.length
    let requiredAccounts = object.Existing.slice(0, numRequiredAccounts);
    let numUnlockedAccounts = object.Unlocked.length;
      
    //stdout.write(`\r[INFO] Unlocking accounts: ` + numUnlockedAccounts + 
    //  ` / ` + numRequiredAccounts);
    async.eachLimit(requiredAccounts, config.accountUnlockThreadLimit,
    function(account, callback) {
      object.Unlocked[object.Existing.indexOf(account)] = account;
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
    let numExistingAccounts = object.Existing.length;
    let numUnlockedAccounts = object.Unlocked.length;
    
    stdout.write(`\r[INFO] Unlocking accounts: ` + numUnlockedAccounts + 
      ` / ` + numExistingAccounts);
    async.eachLimit(object.Existing, config.accountUnlockThreadLimit, 
    function(account, callback) {
      web3.personal.unlockAccount(account, "", 100000, function(err, res) {
        object.Unlocked[object.Existing.indexOf(account)] = account;
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
    let numExistingAccounts = object.Existing.length;
    let accountOptions = result.accountOptions;
    let numRequiredAccounts = accountOptions.numRequiredAccounts;
    // at object point it should not be possible to have numRequiredAccounts > existing.length
    let requiredAccounts = object.Existing.slice(0, numRequiredAccounts);
    let responseCount = 0;
    let requestCount = 0;
    async.eachLimit(requiredAccounts, 5, function(account, callback) {
      requestCount++;
      web3.eth.getBalance(account, function(err, res) {
        if (err) { 
          console.log("ERROR", err); 
        } else { 
          responseCount++;
          object.balances[object.Existing.indexOf(account)] = res.toNumber(); 
          object.TotalBalance += res.toNumber();
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
    let numExistingAccounts = object.Existing.length;
    let showProgress = true;
    if (result.showProgressGetAllBalances == false) {
      showProgress = false;
    }
    let responseCount = 0;
    let requestCount = 0;
    async.eachLimit(object.Existing, 5, function(account, callback) {
      requestCount++;
      web3.eth.getBalance(account, function(err, res) {
        if (err) { 
          console.log("ERROR", err); 
        } else { 
          responseCount++;
          object.Balances[object.Existing.indexOf(account)] = res.toNumber(); 
          object.TotalBalance += res.toNumber();
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
    let numExistingAccounts = object.Existing.length;
    let accountOptions = result.accountOptions;
    let numRequiredAccounts = accountOptions.numRequiredAccounts;
    // at object point it should not be possible to have numRequiredAccounts > existing.length
    let requiredAccounts = object.Existing.slice(0, numRequiredAccounts);
    let responseCount = 0;
    let requestCount = 0;
    let batch = web3.createBatch();
    for (let i = 1; i < numRequiredAccounts; i++) {
      if (balances[i] > 0) {
        requestCount++;
        let tx = {from: requiredAccounts[i], to: requiredAccounts[0], value: object.balances[i]};
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
    let numExistingAccounts = object.Existing.length;
    let responseCount = 0;
    let requestCount = 0;
    let batch = web3.createBatch();
    for (let i = 1; i < numExistingAccounts; i++) {
      if (balances[i] > 0) {
        requestCount++;
        let tx = {from: object.Existing[i], to: object.Existing[0], value: object.balances[i]};
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
    let numExistingAccounts = object.Existing.length;
    let accountOptions = result.accountOptions;
    let numRequiredAccounts = accountOptions.numRequiredAccounts;
    // at object point it should not be possible to have numRequiredAccounts > existing.length
    let requiredAccounts = object.Existing.slice(0, numRequiredAccounts);
    let requiredAccountBalances = Math.floor(object.TotalBalance/numRequiredAccounts);
    let responseCount = 0;
    let requestCount = 0;
    let batch = web3.createBatch();
    stdout.write(`\r[INFO] Accounts funded: ` + 1 + 
      ` / ` + numRequiredAccounts);
    for (let i = 1; i < numRequiredAccounts; i++) {
      requestCount++;
      let tx = { from: object.Existing[0], to: object.Existing[i], value: requiredAccountBalances };
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

  object.Sync = sync;
  object.Create = create;
  object.Unlock = unlock;
  object.UpdateRequiredToUnlocked = updateRequiredToUnlocked;
  object.UpdateAllExistingToUnlocked = updateAllExistingToUnlocked;
  object.UnlockAll = unlockAll;
  object.GetBalances = getBalances;
  object.GetAllBalances = getAllBalances;
  object.CollectEther = collectEther;
  object.CollectAllEther = collectAllEther;
  object.DistributeEther = distributeEther;

  return object;
}

module.exports = accounts;
