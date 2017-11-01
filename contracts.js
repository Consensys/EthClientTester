var async = require('async');
var fs = require('fs');
var solc = require('solc');

var deployed = [];
var numDeployed = 0;

function deploy(result, cb) {
  let config = require('./config.js');
  let stdout = process.stdout;
  let web3 = result.web3;
  let contractDataArray = config.contractDataArray;

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
      from: web3.eth.accounts[compiledContract.ownerIndex],
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

  async.eachLimit(contractDataArray, 1, function(contractData, callback) {
    displayProgress();
    let compiledContract = compileContract;
    deployCompiledContract(compiledContract, callback);
  }, function(err) {
    displaySummary();
    cb(null, result);
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

exports.Deployed = deployed;
exports.Deploy = deploy;
exports.GatherInfo = gatherInfo;
