var config = require('./config.js');

function log() {
  let fs = require('fs');
  let path = require('path');
  var object = {};

  function initialize(result, cb) {
    let logOptions = result.logOptions;
    let logPathRoot = logOptions.logPathRoot; 
    let logDirTest = logOptions.logDirTest;
    let logPathTest = logPathRoot + '/' + logDirTest;
    let logDirInstance = logOptions.logDirInstance;
    let logPathInstance = logPathTest + '/' + logDirInstance;
    if (!fs.existsSync(logPathRoot)) {
      fs.mkdirSync(logPathRoot);
    } 
    if (!fs.existsSync(logPathTest)) {
      fs.mkdirSync(logPathTest);
    } 
    if (!fs.existsSync(logPathInstance)) {
      fs.mkdirSync(logPathInstance);
    } 
    object.pathTest = logPathTest;
    object.path = logPathInstance;
    object.numErrors = 0;
    result.log = object;
    cb(null, result);
  }

  function appendTxHashResponse(logObj) {
    let timestamp;
    if (logObj.timestamp) {
      timestamp = logObj.timestamp;
    } else {
      timestamp = Date.now();
    }
    let msg = logObj.msg;
    let filePath = object.path + '/txHashResponses.log';
    let dataStr = timestamp + ',' + msg;
    appendToFile(filePath, dataStr, "");
  }

  function appendTxHashRequest(logObj) {
    let timestamp;
    if (logObj.timestamp) {
      timestamp = logObj.timestamp;
    } else {
      timestamp = Date.now();
    }
    let msg = logObj.msg;
    let filePath = object.path + '/txHashRequests.log';
    let dataStr = timestamp + ',' + msg;
    appendToFile(filePath, dataStr, "");
  }

  function appendStatusUpdate(logObj) {
    let timestamp;
    if (logObj.timestamp) {
      timestamp = logObj.timestamp;
    } else {
      timestamp = Date.now();
    }
    let msg = logObj.msg;
    let filePath = object.path + '/statusUpdates.log';
    let dataStr = timestamp + ',' + msg;
    appendToFile(filePath, dataStr, "");
  }

  function appendError(logObj) {
    if (object.numErrors < config.maxNumErrors) {
      let timestamp;
      if (logObj.timestamp) {
        timestamp = logObj.timestamp;
      } else {
        timestamp = Date.now();
      }
      let msg = logObj.msg;
      let filePath = object.path + '/errors.log';
      let str = timestamp + ',' + msg + '\n';
      fs.appendFile(filePath, str, function(err) {
        if (err) {console.log(err);}
      });
      object.numErrors++;
    }
  }

  function appendBlockStats(logObj) {
    let timestamp;
    if (logObj.timestamp) {
      timestamp = logObj.timestamp;
      if (config.clientType == 'go-quorum') { //timestamp in nanoseconds
        timestamp = Math.floor(timestamp/1000000);
      }
      //move to parent directory since only one copy needed.
      //Do this as soon as tests are not simply duplicated on each node
      //(each node can have its own test specified)
      //let filePath = object.pathTest + '/blockStats.log'; 
      let filePath = object.path + '/blockStats.log';
      let dataStr = timestamp + ',' + logObj.blockNumber + ',' + logObj.gasUsed + ',' +
        logObj.numTransactions;
      let headerStr = 'timestamp,blockNumber,gasUsed,numTransactions';
      appendToFile(filePath, dataStr, headerStr);
    } else {
      appendError({
        msg: 'ERROR in log.appendBlockStats: logObj contains no timestamp!'
      });
    }
  }

  function appendHostStats(logObj) {
    let timestamp;
    if (logObj.timestamp) {
      let timestamp = logObj.timestamp;
      let filePath = object.path + '/hostStats.log';
      let dataStr = timestamp + ',' + 
        logObj.requestTimestamp + ',' + 
        logObj.requestReceivedTimestamp + ',' + 
        logObj.responseTimestamp + ',' + 
        logObj.responseReceivedTimestamp + ',' + 
        logObj.statsTimestamp + ',' + 
        logObj.numCpus + ',' +
        logObj.memkBTot + ',' + 
        logObj.utilization + ',' + 
        logObj.loadAvg1m + ',' + 
        logObj.memkBAvail + ',' + 
        logObj.iowait + ',' + 
        logObj.await + ',' + 
        logObj.svctm + ',' + 
        logObj.diskkBpsRead + ',' + 
        logObj.diskkBpsWrite + ',' + 
        logObj.chaindataSizekB;
      let headerStr = 'timestamp,requestTimestamp,requestReceivedTimestamp,' + 
        'responseTimestamp,responseReceivedTimestamp,statsTimestamp,numCpus,' +
        'memkBTot,utilization,loadAvg1m,memkBAvail,iowait,await,svctm,' + 
        'diskkBpsRead,diskkBpsWrite,chaindataSizekB';
      appendToFile(filePath, dataStr, headerStr);
    } else {
      appendError({
        msg: 'ERROR in log.appendHostStats: logObj contains no timestamp!'
      });
    }
  }
 
  /*  Appends line to log file. Creates log file if it does not yet 
      exist, and write a header line if a non-empty header str is provided.
  */
  function appendToFile(filePath, dataStr, headerStr) {
    fs.open(filePath, 'ax', function(err, fd) {
      if (err && err.code == 'EEXIST') {
        fs.open(filePath, 'a', function(err, fd) {
          fs.write(fd, dataStr + '\n', function(err, wrtn, str) {
            if (err) {
              appendError({
                msg: 'ERROR in log.appendToFile: ' + err
              });
            }
          });
        });
      } else { // file does not exist yet, write header line first
        fs.open(filePath, 'a', function(err, fd) {
          let totalStr = dataStr + '\n';
          if ((headerStr) && (headerStr != "")) {
            totalStr = headerStr + '\n' + dataStr + '\n';
          } 
          fs.write(fd, totalStr, function(err, wrtn, str) {
            if (err) {
              appendError({
                msg: 'ERROR in log.appendToFile: ' + err
              });
            }
          });
        });
      }
    });
  }

  object.Initialize = initialize;
  object.AppendTxHashRequest = appendTxHashRequest;
  object.AppendTxHashResponse = appendTxHashResponse;
  object.AppendStatusUpdate = appendStatusUpdate;
  object.AppendError = appendError;
  object.AppendBlockStats = appendBlockStats;
  object.AppendHostStats = appendHostStats;
  return object;
}

module.exports = log;
