var config = {}

config.web3RPCHost = "52.233.193.115" 		//Raft4
//config.web3RPCHost = "52.233.139.22";		//Raft5
//config.web3RPCHost = "104.46.49.141";		//Raft6
config.web3RPCPort = "20010"

/* It seems that in order to generate high transaction volumes in a very
	 short time, it is necessary to use multiple accounts (this probably depends on
	 network quality), since nonce value sequences get broken, or the whole 
	 batch fails (when >700 transactions are sent from a single account). 
	 It also seems like the txpool is limited to a certain number (64?) of 
	 queued transactions per account (rather than in total). Previously used 
	 accounts can be reused for benchmarking, but they need to be unlocked 
	 everytime, and this can take quite long for a large number of accounts.
*/


config.txOptions = {
	txRatePerAccount: 1,			// transaction rate per account per second
	numAccounts: 1,					// number of accounts
	value: 10
};

config.maxTime = 10;

module.exports = config
