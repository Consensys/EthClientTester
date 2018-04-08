var config = {}

/*  Connection settings
*/
config.clientType = 'ethereumjs-testrpc';
config.nodes = [
  {
    name: 'testrpc1',
    web3RPCHost: '127.0.0.1',
    web3RPCPort: '8545',
    genTraffic: true
  }
];

//config.clientType = 'go-quorum';
//config.nodes = [
//  {
//    name: "node1",
//    web3RPCHost: "127.0.0.1",
//    web3RPCPort: "20010",
//    genTraffic: true
//  }, {
//    name: "node2",
//    web3RPCHost: "192.168.0.2",
//    web3RPCPort: "20010",
//    genTraffic: false
//  }, {
//    name: "node3",
//    web3RPCHost: "192.168.0.3",
//    web3RPCPort: "20010",
//    genTraffic: false
//  }, {
//    name: "node4",
//    web3RPCHost: "192.168.0.4",
//    web3RPCPort: "20010",
//    genTraffic: false
//  }
//];

/*  Test settings
*/
config.tests = [
  'tokenTransferRampedExample1.js'
  //'etherTransactionExample2.js'
];

module.exports = config
