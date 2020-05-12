#!/bin/bash
# install solc_v0.4.25 to compile wecredit
curl -o /usr/bin/solc -fL https://github.com/ethereum/solidity/releases/download/v0.4.25/solc-static-linux     && chmod u+x /usr/bin/solc && chown $USER:$USER /usr/bin/solc 
# pull repo
cd Vultron-Fisco && git pull && git checkout -- *
cd ..
# cd Vultron-FISCO-BCOS && git pull && git checkout -- * && ./quickstart.sh
# cd ..
# cd Vultron-GoEthereum && git pull && git checkout -- * && 
# cd ..
