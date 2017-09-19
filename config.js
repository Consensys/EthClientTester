var config = {}

config.web3RPCHost = "52.233.193.115" 		//Raft4
//config.web3RPCHost = "52.233.139.22";		//Raft5
//config.web3RPCHost = "104.46.49.141";		//Raft6
config.web3RPCPort = "20010"

/* 	It seems that in order to generate high transaction volumes in a very
	 	short time, it is necessary to use multiple accounts (this probably depends on
	 	network quality), since nonce value sequences get broken, or the whole 
	 	batch fails (when >700 transactions are sent from a single account). 
	 	It also seems like the txpool is limited to a certain number (64?) of 
	 	queued transactions per account (rather than in total). Previously used 
	 	accounts can be reused for benchmarking, but they need to be unlocked 
	 	everytime, and this can take quite long for a large number of accounts.
*/

/*	Transactions are sent in batches of <numAccounts> transactions at a time,
		at a rate of <txRatePerAccount> times per second.
*/
config.txOptions = {
	txRatePerAccount: 2,									// transaction rate per account per second
	numAccounts: 6,												// number of accounts
	value: 10
};

config.web3RPCInitTimeoutMillis = 5000; // exits with error if it takes longer than this
config.accountUnlockThreadLimit = 5;		// number of concurrent threads limited to this
config.maxTimeMillis = 500;							// amount of time to send the transactions for

module.exports = config
