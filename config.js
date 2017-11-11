var contracts = require('./contracts.js');
var ERC20 = require('./contracts/ERC20.js');

var config = {}

/*  Connection settings
*/
config.web3RPCHost = "localhost"     //Raft4
config.web3RPCPort = "8545"

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

/*  Contract settings
*/
config.contractDataArray = [
  contracts.GatherInfo(ERC20, 0)
];

/*  Miscellaneous settings
*/
config.web3RPCInitTimeoutMillis = 5000; // exits with error if it takes longer than this
config.accountUnlockThreadLimit = 5;    // number of concurrent threads limited to this

module.exports = config
