var contracts = require('./contracts.js');
var ERC20 = require('./contracts/ERC20.js');

var config = {}

/*  Connection settings
*/
config.web3RPCHost = "localhost"     //Raft4
//config.web3RPCHost = "52.233.193.115"     //Raft4
//config.web3RPCHost = "52.233.139.22";   //Raft5
//config.web3RPCHost = "104.46.49.141";   //Raft6
config.web3RPCPort = "8545"
//config.web3RPCPort = "20010"

/*  Test node settings
*/
config.numInitiallyUnlockedAccounts = 0; // number of accounts on test node that are always
                                         // automatically unlocked when node starts

/* When using testrpc, the number of accounts
   will need to be specified when testrpc is
   started (use the -a=... option), and these 
   accounts will all be unlocked automatically.
*/
config.doAccountCreation = false;
config.doAccountUnlocking = false;
config.doEtherRedistribution = false;

config.contractDataArray = [
  contracts.GatherInfo(ERC20, 0),
  contracts.GatherInfo(ERC20, 1)
];

config.web3RPCInitTimeoutMillis = 5000; // exits with error if it takes longer than this
config.accountUnlockThreadLimit = 5;    // number of concurrent threads limited to this

module.exports = config
