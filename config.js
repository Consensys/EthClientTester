var config = {}

config.web3RPCHost = "52.233.193.115"     //Raft4
//config.web3RPCHost = "52.233.139.22";   //Raft5
//config.web3RPCHost = "104.46.49.141";   //Raft6
config.web3RPCPort = "20010"

/*  It seems that in order to generate high transaction volumes in a very
    short time, it is necessary to use multiple accounts (this probably depends on
    network quality), since nonce value sequences get broken, or the whole 
    batch fails (when >700 transactions are sent from a single account). 
    It also seems like the txpool is limited to a certain number (64?) of 
    queued transactions per account (rather than in total). Previously used 
    accounts can be reused for benchmarking, but they need to be unlocked 
    everytime, and this can take quite long for a large number of accounts.
*/

/*  Transactions are sent in batches of <numAccounts> transactions at a time,
    at a rate of <txRatePerAccount> batches per second.
*/
config.txOptions = {
  txRatePerAccount: 1,                 // transaction rate per account per second
  numAccounts: 5,                       // number of accounts
  value: 10,
  maxTimeMillis: 10*1000                    // amount of time to send the transactions for
};

config.queryOptions = {
  batchRate: 1,                         // batch rate per second
  numQueriesPerBatch: 1,                // number of queries per batch
  maxTimeMillis: 5000                   // amount of time to send the queries for
};

config.contractDataArray = [{
  relativeSourcePath: './contracts/ERC20.sol', // path to the solidity contract source code
  contractName: 'ERC20',               // name of the contract
  contractOwnerIndex: 0                // index of the contract owner in web3.eth.accounts
  }
  //{
  //relativeSourcePath: './contracts/ERC20.sol', // path to the solidity contract source code
  //contractName: 'ERC20',               // name of the contract
  //contractOwnerIndex: 1                // index of the contract owner in web3.eth.accounts
  //}, {
  //relativeSourcePath: './contracts/ERC20.sol', // path to the solidity contract source code
  //contractName: 'ERC20',               // name of the contract
  //contractOwnerIndex: 2                // index of the contract owner in web3.eth.accounts
  //}, {
  //relativeSourcePath: './contracts/ERC20.sol', // path to the solidity contract source code
  //contractName: 'ERC20',               // name of the contract
  //contractOwnerIndex: 3                // index of the contract owner in web3.eth.accounts
  //}
];

config.web3RPCInitTimeoutMillis = 5000; // exits with error if it takes longer than this
config.accountUnlockThreadLimit = 5;    // number of concurrent threads limited to this

module.exports = config
