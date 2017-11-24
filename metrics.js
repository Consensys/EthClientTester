function metrics() {
  var http = require('http');

  let object = {};
  
  function fetch(result, cb) {
    let host = result.web3RPCHost;
    //let host = '127.0.0.1';
    let port = '8001';
    http.get('http://' + host + ':' + port + '/?requestTimestamp=' + Date.now(), function(res) {
      let data = '';
      let responseReceivedTimestamp = null;
      res.on('data', function(chunk) {
        if (!responseReceivedTimestamp) {
          responseReceivedTimestamp = Date.now();
        }
        data += chunk;
      });
      res.on('end', function() {
        let dataObj = JSON.parse(data);
        dataObj.responseReceivedTimestamp = responseReceivedTimestamp;
        result.log.AppendCPUStats(dataObj.cpuStats);
        result.log.AppendMemStats(dataObj.memStats);
        result.log.AppendDiskStats(dataObj.diskStats);
        cb(null, result);
      });
    });
  }
  
  object.Fetch = fetch;

  return object;
}

module.exports = metrics
