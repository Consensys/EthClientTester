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
    let str = timestamp + ',' + msg + '\n';
    fs.appendFile(filePath, str, function(err) {
      if (err) {console.log(err);}
    });
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
    let str = timestamp + ',' + msg + '\n';
    fs.appendFile(filePath, str, function(err) {
      if (err) {console.log(err);}
    });
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
    let str = timestamp + ',' + msg + '\n';
    fs.appendFile(filePath, str, function(err) {
      if (err) {console.log(err);}
    });
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
      let str = timestamp + ',' + logObj.blockNumber + ',' + logObj.gasUsed + ',' +
        logObj.numTransactions + '\n';
      fs.open(filePath, 'ax', function(err, fd) {
        if (err && err.code == 'EEXIST') {
          fs.open(filePath, 'a', function(err, fd) {
            fs.write(fd, str, function(err, wrtn, str) {
              if (err) {
                appendError({
                  msg: 'ERROR in log.appendBlockStats: ' + err
                });
              }
            });
          });
        } else { // file does not exist yet, write header line first
          fs.open(filePath, 'a', function(err, fd) {
            let headerStr = 'timestamp,blockNumber,gasUsed,numTransactions\n';
            let totalStr = headerStr + str;
            fs.write(fd, totalStr, function(err, wrtn, str) {
              if (err) {
                appendError({
                  msg: 'ERROR in log.appendBlockStats: ' + err
                });
              }
            });
          });
        }
      });
    } else {
      appendError({
        msg: 'ERROR in log.appendBlockStats: logObj contains no timestamp!'
      });
    }
  }

  function appendCPUStats(logObj) {
    let timestamp;
    if (logObj.timestamp) {
      timestamp = logObj.timestamp;
    } else {
      appendError({
        msg: 'ERROR in log.appendCPUStats: logObj contains no timestamp!'
      });
    }
    let filePath = object.path + '/hostCPUStats.log';
    let str = timestamp + ',' + logObj.numCpus + ',' + logObj.utilization + ',' +
      logObj.loadAvg1m + ',' + logObj.loadAvg5m + ',' + logObj.loadAvg15m + '\n';
    fs.open(filePath, 'ax', function(err, fd) {
      if (err && err.code == 'EEXIST') {
        fs.open(filePath, 'a', function(err, fd) {
          fs.write(fd, str, function(err, wrtn, str) {
            if (err) {
              appendError({
                msg: 'ERROR in log.appendCPUStats: ' + err
              });
            }
          });
        });
      } else { // file does not exist yet, write header line first
        fs.open(filePath, 'a', function(err, fd) {
          let headerStr = 'timestamp,numCpus,utilization,loadAvg1m,loadAvg5m,loadAvg15m\n';
          let totalStr = headerStr + str;
          fs.write(fd, totalStr, function(err, wrtn, str) {
            if (err) {
              appendError({
                msg: 'ERROR in log.appendCPUStats: ' + err
              });
            }
          });
        });
      }
    });
  }

  function appendMemStats(logObj) {
    let timestamp;
    if (logObj.timestamp) {
      timestamp = logObj.timestamp;
    } else {
      appendError({
        msg: 'ERROR in log.appendMemStats: logObj contains no timestamp!'
      });
    }
    let filePath = object.path + '/hostMemStats.log';
    let str = timestamp + ',' + logObj.kBAvailable + ',' + logObj.kBTotal + '\n';
    fs.open(filePath, 'ax', function(err, fd) {
      if (err && err.code == 'EEXIST') {
        fs.open(filePath, 'a', function(err, fd) {
          fs.write(fd, str, function(err, wrtn, str) {
            if (err) {
              appendError({
                msg: 'ERROR in log.appendMemStats: ' + err
              });
            }
          });
        });
      } else { // file does not exist yet, write header line first
        fs.open(filePath, 'a', function(err, fd) {
          let headerStr = 'timestamp,kBAvailable,kBTotal\n';
          let totalStr = headerStr + str;
          fs.write(fd, totalStr, function(err, wrtn, str) {
            if (err) {
              appendError({
                msg: 'ERROR in log.appendMemStats: ' + err
              });
            }
          });
        });
      }
    });
  }

  function appendDiskStats(logObj) {
    let timestamp;
    if (logObj.timestamp) {
      timestamp = logObj.timestamp;
    } else {
      appendError({
        msg: 'ERROR in log.appendDiskStats: logObj contains no timestamp!'
      });
    }
    let filePath = object.path + '/hostDiskStats.log';
    let str = timestamp + ',' + logObj.iowait + ',' + logObj.await + ',' +
      logObj.svctm + ',' + logObj.kBpsRead + ',' + logObj.kBpsWrite + ',' + logObj.chaindataSizekB + '\n';
    fs.open(filePath, 'ax', function(err, fd) {
      if (err && err.code == 'EEXIST') {
        fs.open(filePath, 'a', function(err, fd) {
          fs.write(fd, str, function(err, wrtn, str) {
            if (err) {
              appendError({
                msg: 'ERROR in log.appendDiskStats: ' + err
              });
            }
          });
        });
      } else { // file does not exist yet, write header line first
        fs.open(filePath, 'a', function(err, fd) {
          let headerStr = 'timestamp,iowait,await,svctm,kBpsRead,kBpsWrite,chaindataSizekB\n';
          let totalStr = headerStr + str;
          fs.write(fd, totalStr, function(err, wrtn, str) {
            if (err) {
              appendError({
                msg: 'ERROR in log.appendDiskStats: ' + err
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
  object.AppendCPUStats = appendCPUStats;
  object.AppendMemStats = appendMemStats;
  object.AppendDiskStats = appendDiskStats;
  return object;
}

module.exports = log;
