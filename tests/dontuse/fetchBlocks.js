var scheduler = require('../scheduler.js');

var blockFrom = 1; // change this to the desired starting block
var frequency = 50;

module.exports.prepare = function(seq) {
  seq.push(function(result, cb) {
    result.blockchain.Sync(result, cb);
  });
}

module.exports.execute = function(seq) {
  seq.push(function(result, cb) {
    var blockCount = result.blockchain.LastBlockNumber-blockFrom;
    result.blockchain.PreviousBlockNumber = blockFrom-1;
    scheduler.Repeat(function(repeater) {
      result.repeater = repeater;
      result.blockchain.LogBlockStats(result)
    }, blockCount, frequency, function() {
      cb(null, result);
    });
  });
}
