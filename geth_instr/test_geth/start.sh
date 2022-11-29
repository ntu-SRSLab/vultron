#!/bin/bash
geth --rpc \
     --rpccorsdomain "*" \
     --datadir ./data \
     --networkid 1000 \
     init ./genesis.json  \
     console