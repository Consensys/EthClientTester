function blockchain() {
  let async = require('async');
  let config = require('./config.js');
  let object = {};

  function getBlocks(result, cb){
    let numBlocks = 500 // To be moved to result
    let web3 = result.web3
    object.blockHeight = web3.eth.blockNumber
    let currentBlockNumber = object.blockHeight
    let blockList = []
    let averageRate = 0
    async.whilst(function(){
      return ((object.blockHeight - currentBlockNumber < numBlocks) && (currentBlockNumber > 0))
    } , function(callback){
      web3.eth.getBlock(currentBlockNumber, function(err, block){
        if(err){
          result.log.AppendError({
            msg: 'ERROR in blockchain.getBlock: ' + err
          });
        }
        blockList.push(block)
        currentBlockNumber--  
        callback(err, currentBlockNumber)
      }) 
    }, function(err, currentBlockNumber){
      let txCount = 0
      let elapsedTime = Math.abs(blockList[0].timestamp -blockList[blockList.length-1].timestamp) 
      for(let block of blockList){
        txCount += block.transactions.length 
      }
      averageRate = txCount/(elapsedTime/1000/1000/1000)
      console.log('elapsedTime:', elapsedTime/1000/1000/1000)
      console.log('txCount:', txCount)
      console.log('averageRate:', averageRate)
      cb()
    })
  }

  object.getBlocks = getBlocks

  return object;
}

module.exports = blockchain;
