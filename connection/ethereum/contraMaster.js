#! /local/bin/babel-node
const path = require('path');
const net = require("net");
const Web3 = require('web3');
const TruffleWeb3=require("truffle-web3");
const async = require("async");
const Promise = require("bluebird");
const truffle_contract = require('@truffle/contract');
const assert = require('assert');
const tracer = require('../EVM2Code');
const fs = require('fs');
const locks = require('locks');
// mutex
const mutex = locks.createMutex();

var g_data_feedback = false;

/// the file that used to keep exploit script
const g_exploit_path = "./exploit.txt";


class ContraMaster{
  constructor(ipcprovider){
    this.callSequenList = [];
    this.Provider =new Web3.providers.IpcProvider(ipcprovider, net);
    this.web3 = new Web3(this.Provider);
    this.Provider =new TruffleWeb3.providers.IpcProvider(ipcprovider, net);
    assert(web3);
  }
  async getContractInstance(artifact_path){
    let artifact = require(path.relative(__dirname, artifact_path));
    let MyContract = truffle_contract(artifact);
    MyContract.setProvider(this.Provider);
    let instance = await MyContract.deployed();
    return instance;
  }
  async unlockAccount(){
    try{
      this.accounts  = await web3.eth.getAccounts()
      this.defaultAccount = this.accounts[0]
      let ret = await web3.eth.personal.unlockAccount(this.defaultAccount, "123456", 200 * 60 * 60)
      if(ret)
        console.log( `${this.defaultAccount} is unlocked` )
      else 
        console.log(`unlock failure`)
    }catch(err){
      console.error(err)
      console.trace()
    }
  }
load(myEmitter, targetPath, attackPath, targetSolPath, attackSolPath){
  this.MyEmitter = myEmitter;
  this.attackContract = await get_instance(attackPath);
  this.targetContract = await get_instance(targetPath);
  this.attackArtifact = require(path.relative(__dirname, attackPath));
  this.targetArtifact = require(path.relative(__dirname, targetPath));
  assert(this.accounts);
  this.accounts.push(this.attackContract.address);
  this.bookKeepingAbi = await findBookKeepingAbi(this.targetContract.abi);
  this.candidateSeq = [];
  await findCandSequence(this.targetContract.abi, this.attackContract.abi);

  /// the set of statements, which may be used for computing experimental results
  this.attackStmtSet = await tracer.buildStmtSet(this.attackArtifact.sourcePath,
                                               this.attackArtifact.deployedSourceMap,
                                               this.attackArtifact.source);
  this.targetStmtSet = await tracer.buildStmtSet(this.targetArtifact.sourcePath,
                                               this.targetArtifact.deployedSourceMap,
                                               this.targetArtifact.source);     
  
  /// the map that the instruction corresponds to the statement 
  /// the form: [ '239JUMPI', 'Attack_SimpleDAO0.sol:1' ]
  /// where 239 is the offset, JUMPI is the instruction
  this.attactInstructioMap = await tracer.buildInsMap(this.attackArtifact.sourcePath,
                                             this.attackArtifact.deployedBytecode,
                                             this.attackArtifact.deployedSourceMap,
                                             this.attackArtifact.source);

  this.targetInstructioMap = await tracer.buildInsMap(this.targetArtifact.sourcePath,
                                             this.targetArtifact.deployedBytecode,
                                             this.targetArtifact.deployedSourceMap,
                                             this.targetArtifact.source);

  /// the static dependencies
  /// The form:
  // { Read: { 'SimpleDAO.sol:17': [ 'credit' ] },
  //  Write: { 'SimpleDAO.sol:8': [ 'owner' ] },
  //  CDepen: { 'SimpleDAO.sol:21': [ 'SimpleDAO.sol:22' ] } }
  // console.log("arriving here");
  this.atttackStaticDep = await tracer.buildStaticDep(attackSolPath);
  this.targetStaticDep = await tracer.buildStaticDep(targetSolPath);

  this.sendCallSet = await tracer.buildMoneySet(targetSolPath);
  this.sendCallFound = await tracer.buildRelevantDepen(this.targetStaticDep, this.sendCallSet);
  console.log(this.sendCallFound);


  return {
   accounts: this.accounts,
   attack_adds: this.attackContract.address,
   target_adds: this.targetContract.address,
   attack_abi: this.attackContract.abi,
   target_abi: this.targetContract.abi
  };
  }
  seed(){

  }
  fuzz(){

  }
  execCall(){

  }
  mutate(){

  }
}









