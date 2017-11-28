# Quorum Network Tester
The aim of this project is to make it easier to create a collection of benchmarking tests, set them up and run them on a Quorum/Ethereum network. 

## What does it do?
The QuorumNetworkTester does the following:
 - Connects to the rpc interfaces of a list of nodes, specified in config.js, using web3.js. 
 - Runs the tests specified in config.js on the nodes specified in config.js.
 - Records timestamped transaction hashes and errors for each node.

If a QuorumNetworkProbe (https://github.com/rynobey/QuorumNetworkProbe) is running on a node's host, the QuorumNetworkTester can collect additional information (for every node running a QuorumNetworkProbe), which currently includes:
 - CPU stats: iowait, utilization, loadAvg(1m), loadAvg(5m), loadAvg(15m).
 - Disk stats: await, svctm, kBpsRead, kBpsWrite
 - Memory stats: total memory (kB), available memory(kB)
 - Blockchain stats: blockchain data size (kB)

## How do I install it?
```
git clone --recursive https://github.com/rynobey/QuorumNetworkTester.git
cd QuorumNetworkTester
npm install
```
See https://github.com/rynobey/QuorumNetworkProbe for setting up the probe on a node's host.

## How do I set it up before running a test?
The configuration of QuorumNetworkTester is done by setting parameter values in config.js. These parameters include a list of nodes to monitor and use for traffic generation and a list of tests to perform, as well as some other parameters. Each test procedure is defined in a file containing the preparation and execution procedures for that specific test, and the file itself is located in the tests folder. A quick guide to setting up and running a test using testrpc follows.

1) If you have not done so yet, follow the instructions above to download and install QuorumNetworkTester
2) If you don't yet have testrpc installed: ``npm install -g ethereumjs-testrpc@v4.1.3``
3) Start testrpc: ``testrpc``
4) Open config.js in your favourite text editor, and make sure of the following:   

   a) Your testrpc is listed in the ``config.nodes`` array. You will need to specify a name, host address, host port, and whether it will be used to generate traffic or not.  
   
   b) One of the example tests in the ``QuorumNetworkTests/tests/`` folder is listed in the ``config.tests`` array (it needs to be added using ``require('./tests/<testName>.js')``. To get started, you can add the ether transfer example test by adding ``require('./tests/etherTransactionExample1.js')`` to the ``config.tests`` array.  
   
   c) The number of initially unlocked accounts (``config.numInitiallyUnlockedAccounts``) is correct. This depends on how you start up testrpc - by default this will be 10.   
   
   d) Whether the accounts needed for a test should be created (``conig.doAccountCreation``), unlocked (``config.doAccountUnlocking``) and funded (``config.doEtherRedistribution``) is correctly specified. Typically these should all be ``false`` when using testrpc, and ``true`` when using something else (for ex. Quorum).   
   
   e) The time between fetching data from a deployed QuorumNetworkProbe (``config.probeDataFetchPeriod``) is specified. If there are no probes, or you do not want to record the data made available by the probe, you can set this to 0, which will disable it.  
   
## How do I run a test?
Once the QuorumNetworkTester is configured, and your network is up and running, you can start the test using ``node index.js``. Running a test involves three phases: initialization, preparation, and execution. Once a test is completed, it will exit. Timestamped status updates, errors, transactions hashes, and recorded host data (if activated) for each node can be found in the ``QuorumNetworkTester/logs`` directory, in the directory with the name corresponding to the year, month, day, hour, and minute (UTC) when the test was started.

## How do I add my own test procedures?
Coming soon
