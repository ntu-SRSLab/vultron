#!/bin/bash
# install solc_v0.4.25 to compile wecredit
curl -o /usr/bin/solc -fL https://github.com/ethereum/solidity/releases/download/v0.4.25/solc-static-linux     && chmod u+x /usr/bin/solc && chown $USER:$USER /usr/bin/solc 
# pull repo
cd Vultron-Fisco && git pull && git checkout -- *
cd ..
# replace relative path in solidity contract source code to absolute path so as to make fuzzer work well
Source="import \""
Target="import \"$HOME/Webank/vultron/Vultron-Fisco/fisco/wecredit/"
echo $Source
echo $Target

sed -i "s#$Source#$Target#g" $HOME/Webank/vultron/Vultron-Fisco/fisco/wecredit/Account.sol
sed -i "s#$Source#$Target#g" $HOME/Webank/vultron/Vultron-Fisco/fisco/wecredit/AccountMap.sol
sed -i "s#$Source#$Target#g" $HOME/Webank/vultron/Vultron-Fisco/fisco/wecredit/AccountController.sol
sed -i "s#$Source#$Target#g" $HOME/Webank/vultron/Vultron-Fisco/fisco/wecredit/Credit.sol
sed -i "s#$Source#$Target#g" $HOME/Webank/vultron/Vultron-Fisco/fisco/wecredit/CreditController.sol
sed -i "s#$Source#$Target#g" $HOME/Webank/vultron/Vultron-Fisco/fisco/wecredit/CreditMap.sol
sed -i "s#$Source#$Target#g" $HOME/Webank/vultron/Vultron-Fisco/fisco/wecredit/CommonLib.sol
