#!/bin/bash
Source="import \""
Target="import \"$HOME/Webank/vultron/Vulron-Fisco/fisco/wecredit/"
echo $Source
echo $Target
sed -i "s#$Target#$Source#g" $HOME/Webank/vultron/Vultron-Fisco/fisco/wecredit/Account.sol
sed -i "s#$Target#$Source#g" $HOME/Webank/vultron/Vultron-Fisco/fisco/wecredit/AccountMap.sol
sed -i "s#$Target#$Source#g" $HOME/Webank/vultron/Vultron-Fisco/fisco/wecredit/AccountController.sol
sed -i "s#$Target#$Source#g" $HOME/Webank/vultron/Vultron-Fisco/fisco/wecredit/Credit.sol
sed -i "s#$Target#$Source#g" $HOME/Webank/vultron/Vultron-Fisco/fisco/wecredit/CreditController.sol
sed -i "s#$Target#$Source#g" $HOME/Webank/vultron/Vultron-Fisco/fisco/wecredit/CreditMap.sol
sed -i "s#$Target#$Source#g" $HOME/Webank/vultron/Vultron-Fisco/fisco/wecredit/CommonLib.sol

Target="import \"$HOME/Webank/vultron/Vultron-Fisco/fisco/wecredit/"
sed -i "s#$Source#$Target#g" $HOME/Webank/vultron/Vultron-Fisco/fisco/wecredit/Account.sol
sed -i "s#$Source#$Target#g" $HOME/Webank/vultron/Vultron-Fisco/fisco/wecredit/AccountMap.sol
sed -i "s#$Source#$Target#g" $HOME/Webank/vultron/Vultron-Fisco/fisco/wecredit/AccountController.sol
sed -i "s#$Source#$Target#g" $HOME/Webank/vultron/Vultron-Fisco/fisco/wecredit/Credit.sol
sed -i "s#$Source#$Target#g" $HOME/Webank/vultron/Vultron-Fisco/fisco/wecredit/CreditController.sol
sed -i "s#$Source#$Target#g" $HOME/Webank/vultron/Vultron-Fisco/fisco/wecredit/CreditMap.sol
sed -i "s#$Source#$Target#g" $HOME/Webank/vultron/Vultron-Fisco/fisco/wecredit/CommonLib.sol
