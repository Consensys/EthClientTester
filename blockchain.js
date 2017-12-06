function blockchain() {
  let async = require('async');
  let config = require('./config.js');
  let object = {};
  object.LastBlockNumber = 0;
  object.NumNewBlocksSincePreviousSync = 0;
  object.PreviousBlockNumber = 0;
  object.CurrentBlockNumber = 0;

  function sync(result, cb) {
    let web3 = result.web3;
    result.log.AppendStatusUpdate({
      msg: 'Synchronizing blockchain data...'
    });
    web3.eth.getBlockNumber(function(err, blockNumber) {
      if (err) {
        result.log.AppendError({
          msg: 'ERROR in blockchain.sync: ' + err
        });
      } else {
        result.log.AppendStatusUpdate({
          msg: 'Done.'
        });
        object.NumNewBlocksSincePreviousSync = blockNumber - object.LastBlockNumber;
        object.LastBlockNumber = blockNumber
      }
      if (cb) {cb(null, result); }
    });
  }

  function logBlockStats(result, cb) {
    let web3 = result.web3;
    // if currentBlockNumber is not specified, automatically goes to next block after previous
    let blockOptions = {
      currentBlockNumber: object.PreviousBlockNumber + 1
    }
    if (result.blockOptions) {
      blockOptions = result.blockOptions;
    }
    
    function handleGetBlockResponse(err, currentBlock) {
      if (err) {
        result.log.AppendError({
          msg: 'ERROR in blockchain.logBlockStats: ' + err
        });
      } else if (currentBlock == null) {
        // this means all blocks have been fetched
      } else {
        object.PreviousBlockNumber = object.CurrentBlockNumber;
        result.log.AppendStatusUpdate({
          msg: 'Done.'
        });
        let timestamp = currentBlock.timestamp;
        let blockNumber = currentBlock.number;
        let gasUsed = currentBlock.gasUsed;
        let numTransactions = currentBlock.transactions.length;
        result.log.AppendBlockStats({
          timestamp: timestamp,
          blockNumber: blockNumber,
          gasUsed: gasUsed,
          numTransactions: numTransactions 
        });
      }
      if (result.repeater) {
        result.repeater.completed();
      }
      if (cb) {cb(null, result); }
    }

    // no more blocks to collects stats from
    if (object.CurrentBlockNumber > object.LastBlockNumber) {
      result.log.AppendStatusUpdate({
        msg: 'No new block stats to fetch'
      });
    } else {
      object.CurrentBlockNumber = blockOptions.currentBlockNumber;
      result.log.AppendStatusUpdate({
        msg: 'Fetching block stats...'
      });
      web3.eth.getBlock(object.CurrentBlockNumber, function(err, currentBlock) {
        handleGetBlockResponse(err, currentBlock);
      });
    }
  }
  object.Sync = sync;
  object.LogBlockStats = logBlockStats;
  return object;
}

module.exports = blockchain;
