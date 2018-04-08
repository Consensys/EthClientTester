# Disclaimer
This is a WIP.

# Ethereum Client Tester
The aim of this project is to make it easier to create a collection of benchmarking tests, set them up and run them on an Ethereum network. 

## What does it do?
The EthClientTester does the following:
 - Connects to the rpc interfaces of a list of nodes, specified in config.js, using web3.js. 
 - Runs the test specified in config.js on the nodes specified in config.js.
 - Records timestamped transaction hashes and errors for each node.
 - Includes some simple python-based plotting tolls forviewing data.

If an EthClientProbe (https://github.com/rynobey/EthClientProbe) is running on a node's host, the EthClientTester can collect additional information (for every node running an EthClientProbe), which currently includes:
 - CPU stats: iowait, utilization, loadAvg
 - Disk stats: await, svctm, kBpsRead, kBpsWrite
 - Memory stats: total memory (kB), available memory(kB)
 - Blockchain stats: blockchain data size (kB)

## How do I install it?
```
git clone --recursive https://github.com/ConsenSys/EthClientTester.git
cd EthClientTester
npm install
```
See https://github.com/rynobey/EthClientProbe for setting up the probe on a node's host.

## How do I set it up before running a test?
The configuration of EthClientTester is done by setting parameter values in `config.js`. These parameters include a list of nodes to monitor and use for traffic generation and the test to perform, as well as some other parameters. Each test procedure is defined in a file containing the preparation and execution procedures for that specific test, and the file itself is located in the tests folder. A quick guide to setting up and running a test using testrpc follows.

1) If you have not done so yet, follow the instructions above to download and install EthClientTester
2) If you don't yet have testrpc installed: ``npm install -g ethereumjs-testrpc@v4.1.3``
3) Start testrpc: ``testrpc``
4) Open config.js in your favourite text editor, and make sure of the following:   

   a) That your testrpc is listed in the ``config.nodes`` array. You will need to specify a name, host address, host port, and whether it will be used to generate traffic or not. Besides listing each node's details, you also need to specify the type of client running on your nodes: ``config.clientType = 'ethereumjs-testrpc`` if using testrpc (use ``'go-quorum'`` if client is quorum - support for other clients can be added if requested).
   
   b) That one of the example tests in the ``EthClientTester/tests/`` folder is listed in the ``config.tests`` array (it needs to be added using ``'<testName>.js'``. To get started, you can add the ether transfer example test by adding ``'etherTransactionExample2.js'`` to the ``config.tests`` array.  
   
## How do I run a test?
Once the EthClientTester is configured, and your network is up and running, you can start the test using ``node index.js``. Running a test involves three phases: initialization, preparation, and execution. Once a test is completed, it will exit. Timestamped status updates, errors, transaction hashes, and recorded host data (if activated) for each node can be found in the ``EthClientTester/logs`` directory, in the (enumerated) directory with the name corresponding to the year, month, day, hour, and minute (UTC) when the test was started.

## How do I plot the data?
Two simple python scripts are included for plotting the recorded blockchain and host resource utilization statistics for a test procedure. Before trying to plot something, make sure that the data you are looking for is recorded by the test procedure that was run and/or the host is running the [Probe](https://github.com/rynobey/EthClientProbe). The following python packages are required:
1. `numpy`
2. `matplotlib`

If everything is set up properly, the data plots can be generated as follows (while in the `EthClientTester` directory):
1. Blockchain statistics: `python plotBlockchainStats.py <testNumber> <nodeName/all>`
2. Host resource statistics: `python plotHostStats.py <testNumber> <nodeName/all>`

As an example, after running your first test procedure on the node named `node1` in your `config.js` (and your procedure is recording blockchain and host resource statistics), then the commands would look like this:
1. Blockchain statistics: `python plotBlockchainStats.py 1 node1`
2. Host resource statistics: `python plotBlockchainStats.py 1 node1`

## How do I add my own test procedures?
Coming soon
