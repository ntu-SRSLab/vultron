const fs = require("fs");
const abiDecoder = require('abi-decoder');
let logs = [{
    "logIndex": null,
    "transactionIndex": null,
    "transactionHash": null,
    "blockHash": null,
    "blockNumber": null,
    "address": "0x4be83b6f8f18ca7dea29715e031ff322386177c0",
    "data": "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000007d0",
    "topics": [
        "0x74c1192962608e794a00c0c58d423c8c13b40eaf9b2b2b3bc9d0d1a17bb47422"
    ]
}];

let abi = JSON.parse(fs.readFileSync("/home/liuye/Webank/vultron/deployed_contract/CreditController/CreditController.abi"), "utf8");
abiDecoder.addABI(abi);
const events = abiDecoder.decodeLogs(logs);
console.log(JSON.stringify(events));
