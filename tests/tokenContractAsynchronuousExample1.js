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
      console.log("1Transfering 10 tokens from account 0 to account 1");
      //console.log(contracts.Deployed[0].transfer)
      contracts.Deployed[0].transfer.sendTransaction(accounts.Unlocked[1], 10, {from: accounts.Unlocked[0]});
      console.log("2Transfering 10 tokens from account 1 to account 0");
      contracts.Deployed[0].transfer.sendTransaction(accounts.Unlocked[0], 10, {from: accounts.Unlocked[1]});
      console.log("3Transfering 10 tokens from account 0 to account 1");
      //console.log(contracts.Deployed[0].transfer)
      contracts.Deployed[0].transfer.sendTransaction(accounts.Unlocked[1], 10, {from: accounts.Unlocked[0]});
      console.log("4Transfering 10 tokens from account 1 to account 0");
      contracts.Deployed[0].transfer.sendTransaction(accounts.Unlocked[0], 10, {from: accounts.Unlocked[1]});
      console.log("5Transfering 10 tokens from account 0 to account 1");
      //console.log(contracts.Deployed[0].transfer)
      contracts.Deployed[0].transfer.sendTransaction(accounts.Unlocked[1], 10, {from: accounts.Unlocked[0]});
      console.log("6Transfering 10 tokens from account 1 to account 0");
      contracts.Deployed[0].transfer.sendTransaction(accounts.Unlocked[0], 10, {from: accounts.Unlocked[1]});
      result.repeater.completed();
    }, 9999999999, 2, function() {
      cb(null, result);
    });
  });
  return tasks;
}
