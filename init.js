var async = require('async')
var Web3RPC = require('web3quorum')
var Web3Admin = require('web3admin')
var config = require('./config.js')

function web3RPC(result, cb) {
  let host = result.web3RPCHost;
  let port = result.web3RPCPort;
  let httpProvider = Web3RPC.providers.HttpProvider;
  result.web3 = new Web3RPC(new httpProvider("http://" + host + ":" + port));
  result.web3.eth.getBlockNumber(function(err, res) {
    //console.log("[INFO] Web3 RPC initialized: Connected to " + host + ":" + port);
    if (err) {console.log("ERROR initializing Web3 connection:", err);}
    cb(null, result);
  });
}

function web3RPCTimeout(result, cb) {
  let wrappedWeb3RPC = async.timeout(web3RPC, config.web3RPCInitTimeoutMillis);
  wrappedWeb3RPC(result, function (err, res) {
    if (err) { 
      //console.log("[ERROR] Failed to initialize Web3 RPC: timeout");
      if (err) {console.log("ERROR initializing Web3 connection:", err);}
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

exports.Web3RPCTimeout = web3RPCTimeout;
exports.ExtendWeb3 = extendWeb3;
