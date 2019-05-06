#! /local/bin/babel-node



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



/// json file
let g_target_artifact;
let g_attack_artifact
// truffle-contract abstractions
let g_targetContract;
let g_attackContract;
let g_attackStmt_set;
let g_targetStmt_set;
// web3 abstractions

let web3;
let Provider;
let g_account_list;
let g_bookKeepingAbi;

// tracer abstractions at instruction level
let g_targetIns_map;
let g_attackIns_map;
//!/usr/bin/babel-node

// static dependency
let g_staticDep_target;
let g_staticDep_attack;

/// the gas amount
const gasMin = 25000;
const gasMax = 8000000000;
/// dynamci array
const dyn_array_min = 1;
const dyn_array_max = 10;

/// the maximum length of seed_callSequence
const sequence_maxLen = 4;
/// the maximum number of muated call sequences 
const mutateSeque_maxLen = 4;
/// the maximum number of muated operation for each call sequence
const mutateOper_maxLen = 3;
/// the maximum length of changed call sequence
const operSeque_maxLen = 3;

/// the set to keep the coverage for guided fuzzing
let g_stmt_trace = [];
let g_seque_stmt_trace = [];
let g_trans_depen_set = new Set();
let g_seque_depen_set = new Set();
let g_contr_depen_set = new Set();

/// the last call
let g_lastCall = new Map();
/// the call function list for the execution
let g_sequence_call_list = [];
/// the executed call sequence
let g_sequence_executed = [];
/// the index in g_sequence_executed
let g_sequeExe_index = 0;
/// the sequence_exexuted become more meaningful
let g_sequeExe_meaningful = false;
/// the execution results of a call function
let g_exec_results = [];
/// another new call seqeunce
let g_new_sequence_start = false;

/// the hash of previous transaction
let g_pre_txHash = "0x0";
let g_startTime, g_endTime;
let g_timeDiff;

/// the candidate abi that can be used to start transaction
let g_cand_sequence = [];

let g_reset_num = 0;
let g_reset_index = 0;

let g_fuzzing_finish = false;

let g_from_account;


/// the mutation for gas neighbor
let g_gas_neighbor = [];
g_gas_neighbor.push('0.01');
g_gas_neighbor.push('0.1');
g_gas_neighbor.push('0.2');
g_gas_neighbor.push('0.3');
g_gas_neighbor.push('0.5');
g_gas_neighbor.push('0.8');
g_gas_neighbor.push('0.9');
g_gas_neighbor.push('0.92');
g_gas_neighbor.push('0.93');
g_gas_neighbor.push('0.95');
g_gas_neighbor.push('0.96');
g_gas_neighbor.push('0.97');
g_gas_neighbor.push('0.98');
g_gas_neighbor.push('0.99');
g_gas_neighbor.push('1.01');
g_gas_neighbor.push('1.02');
g_gas_neighbor.push('1.03');
g_gas_neighbor.push('1.0');
g_gas_neighbor.push('1.05');
g_gas_neighbor.push('1.06');
g_gas_neighbor.push('1.08');
g_gas_neighbor.push('1.1');
g_gas_neighbor.push('1.2');
g_gas_neighbor.push('1.5');
g_gas_neighbor.push('1.7');
g_gas_neighbor.push('2.0');
g_gas_neighbor.push('3.0');
g_gas_neighbor.push('5.0');
g_gas_neighbor.push('10.0');
g_gas_neighbor.push('50.0');
g_gas_neighbor.push('80.0');
g_gas_neighbor.push('100.0');
g_gas_neighbor.push('1000.0');


/// the mutation operation for uint neighbor
let uint_neighbor = [];
uint_neighbor.push('1.05');
uint_neighbor.push('0.95');
uint_neighbor.push('1.1');
uint_neighbor.push('0.9');
uint_neighbor.push('1.15');
uint_neighbor.push('0.85');  
uint_neighbor.push('1.2');
uint_neighbor.push('0.8');
uint_neighbor.push('1.5');
uint_neighbor.push('0.5');
uint_neighbor.push('2.0');
uint_neighbor.push('0.02');  
uint_neighbor.push('3.0');
uint_neighbor.push('0.015'); 
uint_neighbor.push('4.0');
uint_neighbor.push('0.01'); 
uint_neighbor.push('5.0');
uint_neighbor.push('0.001'); 
uint_neighbor.push('0.0001')
uint_neighbor.push(1);
uint_neighbor.push(-1);
uint_neighbor.push(2);
uint_neighbor.push(-2);
uint_neighbor.push(4);
uint_neighbor.push(-4);
uint_neighbor.push(8);
uint_neighbor.push(-8);




function unlockAccount(){
  g_account_list = web3.eth.accounts;
  g_from_account = g_account_list[0];
  web3.personal.unlockAccount(g_from_account, "123456", 200 * 60 * 60);
}

function setProvider(httpRpcAddr){
  // assert(web3!=undefined);
  Provider = new Web3.providers.HttpProvider(httpRpcAddr);
  web3  =  new Web3(new Web3.providers.HttpProvider(httpRpcAddr));
  assert(web3);
}

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
  let MyContract = truffle_Contract(conf);
  MyContract.setProvider(Provider);
  let instance = await MyContract.deployed();
  return instance;
}

  /// load some static information for the dynamic analysis.e.g., fuzzing
  async function test_load(targetPath, attackPath, targetSolPath, attackSolPath) {

    g_startTime = new Date();
    g_targetContract = await get_instance(targetPath);
    g_attackContract = await get_instance(attackPath);
    return {
     accounts: g_account_list,
     target_adds: g_targetContract.address,
     attack_adds: g_attackContract.address,
     target_abi: g_targetContract.abi,
     attack_abi: g_attackContract.abi
    };
  
  }

  /// load some static information for the dynamic analysis.e.g., fuzzing
async function load(targetPath, attackPath, targetSolPath, attackSolPath) {

  g_startTime = new Date();
  g_targetContract = await get_instance(targetPath);
  g_attackContract = await get_instance(attackPath);
  g_attack_artifact = require(attackPath);
  g_target_artifact = require(targetPath);
  /// add the attack contract address
  g_account_list.push(g_attackContract.address);

  /// find bookkeeping var
  g_bookKeepingAbi = await findBookKeepingAbi(g_targetContract.abi);

  /// all the possible abi
  g_cand_sequence = [];
  await findCandSequence(g_targetContract.abi, g_attackContract.abi);

  /// the set of statements
  g_attackStmt_set = await tracer.buildStmtSet(g_attack_artifact.sourcePath,
    g_attack_artifact.deployedSourceMap,
    g_attack_artifact.source);

  g_targetStmt_set = await tracer.buildStmtSet(g_target_artifact.sourcePath,
    g_target_artifact.deployedSourceMap,
    g_target_artifact.source);     
  
  /// the map that the instruction corresponds to the statement 
  g_attackIns_map = await tracer.buildInsMap(
    g_attack_artifact.sourcePath,
    g_attack_artifact.deployedBytecode,
    g_attack_artifact.deployedSourceMap,
    g_attack_artifact.source);

   g_targetIns_map = await tracer.buildInsMap(
    g_target_artifact.sourcePath,
    g_target_artifact.deployedBytecode,
    g_target_artifact.deployedSourceMap,
    g_target_artifact.source);

  /// the static dependencies
   g_staticDep_target = await tracer.buildStaticDep(targetSolPath);
   g_staticDep_attack = await tracer.buildStaticDep(attackSolPath);
  //  console.log(g_account_list);
  //  console.log(g_targetContract.address);
  //  console.log(g_attackContract.abi);
    return {
   accounts: g_account_list,
   target_adds: g_targetContract.address,
   attack_adds: g_attackContract.address,
   target_abi: g_targetContract.abi,
   attack_abi: g_attackContract.abi
  };

}
  

  /// the seed for dynamic fuzzing
async function seed() {
    if (g_targetContract === undefined) {
      throw "Target contract is not loaded!";
    }
    if (g_attackContract === undefined) {
      throw "Attack contract is not loaded!";
    }
    // Generate call sequence
    let callFun_list = await seed_callSequence();

    // Execute the seed call sequence
    // await exec_sequence_call();
    mutex.lock(async function() {
      try{
        g_reset_index = 0;
        g_reset_num = randomNum(0, 50);
        g_new_sequence_start = true;
        g_sequence_call_list.push(callFun_list);
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

  async function fuzz(txHash, ins_trace) {
    if (g_targetContract === undefined) {
      throw "Target contract is not loaded!";
    }
    if (g_attackContract === undefined) {
      throw "Attack contract is not loaded!";
    }
    /// different transaction hash code
    if(txHash != g_pre_txHash){
      g_pre_txHash = txHash;
      mutex.lock(async function() {
        try{
          /// ins_trace is the instrcution trace
          /// g_stmt_trace is the line nunmber trace
          g_stmt_trace = await tracer.buildTraceMap(ins_trace,
                                                      g_attackIns_map,
                                                      g_targetIns_map);
          g_seque_stmt_trace = g_seque_stmt_trace.concat(g_stmt_trace);
          /// the dynamic dependencies in the g_stmt_trace
          g_trans_depen_set = await tracer.buildDynDep(g_seque_stmt_trace,
                                                     g_staticDep_attack,
                                                     g_staticDep_target);
          /// execute a function call
          await exec_sequence_call();
        }
        catch (e) {
          console.log(e);
        }
        finally{
          mutex.unlock();
        }
      });     
    }
  }
  
  async function reset() {
    if (g_targetContract === undefined) {
      throw "Target contract is not loaded!";
    }
    if (g_attackContract === undefined) {
      throw "Attack contract is not loaded!";
    }
    // await resetBookKeeping();
    await redeploy();
    return "Contracts are reset!";
  }


/// find the bookkeeping variable
async function findBookKeepingAbi(abis) {
  for (let abi of abis) {
    if (abi.type === 'function' && abi.constant &&
        abi.inputs.length === 1 && abi.inputs[0].type === 'address' &&
        abi.outputs.length === 1 && abi.outputs[0].type === 'uint256') {
      return abi;
    }
  }
  throw "Cannot find bookkeeping variable!";
  return;
}


async function findCandSequence(target_abis, attack_abis){
  let target_switch = true;
  let attack_switch = true;

  if(target_switch){
    await target_abis.forEach(function(abi) {
      /// if abi.constant is true, it would not change state variables
      if (abi.type === 'function' && abi.constant == false){
        let notsupport = false;
        let input_len = abi.inputs.length;
        let input_index = 0;
        while(input_index < input_len){
          let input = abi.inputs[input_index];
          if(input.type.indexOf('address') !== 0 && input.type.indexOf('uint') !== 0){
            notsupport = true;
            break;
          }
          input_index += 1;
        }
        if(!notsupport){
          g_cand_sequence.push(abi);
        }
      }
    }); 
  }
  if(attack_switch){
    await attack_abis.forEach(function(abi) {
      if (abi.type === 'function' && abi.constant == false){
        let notsupport = false;
        let input_len = abi.inputs.length;
        let input_index = 0;
        while(input_index < input_len){
          let input = abi.inputs[input_index];
          if(input.type.indexOf('address') !== 0 && input.type.indexOf('uint') !== 0){
            notsupport = true;
            break;
          }
          input_index += 1;
        }
        if(!notsupport){
          g_cand_sequence.push(abi);
        }
      }
    }); 
  }
}

/// get the balacne of given address in the bookkeeping variable
async function getBookBalance(acc_address) {
  let balance = 0;
  let encode = web3.eth.abi.encodeFunctionCall(g_bookKeepingAbi, [acc_address]);

  await web3.eth.call({
                      to: g_targetContract.address,
                      data: encode}, function(err, result) {
                        if (!err) {
                          if (web3.utils.isHex(result)){
                            balance += web3.utils.toBN(result);
                          }
                        }
                      });
  return balance;
}

/// get the balance of attack in the bookkeeping variable
async function getAccountBalance() {
  let balance = await getBookBalance(g_attackContract.address);
  return balance;
}

/// reset bookkeeping variable
async function resetBookKeeping() {
  for (let account of g_account_list) {
    g_targetContract.methods.__vultron_reset(account).call();
  }
  g_targetContract.methods.__vultron_reset(g_attackContract.address).call();
}

/// get the sum of bookkeeping variable
async function getBookSum() {
  let sum = BigInt(0);
  for (let account of g_account_list) { 
    let account_bal = await getBookBalance(account);
    console.log('account_bal: ' + account_bal);
    /// only the BigInt can be added safely
    sum += BigInt(account_bal);
  }
  return "" + sum;
}

/// execute the call and generate the transaction
async function exec_callFun(call){
  let target_bal_bf = await web3.eth.getBalance(g_targetContract.address);
  let target_bal_sum_bf = await getBookSum();
  let attack_bal_bf = await web3.eth.getBalance(g_attackContract.address);
  let attack_bal_acc_bf = await getAccountBalance();

  console.log(call);
  let tx_hash;
  try{
    await web3.eth.sendTransaction({ from: call.from,
                                     to: call.to, 
                                     gas: call.gas,                               
                                     data: web3.eth.abi.encodeFunctionCall(call.abi, call.param)
                                   },
                                   function(error, hash) {
                                     if (!error) {
                                      tx_hash = hash;
                                     }
                                     else{
                                       console.log(error);
                                      }
                                  });
  }catch(e){
    console.log(e);
  }
  let revert_found = false;
  await web3.eth.getTransactionReceipt(tx_hash).then((receipt) => {
    console.log("receipt status: " + receipt.status + " ######receipt gasused: " + receipt.gasUsed);
    if(receipt.status === false){
      if((parseInt(call.gas, 10) - receipt.gasUsed) < 500){
        console.log(tx_hash + '  out-of-gas transaction failed');
        revert_found = true;
      }
    }
    }).catch((e)=> {
      console.log(e);
  });

  let target_bal_af = await web3.eth.getBalance(g_targetContract.address);
  let target_bal_sum_af = await getBookSum();
  let attack_bal_af = await web3.eth.getBalance(g_attackContract.address);
  let attack_bal_acc_af = await getAccountBalance();

  console.log(attack_bal_bf);
  console.log(attack_bal_af);
  console.log(target_bal_bf);
  console.log(target_bal_af);
  console.log(attack_bal_acc_bf);
  console.log(attack_bal_acc_af);
  console.log(target_bal_sum_bf);
  console.log(target_bal_sum_af);
  
  /// TODO still not consider the price of token in bookkeeping variable  
  try{ 
    // if((BigInt(target_bal_bf) - BigInt(target_bal_sum_bf)) != (BigInt(target_bal_af) - BigInt(target_bal_sum_af))){
    //   throw "Balance invariant is not held....";
    // }
    if((BigInt(target_bal_bf) - BigInt(target_bal_sum_bf)) < (BigInt(target_bal_af) - BigInt(target_bal_sum_af))){
      throw "Balance invariant is not held....";
    }
    // if((BigInt(attack_bal_af) - BigInt(attack_bal_bf)) != (BigInt(attack_bal_acc_bf) - BigInt(attack_bal_acc_af))){
    //   throw "Transaction invariant is not held....";
    // }
  }
  catch(e){
    return "found";
  }

  if(revert_found){
    return "revert";
  }
  else{
    return [
      attack_bal_bf,
      attack_bal_af,
      target_bal_bf,
      target_bal_af,  
      attack_bal_acc_bf,
      attack_bal_acc_af,
      target_bal_sum_bf,
      target_bal_sum_af
    ];
  }
}

/// min <= r < max
function randomNum(min, max){
  if(min >= max){
    return Math.floor(min);
  }
  else{
    let range = max - min;
    let rand = Math.random();
    let num = min + Math.floor(rand * range);
    return num; 
  }
}

function sortNumber(a,b)
{
  return a - b;
}

/// generate an account address
function gen_address(adds_type){
  /// returns -1, if the value to search for never occurs
  if(adds_type.indexOf('[') == -1){
    /// primitive type
    let account_index = randomNum(0, g_account_list.length);
    let account = g_account_list[account_index];
    return account;
  }
  else if(adds_type.indexOf('[]') != -1){
    /// dynamic array
    let adds_list = [];
    let adds_num = randomNum(dyn_array_min, dyn_array_max);
    let adds_index = 0;
    while(adds_index < adds_num){
      let account_index = randomNum(0, g_account_list.length);
      let account = g_account_list[account_index];
      adds_list.push(account);
      adds_index += 1;
    }
    return adds_list;
  }
  else{
    /// static array
    let adds_list = [];
    let left_index = adds_type.indexOf('[');
    let right_index = adds_type.indexOf(']');
    let adds_num = parseInt(adds_type.slice(left_index +1, right_index), 10);
    let adds_index = 0;
    while(adds_index < adds_num){
      let account_index = randomNum(0, g_account_list.length);
      let account = g_account_list[account_index];
      adds_list.push(account);
      adds_index += 1;
    }
    return adds_list;
  }
}

/// conver scientific number to string
function uintToString(num){
  let num_str = "" + num;
  /// scientific number
  let index = num_str.indexOf("+");
  if(index != -1){
    let result = num_str[0];
    let power_len = parseInt(num_str.slice(index +1), 10);
    let power_index = 0;
    while(power_index < power_len){
      /// num_str[index-1:] is 'e+...'
      if((power_index +2) < (index -1)){
        result += num_str[power_index +2];
      }
      else{
        result += '0';
      }
      power_index += 1;
    }
    return result;
  }
  else{
    return num_str;
  }
}


/// generate an unsigned integer
/// unum_min is defined, in most case it is 0
/// unum_max may not be defined, e.g., undefined
function gen_uint(uint_type, unum_min, unum_max){
  /// get rid of uint in e.g., 'uint256'
  let num_left = 4;
  /// maybe it is an array, e,g., 'uint256[]'
  let num_right = uint_type.indexOf('[');
  if(num_right == -1){
    /// it is primitive unit, not an array
    num_right = uint_type.length;
  } 
  /// the number of bytes
  let byte_num = parseInt(uint_type.slice(num_left, num_right), 10) / 8;
  let byte_index = 0;
  let num_str = '0x';
  while(byte_index < byte_num){
    num_str += 'ff';
    byte_index += 1;
  }
  if(unum_max === undefined){
    /// unum_max is undefined, we use the default maximum value
    unum_max = parseInt(num_str, 16); 
  }
  else{
    let num_max = parseInt(num_str, 16);
    if(num_max < unum_max){
      unum_max = num_max;
    }
  }
  if(uint_type.indexOf('[') == -1){
    /// primitive type
    let value_int = randomNum(unum_min, unum_max);
    let value = uintToString(value_int);
    return value;
  }
  else if(adds_type.indexOf('[]') != -1){
    /// dynamic array
    let value_list = [];
    let value_num = randomNum(dyn_array_min, dyn_array_max);
    let value_index = 0;
    while(value_index < value_num){
      let value_int = randomNum(unum_min, unum_max);
      let value = uintToString(value_int);;      
      value_list.push(value);
      value_index += 1;
    }
    return value_list;
  }
  else{
    /// static array
    let value_list = [];
    let left_index = uint_type.indexOf('[');
    let right_index = uint_type.indexOf(']');
    let value_num = parseInt(uint_type.slice(left_index +1, right_index), 10);
    let value_index = 0;
    while(value_index < value_num){
      let value_int = randomNum(unum_min, unum_max);
      let value = uintToString(value_int);
      value_list.push(value);
      value_index += 1;
    }
    return value_list;
  }
}

/// generate the call input
/// unum_min is defined, in most case it is 0
/// unum_max may not be defined, e.g., undefined
async function gen_callInput(abi, unum_min, unum_max) {
  let param_list = [];  
  await abi.inputs.forEach(function(param) {
    if (param.type.indexOf('address') == 0) {
      let adds_param = gen_address(param.type);
      param_list.push(adds_param);
    }
    else if (param.type.indexOf('uint') == 0){
      /// uint type, its minimu is '0'
      let uint_param = gen_uint(param.type, 0, unum_max);
      param_list.push(uint_param);
    }
    else {      
      // default parameter
      console.log("not surpport data type...");
      param_list.push(0);
    }
  });
  return param_list;
}

async function modify_callInput_bal_range(abi, orig_inputs, unum_min, unum_max) {
  let param_list = []; 
  let param_changed = false; 
  let input_len = abi.inputs.length;
  let input_index = 0;
  while(input_index < input_len){
    let param = abi.inputs[input_index];
    if (param.type.indexOf('uint') == 0){
      /// uint type, its miximum is '0'
      let uint_param = gen_uint(param.type, unum_min, unum_max);
      param_list.push(uint_param);
      param_changed = true;
    }
    else {      
      // use hte original input
      param_list.push(orig_inputs[input_index]);
    }    
    input_index += 1;
  }

  if(param_changed){
    return param_list;
  }
  else{
    /// there is no change in parameters
    return undefined;
  }
}

/// generate a call function based on the existing call
async function modify_callFun_bal_range(call, unum_min, unum_max) {
  let parameters = await modify_callInput_bal_range(call.abi, call.param, unum_min, unum_max);
  if(parameters !== undefined){
    let callFun = {
      from: call.from,
      to: call.to,
      abi: call.abi,
      gas: call.gas,
      param: parameters
    }
    return callFun;
  }
  else{
    return undefined;
  }
}

async function modify_callInput_bal_single(abi, orig_inputs, unum) {
  let param_list = []; 
  let param_changed = false; 
  let input_len = abi.inputs.length;
  let input_index = 0;
  while(input_index < input_len){
    let param = abi.inputs[input_index];
    if (param.type.indexOf('uint') == 0){
      /// uint type, its miximum is '0'
      let uint_param = gen_uint(param.type, unum, unum);
      param_list.push(uint_param);
      param_changed = true;
    }
    else {      
      // use hte original input
      param_list.push(orig_inputs[input_index]);
    }    
    input_index += 1;
  }

  if(param_changed){
    return param_list;
  }
  else{
    /// there is no change in parameters
    return undefined;
  }
}


async function modify_callFun_bal_single(call, unum) {
  let parameters = await modify_callInput_bal_range(call.abi, call.param, unum);
  if(parameters !== undefined){
    let callFun = {
      from: call.from,
      to: call.to,
      abi: call.abi,
      gas: call.gas,
      param: parameters
    }
    return callFun;
  }
  else{
    return undefined;
  }
}

/// modify the 'input_orig_list' at 'input_index' with 'unum_diff' 
function modify_uint(input_orig_list, input_index, unum_diff){
  let input_orig = input_orig_list[input_index];
  if (typeof input_orig === 'string' || input_orig instanceof String){
    /// it is primitive, e.g., uint
    let input_orig_int = parseInt(input_orig, 10);
    if(typeof unum_diff === "number" || unum_diff instanceof Number){
      /// modify with the instant value
      let input_modify = input_orig_int + unum_diff;
      if(input_modify !== input_orig_int){
        if(input_modify >= 1){
          let modify_str = uintToString(input_modify)
          return modify_str;
        }
        else{
          return undefined;
        }        
      }
      else{
        return undefined;
      }
    }
    else if(typeof unum_diff === 'string' || unum_diff instanceof String){
      /// modify with 'xxx' times
      let unum_diff_int = parseFloat(unum_diff, 10);
      let input_modify = input_orig_int * unum_diff;
      if(input_modify !== input_orig_int){
        let modify_int =  Math.round(input_modify)
        if(modify_int >= 1){
          let modify_str = uintToString(Math.round(input_modify));
          return modify_str;   
        }
        else{
          return undefined;
        }
      }
      else{
        return undefined;
      }
    }
  }
  else if (input_orig instanceof Array){
    /// generate a copy to mutate, otherwise the original input will be modified
    input_orig = input_orig.slice()
    /// select an element to mutate
    let index = randomNum(0, input_orig.length);
    let input_orig_int = parseInt(input_orig[index], 10);
    if(typeof unum_diff === "number" || unum_diff instanceof Number){
      let input_modify = input_orig_int + unum_diff;
      if(input_modify !== input_orig_int){
        if(input_modify >= 1){
          let modify_str = uintToString(input_modify);
          input_orig[index] = modify_str;
        }
        else{
          return undefined;
        }   
        return input_orig;     
      }
      else{
        return undefined;
      }
    }
    else if(typeof unum_diff === 'string' || unum_diff instanceof String){
      let unum_diff_int = parseFloat(unum_diff, 10);
      let input_modify = input_orig_int * unum_diff;
      if(input_modify !== input_orig_int){
        let modify_int =  Math.round(input_modify)
        if(modify_int >= 1){
          let modify_str = uintToString(Math.round(input_modify));
          input_orig[index] = modify_str;   
        }
        else{
          input_orig[index] = '1';
        }
        return input_orig;         
      }
      else{
        return undefined;
      }
    }
  }
  else{
    /// no change, it needs to proceed further
    return undefined;
  }
}

async function modify_callInput_uint(call, unum_diff) {
  let param_list_set = new Set();
  let input_type_list = call.abi.inputs;
  let input_orig_list = call.param;
  let param_i = 0;
  let param_len = input_type_list.length;
  /// for each element in input_orig_list to mutate
  while(param_i < param_len){
    /// the generated parameters
    let param_list = [];
    let modify_found = false;
    let param_j = 0;
    while(param_j < param_len){
      /// we only consider the element that larger than param_i
      if(modify_found == false && param_j >= param_i){
        let input_type = input_type_list[param_j];
        if(input_type.type.indexOf('uint') == 0){
          let uint_param = modify_uint(input_orig_list, param_j, unum_diff);
          if(uint_param !== undefined){
            param_list.push(uint_param);
            modify_found = true;
          }
          /// param_i can be speed up
          param_i = param_j +1;
        }
        else{
          /// it is not unit type
          param_list.push(input_orig_list[param_j]);
        }
      }
      else{
        param_list.push(input_orig_list[param_j]);
      }
      param_j += 1;
    } 
    /// has modified the element 
    if(modify_found){
      param_list_set.add(param_list);
    }
    else{
      /// there is no candidation for modification
      break;
    }
  }
  /// if there is no modification, param_list_set is empty
  return param_list_set;
}


async function modify_callInput_uint_meaningful(call, unum_diff) {
  /// the generated parameters
  let param_list = [];
  let input_type_list = call.abi.inputs;
  let input_orig_list = call.param;
  let param_i = 0;
  let param_len = input_type_list.length;
  let modify_found = false;
  /// for each element in input_orig_list to mutate
  while(param_i < param_len){
    let input_type = input_type_list[param_i];
    if(input_type.type.indexOf('address') == 0){
      let adds_param = gen_address(input_type.type);
      if(adds_param != input_orig_list[param_i]){
        param_list.push(adds_param);
        modify_found = true;
      }
      else{
        param_list.push(input_orig_list[param_i]);
      }
    }
    else if(input_type.type.indexOf('uint') == 0){
      let uint_param = modify_uint(input_orig_list, param_i, unum_diff);
      if(uint_param !== undefined){
        if(uint_param == 'NaN'){
          console.log('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
        }
        param_list.push(uint_param);
        modify_found = true;
      }
      else{
        param_list.push(input_orig_list[param_i]);
      }
    }
    else{
      param_list.push(input_orig_list[param_i]);
    }
    param_i += 1;
  }
  if(modify_found){
    return [true, param_list];
  }
  else{
    return [false, undefined];
  }
}

async function modify_callGas_meaningful(call, gas_diff) {
  let times = parseFloat(gas_diff, 10);
  let gas = Math.ceil(parseInt(call.gas, 10) * times);
  if(gas < gasMax){
    return [true, gas];
  }
  else{
    return false;
  }
}


async function gen_callGas(gas_min, gas_max){
  let gas_int = randomNum(gas_min, gas_max);
  let gas_limit = uintToString(gas_int);
  return gas_limit;
}

/// generate a call function based on the abi
async function gen_callFun(abi) {
  let parameters = await gen_callInput(abi, 0, undefined);
  let gasLimit = await gen_callGas(gasMin, gasMax);
  let callFun = {
    from: g_account_list[0],
    to: abi.name.indexOf('vultron_') !== -1 ? g_attackContract.address : g_targetContract.address,
    abi: abi,
    gas: gasLimit,
    param: parameters
  }
  return callFun;
}


async function modify_callFun_gas(call, gas_min, gas_max){
  let gasLimit = await gen_callGas(gas_min, gas_max);
  let callFun = {
    from: call.from,
    to: call.to,
    abi: call.abi,
    gas: gasLimit,
    param: call.param.slice()
  }
  return callFun;
}



async function modify_callFun_uint(call, unum_diff){
  let callFun_set = new Set();
  // it returns a set of parameter list, because unum_diff can change many parameters
  let parameters_set = await modify_callInput_uint(call, unum_diff);
  for(let parameters of parameters_set){
    let callFun = {
      from: call.from,
      to: call.to,
      abi: call.abi,
      gas: call.gas,
      param: parameters
    };
    callFun_set.add(callFun);
  }
  return callFun_set;
}

async function modify_callFun_uint_meaningful(call, unum_diff){
  // it returns a set of parameter list, because unum_diff can change many parameters
  let modify_result = await modify_callInput_uint_meaningful(call, unum_diff);
  if(modify_result[0]){
    let callFun = {
      from: call.from,
      to: call.to,
      abi: call.abi,
      gas: call.gas,
      param: modify_result[1]
    };  
    return [true, callFun];
  }
  else{
    return [false, undefined];
  }
}

async function modify_callFun_gas_meaningful(call, gas_diff){
  // it returns a set of parameter list, because unum_diff can change many parameters
  let modify_result = await modify_callGas_meaningful(call, gas_diff);
  if(modify_result[0]){
    let callFun = {
      from: call.from,
      to: call.to,
      abi: call.abi,
      gas: modify_result[1],
      param: call.param
    };  
    return [true, callFun];
  }
  else{
    return false;
  }

}

/// mutate the gas, and generate a list of callsequence
/// gas does not need BigInt
async function mutate_gas(call, callSequence, index){
  let gas_sequence_list = [];
  let gas_diff = parseInt(call.gas, 10) - gasMin;
  let gas_neighbor_index = 0;
  let gas_neighbor_len = g_gas_neighbor.length;
  while(gas_neighbor_index <= gas_neighbor_len){
    let gas_min, gas_max;
    if(gas_neighbor_index == 0){
      gas_min = gasMin;
    }
    else{
      let times = parseFloat(g_gas_neighbor[gas_neighbor_index -1], 10);
      gas_min = Math.ceil(gasMin + gas_diff*times);
    }
    if(gas_neighbor_index == gas_neighbor_len){
      gas_max = gasMax;
    }
    else{
      let times = parseFloat(g_gas_neighbor[gas_neighbor_index], 10);
      gas_max = Math.ceil(gasMin + gas_diff*times);
    }
    /// generate a new call function
    let callFun = await modify_callFun_gas(call, gas_min, gas_max);
    /// clone the call sequence
    let gas_sequence = callSequence.slice();
    /// replace the given function
    gas_sequence[index] = callFun;
    gas_sequence_list.push(gas_sequence);
    gas_neighbor_index += 1;
  }
  return gas_sequence_list;
}

/// mutate the uint based on previous balances
/// 'g_exec_results' is the result of 'call'
async function mutate_balance(call, callSequence, index){
  let bal_sequence_list = [];
  let exec_index = 0;
  let exec_len = g_exec_results.length;
  while(exec_index <= exec_len){
    let unum_min, unum_max;
    if(exec_index == 0){
      unum_min = 0;
    }
    else{
      unum_min = parseInt(g_exec_results[exec_index -1]);
    }
    if(exec_index == 8){
      unum_max = undefined;
    }
    else{
      unum_max = parseInt(g_exec_results[exec_index]);
    }      
    /// generate the new calls and execute them
    let callFun = await modify_callFun_bal_range(call, unum_min, unum_max);
    if(callFun !== undefined){
      /// clone the call sequence
      let bal_sequence = callSequence.slice();
      /// replace the given function
      bal_sequence[index] = callFun;
      bal_sequence_list.push(bal_sequence);
    }
    callFun = await modify_callFun_bal_single(call, unum_max);
    if(callFun !== undefined){
      /// clone the call sequence
      let bal_sequence = callSequence.slice();
      /// replace the given function
      bal_sequence[index] = callFun;
      bal_sequence_list.push(bal_sequence);
    }
    exec_index += 1;
  }
  return bal_sequence_list;  
}

async function mutate_uint(call, callSequence, index){
  let uint_sequence_list = [];
  let uint_neighbor_index = 0;
  let uint_neighbor_len = uint_neighbor.length;
  while(uint_neighbor_index <= uint_neighbor_len){
    /// unum_diff is not handled here, because it is relevant to multiple parameters
    /// generate a new call function
    let unum_diff = uint_neighbor[uint_neighbor_index];
    let callFun_set = await modify_callFun_uint(call, unum_diff);
    for(let callFun of callFun_set){
      /// clone the call sequence
      let uint_sequence = callSequence.slice();
      /// replace the given function
      uint_sequence[index] = callFun;
      uint_sequence_list.push(uint_sequence);     
    }
    uint_neighbor_index += 1;
  }
  return uint_sequence_list;
}

async function mutate_callFun(call, callSequence, index) {
  let sequence_new_list = [];
  /// mutate the gas
  let gas_sequence_list = await mutate_gas(call, callSequence, index);
  for(let gas_sequence of gas_sequence_list){
    sequence_new_list.push(gas_sequence);
  }
  /// mutate the input based on the balance
  let bal_sequence_list = await mutate_balance(call, callSequence, index);
  for(let bal_sequence of bal_sequence_list){
    sequence_new_list.push(bal_sequence);
  }
  /// mutate the input based on the neighbor
  let uint_sequence_list = await mutate_uint(call, callSequence, index);
  for(let uint_sequence of uint_sequence_list){
    sequence_new_list.push(uint_sequence);
  }  
  return sequence_new_list;
}


async function mutate_callFun_uint_meaningful(call, callSequence, index) {
  let unum_diff = '0.0000001';
  /// unum_diff is not handled here, because it is relevant to multiple parameters
  /// generate a new call function
  let modify_result = await modify_callFun_uint_meaningful(call, unum_diff);
  if(modify_result[0]){
    /// callSequence itself is changed, not change at its copy 
    callSequence[index] = modify_result[1]; 
    return true;
  }
  else{
    return false;
  }
}

async function mutate_callFun_gas_meaningful(call, callSequence, index) {
  let gas_diff = '30.0';
  let modify_result = await modify_callFun_gas_meaningful(call, gas_diff);
  /// callSequence itself is changed, not change at its copy 
  if(modify_result[0]){
    callSequence[index] = modify_result[1]; 
    return true;
  }
  else{
    return false;
  }
}

async function mutate_callSequence(callSequence){
  let callSequence_new_set = new Set();
  let mutateSeque_index = 0;
  while(mutateSeque_index < mutateSeque_maxLen){
    /// copy the previous sequence, it would be modified
    let callSequence_new = callSequence.slice();
    let sequence_len = callSequence_new.length;
    let mutateOper_index = 0;
    while(mutateOper_index < mutateOper_maxLen){
      /// the location to mutate
      let sequence_index = randomNum(0, sequence_len);
      /// the type of mutation, e.g., add, delete, and modify
      let mutation_type = randomNum(0, 3);
      if(mutation_type == 0){
        /// add operation
        let operSeque_num = randomNum(0, operSeque_maxLen);
        let operSeque_index = 0;
        while(operSeque_index < operSeque_num){
          let abi_index = randomNum(0, g_cand_sequence.length);
          let abi = g_cand_sequence[abi_index];
          let callFun = await gen_callFun(abi);
          /// add the element
          callSequence_new.splice(sequence_index, 0, callFun);
          operSeque_index += 1;
        }
      }
      else if(mutation_type == 1){
        /// delete operation
        let operSeque_num = randomNum(0, operSeque_maxLen);
        /// delete operSeque_num element
        callSequence_new.splice(sequence_index, operSeque_num);     
      }
      else if(mutation_type == 2){
        /// modify operation
        let operSeque_num = randomNum(0, operSeque_maxLen);
        let operSeque_index = 0;
        while(operSeque_index < operSeque_num){
          let abi_index = randomNum(0, g_cand_sequence.length);
          let abi = g_cand_sequence[abi_index];
          let callFun = await gen_callFun(abi);
          /// replace the element
          callSequence_new.splice(sequence_index + operSeque_index, 1, callFun);
          operSeque_index += 1;
        }
      }
      mutateOper_index += 1;
    }
    callSequence_new_set.add(callSequence_new);
    mutateSeque_index += 1;
  }
  return callSequence_new_set;
}

async function insert_ownship(){
  await g_targetContract._jsonInterface.forEach(function(abi) {
    /// abi.constant == true would not change state variables
    if (abi.name == 'transferOwnship'){
      let call = {
        from: g_account_list[0],
        to: g_targetContract.address,
        abi: abi,
        gas: '1000000',
        param: [],
      }
      return call;
    }
  });
}

async function seed_callSequence() {
  let call_sequence = [];

  /// at least there are two calls
  let sequence_len = randomNum(2, sequence_maxLen);
  let sequence_index = 0;
  while (sequence_index < sequence_len){
    /// 0 <= call_index < g_cand_sequence.lengthaccount_list
    let abi_index = randomNum(0, g_cand_sequence.length);
    let abi = g_cand_sequence[abi_index];
    let callFun = await gen_callFun(abi);
    call_sequence.push(callFun);
    sequence_index += 1;
  }
  return call_sequence;
}

///Redeploy contract
async function redeploy(){
  console.log("redeploy......");
  g_targetContract = await g_targetContract.new({
        from: g_account_list[0],
        gas: 1500000,
        value: web3.utils.toWei("5", "ether")
     });
  g_attackContract = await g_attackContract.new(g_targetContract.address,{
      from: g_account_list[0],
      gas: 1500000,
      value: web3.utils.toWei("5", "ether")
     });
  console.log(g_targetContract.address);
}

/// for debugging
async function print_callSequence(calls_list){
  for(let calls of calls_list){
    console.log(calls);
  }
}

async function experiment_results(){
  g_endTime = new Date();
  g_timeDiff = Math.round((g_endTime - g_startTime) / 1000);
  console.log("elapsed time: " + g_timeDiff);
  let coverage_stmt = new Set();
  console.log(g_contr_depen_set);
  for(let contr_depen of g_contr_depen_set){
    let two_stmts = contr_depen.split('#');
    coverage_stmt.add(two_stmts[0]);
    coverage_stmt.add(two_stmts[1]);
  }
  let coverage_ratio = coverage_stmt.size / (g_attackStmt_set.size + g_targetStmt_set.size);
  console.log("coverage ratio: " + coverage_ratio);
}

async function internal_change(g_exec_results){
  if(g_exec_results[1] != g_exec_results[2]){
    return true;
  }
  else if(g_exec_results[3] != g_exec_results[4]){
    return true;
  }
  else if(g_exec_results[5] != g_exec_results[6]){
    return true;
  }
  else if(g_exec_results[7] != g_exec_results[8]){
    return true;
  }
  return false;
}


async function exec_sequence_call(){
  // console.log(g_sequence_call_list[0]);
  if(g_fuzzing_finish){
    /// for reentrancy
    // if (g_stmt_trace.length > 30)
      /// we finish the fuzzing
    return;
  }
  /// deal with the results of previous transaction
  /// mutate the function call, e.g., input, gas
  seque_depen_num_bf = g_seque_depen_set.size;
  /// add into the sequence dependencies
  for(let trans_depen of g_trans_depen_set){
    if (g_seque_depen_set.has(trans_depen) == false){
      g_seque_depen_set.add(trans_depen);
    }
  }
  seque_depen_num_af = g_seque_depen_set.size;
  console.log("seque before: " + seque_depen_num_bf + " seque after: " + seque_depen_num_af);
  console.log(g_seque_depen_set);
  if(seque_depen_num_af > seque_depen_num_bf){
    /// mutate the input and gas of the call
    /// g_sequence_executed, and g_sequeExe_index is still right
    let calls_new_list = await mutate_callFun(g_lastCall, g_sequence_executed, g_sequeExe_index -1);
    for(let calls_new of calls_new_list){
      g_sequence_call_list.push(calls_new);
    }    
    let callSequence_new_set = await mutate_callSequence(g_sequence_executed);
    for(let callSequence_new of callSequence_new_set){
      g_sequence_call_list.push(callSequence_new);
    }  
  }

  if(g_new_sequence_start){
    /// it a new call sequence, we consider the precious call sequence
    let contr_set_num_bf = g_contr_depen_set.size; 
    for(let seque_depen of g_seque_depen_set){
      if(g_contr_depen_set.has(seque_depen) == false){
        g_contr_depen_set.add(seque_depen);
      }
    }      
    let contr_set_num_af = g_contr_depen_set.size;
    if(contr_set_num_af > contr_set_num_bf){
      /// the call sequence generate new coverage, generate the new call sequence
      let callSequence_new_set = await mutate_callSequence(g_sequence_executed);
      for(let callSequence_new of callSequence_new_set){
        g_sequence_call_list.push(callSequence_new);
      }
    }

    /// start another statement trace, because another call sequence
    g_seque_stmt_trace = [];
    /// clear the coverage of call sequence, because we execute the new call sequence
    g_seque_depen_set.clear();
    g_sequeExe_meaningful = false;
    if(g_sequence_call_list.length != 0){
      /// the call sequence for the next execution
      g_sequence_executed = g_sequence_call_list[0].slice();
      g_sequeExe_index = 0;
      console.log("start another sequence.....");
    }
    else{
      g_fuzzing_finish = true;
      await experiment_results();
      console.log("fuzzing finish....");
      return;
    }
  }
  // console.log(g_sequence_call_list[0]);
  if(g_sequence_call_list.length !== 0){
    let sequence = g_sequence_call_list[0];
    let sequence_found = false;
    while(true){
      /// call sequence is empty, which may be generated by delete some calls
      if(sequence.length !== 0){
        sequence_found = true;
        break;
      }
      else{
        g_sequence_call_list.splice(0, 1);
        if(g_sequence_call_list.length != 0){
          /// start another statement trace, because another call sequence
          g_seque_stmt_trace = [];
          /// clear the coverage of call sequence, because we execute the new call sequence
          g_seque_depen_set.clear();
          g_sequeExe_meaningful = false;
          /// the call sequence for the next execution
          g_sequence_executed = g_sequence_call_list[0].slice();
          g_sequeExe_index = 0;
     
          sequence = g_sequence_call_list[0];
        }
        else{
          g_fuzzing_finish = true;
          experiment_results();
          console.log("fuzzing finish.....");
          return;
        }
      }
    }
    if(sequence_found){
      let call = sequence[0];
      g_lastCall = call;
      g_exec_results = await exec_callFun(call);
      if(g_exec_results === "found"){
        /// stop the running
        g_fuzzing_finish = true;
        experiment_results();
        console.log("fuzzing finish....");
      }
      else if(g_exec_results === "revert"){
        let mutate_gas_suc = await mutate_callFun_gas_meaningful(call, g_sequence_executed, g_sequeExe_index);
        if(mutate_gas_suc){
          g_sequeExe_meaningful = true;
        }    
        // if(g_exec_results[1] == g_exec_results[5] && g_exec_results[3] == g_exec_results[7]){
        //   /// here we use g_sequence_executed[g_sequeExe_index], because call is changed by its gas before
        //   let mutate_uint_suc = await mutate_callFun_uint_meaningful(g_sequence_executed[g_sequeExe_index], g_sequence_executed, g_sequeExe_index);
        //   if(mutate_uint_suc){
        //     g_sequeExe_meaningful = true;
        //   }  
        // } 
        g_exec_results = g_exec_results.slice(1);   
        /// sort is performed at the original array, not generate a new copy
        /// it is used in the mutate_callFun
        g_exec_results.sort(sortNumber);        
      }
      else {
        let status_change = await internal_change(g_exec_results);
        if(!status_change){
          /// here we use g_sequence_executed[g_sequeExe_index], because call is changed by its gas before
          let mutate_uint_suc = await mutate_callFun_uint_meaningful(call, g_sequence_executed, g_sequeExe_index);
          if(mutate_uint_suc){
            g_sequeExe_meaningful = true;
          }  
        } 
        g_exec_results = g_exec_results.slice(1);   
        /// sort is performed at the original array, not generate a new copy
        /// it is used in the mutate_callFun
        g_exec_results.sort(sortNumber);        
      }

      /// delete the call function
      sequence.splice(0, 1);
      /// g_sequeExe_index increase
      g_sequeExe_index += 1;
      g_new_sequence_start = false;
      if(sequence.length === 0){
        /// a call sequence is executed completely, delete the previous call sequence
        g_sequence_call_list.splice(0, 1);
        g_new_sequence_start = true;

        /// the g_sequence_executed becomes more meaningfule
        if(g_sequeExe_meaningful){
          /// we should use g_sequence_executed.slice
          /// because g_sequence_executed may be changer later
          /// we should add them into the front, because it is meaningful verson of last call sequence
          g_sequence_call_list.unshift(g_sequence_executed.slice());
        }
        else{
          /// the transferred money cannot be change, we generate another call sequence
          if(g_sequence_call_list.length <= 3){
            let callSequence_new_set = await mutate_callSequence(g_sequence_executed);
            for(let callSequence_new of callSequence_new_set){
              g_sequence_call_list.push(callSequence_new);
            }
          }
        }
        /// TODO maybe the parameters are wrong
        // if(g_reset_index >= g_reset_num){
        //   await redeploy();  
        //   g_reset_num = randomNum(0, 50);
        //   g_reset_index = 0;          
        // }
        // else{
        //   g_reset_index += 1;
        // }
      }
    }
  }
}


async function generateFunctionInputs_donate(abi) {

  let parameters = [];  
  await abi.inputs.forEach(function(param) {
    if (param.type == 'address') {
      // parameters.push(g_attackContract.address);
      parameters.push(g_account_list[0]);
    } else if (param.type == 'uint256') {
      // parameters.push(web3.utils.toWei('1', 'ether'));
      parameters.push("2000000000");
    } else {
     g_targetContract.address
     g_targetContract.address
    }g_targetContract.address
  });

  let call = {
    from: g_account_list[0],
    to: abi.name.indexOf('vultron_') !== -1 ? g_attackContract.address : g_targetContract.address,
    abi: abi,
    gas: '1000000',
    param: parameters,
  }
  return call;
}

async function generateFunctionInputs_withdraw(abi) {
  if (abi.constant) return;
  if (abi.type != 'function') return;

  let parameters = [];  
  await abi.inputs.forEach(function(param) {
    if (param.type == 'address') {
      parameters.push(g_attackContract.address);
    } else if (param.type == 'uint256') {
      // parameters.push(web3.utils.toWei('1', 'ether'));
      parameters.push("1000000000");
    } else {
      // default parameter
      parameters.push(0);
    }
  });

  let call = {
    from: g_account_list[0],
    to: abi.name.indexOf('vultron_') !== -1 ? g_attackContract.address : g_targetContract.address,
    abi: abi,
    gas: '1000000',
    param: parameters,
  }
  return call;
}

async function simple_callSequence() {
  let callFun_list = [];
  await g_cand_sequence.forEach(function(abi) {
    if (abi.name == 'setTaxes') {
      generateFunctionInputs_donate(abi).then(function(call) {
      callFun_list.push(call);
      })
    }
  });
  await g_cand_sequence.forEach(function(abi) {
    if (abi.constant || abi.type != 'function')
      return;

    if (abi.name == 'transfer') {
      generateFunctionInputs_withdraw(abi).then(function(call) {
      callFun_list.push(call);
      })
    }
  });
  return callFun_list;
}

module.exports.fuzz = fuzz;
module.exports.seed = seed;
module.exports.load = load;
module.exports.reset = reset;
module.exports.setProvider = setProvider;
module.exports.unlockAccount = unlockAccount;
module.exports.test_load = test_load;