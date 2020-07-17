#! /local/bin/babel-node

const path = require("path");
const Web3 = require('web3');
const truffleWeb3=require("truffle-web3");
const truffle_contract = require('@truffle/contract');
// let httpRpcAddr = "http://127.0.0.1:8546";
// let Provider = new Web3.providers.HttpProvider(httpRpcAddr);
// let web3 = new Web3(new Web3.providers.HttpProvider(httpRpcAddr));

var net = require('net');
let Provider = new Web3.providers.IpcProvider('/home/liuye/Projects/AlethWithTraceRecorder/bootstrap-scripts/aleth-ethereum/Ethereum/geth.ipc', net);
// let Provider = new Web3.providers.IpcProvider('/home/liuye/Projects/ModCon/ethereum/aleth-ethereum/Ethereum/geth.ipc', net);
let web3 = new Web3(Provider);

async  function testFreeEth(artifact_path, attack_path){
	let accounts = await web3.eth.getAccounts();
	await web3.eth.personal.unlockAccount(accounts[0], "123456", 20*60*60);
	let block = await web3.eth.getBlock("latest");
	let gas = Math.floor(4*block.gasLimit/5);
	let artifact = require(path.relative(__dirname, artifact_path));
	let MyContract = truffle_contract(artifact);
	MyContract.setProvider(new truffleWeb3.providers.IpcProvider('/home/liuye/Projects/AlethWithTraceRecorder/bootstrap-scripts/aleth-ethereum/Ethereum/geth.ipc', net));
	let FreeEth = await MyContract.deployed();
	FreeEth = new web3.eth.Contract(artifact.abi, artifact.networks[Object.keys(artifact.networks)[0]].address);

	artifact = require(path.relative(__dirname, attack_path));
	MyContract = truffle_contract(artifact);
	MyContract.setProvider(new truffleWeb3.providers.IpcProvider('/home/liuye/Projects/AlethWithTraceRecorder/bootstrap-scripts/aleth-ethereum/Ethereum/geth.ipc', net));
	let AttackFreeEth = await MyContract.deployed();
	// console.log(AttackFreeEth);
	AttackFreeEth = new web3.eth.Contract(artifact.abi, artifact.networks[Object.keys(artifact.networks)[0]].address);

	
	// console.log(FreeEth);
	// console.log(web3.utils);
	let balance = await web3.eth.getBalance(AttackFreeEth._address);
	console.log(balance);
	await FreeEth. methods.GetFreebie().send({	
		from: accounts[0],
		gas: gas,
		value: web3.utils.toWei("0.1", "ether")
	})
	console.log(web3.utils.toWei("0.1", "ether"));
	await AttackFreeEth.methods.vultron_GetFreebie(web3.utils.toWei("0.1", "ether")).send({	
		from: accounts[0],
		gas: gas,
		// value: web3.utils.toWei("0.1", "ether")
	});
	balance = await web3.eth.getBalance(AttackFreeEth._address);
	console.log(balance);	
}
		
testFreeEth(path.join("./build/contracts","FreeEth.json"), path.join("./build/contracts","Attack_FreeEth0.json"))
	
