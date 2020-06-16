# ICO pocketinns #

<img src="https://pocketinns.io/img/logo.png" width="300" height="100"/>


# README #
## About Pocketinns  [![chat](https://img.shields.io/badge/chat%20on-slack-green.svg)](https://pocketinns.slack.com/)   [![chat](https://img.shields.io/badge/chat%20on-telegram-green.svg)](https://t.me/joinchat/GVaQ5BLi7lQNz4zHUYCIfQ)



The **Pocketinns Umbrella Project** is a revolutionary online community driven **marketplace ecosystem** built around a decentralized blockchain-oriented model. It is a marketplace for both sellers and consumers. It is designed to enhance ease of transactions while maximizing trust, safety, value, and savings, all while maintaining a true decentralized network.

http://www.pocketinns.io



## Token Auction
**The token auction will start on January 15th, 2018 (10am EST)** and the auction ends on January 31st, 2018 (10am EST) and will accept ETH as a form of funding.

The PINNS token auction will follow the **reverse Dutch Auction**, in which an initially high offering price is lowered by increments until a buyer or, as in U.S. Treasury sales of securities, sufficient buyers are found.
## For CrowdSale
* First deploy **DutchAuction** contract by providing EtherPriceFactor (Price of 1 Ether in USD),and obtain its address.
* Secondly deploy **PocketinnsToken** contract and use address from previous step as its input. Obtain address of the token contract.
* Thirdly call function **start_ICO()** of DutchAuction contract and provide address from **PocketinnsToken** contract as an input.
## How do I run ? 
* contract owner can start Crowdsale by calling **start_ICO()** function of the **DutchAuction** contract.
* contributions are accepted by sending Ether to **DutchAuction** contract address. Minimum contribution is 1 Ether.
* in case of emergency, function **setStage()** can be called by owner to set stage in order to stop contribution or to start crowdasle again.
* contributors will need to claim their tokens after **DutchAuction** has ended. To claim tokens contributor needs to call function **claimTokensICO()**,by passing the contributor address as parameter.
* after the ICO ends, owner of the contract sends the GoodWill tokens to **DutchAuction** contract and call function **startGoodwillDistribution()**.
* to claim Goodwill tokens as per the tokens bought during the first Four days of ICO, contributor needs to call **claimGoodwillTokens()**, by passing the contributor address as parameter. 
