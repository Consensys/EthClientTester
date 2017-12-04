var config = {}

/*  Connection settings
*/
config.clientType = 'ethereumjs-testrpc';

config.nodes = [
  {
    name: "testrpc1",
    web3RPCHost: "localhost",
    web3RPCPort: "8545",
    genTraffic: true
  }
];

//config.clientType = 'go-quorum';
//
//config.nodes = [
//  {
//    name: "node1",
//    web3RPCHost: "10.0.0.12",
//    web3RPCPort: "20010",
//    genTraffic: true
//  }, {
//    name: "node2",
//    web3RPCHost: "10.0.0.9",
//    web3RPCPort: "20010",
//    genTraffic: true
//  }, {
//    name: "node3",
//    web3RPCHost: "10.0.0.11",
//    web3RPCPort: "20010",
//    genTraffic: true
//  }
//];

config.tests = [
  'etherTransactionExample1.js'
  //'tokenContractAsynchronuousExample1.js'
  //'tokenTransferConstantRate1.js'
];


module.exports = config
