var transactions = require('./transactions.js');
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

function configure(tasks) {
  tasks = sendTransactions(tasks);
  /* always make sure that before any run-task is started, 
  updated account info (like balances) is fetched... this should 
  ideally happen at the end of a previous task-list*/
  tasks.push(accounts.Sync);
  return tasks;
}

exports.Configure = configure;
