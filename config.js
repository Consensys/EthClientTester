var config = {}

/*  Connection settings
*/
config.nodes = [
  {
    web3RPCHost: "localhost",
    web3RPCPort: "8545"
  }
]

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
config.doAccountCreation = false;
config.doAccountUnlocking = false;
config.doEtherRedistribution = false;

/*  Miscellaneous settings
*/
config.web3RPCInitTimeoutMillis = 5000; // exits with error if it takes longer than this
config.accountUnlockThreadLimit = 5;    // number of concurrent threads limited to this

module.exports = config
