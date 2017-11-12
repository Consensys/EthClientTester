var config = {}

/*  Connection settings
*/
config.nodes = [
  {
    web3RPCHost: "10.0.0.15",
    web3RPCPort: "20010"
  }, {
    web3RPCHost: "10.0.0.16",
    web3RPCPort: "20010"
  }, {
    web3RPCHost: "10.0.0.17",
    web3RPCPort: "20010"
  }
];

config.tests = [
  require('./tests/etherTransactionExample1.js')
];

/*  Number of accounts on test node that are always
    automatically unlocked when node starts (this is
    a node setting, so numInitiallyUnlockedAccounts
    should correspond with how the node is set up)
*/
config.numInitiallyUnlockedAccounts = 0;  

/* When using testrpc, the number of accounts
   will need to be specified when testrpc is
   started (use the -a=... option), and these 
   accounts will all be unlocked automatically.
*/
config.doAccountCreation = true;
config.doAccountUnlocking = true;
config.doEtherRedistribution = true;

/*  Miscellaneous settings
*/
config.web3RPCInitTimeoutMillis = 5000; // exits with error if it takes longer than this
config.accountUnlockThreadLimit = 5;    // number of concurrent threads limited to this

module.exports = config
