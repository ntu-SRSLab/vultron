const path = require('path');
const Web3jService = require('web3j-api/web3j').Web3jService;
const web3j = new Web3jService();
const Configuration = require('web3j-api/common/configuration').Configuration;

Configuration.setConfig(path.join(__dirname, './config.json'));

const truffle_contract = require('truffle-contract');

const fs = require('fs');
const locks = require('locks');
// mutex
const mutex = locks.createMutex();
const async = require('async');

var g_data_feedback = false;

/// json file
let g_target_artifact;
let g_attack_artifact;
// truffle-contract abstractions
let g_targetContract;
let g_attackContract;


async function get_instance(artifact_path){
  let artifact = require(path.relative(g_cwd, artifact_path));
  let MyContract = truffle_contract(artifact);
  MyContract.setProvider(Provider);
  let instance = await MyContract.deployed();

  return instance;
}


async function load(targetPath, attackPath, targetSolPath, attackSolPath){
  g_attackContract = await get_instance(attackPath);
  g_targetContract = await get_instance(targetPath);
  g_attack_artifact = require(path.relative(g_cwd, attackPath));
  g_target_artifact = require(path.relative(g_cwd, targetPath));
  
  /// add the attack contract address
  g_account_list.push(g_attackContract.address);
  /// find bookkeeping variable
  g_bookKeepingAbi = await findBookKeepingAbi(g_targetContract.abi);
  /// all the possible abi, then we use to synthesize the call sequence
  g_cand_sequence = [];
  await findCandSequence(g_targetContract.abi, g_attackContract.abi);

  /// the set of statements, which may be used for computing experimental results
  g_attackStmt_set = await tracer.buildStmtSet(g_attack_artifact.sourcePath,
                                               g_attack_artifact.deployedSourceMap,
                                               g_attack_artifact.source);
  g_targetStmt_set = await tracer.buildStmtSet(g_target_artifact.sourcePath,
                                               g_target_artifact.deployedSourceMap,
                                               g_target_artifact.source);     
  
  /// the map that the instruction corresponds to the statement 
  /// the form: [ '239JUMPI', 'Attack_SimpleDAO0.sol:1' ]
  /// where 239 is the offset, JUMPI is the instruction
  g_attackIns_map = await tracer.buildInsMap(g_attack_artifact.sourcePath,
                                             g_attack_artifact.deployedBytecode,
                                             g_attack_artifact.deployedSourceMap,
                                             g_attack_artifact.source);
  g_targetIns_map = await tracer.buildInsMap(g_target_artifact.sourcePath,
                                             g_target_artifact.deployedBytecode,
                                             g_target_artifact.deployedSourceMap,
                                             g_target_artifact.source);

  /// the static dependencies
  /// The form:
  // { Read: { 'SimpleDAO.sol:17': [ 'credit' ] },
  //  Write: { 'SimpleDAO.sol:8': [ 'owner' ] },
  //  CDepen: { 'SimpleDAO.sol:21': [ 'SimpleDAO.sol:22' ] } }
  // console.log("arriving here");
  g_staticDep_attack = await tracer.buildStaticDep(attackSolPath);
  g_staticDep_target = await tracer.buildStaticDep(targetSolPath);

  g_send_call_set = await tracer.buildMoneySet(targetSolPath);
  g_send_call_found = await tracer.buildRelevantDepen(g_staticDep_target, g_send_call_set);
  console.log(g_send_call_found);

  // /// clear the exploit script
  // if(fs.existsSync(g_exploit_path)){
  //   fs.unlinkSync(g_exploit_path);
  // }

  return {
   accounts: g_account_list,
   attack_adds: g_attackContract.address,
   target_adds: g_targetContract.address,
   attack_abi: g_attackContract.abi,
   target_abi: g_targetContract.abi
  };
}

/// the seed for dynamic fuzzing
async function seed() {
  if (g_targetContract === undefined) {
    throw "Target contract is not deployed!";
  }
  if (g_attackContract === undefined) {
    throw "Attack contract is not deployed!";
  }
  // we only generate a call sequence
  let callFun_list;
  if(g_data_feedback){
    callFun_list = await seed_callSequence();
  }
  else{
    callFun_list = await seed_callSequence_withoutData();
  }
  // Execute the seed call sequence
  mutex.lock(async function() {
    try{
      /// the call sequence to be executed
      g_callSequen_list.push(callFun_list);
      g_callSequen_start = true;
      await exec_sequence_call();
    }
    catch (e) {
      console.log(e);
    }
    finally{
      mutex.unlock();
    }
  });

  let execResult_list = "successful!";
  return {
    callFuns: callFun_list,
    execResults: execResult_list
  };
}

//module.exports.load = load;
//module.exports.seed = seed;

module.exports.test_deployed = function() {
  web3j.getBlockNumber().then((res) => {
    console.log(res);
  }).catch((e) => {
    console.log(e);
  });
  return true;
}
