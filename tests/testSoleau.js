#! /local/bin/babel-node

const path = require("path");
const Web3 = require('web3');
const truffleWeb3=require("truffle-web3");
const truffle_contract = require('@truffle/contract');
// let httpRpcAddr = "http://127.0.0.1:8546";
// let Provider = new Web3.providers.HttpProvider(httpRpcAddr);
// let web3 = new Web3(new Web3.providers.HttpProvider(httpRpcAddr));

var net = require('net');
let Provider = new Web3.providers.IpcProvider('/home/liuye/ContraMaster/AlethWithTraceRecorder/bootstrap-scripts/aleth-ethereum/Ethereum/geth.ipc', net);
let web3 = new Web3(Provider);

async  function testSoleau(artifact_path, attack_path){
	let accounts = await web3.eth.getAccounts();
	await web3.eth.personal.unlockAccount(accounts[0], "123456", 20*60*60);
	let block = await web3.eth.getBlock("latest");
	let gas = Math.floor(4*block.gasLimit/5);
	let artifact = require(path.relative(__dirname, artifact_path));
	let Soleau = new web3.eth.Contract(artifact.abi, artifact.networks[Object.keys(artifact.networks)[0]].address);

	artifact = require(path.relative(__dirname, attack_path));
	let AttackSoleau = new web3.eth.Contract(artifact.abi, artifact.networks[Object.keys(artifact.networks)[0]].address);

	
	let balance = await web3.eth.getBalance(Soleau._address);
	console.log(balance);
        console.log(web3.utils.toWei("0.1", "ether"),"0x1234567812345678");
       let receipt = await AttackSoleau.methods.vultron_record("0x313951005d71a480" /*web2.utils.toWei("0.1", "ether")*/, 0).send({	
		from: accounts[0],
		gas: gas,
	});
	console.log(receipt);
	balance = await web3.eth.getBalance(Soleau._address);
	console.log(balance);	
}
		
testSoleau(path.join("./build/contracts","Soleau.json"), path.join("./build/contracts","Attack_Soleau0.json"))
	
