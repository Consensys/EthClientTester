var path = require('path');
var config = {}

/*  Connection settings
*/
config.nodes = [
  {
    name: "testrpc1",
    web3RPCHost: "localhost",
    web3RPCPort: "8545",
    genTraffic: true
  }
];
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
//config.nodes = [
//  {
//    name: "raft1",
//    web3RPCHost: "127.0.0.1",
//    web3RPCPort: "20010",
//    genTraffic: true
//  }
//];

config.tests = [
  require('./tests/etherTransactionExample1.js')
  //require('./tests/tokenContractAsynchronuousExample1.js')
  //require('./tests/tokenTransferConstantRate1.js')
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
config.numInitiallyUnlockedAccounts = 10;  

/*  These can be changed if the necessary accounts 
    have already been created/unlocked
    These will typically be false when using testrpc
    and true when using quorum
*/
config.doAccountCreation = false;
config.doAccountUnlocking = false;
config.doEtherRedistribution = false;

/*  Miscellaneous settings
*/
config.web3RPCInitTimeoutMillis = 5000; // exits with error if it takes longer than this
config.accountUnlockThreadLimit = 5;    // number of concurrent threads limited to this

config.syncUnpause = true;

/*  Remote Probe settings
*/
config.probeDataFetchPeriod = 0; // a value of 0 disables fetching of robe data

/*  Specify a max number of errors to be logged (checked individually per node). 
    Prevents error log file being spammed when something breaks.
*/
config.maxNumErrors = 10000;

module.exports = config
