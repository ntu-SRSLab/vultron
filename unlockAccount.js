var assert = require("assert");
var Web3 = require("web3");
var shell = require("shelljs");
var path = require("path")
var net = require("net");
let workdir = shell.pwd();
console.log(`workdir: ${workdir}`);
var ipcpath= path.join(shell.pwd().toString(), "..", 'AlethWithTraceRecorder/bootstrap-scripts/aleth-ethereum/Ethereum/geth.ipc');
var web3 = new Web3(new Web3.providers.IpcProvider(ipcpath, net));
assert(web3);
async function unlockAccount(){
    // console.log(await web3.eth.personal.defaultAccount);
    // let block = await web3.eth.getBlock("latest");
    // console.log(block);
    let accounts =  await web3.eth.getAccounts();
    console.log(accounts[0]);
    let ret = await web3.eth.personal.unlockAccount(accounts[0], "123456", 200 * 60 * 60)
    // console.log(ret);
    if(ret){
        console.log("Default account unlocked.")
    }else{
        console.log("Default account unlocked failure.")
    }
}
unlockAccount();
