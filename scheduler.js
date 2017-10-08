function repeat(func, numIterations, frequency, callback) {
  func();
  let count = 1;
  let intervalID = setInterval(function() {
    if (count >= numIterations) {
      clearInterval(intervalID);
      if (callback) {
        callback();
      }
    } else {
      func();
      count++;
    }
  }, 1000/frequency);
}

function alternate(func1, func2, numIterations, frequency, callback) {
  repeat(func1, numIterations, frequency/2, callback);
  setTimeout(function() {
    repeat(func2, numIterations, frequency/2);
  }, 1000/frequency);
}

exports.Repeat = repeat;
exports.Alternate = alternate;
