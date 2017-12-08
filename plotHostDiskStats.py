# Usage: python ploHostDiskStats.py <arg1>
# (ex. python plotHostDiskStats.py 1)
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
#subdirs = [subdirs[1]]
# load all data
nodes = []
data = []
for subdir in subdirs:
  os.chdir('./' + subdir)
  nodes.append(subdir)
  data.append(np.genfromtxt('./hostDiskStats.log', delimiter=',', names=True))
  os.chdir('../')

# get data time offset (time of first timestamp)
timeOffset = data[0][0]['timestamp']
#timeOffset = 1512722624940

# adjust timestamp values
for nodeData in data:
  nodeData['timestamp'] = (nodeData['timestamp'] - timeOffset)/1000

# create figure and subplots
numDTypes = len(data[0].dtype)-2
fig, axarr = plt.subplots(numDTypes, sharex=True)

# plot all data
dirIndex = 0
for nodeData in data:
  timestamps = nodeData['timestamp']
  iowait = nodeData['iowait']  
  totalSvctm = nodeData['await'] + nodeData['svctm']
  kBpsRead = nodeData['kBpsRead']
  kBpsWrite = nodeData['kBpsWrite']
  chaindataSizekB = nodeData['chaindataSizekB']
  axarr[0].plot(timestamps, iowait, label=subdirs[dirIndex])
  axarr[1].plot(timestamps, totalSvctm, label=subdirs[dirIndex])
  axarr[2].plot(timestamps, kBpsRead, label=subdirs[dirIndex])
  axarr[3].plot(timestamps, kBpsWrite, label=subdirs[dirIndex])
  axarr[4].plot(timestamps, chaindataSizekB, label=subdirs[dirIndex])
  dirIndex += 1

axarr[0].title.set_text('CPU average time spent waiting for IO [%]')
axarr[1].title.set_text('Average total disk IO service time')
axarr[2].title.set_text('Average disk read speed [kB/s]')
axarr[3].title.set_text('Average disk write speed [kB/s]')
axarr[4].title.set_text('Blockchain data size on disk [kB]')
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
