var config = {}

/*  Connection settings
*/
//config.clientType = 'ethereumjs-testrpc';
//config.nodes = [
//  {
//    name: 'testrpc1',
//    web3RPCHost: '127.0.0.1',
//    web3RPCPort: '8545',
//    genTraffic: true
//  }
//];

config.clientType = 'go-quorum';
config.nodes = [
  {
    name: "node1",
    web3RPCHost: "127.0.0.1",
    web3RPCPort: "20010",
    genTraffic: true
  }
];

/*  Test settings
*/
config.tests = [
  'etherTransactionExample2.js'
];

module.exports = config
