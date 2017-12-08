function metrics() {
  var http = require('http');

  let object = {};
  
  function fetch(result, cb) {
    let host = result.web3RPCHost;
    //let host = '127.0.0.1';
    let port = '8010';
    let wrapper = function (req) {
      return function() {
        req.abort(); 
        result.log.AppendError({
          msg: 'ERROR in metrics.fetch: http.get timed out'
        });
        cb(null, result);
      }
    }
    let request = http.get('http://' + host + ':' + port + '/?requestTimestamp=' + Date.now(), function(res) {
      let data = '';
      let responseReceivedTimestamp = null;
      res.on('data', function(chunk) {
        clearTimeout(timeoutID);
        if (!responseReceivedTimestamp) {
          responseReceivedTimestamp = Date.now();
        }
        data += chunk;
        timeoutID = setTimeout(func, 20000);
      });
      res.on('end', function() {
        clearTimeout(timeoutID);
        let dataObj = JSON.parse(data);
        dataObj.responseReceivedTimestamp = responseReceivedTimestamp;
        dataObj.timestamp = Date.now();
        result.log.AppendHostStats(dataObj);
        cb(null, result);
      });
      res.on('error', function() {
        clearTimeout(timeoutID);
        result.log.AppendError({
          msg: 'ERROR in metrics.fetch: http.get response error'
        })
        cb(null, result);
      });
    }).on('error', function() {
      clearTimeout(timeoutID);
      result.log.AppendError({
        msg: 'ERROR in metrics.fetch: http.get request error'
      })
      cb(null, result);
    });

    let func = wrapper(request);
    let timeoutID = setTimeout(func, 20000);
  }
  
  object.Fetch = fetch;

  return object;
}

module.exports = metrics
