#! /local/bin/babel-node
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

/// the file that used to keep exploit script
const g_exploit_path = "./exploit.txt";

/// json file
let g_target_artifact;
let g_attack_artifact
// truffle-contract abstractions
let g_targetContract;
let g_attackContract;

// web3 abstractions
let web3;
let Provider;
let g_account_list;
/// the bookkeeping variable abi
let g_bookKeepingAbi;

let g_attackStmt_set;
let g_targetStmt_set;
// tracer abstractions at instruction level
let g_attackIns_map;
let g_targetIns_map;
// static dependency
let g_staticDep_attack;
let g_staticDep_target;

/// the gas amount
const gasMax = 8000000000;
/// dynamci array
const dyn_array_min = 1;
const dyn_array_max = 5;
/// the maximum length of seed_callSequence
const sequence_maxLen = 4;

/// the call sequence to be executed
let g_callSequen_list = [];
/// another new call seqeunce
let g_callSequen_start = false;

/// the current executed call, don't initialized because it is assigned again
/// we will mutate the inputs of this call function 
let g_lastCall_exec;
/// the current index in g_callSequen_cur, it corresponds to "g_lastCall_exec"
let g_callIndex_cur = 0;
/// the executed call sequence
let g_callSequen_cur = [];
/// the trace of a transaction
let g_trans_stmt_trace = [];
/// the trace of a call sequence
let g_sequen_stmt_trace = [];
/// the key is i^th call in sequence, the value is read/write variable
let g_stmt_read_map = new Map();
let g_stmt_write_map = new Map();
/// the set of dynamic dependencies in a call sequence
let g_sequen_depen_set = new Set();
/// the set of all dynamic dependencies in this contract until now
let g_contra_depen_set = new Set();

/// the hash of previous transactions
let g_pre_txHash_set = new Set();
let g_startTime, g_endTime;
let g_timeDiff;

/// the current call that is executed
let g_callFun_cur;
/// the candidate abi that can be used to start transaction
let g_cand_sequence = [];
let g_fuzzing_finish = false;

/// the account pools
let g_from_account;
function unlockAccount(){
  /// it is initialized by the blockchain, 
  /// for example, /home/hjwang/Tools/SCFuzzer/test_geth/data/keystore
  g_account_list = web3.eth.accounts;
  g_from_account = g_account_list[0];
  /// unlock initial user, which is also miner account
  web3.personal.unlockAccount(g_from_account, "123", 200 * 60 * 60);
}

function setProvider(httpRpcAddr){
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
async function load(targetPath, attackPath, targetSolPath, attackSolPath) {
  g_attackContract = await get_instance(attackPath);
  g_targetContract = await get_instance(targetPath);
  g_attack_artifact = require(attackPath);
  g_target_artifact = require(targetPath);
  /// add the attack contract address
  g_account_list.push(g_attackContract.address);

  /// find bookkeeping variable
  // g_bookKeepingAbi = await findBookKeepingAbi(g_targetContract.abi);

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
  g_staticDep_attack = await tracer.buildStaticDep(attackSolPath);
  g_staticDep_target = await tracer.buildStaticDep(targetSolPath);

  /// clear the exploit script
  if(fs.existsSync(g_exploit_path)){
    fs.unlinkSync(g_exploit_path);
  }

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
  let callFun_list = await seed_callSequence();

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

/// it will be executed after each transaction is executed
async function fuzz(txHash, ins_trace) {
  const getTransaction = Promise.promisify(web3.eth.getTransaction);

  if (g_attackContract === undefined) {
    throw "Attack contract is not loaded!";
  }
  if (g_targetContract === undefined) {
    throw "Target contract is not loaded!";
  }

  /// different transaction hash code, it is a string
  if(!g_pre_txHash_set.has(txHash)){
    /// store current txHash as previous txHash
    g_pre_txHash_set.add(txHash);

    mutex.lock(async function() {
      try{
        /// this is used to get the input of transaction 
        // let transObj = await getTransaction(txHash);
        // console.log("receive: "+ transObj.input);
     
        /// when attack_target == 0, it is on attack contract
        /// when attack_target == 1, it is on target contract
        var attack_target = 0;
        /// ins_trace is the instrcution trace
        /// g_stmt_trace is list of line nunmber trace
        if(g_callFun_cur.to == g_targetContract.address){
          attack_target = 1;
        }
        g_trans_stmt_trace = await tracer.buildTraceMap(ins_trace,
                                                        g_attackIns_map,
                                                        g_targetIns_map,
                                                        attack_target);
        /// the read/write variable in this transaction
        /// we use it to switch the order of sequence
        var WR_set = await tracer.buildWRSet(g_trans_stmt_trace,
                                             g_staticDep_attack,
                                             g_staticDep_target);
        g_stmt_write_map[g_callIndex_cur -1] = WR_set[0];
        g_stmt_read_map[g_callIndex_cur -1] = WR_set[1];
        console.log(WR_set[0]);
        console.log(WR_set[1]);

        /// concate the transaction tract into sequence trace
        g_sequen_stmt_trace = g_sequen_stmt_trace.concat(g_trans_stmt_trace);
        /// the dynamic dependencies in the g_stmt_trace
        g_sequen_depen_set = await tracer.buildDynDep(g_sequen_stmt_trace,
                                                      g_staticDep_attack,
                                                      g_staticDep_target);
        /// before executing next transaction, we first mutate the just executed transaction
        await determine_funMutation();
        await determine_sequenMutation();
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

async function find() {
  if (g_targetContract === undefined) {
    throw "Target contract is not loaded!";
  }

  let cand_bookkeeping = await findBookkeepingVars(g_targetContract.abi);
  if (!cand_bookkeeping.length) {
    throw "Cannot find any bookkeeping variables!";
  }

  // Retrieve the list of payable functions
  let payableABI_list = await getPayableFuns(g_targetContract.abi);
  try {
    for (abi of payableABI_list) {
      var abi_pair = [abi, g_targetContract.address];
      let callFun = await gen_callFun(abi_pair);
      console.log(callFun);
      var abiName = abi.name || 'fallback';
      console.log('Searching in ' + abiName + ' function');
      await exec_callPayFun(callFun, cand_bookkeeping);
      console.log(abi)
      if (g_bookKeepingAbi) break;
    }
  }
  catch (e) {
    console.log(e);
  }

  var execResult_list = "successful!";
  return {
    execResults: execResult_list,
    callFun: abiName,
    bookkeepingVar: g_bookKeepingAbi.name
  };
}

// async function reset() {
//   if (g_targetContract === undefined) {
//     throw "Target contract is not loaded!";
//   }
//   if (g_attackContract === undefined) {
//     throw "Attack contract is not loaded!";
//   }
//   // await resetBookKeeping();
//   await redeploy();
//   return "Contracts are reset!";
// }

// ///Redeploy contract
// async function redeploy(){
//   console.log("redeploy......");
//   g_targetContract = await g_targetContract.new({
//         from: g_account_list[0],
//         gas: 1500000,
//         value: web3.utils.toWei("5", "ether")
//      });
//   g_attackContract = await g_attackContract.new(g_targetContract.address,{
//       from: g_account_list[0],
//       gas: 1500000,
//       value: web3.utils.toWei("5", "ether")
//      });
//   console.log(g_targetContract.address);
// }

// /// for debugging
// async function print_callSequence(calls_list){
//   for(let calls of calls_list){
//     console.log(calls);
//   }
// }

/// reset bookkeeping variable
// async function resetBookKeeping() {
//   for (let account of g_account_list) {
//     g_targetContract.methods._vultron_reset(account).call();
//   }
//   g_targetContract.methods._vultron_reset(g_attackContract.address).call();
// }


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

/// add all the functions into the g_cand_sequence, then use g_cand_sequence to generate the call sequence
async function findCandSequence(target_abis, attack_abis){
  /// the switch to decide whether we add the functions in target/attack contracts into to g_cand_sequence
  var attack_switch = true;
  var target_switch = true;

  if(attack_switch){
    await attack_abis.forEach(function(abi) {
      if (abi.type === 'function' && abi.constant == false){
        let notsupport = false;

        let input_index = 0;
        let input_len = abi.inputs.length;
        while(input_index < input_len){
          var input = abi.inputs[input_index];
          /// at present, we only support the types of "address", "uint*", and "int*"
          if(input.type.indexOf('address') !== 0 && input.type.indexOf('uint') !== 0 && input.type.indexOf('int') !== 0){
            notsupport = true;
            break;
          }
          input_index += 1;
        }
        if(!notsupport){
          var abi_pair = [abi, g_attackContract.address]
          g_cand_sequence.push(abi_pair);
        }
      }
    }); 
  }

  if(target_switch){
    await target_abis.forEach(function(abi) {
      /// if abi.constant is true, it would not change state variables
      /// thus, it may not be a transaction if we call it
      if (abi.type === 'function' && abi.constant == false){
        let notsupport = false;

        let input_len = abi.inputs.length;
        let input_index = 0;
        while(input_index < input_len){
          var input = abi.inputs[input_index];
          /// at present, we only support the types of "address", "uint*", and "int*"
          if(input.type.indexOf('address') !== 0 && input.type.indexOf('uint') !== 0 && input.type.indexOf('int') !== 0){
            notsupport = true;
            break;
          }
          input_index += 1;
        }
        if(!notsupport){
          var abi_pair = [abi, g_targetContract.address]
          g_cand_sequence.push(abi_pair);
        }
      }
    }); 
  }
}

/// get the balance of given address in the bookkeeping variable
async function getBookBalance(acc_address, bookkeepingVar = g_bookKeepingAbi){
  let balance = BigInt(0);
  let encode = abiCoder.encodeFunctionCall(bookkeepingVar, [acc_address]);
  await web3.eth.call({
                      to: g_targetContract.address,
                      data: encode},
                      function(err, result) {
                        if (!err) {
                          if (abiCoder.utils.isHex(result)){
                            balance += abiCoder.utils.toBN(result);
                          }
                        }
                      });
  return BigInt(balance);
}

/// get the sum of bookkeeping variable
async function getBookSum(bookkeepingVar = g_bookKeepingAbi) {
  let sum = BigInt(0);
  for (let account of g_account_list) {
    let account_bal = await getBookBalance(account, bookkeepingVar);
    /// only the BigInt can be added safely
    sum += BigInt(account_bal);
  }
  return sum;
}

// get the sum of each bookkeeping variable candidate
async function getAllBooksSum (cand_bookkeeping) {
  var books_sum = [];
  for (book_var of cand_bookkeeping) {
    var sum = await getBookSum(book_var);
    books_sum.push({ name: book_var.name, value: sum });
    console.log(book_var.name, sum);
  }
  return books_sum;
}


const writeExploit = (callSequen_cur) => {
  var call_str = "";
  let call_index = 0;
  /// g_callIndex_cur is current index in call sequence
  while(call_index < g_callIndex_cur){
    var call_cur = callSequen_cur[call_index];
    call_str = call_str + call_cur.name + "  "; 
    call_index += 1;
  }
  call_str += "\n";
  fs.appendFileSync(g_exploit_path, call_str);
}


/// execute the call and generate the transaction
async function exec_callFun(call, callSequen_cur){
  /// used to identify the first statement is attack or target contract
  g_callFun_cur = call;

  let attack_bal_bf = await web3.eth.getBalance(g_attackContract.address);
  let attack_bal_acc_bf = await getBookBalance(g_attackContract.address);
  let target_bal_bf = await web3.eth.getBalance(g_targetContract.address);
  let target_bal_sum_bf = await getBookSum();

  console.log(call.abi.name);
  /// use to get the input of sent transaction
  /// compare to the received transaction in fuzz module
  // console.log("send: " + abiCoder.encodeFunctionCall(call.abi, call.param));

  let tx_hash;
  try{
    await web3.eth.sendTransaction({ from: call.from,
                                     to: call.to, 
                                     gas: call.gas,                               
                                     data: abiCoder.encodeFunctionCall(call.abi, call.param)
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
 
  let attack_bal_af = await web3.eth.getBalance(g_attackContract.address);
  let attack_bal_acc_af = await getBookBalance(g_attackContract.address);
  let target_bal_af = await web3.eth.getBalance(g_targetContract.address);
  let target_bal_sum_af = await getBookSum();
   
  try{ 
    if((BigInt(uintToString(target_bal_bf)) - BigInt(target_bal_sum_bf)) != (BigInt(uintToString(target_bal_af)) - BigInt(target_bal_sum_af))){
      throw "Balance invariant is not held....";
    }
    if((BigInt(uintToString(attack_bal_af)) - BigInt(uintToString(attack_bal_bf))) != (BigInt(attack_bal_acc_bf) - BigInt(attack_bal_acc_af))){
      throw "Transaction invariant is not held....";
    }
  }
  catch(e){
    writeExploit(callSequen_cur);
    return "Oracles are violated!";
  }
}

async function exec_callPayFun(call, cand_bookkeeping){
  var target_bal_sum_bf = await getAllBooksSum(cand_bookkeeping);
  var tx_value = 10e18;

  let tx_hash;
  try {
    const transactionConfig = {
      from: call.from,
      to: call.to,
      abi: call.abi,
      gas: '1000000',
      value: tx_value
    };

    if (call.param) {
      transactionConfig['data'] =  abiCoder.encodeFunctionCall(call.abi, call.param);
    }

    console.log(transactionConfig);
    await web3.eth.sendTransaction(
      transactionConfig,
      function (error, hash) {
        if (!error) {
          tx_hash = hash;
          console.log(hash)
        } else {
          console.log(error);
        }
      }
    );
  } catch(e) {
    console.log(e);
  }

  var target_bal_sum_af = await getAllBooksSum(cand_bookkeeping);
  console.log(target_bal_sum_af)
  for (book_var_af of target_bal_sum_af) {
    var book_var_bf = target_bal_sum_bf.find(obj => (obj.name === book_var_af.name));
    if (BigInt(book_var_af.value) - BigInt(book_var_bf.value) == BigInt(tx_value))
    {
      g_bookKeepingAbi = cand_bookkeeping.find(obj => (obj.name === book_var_af.name));
      console.log('\nThe bookkeeping variable \'' + g_bookKeepingAbi.name +'\' is found');
      return;
    }
  }
  return 'No bookkeeping variables found!';
}

/// synthesize the initial call sequence
async function seed_callSequence() {
  var call_sequence = [];
  /// the set of call that has been selected
  var added_set = new Set();
  var sequence_len = randomNum(1, sequence_maxLen);
  var sequence_index = 0;
  while (sequence_index < sequence_len){
    /// 0 <= call_index < g_cand_sequence.length
    var abi_index = randomNum(0, g_cand_sequence.length);
    /// we select the function in call_sequence without duplicates
    var abi_index_orig = abi_index;
    while(added_set.has(abi_index)){
      if(abi_index >= g_cand_sequence.length){
        break;
      }
      abi_index = abi_index +1;
    }
    if(abi_index >= g_cand_sequence.length){
      abi_index = abi_index_orig -1;
      while(added_set.has(abi_index)){
        if(abi_index < 0){
          break;
        }
        abi_index = abi_index -1;
      }
    }
    if(abi_index < 0){
      break;
    }
    var abi_pair = g_cand_sequence[abi_index];
    added_set.add(abi_index);
    var callFun = await gen_callFun(abi_pair);
    call_sequence.push(callFun);

    sequence_index += 1;
  }
  /// we only generate a call sequence
  return call_sequence;
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
/// if it is primitive type, e.g., address, we use the attack contract address
function gen_address(adds_type){
  /// returns -1, if the value to search for never occurs
  if(adds_type.indexOf('[') == -1){
    /// primitive type
    let account = g_attackContract.address
    return account;
  }
  else if(adds_type.indexOf('[]') != -1){
    /// dynamic array
    let adds_list = [];
    let adds_index = 0;
    let adds_num = randomNum(dyn_array_min, dyn_array_max);
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
  let index = num_str.indexOf("+");
  /// it is a scientific number
  if(index != -1){
    let result = num_str[0];
    /// donot need BigInt, because it is not very big
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
    var big_result = BigInt(result);
    var hex_result = big_result.toString(16);
    var hex_result = "0x" + hex_result;
    return hex_result;
  }
  else{
    var big_result = BigInt(num_str);
    var hex_result = big_result.toString(16);
    var hex_result = "0x" + hex_result;
    return hex_result;
  }
}

/// generate the maximum uint number
function gen_uintMax(uint_type){
  /// get rid of uint in e.g., 'uint256'
  let num_left = 4;
  /// maybe it is an array, e,g., 'uint256[]'
  let num_right = uint_type.indexOf('[');
  if(num_right == -1){
    /// it is primitive unit, not an array
    num_right = uint_type.length;
  } 
  /// the number of bytes
  let byte_num;
  if(num_left < num_right){
    byte_num = parseInt(uint_type.slice(num_left, num_right), 10) / 8;
  }
  else{
    /// uint is equivelant to uint256
    byte_num = 32;
  }

  let num_str = '0x';
  let byte_index = 0;
  while(byte_index < byte_num){
    num_str += 'ff';
    byte_index += 1;
  }
  /// don't use BigInt, because it is used in late, BigInt only be used with BigInt
  var unum_max = parseInt(num_str);
  return unum_max; 
}

/// generate the maximum int number
function gen_intMax(int_type){
  /// get rid of int in e.g., 'int256'
  let num_left = 4;
  /// maybe it is an array, e,g., 'uint256[]'
  let num_right = int_type.indexOf('[');
  if(num_right == -1){
    /// it is primitive int, not an array
    num_right = int_type.length;
  } 
  /// the number of bytes
  let byte_num;
  if(num_left < num_right){
    byte_num = parseInt(int_type.slice(num_left, num_right), 10) / 8;
  }
  else{
    byte_num = 32;
  }
  /// the first bit is sign (+, -) bit
  let num_str = '0x7f';
  /// start from 1, because the first byte has been appended
  let byte_index = 1;
  while(byte_index < byte_num){
    num_str += 'ff';
    byte_index += 1;
  }
  /// don't use BigInt, because it is used in late, BigInt only be used with BigInt
  var num_max = parseInt(num_str);
  return num_max; 
}

/// generate the maximum int number
function gen_intMin(int_type){
  /// get rid of uint in e.g., 'uint256'
  let num_left = 4;
  /// maybe it is an array, e,g., 'uint256[]'
  let num_right = int_type.indexOf('[');
  if(num_right == -1){
    /// it is primitive int, not an array
    num_right = int_type.length;
  } 
  /// the number of bytes
  let byte_num;
  if(num_left < num_right){
    byte_num = parseInt(int_type.slice(num_left, num_right), 10) / 8;
  }
  else{
    byte_num = 32;
  }

  let num_str = '-0x7f';
  /// start from 1, because the first byte has been appended
  let byte_index = 1;
  while(byte_index < byte_num){
    num_str += 'ff';
    byte_index += 1;
  }
  /// don't use BigInt, because it is used in late, BigInt only be used with BigInt
  var num_min = parseInt(num_str);
  return num_min; 
}

/// generate an singed integer
/// num_min and num_max may not be defined, e.g., undefined
function gen_int(int_type, num_min, num_max){
  var intMin = gen_intMin(int_type);
  if(num_min === undefined){
    /// num_min is undefined, we use the default minimum value
    num_min = intMin; 
  }
  else{
    if(intMin > num_max){
      num_min = intMin;
    }
  }   
  var intMax = gen_intMax(int_type);
  if(num_max === undefined){
    /// num_max is undefined, we use the default maximum value
    num_max = intMax; 
  }
  else{
    if(intMax < num_max){
      num_max = intMax;
    }
  } 
  if(int_type.indexOf('[') == -1){
    /// primitive type
    let value_int = randomNum(num_min, num_max);
    let value = uintToString(value_int);
    return value;
  }
  else if(int_type.indexOf('[]') != -1){
    /// dynamic array
    let value_list = [];
    let value_num = randomNum(dyn_array_min, dyn_array_max);
    let value_index = 0;
    while(value_index < value_num){
      let value_int = randomNum(num_min, num_max);
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
      let value_int = randomNum(num_min, num_max);
      let value = uintToString(value_int);
      value_list.push(value);
      value_index += 1;
    }
    return value_list;
  }
}

/// generate an unsigned integer
/// unum_min is defined, in most case it is 0
/// unum_max may not be defined, e.g., undefined
function gen_uint(uint_type, unum_min, unum_max){
  var uintMax = gen_uintMax(uint_type);
  if(unum_min == undefined){
    unum_min = uintMax;
  }
  else{
    if(unum_min < 0){
      unum_min = 0;
    }
  }
  if(unum_max == undefined){
    /// unum_max is undefined, we use the default maximum value
    unum_max = uintMax; 
  }
  else{
    if(uintMax < unum_max){
      unum_max = uintMax;
    }
  } 
  if(uint_type.indexOf('[') == -1){
    /// primitive type
    let value_int = randomNum(unum_min, unum_max);
    let value = uintToString(value_int);
    return value;
  }
  else if(uint_type.indexOf('[]') != -1){
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
async function gen_callInput(abi, unum_min, unum_max, num_min, num_max) {
  let param_list = [];  
  await abi.inputs.forEach(function(param) {
    if (param.type.indexOf('address') == 0) {
      let adds_param = gen_address(param.type);
      param_list.push(adds_param);
    }
    else if (param.type.indexOf('uint') == 0){
      /// uint type, its minimu is '0'
      let uint_param = gen_uint(param.type, unum_min, unum_max);
      param_list.push(uint_param);
    }
    else if(param.type.indexOf('int') == 0){
      /// int type
      let int_param = gen_int(param.type, num_min, num_max);
      param_list.push(int_param);
    }
    else {      
      // default parameter
      console.log("not support data type...");
      param_list.push(0);
    }
  });
  return param_list;
}

/// generate a call function based on the existing call
/// we mutate the input on the lastCall_exec
async function modify_input_range(lastCall_exec, num_min, num_max) {
  let param_list = []; 
  let param_changed = false; 

  let input_index = 0;
  let input_len = lastCall_exec.abi.inputs.length;
  /// we mutate all inputs that satisfy conditions
  while(input_index < input_len){
    let param = lastCall_exec.abi.inputs[input_index];
    if (param.type.indexOf('uint') == 0){
      if(num_min >= 0){
        let uint_param = gen_uint(param.type, num_min, num_max);
        param_list.push(uint_param);
        param_changed = true;
      }
      else{
        // use the original input
        param_list.push(lastCall_exec.param[input_index]);        
      }
    }
    else if(param.type.indexOf('int') == 0){
      let int_param = gen_int(param.type, num_min, num_max);
      param_list.push(int_param);
      param_changed = true;
    }
    else {      
      // use the original input
      param_list.push(lastCall_exec.param[input_index]);
    }    
    input_index += 1;
  }

  if(param_changed){
    let callFun = {
      from: lastCall_exec.from,
      to: lastCall_exec.to,
      abi: lastCall_exec.abi,
      gas: lastCall_exec.gas,
      param: param_list
    }
    return callFun;
  }
  else{
    return undefined;
  }
}

async function modify_input_point(lastCall_exec, num) {
  let param_list = []; 
  let param_changed = false; 
  let input_len = lastCall_exec.abi.inputs.length;
  let input_index = 0;
  while(input_index < input_len){
    let param = lastCall_exec.abi.inputs[input_index];
    if (param.type.indexOf('uint') == 0){
      if(num >= 0){
        /// it generate the num number
        let uint_param = gen_uint(param.type, num, num);
        param_list.push(uint_param);
        param_changed = true;
      }
      else{
        // use hte original input
        param_list.push(lastCall_exec.param[input_index]);
      }
    }
    else if(param.type.indexOf('int') == 0){
      let int_param = gen_int(param.type, num, num);
      param_list.push(int_param);
      param_changed = true;
    }
    else {      
      // use hte original input
      param_list.push(lastCall_exec.param[input_index]);
    }    
    input_index += 1;
  }

  if(param_changed){
    let callFun = {
      from: lastCall_exec.from,
      to: lastCall_exec.to,
      abi: lastCall_exec.abi,
      gas: lastCall_exec.gas,
      param: param_list
    }
    return callFun;
  }
  else{
    return undefined;
  }
}


async function gen_callGasMax(){
  var gas_limit = uintToString(gasMax);
  return gas_limit;
}


/// generate a call function based on the abi
async function gen_callFun(abi_pair) {
  /// the first (0, undefined) for uint
  /// the second (undefined, undefined) for int
  let parameters = await gen_callInput(abi_pair[0], 0, undefined, undefined, undefined);
  let gasLimit = await gen_callGasMax();
  let callFun = {
    /// g_account_list[0] is the initial account, which is also a miner account
    from: g_account_list[0],
    to: abi_pair[1],
    abi: abi_pair[0],
    gas: gasLimit,
    param: parameters
  }
  return callFun;
}

/// mutate the uint based on previous balances
async function mutate_balance(lastCall_exec, callSequen_cur, lastCall_index){
  let bal_callSequen_list = [];

  /// add the dynamic contract states into "dynamic_state_list" and sort it by increasement
  let dynamic_state_list = [];
  let attack_bal = await web3.eth.getBalance(g_attackContract.address);
  dynamic_state_list.push(BigInt(uintToString(attack_bal)));
  let target_bal = await web3.eth.getBalance(g_targetContract.address);
  dynamic_state_list.push(BigInt(uintToString(target_bal)));
  for (let account of g_account_list) { 
    let account_bal = await getBookBalance(account);
    dynamic_state_list.push(account_bal);
  }
  let target_bal_sum = await getBookSum();
  dynamic_state_list.push(target_bal_sum);
  dynamic_state_list.sort(sortNumber);

  let exec_index = 0;  
  let dyn_state_len = dynamic_state_list.length;
  /// we use "<=", because we also generate value greater than the last element
  while(exec_index <= dyn_state_len){
    let unum_min, unum_max;
    
    /// we generate the range where we produce a number
    if(exec_index == 0){
      unum_min = 0;
    }
    else{
      unum_min = parseInt(dynamic_state_list[exec_index -1]);
    }
    if(exec_index == dyn_state_len){
      unum_max = undefined;
    }
    else{
      unum_max = parseInt(dynamic_state_list[exec_index]);
    }   

    /// mutate lastCall_exec and generate the new calls
    let callFun = await modify_input_range(lastCall_exec, unum_min, unum_max);
    if(callFun !== undefined){
      /// clone the call sequence
      let bal_callSequen = callSequen_cur.slice();
      /// replace the given function
      bal_callSequen[lastCall_index] = callFun;
      bal_callSequen_list.push(bal_callSequen);
    }
    callFun = await modify_input_point(lastCall_exec, unum_max);
    if(callFun !== undefined){
      /// clone the call sequence
      let bal_callSequen = callSequen_cur.slice();
      /// replace the given function
      bal_callSequen[lastCall_index] = callFun;
      bal_callSequen_list.push(bal_callSequen);
    }
    exec_index += 1;
  }
  return bal_callSequen_list;  
}

/// In addition to mutation based on balance, we alos randomely generate some values
async function mutate_uint(lastCall_exec, callSequen_cur, lastCall_index){
  let uint_callSequen_list = [];

  /// the list used to mutate
  let uint_range_list = [];
  uint_range_list.push(0);
  uint_range_list.push(10000000000000);
  /// 1 ether
  uint_range_list.push(1000000000000000000);
  /// 10 ether
  uint_range_list.push(10000000000000000000);

  let uint_range_len = uint_range_list.length;
  /// we start from 1, because we generate value in the range
  let exec_index = 1;  
  while(exec_index < uint_range_len){
    let unum_min = parseInt(uint_range_list[exec_index -1]);
    let unum_max = parseInt(uint_range_list[exec_index]);
    /// mutate lastCall_exec and generate the new calls
    let callFun = await modify_input_range(lastCall_exec, unum_min, unum_max);
    if(callFun !== undefined){
      /// clone the call sequence
      let uint_callSequen = callSequen_cur.slice();
      /// replace the given function
      uint_callSequen[lastCall_index] = callFun;
      uint_callSequen_list.push(uint_callSequen);
    }
    exec_index += 1;
  }
  return uint_callSequen_list; 
}


/// In addition to mutation based on balance, we alos randomely generate some values
async function mutate_int(lastCall_exec, callSequen_cur, lastCall_index){
  let int_callSequen_list = [];

  /// the list used to mutate
  let int_range_list = [];
  int_range_list.push(-1000000);
  int_range_list.push(-1000);
  int_range_list.push(0);
  int_range_list.push(10000000000000);
  /// 1 ether
  int_range_list.push(1000000000000000000);
  /// 10 ether
  int_range_list.push(10000000000000000000);

  let int_range_len = int_range_list.length;
  /// we start from 1, because we generate value in the range
  let exec_index = 1;  
  while(exec_index < int_range_len){
    let num_min = parseInt(int_range_list[exec_index -1]);
    let num_max = parseInt(int_range_list[exec_index]);
    /// mutate lastCall_exec and generate the new calls
    let callFun = await modify_input_range(lastCall_exec, num_min, num_max);
    if(callFun !== undefined){
      /// clone the call sequence
      let int_callSequen = callSequen_cur.slice();
      /// replace the given function
      int_callSequen[lastCall_index] = callFun;
      int_callSequen_list.push(int_callSequen);
    }
    exec_index += 1;
  }
  return int_callSequen_list; 
}

async function mutate_callFun(lastCall_exec, callSequen_cur, lastCall_index) {
  let callSequen_new_list = [];
  /// mutate the input based on the contract states
  let bal_callSequen_list = await mutate_balance(lastCall_exec, callSequen_cur, lastCall_index);
  for(let bal_callSequen of bal_callSequen_list){
    callSequen_new_list.push(bal_callSequen);
  }
  /// In addition to mutation based on balance, we alos randomely generate some values
  let uint_callSequen_list = await mutate_uint(lastCall_exec, callSequen_cur, lastCall_index);
  for(let uint_callSequen of uint_callSequen_list){
    callSequen_new_list.push(uint_callSequen);
  }  
  /// In addition to mutation based on balance, we alos randomely generate some values
  let int_callSequen_list = await mutate_int(lastCall_exec, callSequen_cur, lastCall_index);
  for(let int_callSequen of int_callSequen_list){
    callSequen_new_list.push(int_callSequen);
  }  
  return callSequen_new_list;
}

/// we switch the order of call sequence
async function mutate_callOrder(callSequen_cur, call_index, callIndex_cur){
  var callSequen_new = callSequen_cur.slice();
  var call_switch = callSequen_new[call_index];
  callSequen_new[call_index] = callSequen_new[callIndex_cur];
  callSequen_new[callIndex_cur] = call_switch;
  console.log("switch order: ");
  print_callSequen(callSequen_new);
  return callSequen_new;
}

/// we switch the order for the added call 
async function mutate_callOrder_add(callSequen_cur, call_index, callIndex_cur){
  /// we don't need to slice the callSequen_cur, because we doesn't keep the original
  var call_switch = callSequen_cur[call_index];
  callSequen_cur[call_index] = callSequen_cur[callIndex_cur];
  callSequen_cur[callIndex_cur] = call_switch;
  return callSequen_cur;
}

/// we add a function into call sequence
async function mutate_callSequen(callSequen_cur){
  var callSequen_new = callSequen_cur.slice();

  /// identify which candidate call has been added
  var added_set = new Set();
  var cand_call_index = 0;
  var cand_call_len = g_cand_sequence.length;
  while(cand_call_index < cand_call_len){
    var cand_call = g_cand_sequence[cand_call_index][0];
    for(var call_new of callSequen_new){
      if(cand_call.name == call_new.abi.name){
        added_set.add(cand_call_index);
      }
    }
    cand_call_index++;
  }

  /// 0 <= call_index < g_cand_sequence.length
  var abi_index = randomNum(0, g_cand_sequence.length);
  /// we select the function in call_sequence without duplicates
  var abi_index_orig = abi_index;
  while(added_set.has(abi_index)){
    if(abi_index >= g_cand_sequence.length){
      break;
    }
    abi_index = abi_index +1;
  }
  if(abi_index >= g_cand_sequence.length){
    abi_index = abi_index_orig -1;
    while(added_set.has(abi_index)){
      if(abi_index < 0){
        break;
      }
      abi_index = abi_index -1;
    }
  }
  if(abi_index < 0){
    return undefined;
  }

  var abi_pair = g_cand_sequence[abi_index];
  var callFun = await gen_callFun(abi_pair);
  callSequen_new.push(callFun);

  var insert_index = randomNum(0, callSequen_new.length);
  callSequen_new = mutate_callOrder_add(callSequen_new, insert_index, callSequen_new.length -1)
  return callSequen_new;
}

/// use to mutate input of a function
async function determine_funMutation(){
  var depen_new_found = false;
  for(var sequen_depen of g_sequen_depen_set){
    if(!g_contra_depen_set.has(sequen_depen)){
      g_contra_depen_set.add(sequen_depen);
      depen_new_found = true;
    }
  }

  if(depen_new_found){
    /// mutate the input of last call
    let callSequen_new_list = await mutate_callFun(g_lastCall_exec, g_callSequen_cur, g_callIndex_cur -1);
    for(let callSequen_new of callSequen_new_list){
      g_callSequen_list.push(callSequen_new);
    }  
  }
}

/// used to mutate the order of call sequence
async function determine_sequenMutation(){
  var call_index = 0;
  /// whether we switch the order of call sequence
  var write_set_cur = g_stmt_write_map[g_callIndex_cur -1];
  while(call_index < g_callIndex_cur -1){
    var switch_order = false;
    var trans_read_set = g_stmt_read_map[call_index];
    for(var read_var of trans_read_set){
      if(write_set_cur.has(read_var)){
        switch_order = true;
        break;
      }
    }
    /// we switch the order of sequence
    if(switch_order){
      let callSequen_new = await mutate_callOrder(g_callSequen_cur, call_index, g_callIndex_cur -1);
      g_callSequen_list.push(callSequen_new);
    }
    call_index += 1;
  }

  /// we add more call function into this sequence
  /// we only do it when previous call sequence has been finished
  if(g_callSequen_start){
    callSequen_new = await mutate_callSequen(g_callSequen_cur);
    if(callSequen_new !== undefined){
      g_callSequen_list.push(callSequen_new);
    }
  }
}

async function print_callSequen_list(){
  for(var callSequen of g_callSequen_list){
    var call_name = "";
    for(var call of callSequen){
      call_name = call_name + "#" + call.abi.name;
    }
    console.log(call_name);
  }
}

async function print_callSequen(callSequen){
  var call_name = "";
  for(var call of callSequen){
    call_name = call_name + "#" + call.abi.name;
  }
  console.log(call_name);
}

async function exec_sequence_call(){
  /// we can finish the fuzzing anytime
  if(g_fuzzing_finish){
    return;
  }

  /// initialization for the new call sequence
  if(g_callSequen_start){
    if(g_callSequen_list.length != 0){
      /// the call sequence for the next execution
      g_callSequen_cur = g_callSequen_list[0].slice();

      console.log("executed call sequen: ");
      print_callSequen(g_callSequen_cur);
      /// delete the first callSequen
      g_callSequen_list.splice(0, 1);
      /// the current index in g_callSequen_cur
      g_callIndex_cur = 0;
      /// the trace of a transaction
      g_trans_stmt_trace = [];
      /// start another statement trace, because another call sequence
      g_sequen_stmt_trace = [];
      g_stmt_read_map.clear();
      g_stmt_write_map.clear();
      /// clear dynamic dependencies in call sequence, because we execute the new call sequence
      g_sequen_depen_set.clear();
      /// we did not clear g_contra_depen_set
      g_callSequen_start = false;
    }
    else{
      g_fuzzing_finish = true;
      return;
    }
  }
 
  /// execute the transaction
  if(g_callIndex_cur < g_callSequen_cur.length){
    var curCall = g_callSequen_cur[g_callIndex_cur];
    await exec_callFun(curCall, g_callSequen_cur);
    g_lastCall_exec = curCall;
    g_callIndex_cur = g_callIndex_cur +1;
    /// the current call sequence is executed completely
    if(g_callIndex_cur == g_callSequen_cur.length){
      g_callSequen_start = true;
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

async function getPayableFuns(abis) {
  let cand_functions = [];
  await abis.forEach(function(abi) {
    /// abi.constant == true would not change state variables
    if ((abi.type === 'function' || abi.type === 'fallback') && !abi.constant && abi.payable) {
      if (!abi.inputs)
        abi['inputs'] = [];
      cand_functions.push(abi);
    }
  });
  return cand_functions.sort((a, b) => a.type.localeCompare(b.type));
}

async function findBookkeepingVars(abis) {
  let cand_bookkeeping = [];
  for (var abi of abis) {
    if (abi.type === 'function' && abi.constant &&
      abi.inputs.length === 1 && abi.inputs[0].type === 'address' &&
      abi.outputs.length === 1 && abi.outputs[0].type === 'uint256') {
      console.log("Added " + abi.name + " to bookkeeping candidates");
      cand_bookkeeping.push(abi)
    }
  }
  return cand_bookkeeping;
}


module.exports.fuzz = fuzz;
module.exports.seed = seed;
module.exports.load = load;
module.exports.find = find;
// module.exports.reset = reset;
module.exports.setProvider = setProvider;
module.exports.unlockAccount = unlockAccount;