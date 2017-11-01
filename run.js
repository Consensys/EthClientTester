var transactions = require('./transactions.js');
var contracts = require('./contracts.js');
var accounts = require('./accounts.js');
var scheduler = require('./scheduler.js');

//move task-specific initialization to their respective functions. For ex. in transactions.SendTransactions, first check to see if there are enough existing accounts, and whether there are enough of them unlocked (and create/unlock additional ones as needed), before proceeding with the task. Do the same for all other run-tasks. Doing this will significantly simplify creating new tasks, since the initialization will be automatically deduced from the task input parameters, so the user does not need to predetermine the number of accounts/contracts or whatever else is needed for a specific task. 

function sendTransactions(tasks) {
  tasks.push(function(result, cb) {
    scheduler.Repeat(function(repeater) {
      result.repeater = repeater;
      result.txOptions = {
        numBatchTransactions: 1,//number of transactions in batch (also number of accounts used)
        txValue: 10,// transaction value
      };
      transactions.SendBatch(result);
    }, 20, 10, function() {
      cb(null, result);
    });
  });
  tasks.push(transactions.Confirm);
  return tasks;
}

function testContracts(tasks) {
  tasks.push(contracts.Deploy);
  tasks.push(function(result, cb) {
    console.log("Account 0 Balance: " + 
      contracts.Deployed[0].balanceOf(accounts.Unlocked[0]).toNumber());
    console.log("Account 1 Balance: " + 
      contracts.Deployed[0].balanceOf(accounts.Unlocked[1]).toNumber());
    cb(null, result);
  });
  tasks.push(function(result, cb) {
    scheduler.Repeat(function(repeater) {
      result.repeater = repeater;
      console.log("Transfering 10 tokens from account 0 to account 1");
      contracts.Deployed[0].transfer(accounts.Unlocked[1], 10, {from: accounts.Unlocked[0]});
      console.log("Account 0 Balance: " + 
        contracts.Deployed[0].balanceOf(accounts.Unlocked[0]).toNumber());
      console.log("Account 1 Balance: " + 
        contracts.Deployed[0].balanceOf(accounts.Unlocked[1]).toNumber());
      result.repeater.completed();
    }, 10, 1, function() {
      cb(null, result);
    });
  });
  return tasks;
}

function configure(tasks) {
  //tasks = sendTransactions(tasks);
  tasks = testContracts(tasks);
  /* always make sure that before any run-task is started, 
  updated account info (like balances) is fetched... this should 
  ideally happen at the end of a previous task-list*/
  tasks.push(accounts.Sync);
  return tasks;
}

exports.Configure = configure;
