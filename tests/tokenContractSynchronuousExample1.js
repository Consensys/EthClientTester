var scheduler = require('../scheduler.js');
var ERC20 = require('../contracts/ERC20.js');

/*  NOTE: this test will not be able to generate high tx rates,
    since the transactions are not called asynchronuously!!
*/

module.exports.add = function(tasks) {
  tasks.push(function(result, cb) {
    let accounts = result.accounts;
    let contracts = result.contracts;
    result.contractOptions = {
      contractDataArray: [
        contracts.GatherInfo(ERC20, 0)
      ]
    }
    result.accountOptions = {
      numRequiredAccounts: 2
    }
    contracts.Deploy(result, cb);
  });  
  tasks.push(function(result, cb) {
    scheduler.Repeat(function(repeater) {
      result.repeater = repeater;
      let accounts = result.accounts;
      let contracts = result.contracts;
      console.log("Transfering 10 tokens from account 0 to account 1");
      contracts.Deployed[0].transfer(accounts.Unlocked[1], 10, {from: accounts.Unlocked[0]});
      console.log("Account 0 Balance: " + 
        contracts.Deployed[0].balanceOf(accounts.Unlocked[0]).toNumber());
      console.log("Account 1 Balance: " + 
        contracts.Deployed[0].balanceOf(accounts.Unlocked[1]).toNumber());
      console.log("Transfering 10 tokens from account 1 to account 0");
      contracts.Deployed[0].transfer(accounts.Unlocked[0], 10, {from: accounts.Unlocked[1]});
      console.log("Account 0 Balance: " + 
        contracts.Deployed[0].balanceOf(accounts.Unlocked[0]).toNumber());
      console.log("Account 1 Balance: " + 
        contracts.Deployed[0].balanceOf(accounts.Unlocked[1]).toNumber());
      result.repeater.completed();
    }, 15, 1, function() {
      cb(null, result);
    });
  });
  return tasks;
}
