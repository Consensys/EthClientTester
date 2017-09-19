var async = require('async')
var Web3RPC = require('web3quorum')
var Web3Admin = require('web3admin')
var config = require('./config.js')

function RPC(result, cb) {
	let host = config.web3RPCHost;
	let port = config.web3RPCPort;
	let httpProvider = Web3RPC.providers.HttpProvider;
	result.web3 = new Web3RPC(new httpProvider("http://" + host + ":" + port));
	result.web3.eth.getBlockNumber(function(err, res) {
		console.log("[INFO] Web3 RPC initialized: Connected to " + host + ":" + port);
		cb(null, result);
	});
}

function RPCTimeout(result, cb) {
	let wrappedRPC = async.timeout(RPC, config.web3RPCInitTimeoutMillis);
	wrappedRPC(result, function (err, res) {
		if (err) { 
			console.log("[ERROR] Failed to initialize Web3 RPC: timeout");
			cb(err, null);
		} else { 
			cb(null, result);
		}
	});
}

function extendWeb3(result, cb) {
	setTimeout(function() {
		Web3Admin.extend(result.web3);
	}, 1000);
	cb(null, result);
}

exports.RPCTimeout = RPCTimeout;
exports.extendWeb3 = extendWeb3;
