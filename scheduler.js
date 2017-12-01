var syncUnpause = require('./config.js').syncUnpause;
var repeaters = [];

function repeat(func, numIterations, frequency, callback) {
  let stdout = process.stdout;
  let paused = false;
  let initiatedCount = 0;
  let completedCount = 0;
  
  let repeater = {
    pause: function() {
      paused = true;
    },
    resume: function() {
      paused = false;
    },
    completed: function() {
      completedCount++;
    }
  }
  repeaters.push(repeater);

  /*  There are two distinctly different conditions under which the repeater
      can be signalled to stop:
        1)  Once the required number of task repetitions (numIterations) have
            been started, and all tasks have been completed (there is no backlog)
        2)  Once the required number of task repetitions have been started, and 
            not all tasks have been completed (there is a backlog of pending tasks).

      Case 1 occurs when the time between repetitions is long
      compared to the time it takes to complete the task, i.e. low 
      repetition rate (frequency) and short task execution time.

      Case 2 occurs when the time between repetitions is short 
      compared to the time it takes to complete the task, i.e. high
      repetition rate (frequency) and long task execution time.

      Initiating new tasks on condition that initiatedCount < numIterations,
      and checking that completedCount >= numIterations before calling
      the next callback handles both cases appropriately.
  */
  
  initiatedCount++;
  func(repeater);
  let intervalID = setInterval(function() {
    if ((!paused)) {
      if (completedCount >= numIterations) {
        clearInterval(intervalID);
        if (callback) {
          callback();
        }
      } else {
        if (initiatedCount < numIterations) {
          initiatedCount++;
          func(repeater);
        } else { // this means that we are waiting for pending tasks to complete...
        }
      }
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
