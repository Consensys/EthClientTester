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
    },
    displayProgress: function(description1, description2) {
      description1 = description1 || "Repeating";
      description2 = description2 || "";
      //clear the line first
      stdout.write(`\r                                                                `);
      stdout.write(`\r[INFO] ` + description1 + `: ` + initiatedCount + ` / ` + 
        numIterations + `` + description2);
    }
  }
  repeaters.push(repeater);

  function allRepeatersUnpaused() {
    let output = true;
    for (let index = 0; index < repeaters.length; index++) {
      if (repeaters[index].paused == true) { output = false; }
    }
    return output;
  } 
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
    if ((!syncUnpause && !paused) || (syncUnpause && allRepeatersUnpaused())) {
      if (completedCount >= numIterations) {
        clearInterval(intervalID);
        if (callback) {
          callback();
        }
      } else {
        if (initiatedCount < numIterations) {
          initiatedCount++;
          func(repeater);
          //if (initiatedCount == numIterations) { console.log(); }
        } else { // this means that we are waiting for pending tasks to complete...
          stdout.write(`\r[INFO] Waiting for pending tasks to complete: ` +
            completedCount + ` / ` + initiatedCount);
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
