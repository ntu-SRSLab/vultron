#!/bin/bash
#geth --networkid 1000  --rpc -rpcaddr "0.0.0.0"  --rpcport "8546" --rpccorsdomain "*" --port "30303" --nodiscover  --rpcapi "db,eth,net,web3,miner,net,personal,net,txpool,admin" --datadir /home/osboxes/Develop/Ethereum --nat "any" --unlock 0 --password "pwd.txt"  --mine --miner.threads 1 
geth_instr_whj --syncmode "fast" --networkid 1900  --rpc -rpcaddr "0.0.0.0"  --rpcport "8546" --rpccorsdomain "*" --port "30303" --nodiscover  --rpcapi "db,eth,net,web3,miner,net,txpool,admin,personal,debug" --datadir /home/osboxes/Develop/Ethereum --nat "any" --unlock 0  --password "pwd.txt" js gethAutoMine.js 

