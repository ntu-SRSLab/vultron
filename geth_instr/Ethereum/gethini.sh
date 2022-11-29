#!/bin/bash
geth --datadir "/home/osboxes/Develop/Ethereum" removedb&&geth --datadir "/home/osboxes/Develop/Ethereum"  init "/home/osboxes/Develop/Ethereum/CustomGenisis.json"  
