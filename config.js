var config = {}

/*  Connection settings
*/
config.clientType = 'go-quorum';
config.nodes = [
  {
    name: "node1",
    web3RPCHost: "51.140.42.117",
    web3RPCPort: "20010",
    genTraffic: true
  }, {
    name: "node2",
    web3RPCHost: "51.140.176.110",
    web3RPCPort: "20010",
    genTraffic: false
  }, {
    name: "node3",
    web3RPCHost: "51.140.180.108",
    web3RPCPort: "20010",
    genTraffic: false
  }, {
    name: "node4",
    web3RPCHost: "51.140.161.117",
    web3RPCPort: "20010",
    genTraffic: false
  }
];

/*  Test settings
*/
config.tests = [
  'tokenTransferRampedExample1.js'
  //'fetchBlocks.js'
  //'etherTransactionExample1.js'
  //'tokenContractAsynchronuousExample1.js'
  //'tokenTransferConstantRate1.js'
];

module.exports = config
