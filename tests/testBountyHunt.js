#! /local/bin/babel-node

const path = require("path");
const Web3 = require('web3');
const truffleWeb3=require("truffle-web3");
const truffle_contract = require('truffle-contract');
// let httpRpcAddr = "http://127.0.0.1:8546";
// let Provider = new Web3.providers.HttpProvider(httpRpcAddr);
// let web3 = new Web3(new Web3.providers.HttpProvider(httpRpcAddr));

var net = require('net');
let Provider = new Web3.providers.IpcProvider('/home/liuye/Projects/AlethWithTraceRecorder/bootstrap-scripts/aleth-ethereum/Ethereum/geth.ipc', net);
// let Provider = new Web3.providers.IpcProvider('/home/liuye/Projects/ModCon/ethereum/aleth-ethereum/Ethereum/geth.ipc', net);
let web3 = new Web3(Provider);

async  function testBountyHunt(artifact_path){
	let accounts = await web3.eth.getAccounts();
	await web3.eth.personal.unlockAccount(accounts[0], "123456", 20*60*60);
	let block = await web3.eth.getBlock("latest");
	let gas = Math.floor(4*block.gasLimit/5);
	let artifact = require(path.relative(__dirname, artifact_path));
	let MyContract = truffle_contract(artifact);
	MyContract.setProvider(new truffleWeb3.providers.IpcProvider('/home/liuye/Projects/AlethWithTraceRecorder/bootstrap-scripts/aleth-ethereum/Ethereum/geth.ipc', net));
	let bountyHunt = await MyContract.deployed();
	let setBountyAmountABI = bountyHunt.abi.filter(abi=>{
		return abi.name == "setBountyAmount";
	})[0];
	let totalBountyAmountABI = bountyHunt.abi.filter(abi=>{
		return abi.name == "totalBountyAmount";
	})[0];
	let attempt = 0;
	let bounty;
	while(!bounty&&attempt++ < 10){
	bounty = await bountyHunt.bountyAmount(bountyHunt.address,
	{
		from: accounts[0],
		gas: gas
	});
}
   console.log("attempt times:", attempt);
	console.log("bounty: ", bounty.toString());

	console.log("bounty: ", bounty);
	let receipt = await bountyHunt.grantBounty(bountyHunt.address, "0x100", 
	{
		from: accounts[0],
		gas: gas
	}
	);
	console.log(receipt);
	attempt = 0;
	bounty = undefined;
	while(!bounty&&attempt++ < 10){
	bounty = await bountyHunt.bountyAmount(bountyHunt.address,
	{
		from: accounts[0],
		gas: gas
	});
}
   console.log("attempt times:", attempt);
	console.log("bounty: ", bounty.toString());

	
}
		
testBountyHunt(path.join("./build/contracts","BountyHunt.json"))
	
