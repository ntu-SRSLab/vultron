var net = require("net");
const Web3 = require("web3");
// const Provider = new Web3.providers.HttpProvider("http://localhost:8546");
const Provider = new Web3.providers.IpcProvider('/home/liuye/Projects/AlethWithTraceRecorder/bootstrap-scripts/aleth-ethereum/Ethereum/geth.ipc', net);
const web3 =  new Web3(Provider); 

async function test(){

// console.log(web3);
//console.log(`connect to ethereum?  ${web3.isConnected()? "yes":"no"}`);
let accounts = await web3.eth.getAccounts();
console.log(accounts);
// await web3.eth.personal.unlockAccount(accounts[0], "123456", 20*60*60);
let block = await web3.eth.getBlock("latest");
console.log(block);
for (let account of accounts){
	console.log(account, ": ", await web3.eth.getBalance(account));
}
let oldAmt = await web3.eth.getBalance(accounts[0]);
console.log("account[0]-", accounts[0], ": ", oldAmt);
//await web3.eth.personal.unlockAccount(accounts[2], "123456", 20*60*60);
let receipt = await web3.eth.sendTransaction({
	from: accounts[0], 
	to: accounts[1], 
	value: "0x3", 
	gas:Math.floor(4*block.gasLimit/5)});
console.log("receipt", receipt);
for (let account of accounts){
	console.log(account, ": ", await web3.eth.getBalance(account));
}
}

test().then(result=>{
	console.log(result);
}).catch(err =>{
	console.error(err);
});
