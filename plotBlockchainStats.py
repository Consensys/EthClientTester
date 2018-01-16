# Usage: python plotBlockchainStats.py <arg1> <arg2>
# (ex. python plotBlockchainStats.py 1)
#
# <arg1> is the leading number of the directory inside
# ./logs/ containing the data that should be displayed.
#
# <arg2> is the name of the node for which the data should
# be displayed. This can be a single name, a space-separated
# list, or 'all' for all. If the full node name
# is, for ex., node1@127.0.0.1:8000, then the name here
# should be only "node1".

import sys
import os
import re
import numpy as np
import matplotlib.pyplot as plt

data = []
nodes = []
targets = []

# cd into logs dir
os.chdir('./logs');
subdirs = next(os.walk('.'))[1]

# find directory specified as input argument (leading number)
r = re.compile(sys.argv[1] + '-*')
target = filter(r.match, subdirs)

# cd into chosen directory and get all subdirs
os.chdir('./' + target[0])
subdirs = next(os.walk('.'))[1]
if (sys.argv[2] == 'all'):
  targets = subdirs
else:
  for arg in sys.argv[2:(len(sys.argv))]:
    r = re.compile(arg + '_*')
    matched = filter(r.match, subdirs)
    if (len(matched) > 1):
      print("Specified node name is not unique!")
    targets.append(matched[0])

# load all data
for target in targets:
  os.chdir('./' + target)
  nodes.append(target)
  data.append(np.genfromtxt('./blockStats.log', delimiter=',', names=True))
  os.chdir('../')

# sort block stats according to timestamp
tmpData = []
for nodeData in data:
  tmpData.append(np.sort(nodeData, order='timestamp'))
data = tmpData

# get data time offset (time of first timestamp)
timeOffset = data[0][0]['timestamp']

# adjust timestamp values
for nodeData in data:
#  nodeData['timestamp'] = (nodeData['timestamp'] - timeOffset)/1000
  nodeData['timestamp'] = (nodeData['timestamp'] - timeOffset)

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

# calculate tx rate
#data2a = []
#numSamples = 2
#for nodeData in data:
#  currentCount = []
#  cIndex = 0
#  dataTmp = np.zeros((len(nodeData['timestamp']),), dtype=[('timestamp', '<f8'),('txRate', '<f8')])
#  for item in nodeData:
#    if (cIndex == 0):
#      deltaT = (nodeData[cIndex+1]['timestamp'] - item['timestamp'])
#      currentCount.append(item['numTransactions']/deltaT)
#    else:
#      deltaT = (item['timestamp'] - nodeData[cIndex-1]['timestamp'])
#      currentCount.append(item['numTransactions']/deltaT)
#    cIndex = cIndex + 1
#  dataTmp['timestamp'] = nodeData['timestamp']
#  dataTmp['txRate'] = currentCount
#  cIndex = 0
#  dataTmp2 = np.zeros((len(nodeData['timestamp']),), dtype=[('timestamp', '<f8'),('avgTxRate', '<f8')])
#  rate = []
#  for item in dataTmp:
#    if (cIndex < (numSamples-1)):
#      rate.append(0)
#    else:
#      rate.append(np.sum(dataTmp['txRate'][(cIndex-numSamples+1):cIndex])/numSamples)
#    cIndex += 1
#  dataTmp2['timestamp'] = dataTmp['timestamp']
#  dataTmp2['avgTxRate'] = rate
#  data2a.append(dataTmp2)

# calculate tx rate / s averaged over some time
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
  axarr[0].plot(timestamps, blockNumbers, label=targets[dirIndex])
  axarr[1].scatter(timestamps, gasUsed, label=targets[dirIndex])
  axarr[2].scatter(timestamps, numTx, label=targets[dirIndex])
  dirIndex += 1

# plot all data2
dirIndex = 0
for nodeData in data2:
  timestamps = nodeData['timestamp']
  numTx = nodeData['cummulativeTxCount']
  axarr[3].plot(timestamps, numTx, label=targets[dirIndex])
  dirIndex += 1

## plot all data2
#dirIndex = 0
#for nodeData in data2a:
#  timestamps = nodeData['timestamp']
#  txRate = nodeData['avgTxRate']
#  axarr[4].plot(timestamps, txRate, label=targets[dirIndex])
#  dirIndex += 1

# plot all data3
dirIndex = 0
for nodeData in data3:
  timestamps = nodeData['timestamp']
  txRate = nodeData['tx10SecAvgRate']
  axarr[4].plot(timestamps, txRate, label=targets[dirIndex])
  dirIndex += 1

axarr[0].title.set_text('Block number')
axarr[1].title.set_text('Gas used per block')
axarr[2].title.set_text('Number of transactions per block')
axarr[3].title.set_text('Cumulative number of processed transactions')
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
#plt.xticks(np.arange(0, end, np.floor((end)/25)))

#axarr[0].legend()
#axarr[1].legend()
#axarr[2].legend()
#axarr[3].legend()
#axarr[4].legend()
plt.show()

