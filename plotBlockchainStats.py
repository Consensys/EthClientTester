# Usage: python plotBlockchainStats.py <arg1>
# (ex. python plotBlockchainStats.py 1)
#
# <arg1> is the leading number of the directory inside
# ./logs/ containing the data that should be displayed.

import sys
import os
import re
import numpy as np
import matplotlib.pyplot as plt

# cd into logs dir
os.chdir('./logs');
subdirs = next(os.walk('.'))[1]

# find directory specified as input argument (leading number)
r = re.compile(sys.argv[1] + '-*')
target = filter(r.match, subdirs)

# cd into chosen directory and get all subdirs
os.chdir('./' + target[0])
subdirs = next(os.walk('.'))[1]
subdirs = [subdirs[0]]
# load all data
nodes = []
data = []
for subdir in subdirs:
  os.chdir('./' + subdir)
  nodes.append(subdir)
  data.append(np.genfromtxt('./blockStats.log', delimiter=',', names=True))
  os.chdir('../')

# get data time offset (time of first timestamp)
timeOffset = data[0][0]['timestamp']

#timeOffset = 1510000000000

# adjust timestamp values
for nodeData in data:
  nodeData['timestamp'] = (nodeData['timestamp'] - timeOffset)/1000

# calculate cummulative tx counts
data2 = []
for nodeData in data:
  currentCount = []
  cIndex = 0
  dataTmp = np.zeros((len(nodeData['timestamp']),), dtype=[('timestamp', '<f8'),('cummulativeTxCount', '<f8')])
  for item in nodeData:
    if (cIndex ==0):
      currentCount.append(item['numTransactions'])
    else:
      currentCount.append(currentCount[cIndex - 1] + item['numTransactions'])
    cIndex = cIndex + 1
  dataTmp['timestamp'] = nodeData['timestamp']
  dataTmp['cummulativeTxCount'] = currentCount
  data2.append(dataTmp)

# calculate tx rate / s averaged over 10 seconds
binDelta = 1
data3 = []
for nodeData in data:
  lastBinStart = (np.ceil(nodeData['timestamp'][len(nodeData['timestamp'])-1])-(binDelta))
  numBins = lastBinStart+1
  timeBins = np.linspace(0, lastBinStart, numBins)
  binData = []
  dataTmp = np.zeros((len(timeBins),), dtype=[('timestamp', '<f8'),('tx10SecAvgRate', '<f8')])
  for timeBin in timeBins:
    currentBinStart = timeBin
    binTxCount = 0
    for item in nodeData:
      if (item['timestamp'] >= currentBinStart and item['timestamp'] < currentBinStart + binDelta):
        binTxCount += item['numTransactions']
    binData.append(binTxCount/binDelta)
  dataTmp['timestamp'] = timeBins
  dataTmp['tx10SecAvgRate'] = binData
  data3.append(dataTmp)

# create figure and subplots
numDTypes = len(data[0].dtype)-1
numDTypes += len(data2[0].dtype)-1
numDTypes += len(data3[0].dtype)-1
fig, axarr = plt.subplots(numDTypes, sharex=True)

# plot all data
dirIndex = 0
for nodeData in data:
  timestamps = nodeData['timestamp']
  blockNumbers = nodeData['blockNumber']
  gasUsed = nodeData['gasUsed']
  numTx = nodeData['numTransactions']
  axarr[0].plot(timestamps, blockNumbers, label=subdirs[dirIndex])
  axarr[1].scatter(timestamps, gasUsed, label=subdirs[dirIndex])
  axarr[2].scatter(timestamps, numTx, label=subdirs[dirIndex])
  dirIndex += 1

# plot all data2
dirIndex = 0
for nodeData in data2:
  timestamps = nodeData['timestamp']
  numTx = nodeData['cummulativeTxCount']
  axarr[3].plot(timestamps, numTx, label=subdirs[dirIndex])
  dirIndex += 1

# plot all data3
dirIndex = 0
for nodeData in data3:
  timestamps = nodeData['timestamp']
  txRate = nodeData['tx10SecAvgRate']
  axarr[4].plot(timestamps, txRate, label=subdirs[dirIndex])
  dirIndex += 1

axarr[0].title.set_text('Block number')
axarr[1].title.set_text('Gas used per block')
axarr[2].title.set_text('Number of transactions per block')
axarr[3].title.set_text('Cummulative number of processed transactions')
axarr[4].title.set_text('transaction processing rate averaged over 1 second [tx/s]')
axarr[0].grid(True)
axarr[1].grid(True)
axarr[2].grid(True)
axarr[3].grid(True)
axarr[4].grid(True)
plt.xlabel('Time [s]')
#plt.axis('tight')
plt.autoscale(enable=True, axis='x', tight=True)
#plt.autoscale(enable=True, axis='y', tight=True)
start, end = axarr[0].get_xlim()
plt.xticks(np.arange(start, end, np.floor((end-start)/20)))

#axarr[0].legend()
#axarr[1].legend()
#axarr[2].legend()
#axarr[3].legend()
#axarr[4].legend()
plt.show()
