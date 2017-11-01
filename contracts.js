var async = require('async');
var fs = require('fs');
var solc = require('solc');
var accounts = require('./accounts.js');

var deployed = [];
var numDeployed = 0;

function deploy(result, cb) {
  let config = require('./config.js');
  let stdout = process.stdout;
  let web3 = result.web3;
  let contractDataArray = config.contractDataArray;
  let numRequiredAccounts = getMaxAccountIndex(contractDataArray) + 1;
  let stopinterval = false;
  //initialize a new task list for performing the required setup
  let tasks = [function(callback) { callback(null, result); }];

  //settings passed along to the queued functions
  result.accountOptions = {
    numRequiredAccounts: numRequiredAccounts,
  };

  function displaySummary() {
    console.log("\r[INFO] Deploying contracts: " + 
      numDeployed + " / " + contractDataArray.length);
  }

  function displayProgress() {
    stdout.write(`\r[INFO] Deploying contracts: ` + 
      numDeployed + ` / ` + contractDataArray.length);
  }

  function compileContract(contractData) {
    let relativeSourcePath = contractData.relativeSourcePath;
    let contractName = contractData.contractName;
    let contractOwnerIndex = contractData.contractOwnerIndex;

    let input = fs.readFileSync(relativeSourcePath).toString();
    let output = solc.compile({sources: {[contractName+'.sol']: input}}, 1, function(path) {
      let contents = fs.readFileSync(path);
      return { contents: contents.toString() };
    });
    if (output) {
      let bytecode = output.contracts[contractName+'.sol:'+contractName].bytecode;
      let abi = JSON.parse(output.contracts[contractName+'.sol:'+contractName].interface);
      compiledContract = {
        bytecode: bytecode,
        abi: abi,
        ownerIndex: contractOwnerIndex
      }
      return compiledContract;
    } else {
      return {};
    }
  }
  
  function deployCompiledContract(compiledContract, callback) {
    let contract = web3.eth.contract(compiledContract.abi);
    web3.eth.sendTransaction({ 
      data: '0x' + compiledContract.bytecode,
      from: accounts.Unlocked[compiledContract.ownerIndex],
      gas: 4700000 // if not enough gas is provided, contract won't be initialized properly... truffle uses a default of +- 4.7 million gass
    }, function(err, res) {
      if (!err) { 
        //console.log(res);
        // request the transaction receipt in order to obtain the contract address
        let receipt = web3.eth.getTransactionReceipt(res);
        if (!receipt) {
          console.log("ERROR:", "Failed to get transaction receipt after deploying contract");
        } else {
          deployed.push(contract.at(receipt.contractAddress));
          numDeployed++;
          callback(null);
        }
      } else {
        callback(err);
      }
    });
  }

  function deployAllContracts() {
    async.eachLimit(contractDataArray, 1, function(contractData, callback) {
      displayProgress();
      let compiledContract = compileContract(contractData);
      deployCompiledContract(compiledContract, callback);
    }, function(err) {
      displaySummary();
      cb(null, result);
    });  
  }

  //create accounts
  if ((config.doAccountCreation === undefined) || (config.doAccountCreation != false)) {
    stopInterval = true;
    tasks.push(accounts.Create);
  }
  //unlock accounts
  if ((config.doAccountUnlocking === undefined) || (config.doAccountUnlocking != false)) {
    if (accounts.Unlocked.length < numRequiredAccounts) {
      stopInterval = true;
      tasks.push(accounts.Unlock);
    }
  } else { 
    if ((!accounts.Unlocked) || accounts.Unlocked.length < numRequiredAccounts) {
      stopInterval = true;
      /*if not unlocking accounts, it is assumed that all 
        the needed accounts are already unlocked*/
      tasks.push(accounts.UpdateRequiredToUnlocked);
    }
  }

  //pause (wait) until initialization is completed before resuming
  if (result.repeater && stopInterval) { result.repeater.pause(); }
  async.waterfall(tasks, function(err, res) {
    if (!err) {
      deployAllContracts();
      if (result.repeater) { result.repeater.resume(); }
    } else {
      cb(err, null);
    }
  });
}

function gatherInfo(contractInfo, contractOwnerIndex) {
  let contractObject = {};
  contractObject.relativeSourcePath = contractInfo.RelativeSourcePath;
  contractObject.contractName = contractInfo.ContractName;
  if (contractOwnerIndex) {
    contractObject.contractOwnerIndex = contractOwnerIndex;
  } else {
    contractObject.contractOwnerIndex = 0;
  }
  return contractObject;
}

function getMaxAccountIndex(contractDataArray) {
  let previousMaxIndex = 0;
  for (let i = 0; i < contractDataArray.length; i++) {
    let contractData = contractDataArray[i];
    if (contractData.contractOwnerIndex > previousMaxIndex) {
      previousMaxIndex = contractData.contractOwnerIndex;
    } 
  }
  return previousMaxIndex;
}

exports.Deployed = deployed;
exports.Deploy = deploy;
exports.GatherInfo = gatherInfo;
