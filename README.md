# Quorum Network Tester
The aim of this project is to make it easier to create a collection of benchmarking tests, set them up and run them on a Quorum/Ethereum network. 

## Introduction
When trying to measure the performance of a system, it is critical to carefully consider the following: 1) what needs to be measured, 2) what the inputs to the system should be for these measurements, and 3) how external and/or other factors not under our control may influence the performance (including the measurements/inputs) of the system. These considerations are important since they inform us about the meaning of our test results. If done properly, our tests will allow us to generate reproducible results and compare systems with each other. 

This project is a work in progress, and therefore currently focusses mainly on how to generate the inputs, i.e. the transactions that can be used for the benchmarking of a Quorum/Ethereum network. The intention is to expand the capabilities to also include better measurements in the near future.

## Installation
```
git clone --recursive https://github.com/rynobey/QuorumNetworkTester.git
cd QuorumNetworkTester
npm install
```
## Running a test
1) Edit `config.js` by configuring `web3RPCHost` and `web3RPCPort` to point to your node (or run `testrpc`)  
2) Run `node index.js`
This will run an example test where an ERC20 contract is deployed and some tokens are sent between two addresses. 
