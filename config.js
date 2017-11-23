var path = require('path');
var config = {}

/*  Connection settings
*/
config.nodes = [
  {
    name: "testrpc1",
    web3RPCHost: "localhost",
    web3RPCPort: "8545"
  }
];
//config.nodes = [
//  {
//    name: "node1",
//    web3RPCHost: "10.0.0.12",
//    web3RPCPort: "20010"
//  }, {
//    name: "node2",
//    web3RPCHost: "10.0.0.9",
//    web3RPCPort: "20010"
//  }, {
//    name: "node3",
//    web3RPCHost: "10.0.0.11",
//    web3RPCPort: "20010"
//  }
//];

config.tests = [
  require('./tests/tokenContractAsynchronuousExample1.js')
  //require('./tests/etherTransactionExample1.js')
];

/*  Path to the root log directory
*/
config.logPathRoot = path.resolve(__dirname, 'logs');

/*  When using testrpc, the number of accounts
    will need to be specified when testrpc is
    started (use the -a=... option), and these 
    accounts will all be unlocked automatically.
*/
/*  Number of accounts on test node that are always
    automatically unlocked when node starts (this is
    a node setting, so numInitiallyUnlockedAccounts
    should correspond with how the node is set up)
*/
config.numInitiallyUnlockedAccounts = 0;  

/*  These can be changed if the necessary accounts 
    have already been created/unlocked
*/
config.doAccountCreation = true;
config.doAccountUnlocking = true;
config.doEtherRedistribution = true;

/*  Miscellaneous settings
*/
config.web3RPCInitTimeoutMillis = 5000; // exits with error if it takes longer than this
config.accountUnlockThreadLimit = 5;    // number of concurrent threads limited to this

config.syncUnpause = true;

module.exports = config
