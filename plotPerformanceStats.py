# Usage: python plotPerformanceStats.py <arg1>
# (ex. python plotPerformanceStats.py 1)
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

# load block data
blockSubdirs = [subdirs[2]]
blockData = []
for subdir in blockSubdirs:
  os.chdir('./' + subdir)
  blockData.append(np.genfromtxt('./blockStats.log', delimiter=',', names=True))
  os.chdir('../')

# load tx data
txSubdirs = [subdirs[2]]
nodes = []
txSubData = []
for subdir in txSubdirs:
  os.chdir('./' + subdir)
  print(subdir)
  nodes.append(os.getcwd())
  txSubData.append(np.genfromtxt('./txHashRequests.log', delimiter=',', usecols=0))
  os.chdir('../')

# get data time offset (time of first timestamp)
timeOffset = blockData[0][0]['timestamp']

## calculate cummulative block tx counts
#txBlockDataCummulative = []
#for nodeData in blockData:
#  currentCount = []
#  cIndex = 0
#  dataTmp = np.zeros((len(nodeData['timestamp']),), dtype=[('timestamp', '<f8'),('cummulativeTxCount', '<f8')])
#  for item in nodeData:
#    if (cIndex ==0):
#      currentCount.append(item['numTransactions'])
#    else:
#      currentCount.append(currentCount[cIndex - 1] + item['numTransactions'])
#    cIndex = cIndex + 1
#  dataTmp['timestamp'] = nodeData['timestamp']
#  dataTmp['cummulativeTxCount'] = currentCount
#  txBlockDataCummulative.append(dataTmp)
#
## calculate cummulative submitted tx counts
#blockTicks = blockData[0]['timestamp']
#txSubDataCummulative = []
#for nodeData in blockData:
#  currentCount = 0
#  totalCount = []
#  blockTicks = blockData[0]['timestamp']
#  blockTickIndex = 0
#  for tick in blockTicks:
#    nodeIndex = 0
#    for txSubs in txSubData:
#      for txTimestamp in txSubs:
#        if (blockTickIndex == 0):
#          if ((txTimestamp > 0) and (txTimestamp <= tick)):
#            currentCount += 1
#        else:
#          if ((txTimestamp > blockTicks[blockTickIndex-1]) and (txTimestamp <= tick)):
#            currentCount += 1
#      nodeIndex += 1
#    totalCount.append(currentCount)
#    blockTickIndex += 1

# adjust timestamp values
for nodeData in blockData:
  nodeData['timestamp'] = (nodeData['timestamp'] - timeOffset)/1000

# calculate processed tx rate / s averaged over 1 seconds
binDelta = 1
data3 = []
for nodeData in blockData:
  lastBinStart = (np.ceil(nodeData['timestamp'][len(nodeData['timestamp'])-1])-(binDelta))
  numBins = lastBinStart+1
  timeBins = np.linspace(0, lastBinStart, numBins)
  binData = []
  dataTmp = np.zeros((len(timeBins),), dtype=[('timestamp', '<f8'),('tx1SecAvgRate', '<f8')])
  for timeBin in timeBins:
    currentBinStart = timeBin
    binTxCount = 0
    binTxAvg = 0
    numItemsInBin = 0
    itemIndex = 0
    for item in nodeData:
      if (item['timestamp'] >= currentBinStart and item['timestamp'] <= currentBinStart + binDelta):
        binTxCount += item['numTransactions']
        if (itemIndex > 0):
          binTxAvg += item['numTransactions']/(item['timestamp'] - nodeData['timestamp'][itemIndex-1])
        else:
          binTxAvg += item['numTransactions']/(item['timestamp'] - nodeData['timestamp'][itemIndex+1])
        numItemsInBin += 1
      itemIndex += 1
    #binData.append(binTxCount/binDelta)
    if (numItemsInBin > 0):
      binData.append(binTxAvg/numItemsInBin)
  dataTmp['timestamp'] = timeBins
  dataTmp['tx1SecAvgRate'] = binData
  data3.append(dataTmp)

# calculate processed tx rate / s averaged over 60 seconds
binDelta = 60
data4 = []
for nodeData in blockData:
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
  data4.append(dataTmp)

# calculate submitted tx rate / s averaged over 1 seconds
binDelta = 0.25
data5 = []
for nodeData in blockData:
  lastBinStart = (np.ceil(nodeData['timestamp'][len(nodeData['timestamp'])-1])-(binDelta))
  numBins = lastBinStart+1
  timeBins = np.linspace(0, lastBinStart, numBins)
  binData = []
  dataTmp = np.zeros((len(timeBins),), dtype=[('timestamp', '<f8'),('tx1SecAvgRate', '<f8')])
  currentCount = 0
  totalCount5 = []
  binIndex = 0
  for timeBin in timeBins:
    for txSubs in txSubData:
      for txTimestamp in txSubs:
        tmp = (txTimestamp - timeOffset)/1000
        if ((tmp >= timeBin) and (tmp < timeBin + binDelta)):
          currentCount += 1
    totalCount5.append(currentCount/binDelta)
    currentCount = 0
    binIndex += 1
  dataTmp['timestamp'] = timeBins
  dataTmp['tx1SecAvgRate'] = totalCount5
  data5.append(dataTmp)

# calculate submitted tx rate / s averaged over 60 seconds
binDelta = 60
data6 = []
for nodeData in blockData:
  lastBinStart = (np.ceil(nodeData['timestamp'][len(nodeData['timestamp'])-1])-(binDelta))
  numBins = lastBinStart+1
  timeBins = np.linspace(0, lastBinStart, numBins)
  binData = []
  dataTmp = np.zeros((len(timeBins),), dtype=[('timestamp', '<f8'),('tx1SecAvgRate', '<f8')])
  currentCount = 0
  totalCount5 = []
  binIndex = 0
  for timeBin in timeBins:
    for txSubs in txSubData:
      for txTimestamp in txSubs:
        tmp = (txTimestamp - timeOffset)/1000
        if ((tmp >= timeBin) and (tmp < timeBin + binDelta)):
          currentCount += 1
    totalCount5.append(currentCount/binDelta)
    currentCount = 0
    binIndex += 1
  dataTmp['timestamp'] = timeBins
  dataTmp['tx1SecAvgRate'] = totalCount5
  data6.append(dataTmp)

## create figure and subplots
#numDTypes = len(data[0].dtype)-1
#numDTypes += len(data2[0].dtype)-1
#numDTypes += len(data3[0].dtype)-1
fig, axarr = plt.subplots(2, sharex=True)

## plot all data
#dirIndex = 0
#for nodeData in blockData:
#  timestamps = blockTicks
#  numTxB = txBlockDataCummulative[0]['cummulativeTxCount']
#  numTxS = totalCount
#  axarr[0].scatter(timestamps, np.clip(numTxS-numTxB, 0, 1000000), label=subdirs[dirIndex])
#  dirIndex += 1

## plot all data
#dirIndex = 0
#for nodeData in data:
#  timestamps = nodeData['timestamp']
#  blockNumbers = nodeData['blockNumber']
#  gasUsed = nodeData['gasUsed']
#  numTx = nodeData['numTransactions']
#  axarr[0].plot(timestamps, blockNumbers, label=subdirs[dirIndex])
#  axarr[1].scatter(timestamps, gasUsed, label=subdirs[dirIndex])
#  axarr[2].scatter(timestamps, numTx, label=subdirs[dirIndex])
#  dirIndex += 1
#
## plot all data2
#dirIndex = 0
#for nodeData in data2:
#  timestamps = nodeData['timestamp']
#  numTx = nodeData['cummulativeTxCount']
#  axarr[3].plot(timestamps, numTx, label=subdirs[dirIndex])
#  dirIndex += 1
#
# plot all data3
dirIndex = 0
for nodeData in data3:
  timestamps = nodeData['timestamp']
  txRate = nodeData['tx1SecAvgRate']
  axarr[0].plot(timestamps, txRate, label=subdirs[dirIndex])
  dirIndex += 1

# plot all data4
dirIndex = 0
for nodeData in data4:
  timestamps = nodeData['timestamp']
  txRate = nodeData['tx10SecAvgRate']
  axarr[0].plot(timestamps, txRate, label=subdirs[dirIndex])
  dirIndex += 1

# plot all data5
dirIndex = 0
for nodeData in data5:
  timestamps = nodeData['timestamp']
  txRate = nodeData['tx1SecAvgRate']
  axarr[1].plot(timestamps, txRate, label=subdirs[dirIndex])
  dirIndex += 1

# plot all data6
dirIndex = 0
for nodeData in data6:
  timestamps = nodeData['timestamp']
  txRate = nodeData['tx1SecAvgRate']
  axarr[1].plot(timestamps, txRate, label=subdirs[dirIndex])
  dirIndex += 1

#axarr[0].title.set_text('Block number')
#axarr[1].title.set_text('Gas used per block')
#axarr[2].title.set_text('Number of transactions per block')
#axarr[3].title.set_text('Cummulative number of processed transactions')
#axarr[4].title.set_text('transaction processing rate averaged over 1 second [tx/s]')
axarr[0].grid(True)
axarr[1].grid(True)
#axarr[2].grid(True)
#axarr[3].grid(True)
#axarr[4].grid(True)
plt.xlabel('Time [s]')
#plt.axis('tight')
plt.autoscale(enable=True, axis='x', tight=True)
#plt.autoscale(enable=True, axis='y', tight=True)
#start, end = axarr[0].get_xlim()
#plt.xticks(np.arange(start, end, np.floor((end-start)/20)))

#axarr[0].legend()
#axarr[1].legend()
#axarr[2].legend()
#axarr[3].legend()
#axarr[4].legend()
plt.show()
