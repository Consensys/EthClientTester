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
    result.log.AppendStatusUpdate({
      msg: 'Synchronizing account data...'
    });
    object.Existing = web3.eth.accounts;
    object.GetAllBalances(result, function(err, res) {
      result.log.AppendStatusUpdate({
        msg: 'Done.'
      });
      cb(null, res);
    });
  }

  function create(result, cb) {
    let stdout = process.stdout;
    let web3 = result.web3;
    let numExistingAccounts = object.Existing.length;
    let numCurrentAccounts = numExistingAccounts;
    let accountOptions = result.accountOptions;
    let numRequiredAccounts = accountOptions.numRequiredAccounts;
    
    if ((numCurrentAccounts < numRequiredAccounts) && 
      (config.doAccountCreation === true)) {
      async.whilst(function() {
        return (numCurrentAccounts < numRequiredAccounts);
      }, function(callback) {
        web3.personal.newAccount("", function(err, res) {
          numCurrentAccounts++;
          result.log.AppendStatusUpdate({
            msg: 'Creating accounts: ' + numCurrentAccounts + ' / ' + numRequiredAccounts
          });
          callback(err, res);
        });
      }, function(err) {
        if (err) {
          result.log.AppendError({
            msg: 'ERROR in accounts.create: ' + err
          });
          cb(err, null);
        } else {
          object.Existing = web3.eth.accounts;
          cb(null, result);
        }
      });
    } else {
      result.log.AppendStatusUpdate({
        msg: 'Skipping account creation: numExistingAccounts >= numRequiredAccounts'
      });
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
    let numInitiallyUnlockedAccounts = config.numInitiallyUnlockedAccounts
      
    if (numInitiallyUnlockedAccounts > 0) {
      updateInitiallyUnlockedToUnlocked(result, function(err, result) {
        numUnlockedAccounts = object.Unlocked.length;
        console.log("numUnlockedAccounts", numUnlockedAccounts);
        console.log("numRequiredAccounts", numRequiredAccounts);
        if (numUnlockedAccounts < numRequiredAccounts) {
          let accountsToUnlock = object.Existing.slice(numInitiallyUnlockedAccounts-1, numRequiredAccounts);
          async.eachLimit(accountsToUnlock, config.accountUnlockThreadLimit, 
          function(account, callback) {
            web3.personal.unlockAccount(account, "", 100000, function(err, res) {
              object.Unlocked[object.Existing.indexOf(account)] = account;
              numUnlockedAccounts++;
              result.log.AppendStatusUpdate({
                msg: 'Unlocking accounts: ' + numUnlockedAccounts + ' / ' + numRequiredAccounts
              });
              callback(err);
            });     
          }, function(err) {
            if (err) {
              result.log.AppendError({
                msg: 'ERROR in accounts.unlock: ' + err
              });
              cb(err, null);
            } else {
              cb(null, result);
            }
          });
        } else {
          cb(null, result);
        }
      });
    } else {
      if ((numUnlockedAccounts < numRequiredAccounts)
        && (config.doAccountUnlocking === true)) {
        async.eachLimit(requiredAccounts, config.accountUnlockThreadLimit, 
        function(account, callback) {
          web3.personal.unlockAccount(account, "", 100000, function(err, res) {
            object.Unlocked[object.Existing.indexOf(account)] = account;
            numUnlockedAccounts++;
            result.log.AppendStatusUpdate({
              msg: 'Unlocking accounts: ' + numUnlockedAccounts + ' / ' + numRequiredAccounts
            });
            callback(err);
          });     
        }, function(err) {
          if (err) {
            result.log.AppendError({
              msg: 'ERROR in accounts.unlock: ' + err
            });
            cb(err, null);
          } else {
            cb(null, result);
          }
        });
      } else {
        cb(null, result);
      }
    }
  }

  /*This function assumes that the required accounts are already unlocked on the node,
    but just not yet added to the local list of unlocked accounts*/
  function updateInitiallyUnlockedToUnlocked(result, cb) {
    let numExistingAccounts = object.Existing.length;
    let numUnlockedAccounts = object.Unlocked.length;
    let accountOptions = result.accountOptions;
    let numRequiredAccounts = accountOptions.numRequiredAccounts;
    let requiredAccounts = object.Existing.slice(0, numRequiredAccounts);
    let numInitiallyUnlockedAccounts = config.numInitiallyUnlockedAccounts;
    let initiallyUnlockedAccounts = requiredAccounts;
    if (numInitiallyUnlockedAccounts < numRequiredAccounts) {
      initiallyUnlockedAccounts = object.Existing.slice(0, numInitiallyUnlockedAccounts);
    }    
    result.log.AppendStatusUpdate({
      msg: 'Updating account unlocked state: ' + numUnlockedAccounts + ' / ' + numRequiredAccounts
    });
    async.eachLimit(initiallyUnlockedAccounts, config.accountUnlockThreadLimit,
    function(account, callback) {
      object.Unlocked[object.Existing.indexOf(account)] = account;
      numUnlockedAccounts++;
      result.log.AppendStatusUpdate({
        msg: 'Updating account unlocked state: ' + numUnlockedAccounts + ' / ' + numRequiredAccounts
      });
      callback(null);
    }, function(err) {
      if (err) {
        result.log.AppendError({
          msg: 'ERROR in accounts.updateInitiallyUnlockedToUnlocked: ' + err
        });
        cb(err, null);
      } else {
        //console.log();
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
      
    result.log.AppendStatusUpdate({
      msg: 'Unlocking accounts: ' + numUnlockedAccounts + ' / ' + numRequiredAccounts
    });
    async.eachLimit(requiredAccounts, config.accountUnlockThreadLimit,
    function(account, callback) {
      object.Unlocked[object.Existing.indexOf(account)] = account;
      numUnlockedAccounts++;
      result.log.AppendStatusUpdate({
        msg: 'Unlocking accounts: ' + numUnlockedAccounts + ' / ' + numRequiredAccounts
      });
      callback(null);
    }, function(err) {
      if (err) {
        result.log.AppendError({
          msg: 'ERROR in accounts.updateRequiredToUnlocked: ' + err
        });
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
      
    result.log.AppendStatusUpdate({
      msg: 'Unlocking accounts: ' + numUnlockedAccounts + ' / ' + numRequiredAccounts
    });
    async.eachLimit(requiredAccounts, config.accountUnlockThreadLimit,
    function(account, callback) {
      object.Unlocked[object.Existing.indexOf(account)] = account;
      numUnlockedAccounts++;
      result.log.AppendStatusUpdate({
        msg: 'Unlocking accounts: ' + numUnlockedAccounts + ' / ' + numRequiredAccounts
      });
      callback(null);
    }, function(err) {
      if (err) {
        result.log.AppendError({
          msg: 'ERROR in accounts.updateAllExistingToUnlocked: ' + err
        });
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
    
    result.log.AppendStatusUpdate({
      msg: 'Unlocking accounts: ' + numUnlockedAccounts + ' / ' + numRequiredAccounts
    });
    if (config.doAccountUnlocking === true) {
      async.eachLimit(object.Existing, config.accountUnlockThreadLimit, 
      function(account, callback) {
        web3.personal.unlockAccount(account, "", 100000, function(err, res) {
          object.Unlocked[object.Existing.indexOf(account)] = account;
          numUnlockedAccounts++;
          result.log.AppendStatusUpdate({
            msg: 'Unlocking accounts: ' + numUnlockedAccounts + ' / ' + numRequiredAccounts
          });
          callback(err, res);
        });     
      }, function(err) {
        if (err) {
          result.log.AppendError({
            msg: 'ERROR in accounts.unlockAll: ' + err
          });
          cb(err, null);
        } else {
          cb(null, result);
        }
      });
    } else {
      cb(null, result);
    }
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
          result.log.AppendError({
            msg: 'ERROR in accounts.getBalances: ' + err
          }); 
        } else { 
          responseCount++;
          object.Balances[object.Existing.indexOf(account)] = res.toNumber(); 
          object.TotalBalance += res.toNumber();
        }
        result.log.AppendStatusUpdate({
          msg: 'Getting account balances: ' + responseCount + ' / ' + numRequiredAccounts
        });
        if (responseCount == requestCount) {
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
    let responseCount = 0;
    let requestCount = 0;
    async.eachLimit(object.Existing, 5, function(account, callback) {
      requestCount++;
      web3.eth.getBalance(account, function(err, res) {
        if (err) { 
          result.log.AppendError({
            msg: 'ERROR in accounts.getAllBalances: ' + err
          });
        } else { 
          responseCount++;
          object.Balances[object.Existing.indexOf(account)] = res.toNumber(); 
          object.TotalBalance += res.toNumber();
        }
        result.log.AppendStatusUpdate({
          msg: 'Getting account balances: ' + responseCount + ' / ' + numExistingAccounts
        });
        if (responseCount == requestCount) {
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
    let requiredAccounts = object.Unlocked.slice(0, numRequiredAccounts);
    if (config.doEtherDistribution === true) {
      let responseCount = 0;
      let requestCount = 0;
      let batch = web3.createBatch();
      for (let i = 1; i < numRequiredAccounts; i++) {
        if (object.Balances[i] > 0) {
          requestCount++;
          let tx = {from: requiredAccounts[i], to: requiredAccounts[0], value: 0.9*object.Balances[i]};
          batch.add(web3.eth.sendTransaction.request(tx, function(err, txHash) {
            responseCount++;
            if(err) { 
              result.log.AppendError({
                msg: 'ERROR in accounts.collectEther: ' + err
              });
              cb(err, null);
            } else {
              result.log.AppendStatusUpdate({
                msg: 'Collecting funds: ' + responseCount + ' / ' + requestCount
              });
              if (responseCount == requestCount) {
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
    } else {
      cb(null, result);
    }
  }

  function collectAllEther(result, cb) {
    let stdout = process.stdout;
    let web3 = result.web3;
    let numExistingAccounts = object.Existing.length;
    if (config.doEtherDistribution === true) {
      let responseCount = 0;
      let requestCount = 0;
      let batch = web3.createBatch();
      for (let i = 1; i < numExistingAccounts; i++) {
        if (object.Balances[i] > 0) {
          requestCount++;
          let tx = {from: object.Unlocked[i], to: object.Unlocked[0], value: 0.9*object.Balances[i]};
          batch.add(web3.eth.sendTransaction.request(tx, function(err, txHash) {
            responseCount++;
            if(err) { 
              result.log.AppendError({
                msg: 'ERROR in accounts.collectAllEther: ' + err
              });
              cb(err, null);
            } else {
              result.log.AppendStatusUpdate({
                msg: 'Collecting funds: ' + responseCount + ' / ' + requestCount
              });
              if (responseCount == requestCount) {
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
    if (config.doEtherDistribution === true) {
      let requiredAccounts = object.Existing.slice(0, numRequiredAccounts);
      let requiredAccountBalances = Math.floor(object.Balances[0]/numRequiredAccounts);
      let responseCount = 0;
      let requestCount = 0;
      let batch = web3.createBatch();
      result.log.AppendStatusUpdate({
        msg: 'Funding accounts: ' + 1 + ' / ' + numRequiredAccounts
      });
      for (let i = 1; i < numRequiredAccounts; i++) {
        requestCount++;
        let tx = { from: object.Unlocked[0], to: object.Unlocked[i], value: requiredAccountBalances };
        batch.add(web3.eth.sendTransaction.request(tx, function(err, txHash) {
          responseCount++;
          if(err) { 
            result.log.AppendError({
              msg: 'ERROR in accounts.distributeEther: ' + err
            });
            cb(err, null);
          } else {
            result.log.AppendStatusUpdate({
              msg: 'Funding accounts: ' + (responseCount+1) + ' / ' + numRequiredAccounts
            });
            if (responseCount == requestCount) {
              cb(null, result);
            }
          }
        }));
      }
      if (requestCount > 0) {
        batch.execute();
      } else {
        cb(null, result);
      }
    } else {
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
