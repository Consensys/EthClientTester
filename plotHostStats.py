# Usage: python plotHostStats.py <arg1>
# (ex. python plotHostStats.py 1)
#
# <arg1> is the leading number of the directory inside
# ./logs/ containing the data that should be displayed.

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
  data.append(np.genfromtxt('./hostStats.log', delimiter=',', names=True))
  os.chdir('../')

## calculate ping time averaged over 1 seconds
#binDelta = 1
#data3 = []
#for nodeData in data:
#  lastBinStart = (np.ceil(nodeData['statsTimestamp'][len(nodeData['statsTimestamp'])-1])-(binDelta))
#  numBins = lastBinStart+1
#  timeBins = np.linspace(0, lastBinStart, numBins)
#  binData = []
#  dataTmp = np.zeros((len(timeBins),), dtype=[('statsTimestamp', '<f8'),('ping1SecAvg', '<f8')])
#  for timeBin in timeBins:
#    currentBinStart = timeBin
#    totalTime = 0
#    for item in nodeData:
#      if (item['statsTimestamp'] >= currentBinStart and item['statsTimestamp'] < currentBinStart + binDelta):
#        totalTime += (item['responseReceivedTime'] - item['requestTimestamp'])
#    binData.append(totalTime/binDelta)
#  dataTmp['statsTimestamp'] = timeBins
#  dataTmp['ping1SecAvg'] = binData
#  data3.append(dataTmp)

# get data time offset (time of first timestamp)
timeOffset = data[0][0]['requestTimestamp']

# adjust timestamp values
for nodeData in data:
  nodeData['statsTimestamp'] = (nodeData['statsTimestamp'] - timeOffset)/1000

# create figure and subplots
numDTypes = 7
fig, axarr = plt.subplots(numDTypes, sharex=True)

# plot all data
dirIndex = 0
for nodeData in data:
  timestamps = nodeData['statsTimestamp']
  utilization = np.divide(nodeData['utilization'], nodeData['numCpus'])
  loadAvg1m = nodeData['loadAvg1m']
  memUsed = 100*np.divide((nodeData['memkBTot'] - nodeData['memkBAvail']), nodeData['memkBTot'])
  iowait = nodeData['iowait']
  diskReqTime = nodeData['await']
  chaindataSize = nodeData['chaindataSizekB'] / 1024
  statsReqRTT = nodeData['responseReceivedTimestamp'] - nodeData['requestTimestamp']
  axarr[0].plot(timestamps, utilization, label=targets[dirIndex])
  axarr[1].plot(timestamps, loadAvg1m, label=targets[dirIndex])
  axarr[2].plot(timestamps, memUsed, label=targets[dirIndex])
  axarr[3].plot(timestamps, iowait, label=targets[dirIndex])
  axarr[4].plot(timestamps, diskReqTime, label=targets[dirIndex])
  axarr[5].plot(timestamps, chaindataSize, label=targets[dirIndex])
  axarr[6].plot(timestamps, statsReqRTT, label=targets[dirIndex])
  dirIndex += 1

axarr[0].title.set_text('Normalized CPU utilization')
axarr[0].set_ylim([0,100])
axarr[1].title.set_text('Avg CPU load (1m)')
axarr[1].set_ylim([0,2])
axarr[2].title.set_text('Memory usge (%)')
axarr[2].set_ylim([0,100])
axarr[3].title.set_text('Time CPU spends waiting for IO (%)')
axarr[3].set_ylim([0,50])
axarr[4].title.set_text('Average disk request service time (mS)')
axarr[5].title.set_text('Blockchain data size on disk (MB)')
axarr[6].title.set_text('Host stats request round trip time (mS)')
axarr[6].set_ylim([0,1500])
axarr[0].grid(True)
axarr[1].grid(True)
axarr[2].grid(True)
axarr[3].grid(True)
axarr[4].grid(True)
axarr[5].grid(True)
axarr[6].grid(True)
plt.xlabel('Time [s]')
plt.autoscale(enable=True, axis='x', tight=True)
start, end = axarr[0].get_xlim()
plt.xticks(np.arange(0, end, np.floor((end)/25)))

axarr[0].legend(loc='upper center', ncol=4, fontsize=9)
axarr[1].legend(loc='upper center', ncol=4, fontsize=9)
axarr[2].legend(loc='upper center', ncol=4, fontsize=9)
axarr[3].legend(loc='upper center', ncol=4, fontsize=9)
axarr[4].legend(loc='upper center', ncol=4, fontsize=9)
axarr[5].legend(loc='upper center', ncol=4, fontsize=9)
axarr[6].legend(loc='upper center', ncol=4, fontsize=9)

plt.show()
