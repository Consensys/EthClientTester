function contracts() {
  let async = require('async');
  let fs = require('fs');
  let solc = require('solc');
  let config = require('./config.js');
  let object = {};

  object.Deployed = [];
  object.NumDeployed = 0;

  function deploy(result, cb) {
    let stdout = process.stdout;
    let web3 = result.web3;
    let contractDataArray = result.contractOptions.contractDataArray;
    let numDeploymentAccounts = getMaxAccountIndex(contractDataArray) + 1;
    let stopinterval = false;
    let accounts = result.accounts;

    //initialize a new task list for performing the required setup
    let tasks = [function(callback) { callback(null, result); }];

    //settings passed along to the queued functions
    if (!result.accountOptions) {
      result.accountOptions = {
        numRequiredAccounts: numDeploymentAccounts,
      };
    }
    let numRequiredAccounts = result.accountOptions.numRequiredAccounts;

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
        result.log.AppendError({
          msg: 'ERROR in contracts.compileContract: ' + err
        });
        return {};
      }
    }
    
    function deployCompiledContract(compiledContract, callback) {
      let contract = web3.eth.contract(compiledContract.abi);
      let deploymentTx = { 
        data: '0x' + compiledContract.bytecode,
        from: accounts.Unlocked[compiledContract.ownerIndex],
      };
      deploymentTx.gas = web3.eth.estimateGas(deploymentTx);
      web3.eth.sendTransaction(deploymentTx, function(err, res) {
        if (!err) { 
          // request the transaction receipt in order to obtain the contract address
          let receipt = web3.eth.getTransactionReceipt(res);
          if (!receipt) {
            result.log.AppendError({
              msg: 'ERROR in contracts.deployCompiledContract (no receipt): ' + err
            });
          } else {
            let instance = contract.at(receipt.contractAddress);
            for (let i = 0; i < instance.abi.length; i++) {
              if (instance.abi[i].name) {
                instance[instance.abi[i].name].getTx = function() {
                  let txData = instance[instance.abi[i].name].getData.apply(this, arguments);
                  let tx = {
                    from: arguments[arguments.length-1].from,
                    to: instance.address,
                    data: txData,
                  }
                  if (arguments[arguments.length-1].gas) {
                    tx.gas = arguments[arguments.length-1].gas;
                  } else {
                    tx.gas = web3.eth.estimateGas(tx);
                  }
                  return tx;
                }
              }
            }
            object.Deployed.push(instance);
            object.NumDeployed++;
            callback(null);
          }
        } else {
          result.log.AppendError({
            msg: 'ERROR in contracts.deployCompiledContract: ' + err
          });
          callback(err);
        }
      });
    }

    function deployAllContracts() {
      async.eachLimit(contractDataArray, 1, function(contractData, callback) {
        let compiledContract = compileContract(contractData);
        deployCompiledContract(compiledContract, callback);
      }, function(err) {
        cb(null, result);
      });  
    }

    deployAllContracts();
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

  object.Deploy = deploy;
  object.GatherInfo = gatherInfo;

  return object;
}

module.exports = contracts;
