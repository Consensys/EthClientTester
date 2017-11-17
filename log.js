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
    object.path = logPathInstance;
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
  }

  object.Initialize = initialize;
  object.AppendTxHashRequest = appendTxHashRequest;
  object.AppendTxHashResponse = appendTxHashResponse;
  object.AppendStatusUpdate = appendStatusUpdate;
  object.AppendError = appendError;
  return object;
}

module.exports = log;
