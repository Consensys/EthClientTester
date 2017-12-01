function blockchain() {
  let async = require('async');
  let config = require('./config.js');
  let object = {};

  // Move this to a util file
  function convertBlocktimeToSeconds(timestamp){
    // if quorum
    return timestamp/1000/1000/1000
    // testrpc should already be in seconds
  }

  function getBlocks(result, cb){
    let web3 = result.web3
    web3.eth.getBlock('latest', function(err, block){

      object.blockHeight = block.number
      let currentBlockNumber = block.number

      let previousWritePeriod = 2 // seconds. This should be passing in via result
      let latestBlockTimestamp = convertBlocktimeToSeconds(block.timestamp)
      let oldestBlockTimestamp = latestBlockTimestamp - previousWritePeriod
      let currentBlockTimestamp = latestBlockTimestamp // seconds
      let blockList = []
      let averageRate = 0
      async.whilst(function(){
        return ((currentBlockTimestamp > oldestBlockTimestamp) && (currentBlockNumber > 0))
      } , function(callback){
        web3.eth.getBlock(currentBlockNumber, function(err, currentBlock){
          if(err){
            result.log.AppendError({
              msg: 'ERROR in blockchain.getBlock: ' + err
            });
          }
          currentBlockNumber--  
          currentBlockTimestamp = convertBlocktimeToSeconds(currentBlock.timestamp)
          if(currentBlockTimestamp > oldestBlockTimestamp){
            blockList.push(currentBlock)
          }
          callback(err, currentBlockNumber)
        }) 
      }, function(err, currentBlockNumber){
        let txCount = 0
        let sumGasUsed = 0
        let elapsedTime = Math.abs(blockList[0].timestamp -blockList[blockList.length-1].timestamp) 
        elapsedTime = convertBlocktimeToSeconds(elapsedTime)
        for(let i = 1; i < blockList.length; i++){
          let currentBlock = blockList[i]
          txCount += currentBlock.transactions.length 
          sumGasUsed += currentBlock.gasUsed
        }
        averageRate = txCount/(elapsedTime)
        averageGas = sumGasUsed/(elapsedTime)
        console.log('elapsedTime:', elapsedTime.toFixed(3), '[s]')
        console.log('txCount:', txCount)
        console.log('averageRate:', averageRate.toFixed(3), '[tx/s]')
        console.log('averageGas:', averageGas.toFixed(3), '[gasUnits/s]')
        cb(null, result)
      })
    })
  }

  object.getBlocks = getBlocks
  return object;
}

module.exports = blockchain;
