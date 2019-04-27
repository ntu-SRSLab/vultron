const contract = require('truffle-contract');
const assert = require('assert');
const tracer = require('./EVM2Code');
const fs = require('fs');
const locks = require('locks');
// mutex
const mutex = locks.createMutex();
const async = require('async');


var self;
/// json file
var target_artifact;
var attack_artifact
// truffle-contract abstractions
var targetContract;
var attackContract;

// web3 abstractions
var web3;
var target_con;
var attack_con;
var account_list;
var bookKeepingAbi;

// tracer abstractions at instruction level
var targetIns_map;
var attackIns_map;

// static dependency
var staticDep_target;
var staticDep_attack;

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
var seque_stmt_trace = [];
var trans_depen_set = new Set();
var seque_depen_set = new Set();
var contr_depen_set = new Set();

/// the last call
var lastCall = new Map();
/// the call function list for the execution
var sequence_call_list = [];
/// the executed call sequence
var sequence_executed = [];
/// the index in sequence_executed
var sequeExe_index = 0;
/// the sequence_exexuted become more meaningful
var sequeExe_meaningful = false;
/// the execution results of a call function
var exec_results = [];
/// another new call seqeunce
var new_sequence_start = false;

/// the hash of previous transaction
var pre_txHash = "0x0";

/// the candidate abi that can be used to start transaction
var cand_sequence = [];

var reset_num = 0;
var reset_index = 0;

var fuzzing_finish = false;

/// the mutation for gas neighbor
var gas_neighbor = [];
gas_neighbor.push('0.01');
gas_neighbor.push('0.1');
gas_neighbor.push('0.2');
gas_neighbor.push('0.3');
gas_neighbor.push('0.5');
gas_neighbor.push('0.8');
gas_neighbor.push('0.9');
gas_neighbor.push('0.92');
gas_neighbor.push('0.93');
gas_neighbor.push('0.95');
gas_neighbor.push('0.96');
gas_neighbor.push('0.97');
gas_neighbor.push('0.98');
gas_neighbor.push('0.99');
gas_neighbor.push('1.01');
gas_neighbor.push('1.02');
gas_neighbor.push('1.03');
gas_neighbor.push('1.0');
gas_neighbor.push('1.05');
gas_neighbor.push('1.06');
gas_neighbor.push('1.08');
gas_neighbor.push('1.1');
gas_neighbor.push('1.2');
gas_neighbor.push('1.5');
gas_neighbor.push('1.7');
gas_neighbor.push('2.0');
gas_neighbor.push('3.0');
gas_neighbor.push('5.0');
gas_neighbor.push('10.0');
gas_neighbor.push('50.0');
gas_neighbor.push('80.0');
gas_neighbor.push('100.0');
gas_neighbor.push('1000.0');


/// the mutation operation for uint neighbor
var uint_neighbor = [];
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
uint_neighbor.push('0.0001');
uint_neighbor.push(1);
uint_neighbor.push(-1);
uint_neighbor.push(2);
uint_neighbor.push(-2);
uint_neighbor.push(4);
uint_neighbor.push(-4);
uint_neighbor.push(8);
uint_neighbor.push(-8);


module.exports = {
  /// load some static information for the dynamic analysis.e.g., fuzzing
  load: async function(targetPath, attackPath, targetSolPath, attackSolPath) {
    //var execSync = require('child_process').execSync;
    //var cmdStr = "sh ./startTruffle.sh";
    //execSync(cmdStr, {stdio: [process.stdin, process.stdout, process.stderr]});

    self = this;
    web3 = self.web3;
    try {
      account_list = await web3.eth.getAccounts();

      target_artifact = require(targetPath);
      targetContract = contract(target_artifact);
      targetContract.setProvider(self.web3.currentProvider);
      attack_artifact = require(attackPath);
      attackContract = contract(attack_artifact);
      attackContract.setProvider(self.web3.currentProvider);

      // This is workaround: https://github.com/trufflesuite/truffle-contract/issues/57
      if (typeof targetContract.currentProvider.sendAsync !== "function") {
        targetContract.currentProvider.sendAsync = function() {
          return targetContract.currentProvider.send.apply(
            targetContract.currentProvider, arguments);
        };
      }
      
      if (typeof attackContract.currentProvider.sendAsync !== "function") {
        attackContract.currentProvider.sendAsync = function() {
          return attackContract.currentProvider.send.apply(
            attackContract.currentProvider, arguments);
        };
      }

      var target_abs = await targetContract.deployed();
      var attack_abs = await attackContract.deployed();

      target_con = await new web3.eth.Contract(target_abs.abi, target_abs.address);
      attack_con = await new web3.eth.Contract(attack_abs.abi, attack_abs.address);

      // /// the set of statements
      attackStmt_set = await tracer.buildStmtSet(attack_artifact.sourcePath,
        attack_artifact.deployedSourceMap,
        attack_artifact.source);

      targetStmt_set = await tracer.buildStmtSet(target_artifact.sourcePath,
        target_artifact.deployedSourceMap,
        target_artifact.source);     
      
      /// the map that the instruction corresponds to the statement 
      attackIns_map = await tracer.buildInsMap(
        attack_artifact.sourcePath,
        attack_artifact.deployedBytecode,
        attack_artifact.deployedSourceMap,
        attack_artifact.source);

      targetIns_map = await tracer.buildInsMap(
        target_artifact.sourcePath,
        target_artifact.deployedBytecode,
        target_artifact.deployedSourceMap,
        target_artifact.source);

      /// the static dependencies
      staticDep_target = await tracer.buildStaticDep(targetSolPath);
      staticDep_attack = await tracer.buildStaticDep(attackSolPath);
    } catch (e) {
      console.log(e);
      return e.message;
    }
    return {
      accounts: account_list,
      target_adds: target_con.options.address,
      attack_adds: attack_con.options.address,
      target_abi: target_con._jsonInterface,
      attack_abi: attack_con._jsonInterface
    };
  },

  /// the seed for dynamic fuzzing
  seed: async function() {
    if (!bookKeepingAbi) {
      throw 'Run /find first!';
    }

    if (target_con === undefined) {
      throw "Target contract is not loaded!";
    }
    if (attack_con === undefined) {
      throw "Attack contract is not loaded!";
    }

    console.log('Bookkeeping variable is: ' + bookKeepingAbi.name);

    // Generate call sequence
    var callFun_list = await seed_callSequence(attack_con._jsonInterface);

    // Execute the seed call sequence
    // await exec_sequence_call();
    mutex.lock(async function() {
      try{
        reset_index = 0;
        reset_num = randomNum(0, 50);
        new_sequence_start = true;
        sequence_call_list.push(callFun_list);
        await exec_sequence_call();
      }
      catch (e) {
        console.log(e);
      }
      finally{
        mutex.unlock();
      }
    });

    var execResult_list = "successful!";
    return {
      callFuns: callFun_list,
      execResults: execResult_list
    };
  },


  find: async function() {
    if (target_con === undefined) {
        throw "Target contract is not loaded!";
    }

    // Retrieve the list of payable functions
    let cand_bookkeeping = await findBookkeepingVars(target_con._jsonInterface);
    if (!cand_bookkeeping.length) {
      throw "Cannot find any bookkeeping variables!";
    }

    let payableFun_list = await getPayableFuns(target_con._jsonInterface);
    try {
      for (fun of payableFun_list) {
        let call = await gen_callPayFun(fun);
        console.log(call);
        var funName = fun.name || 'fallback';
        console.log('Searching in ' + funName + ' function');
        await exec_callPayFun(call, cand_bookkeeping);
        if (bookKeepingAbi) break;
      }
    }
    catch (e) {
      console.log(e);
    }

    var execResult_list = "successful!";
    return {
      execResults: execResult_list,
      callFun: funName,
      bookkeepingVar: bookKeepingAbi.name
    };
},

  fuzz: async function(txHash, ins_trace) {
    if (target_con === undefined) {
      throw "Target contract is not loaded!";
    }
    if (attack_con === undefined) {
      throw "Attack contract is not loaded!";
    }
    /// different transaction hash code
    if(txHash != pre_txHash){
      pre_txHash = txHash;
      mutex.lock(async function() {
        try{
          /// ins_trace is the instrcution trace
          /// stmt_trace is the line nunmber trace
          var stmt_trace = await tracer.buildTraceMap(ins_trace,
                                                      attackIns_map,
                                                      targetIns_map);
          // console.log(seque_stmt_trace);
          seque_stmt_trace = seque_stmt_trace.concat(stmt_trace);
          // console.log(seque_stmt_trace);
          /// the dynamic dependencies in the stmt_trace
          trans_depen_set = await tracer.buildDynDep(seque_stmt_trace,
                                                     staticDep_attack,
                                                     staticDep_target);
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
  },
  
  reset: async function() {
    if (target_con === undefined) {
      throw "Target contract is not loaded!";
    }
    if (attack_con === undefined) {
      throw "Attack contract is not loaded!";
    }
    // await resetBookKeeping();
    await redeploy();
    return "Contracts are reset!";
  }
}

/// get the balacne of given address in the bookkeeping variable
async function getBookBalance(acc_address, bookkeepingVar = bookKeepingAbi) {
  var bal = 0;
  var encode = web3.eth.abi.encodeFunctionCall(bookkeepingVar, [acc_address]);

  await web3.eth.call({
                      to: target_con.options.address,
                      data: encode}, function(err, result) {
                        if (!err) {
                          if (web3.utils.isHex(result))
                            bal += web3.utils.toBN(result);
                        }
                      });
  return bal;
}

/// get the balance of attack in the bookkeeping variable
async function getAccountBalance(bookkeepingVar = bookKeepingAbi) {
  var bal = await getBookBalance(attack_con.options.address, bookkeepingVar);
  return bal;
}

/// reset bookkeeping variable
async function resetBookKeeping() {
  for (var account of account_list) {
    target_con.methods.__vultron_reset(account).call();
  }
  target_con.methods.__vultron_reset(attack_con.options.address).call();
}

/// get the sum of bookkeeping variable
async function getBookSum(bookkeepingVar = bookKeepingAbi) {
  var sum = 0;
  for (var account of account_list) { 
    var account_bal = await getBookBalance(account, bookkeepingVar);
    sum += account_bal;

  }
  var attack_bal = await getBookBalance(attack_con.options.address, bookkeepingVar);
  sum += attack_bal;
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

/// execute the payable func call and check if the vars' values changed
async function exec_callPayFun(call, cand_bookkeeping){
  var tx_hash;
  var revert_found = false;
  var target_bal_bf = await web3.eth.getBalance(target_con.options.address);
  console.log("Balance before: " + target_bal_bf);
  console.log("Balance sum before: ");
  var target_bal_sum_bf = await getAllBooksSum(cand_bookkeeping);
  var tx_value = 10e18;

  try {
    const transactionConfig = {
      from: call.from,
      to: call.to,
      abi: call.abi,
      gas: call.gas,
      value: tx_value
    };

    if (call.param.length) {
      transactionConfig['data'] =  web3.eth.abi.encodeFunctionCall(call.abi, call.param)
    }

    await web3.eth.sendTransaction(
      transactionConfig,
      function (error, hash) {
        if (!error) {
          tx_hash = hash;
        } else {
          console.log(error);
        }
      }
    );
  } catch(e) {
    console.log(e);
  }

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

  var target_bal_af = await web3.eth.getBalance(target_con.options.address);
  console.log("Balance after: " + target_bal_af);
  console.log("Balance sum after: \n");
  var target_bal_sum_af = await getAllBooksSum(cand_bookkeeping);

  for (book_var_af of target_bal_sum_af) {
    var book_var_bf = target_bal_sum_bf.find(obj => (obj.name === book_var_af.name));
    if (book_var_af.value - book_var_bf.value == tx_value)
    {
       bookKeepingAbi = cand_bookkeeping.find(obj => (obj.name === book_var_af.name));
       console.log('\nThe bookkeeping variable \'' + bookKeepingAbi.name +'\' is found');
       return;
    }
  }

  return [
    revert_found ? 'revert' : 'norevert',
    target_bal_bf,
    target_bal_sum_bf,
    target_bal_af,
    target_bal_sum_af,
  ];
}


/// execute the call and generate the transaction
async function exec_callFun(call){
  var tx_hash;
  var revert_found = false;
  var target_bal_bf = await web3.eth.getBalance(target_con.options.address);
  var target_bal_sum_bf = await getBookSum();
  // console.log("Balance sum before: " + target_bal_sum_bf);
  var attack_bal_bf = await web3.eth.getBalance(attack_con.options.address);
  var attack_bal_acc_bf = await getAccountBalance();
  // console.log("Balance account before: " + attack_bal_acc_bf);

  console.log(call);
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
    // console.log(e);
  }

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

  var target_bal_af = await web3.eth.getBalance(target_con.options.address);
  var target_bal_sum_af = await getBookSum();
  // console.log("Balance sum after: " + target_bal_sum_af);
  var attack_bal_af = await web3.eth.getBalance(attack_con.options.address);
  var attack_bal_acc_af = await getAccountBalance();
  // console.log("Balance account after: " + attack_bal_acc_af);

  console.log(attack_bal_bf);
  console.log(attack_bal_af);
  console.log(target_bal_bf);
  console.log(target_bal_af);
  console.log(attack_bal_acc_bf);
  console.log(attack_bal_acc_af);
  console.log(target_bal_sum_bf);
  console.log(target_bal_sum_af);
  // Asserting oracles
  // Balance Invariant
  /// TODO still not consider the price of token in bookkeeping variable
  try{
    // assert.equal(BigInt(target_bal_bf) - BigInt(target_bal_sum_bf),
    //              BigInt(target_bal_af) - BigInt(target_bal_sum_af),
    //              "Balance invariant should always hold.");
    // // Transaction Invariant
    // assert.equal(BigInt(attack_bal_af) - BigInt(attack_bal_bf),
    //              BigInt(attack_bal_acc_bf) - BigInt(attack_bal_acc_af),
    //              "Transaction invariant should always hold.");
    if((BigInt(target_bal_bf) - BigInt(target_bal_sum_bf)) != (BigInt(target_bal_af) - BigInt(target_bal_sum_af))){
      throw "Balance invariant is not held....";
    }
    if((BigInt(attack_bal_af) - BigInt(attack_bal_bf)) != (BigInt(attack_bal_acc_bf) - BigInt(attack_bal_acc_af))){
      throw "Transaction invariant is not held....";
    }
  }
  catch(e){
    console.log(e);
    return "found";
  }
  if(revert_found){
    return [
      "revert",
      target_bal_bf,
      target_bal_sum_bf,
      attack_bal_bf,
      attack_bal_acc_bf,
      target_bal_af,
      target_bal_sum_af,
      attack_bal_af,
      attack_bal_acc_af,
    ];
  }
  else{
    return [
      "norevert",
      target_bal_bf,
      target_bal_sum_bf,
      attack_bal_bf,
      attack_bal_acc_bf,
      target_bal_af,
      target_bal_sum_af,
      attack_bal_af,
      attack_bal_acc_af,
    ];
  }
}

/// min <= r < max
function randomNum(min, max){
  if(min >= max){
    return Math.floor(min);
  }
  else{
    var range = max - min;
    var rand = Math.random();
    var num = min + Math.floor(rand * range);
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
    return attack_con.options.address;
  }
  else if(adds_type.indexOf('[]') != -1){
    /// dynamic array
    var adds_list = [];
    var adds_num = randomNum(dyn_array_min, dyn_array_max);
    var adds_index = 0;
    while(adds_index < adds_num){
      var account_index = randomNum(0, account_list.length);
      var account = account_list[account_index];
      adds_list.push(account);
      adds_index += 1;
    }
    return adds_list;
  }
  else{
    /// static array
    var adds_list = [];
    var left_index = adds_type.indexOf('[');
    var right_index = adds_type.indexOf(']');
    var adds_num = parseInt(adds_type.slice(left_index +1, right_index), 10);
    var adds_index = 0;
    while(adds_index < adds_num){
      var account_index = randomNum(0, account_list.length);
      var account = account_list[account_index];
      adds_list.push(account);
      adds_index += 1;
    }
    return adds_list;
  }
}


function uintToString(num){
  var num_str = "" + num;
  var index = num_str.indexOf("+");
  if(index != -1){
    var result = num_str[0];
    var power_len = parseInt(num_str.slice(index +1), 10);
    var power_index = 0;
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
function gen_uint(uint_type, unum_min, unum_max){
  /// get rid of uint in e.g., 'uint256'
  var num_left = 4;
  /// maybe it is an array, e,g., 'uint256[]'
  var num_right = uint_type.indexOf('[');
  if(num_right == -1){
    /// it is primitive unit, not an array
    num_right = uint_type.length;
  } 
  var byte_num = parseInt(uint_type.slice(num_left, num_right), 10) / 8;
  var byte_index = 0;
  var num_str = '0x';
  while(byte_index < byte_num){
    num_str += 'ff';
    byte_index += 1;
  }
  if(unum_max === undefined){
    /// unum_max is undefined, we use the default maximum value
    unum_max = parseInt(num_str, 16); 
  }
  else{
    var num_int = parseInt(num_str, 16);
    if(num_int < unum_max){
      unum_max = num_int;
    }
  }
  if(uint_type.indexOf('[') == -1){
    /// primitive type
    var value_int = randomNum(unum_min, unum_max);
    var value = uintToString(value_int);
    return value;
  }
  else if(adds_type.indexOf('[]') != -1){
    /// dynamic array
    var value_list = [];
    var value_num = randomNum(dyn_array_min, dyn_array_max);
    var value_index = 0;
    while(value_index < value_num){
      var value_int = randomNum(unum_min, unum_max);
      var value = uintToString(value_int);
      value_list.push(value);
      value_index += 1;
    }
    return value_list;
  }
  else{
    /// static array
    var value_list = [];
    var left_index = uint_type.indexOf('[');
    var right_index = uint_type.indexOf(']');
    var value_num = parseInt(uint_type.slice(left_index +1, right_index), 10);
    var value_index = 0;
    while(value_index < value_num){
      var value_int = randomNum(unum_min, unum_max);
      var value = uintToString(value_int);
      value_list.push(value);
      value_index += 1;
    }
    return value_list;
  }
}

/// generate the call input
async function gen_callInput(abi, unum_min, unum_max) {
  var param_list = [];  
  await abi.inputs.forEach(function(param) {
    if (param.type.indexOf('address') == 0) {
      var adds_param = gen_address(param.type);
      param_list.push(adds_param);
    }
    else if (param.type.indexOf('uint') == 0){
      /// uint type, its minimu is '0'
      var uint_param = gen_uint(param.type, 0, unum_max);
      param_list.push(uint_param);
    }
    else {      // default parameter
      param_list.push(0);
    }
  });
  return param_list;
}

async function modify_callInput_bal(abi, unum_min, unum_max) {
  var param_list = []; 
  var param_changed = false; 
  await abi.inputs.forEach(function(param) {
    if (param.type.indexOf('address') == 0) {
      var adds_param = gen_address(param.type);
      param_list.push(adds_param);
    }
    else if (param.type.indexOf('uint') == 0){
      /// uint type, its minimu is '0'
      var uint_param = gen_uint(param.type, 0, unum_max);
      param_list.push(uint_param);
      param_changed = true;
    }
    else {      
      // default parameter
      param_list.push(0);
    }
  });
  if(param_changed){
    return param_list;
  }
  else{
    /// there is no change in parameters
    return undefined;
  }
}

/// modify the 'input_orig_list' at 'input_index' with 'unum_diff' 
function modify_uint(input_orig_list, input_index, unum_diff){
  var input_orig = input_orig_list[input_index];
  if (typeof input_orig === 'string' || input_orig instanceof String){
    /// it is primitive, e.g., uint
    var input_orig_int = parseInt(input_orig, 10);
    if(typeof unum_diff === "number" || unum_diff instanceof Number){
      /// modify with the instant value
      var input_modify = input_orig_int + unum_diff;
      if(input_modify !== input_orig_int){
        if(input_modify >= 0){
          var modify_str = uintToString(input_modify)
          return modify_str;
        }
        else{
          return '0';
        }        
      }
      else{
        return undefined;
      }
    }
    else if(typeof unum_diff === 'string' || unum_diff instanceof String){
      /// modify with 'xxx' times
      var unum_diff_int = parseFloat(unum_diff, 10);
      var input_modify = input_orig_int * unum_diff;
      if(input_modify !== input_orig_int){
        var modify_str = uintToString(Math.round(input_modify));
        return modify_str;   
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
    var index = randomNum(0, input_orig.length);
    var input_orig_int = parseInt(input_orig[index], 10);
    if(typeof unum_diff === "number" || unum_diff instanceof Number){
      var input_modify = input_orig_int + unum_diff;
      if(input_modify !== input_orig_int){
        if(input_modify >= 0){
          var modify_str = uintToString(input_modify);
          input_orig[index] = modify_str;
        }
        else{
          input_orig[index] = '0';
        }   
        return input_orig;     
      }
      else{
        return undefined;
      }
    }
    else if(typeof unum_diff === 'string' || unum_diff instanceof String){
      var unum_diff_int = parseFloat(unum_diff, 10);
      var input_modify = input_orig_int * unum_diff;
      if(input_modify !== input_orig_int){
        var modify_str = uintToString(Math.round(input_modify));
        input_orig[index] = modify_str;
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
  var param_list_set = new Set();
  var input_type_list = call.abi.inputs;
  var input_orig_list = call.param;
  var param_i = 0;
  var param_len = input_type_list.length;
  /// for each element in input_orig_list to mutate
  while(param_i < param_len){
    /// the generated parameters
    var param_list = [];
    var modify_found = false;
    var param_j = 0;
    while(param_j < param_len){
      /// we only consider the element that larger than param_i
      if(modify_found == false && param_j >= param_i){
        var input_type = input_type_list[param_j];
        if(input_type.type.indexOf('uint') == 0){
          var uint_param = modify_uint(input_orig_list, param_j, unum_diff);
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
  var param_list = [];
  var input_type_list = call.abi.inputs;
  var input_orig_list = call.param;
  var param_i = 0;
  var param_len = input_type_list.length;
  var modify_found = false;
  /// for each element in input_orig_list to mutate
  while(param_i < param_len){
    var input_type = input_type_list[param_i];
    if(input_type.type.indexOf('uint') == 0){
      var uint_param = modify_uint(input_orig_list, param_i, unum_diff);
      if(uint_param !== undefined){
        param_list.push(uint_param);
        modify_found = true;
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
  var times = parseFloat(gas_diff, 10);
  var gas = Math.ceil(parseInt(call.gas, 10) * times);
  if(gas < gasMax){
    return [true, gas];
  }
  else{
    return false;
  }
}


async function gen_callGas(gas_min, gas_max){
  var gas_int = randomNum(gas_min, gas_max);
  var gas_limit = uintToString(gas_int);
  return gas_limit;
}

/// generate a call function based on the abi
async function gen_callFun(abi) {
  var parameters = await gen_callInput(abi, 0, undefined);
  var gasLimit = await gen_callGas(gasMin, gasMax);
  var callFun = {
    from: account_list[0],
    to: attack_con.options.address,
    abi: abi,
    gas: gasLimit,
    param: parameters
  }
  return callFun;
}

/// generate a payable call function based on the abi
async function gen_callPayFun(abi) {
  var callFun = {
    from: account_list[0],
    to: target_con.options.address,
    abi: abi,
    gas: '1000000',
    param: abi.inputs ? await gen_callInput(abi, 0, undefined) : []
  };
  return callFun;
}

async function modify_callFun_gas(call, gas_min, gas_max){
  var gasLimit = await gen_callGas(gas_min, gas_max);
  var callFun = {
    from: call.from,
    to: call.to,
    abi: call.abi,
    gas: gasLimit,
    param: call.param.slice()
  }
  return callFun;
}

/// generate a call function based on the existing call
async function modify_callFun_bal(call, unum_min, unum_max) {
  var parameters = await modify_callInput_bal(call.abi, unum_min, unum_max);
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

async function modify_callFun_uint(call, unum_diff){
  var callFun_set = new Set();
  // it returns a set of parameter list, because unum_diff can change many parameters
  var parameters_set = await modify_callInput_uint(call, unum_diff);
  for(var parameters of parameters_set){
    var callFun = {
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
  var modify_result = await modify_callInput_uint_meaningful(call, unum_diff);
  if(modify_result[0]){
    var callFun = {
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
  var modify_result = await modify_callGas_meaningful(call, gas_diff);
  if(modify_result[0]){
    var callFun = {
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
  var gas_sequence_list = [];
  var gas_diff = parseInt(call.gas, 10) - gasMin;
  var gas_neighbor_index = 0;
  var gas_neighbor_len = gas_neighbor.length;
  while(gas_neighbor_index <= gas_neighbor_len){
    var gas_min, gas_max;
    if(gas_neighbor_index == 0){
      gas_min = gasMin;
    }
    else{
      var times = parseFloat(gas_neighbor[gas_neighbor_index -1], 10);
      gas_min = Math.ceil(gasMin + gas_diff*times);
    }
    if(gas_neighbor_index == gas_neighbor_len){
      gas_max = gasMax;
    }
    else{
      var times = parseFloat(gas_neighbor[gas_neighbor_index], 10);
      gas_max = Math.ceil(gasMin + gas_diff*times);
    }
    /// generate a new call function
    var callFun = await modify_callFun_gas(call, gas_min, gas_max);
    /// clone the call sequence
    var gas_sequence = callSequence.slice();
    /// replace the given function
    gas_sequence[index] = callFun;
    gas_sequence_list.push(gas_sequence);
    gas_neighbor_index += 1;
  }
  return gas_sequence_list;
}

/// mutate the uint based on previous balances
/// 'exec_results' is the result of 'call'
async function mutate_balance(call, callSequence, index){
  var bal_sequence_list = [];
  var exec_index = 0;
  var exec_len = exec_results.length;
  while(exec_index <= exec_len){
    var unum_min, unum_max;
    if(exec_index == 0){
      unum_min = 0;
    }
    else{
      unum_min = parseInt(exec_results[exec_index -1]);
    }
    if(exec_index == 8){
      unum_max = undefined;
    }
    else{
      unum_max = parseInt(exec_results[exec_index]);
    }      
    /// generate the new calls and execute them
    var callFun = await modify_callFun_bal(call, unum_min, unum_max);
    if(callFun !== undefined){
      /// clone the call sequence
      var bal_sequence = callSequence.slice();
      /// replace the given function
      bal_sequence[index] = callFun;
      bal_sequence_list.push(bal_sequence);
    }
    else{
      break;
    }
    exec_index += 1;
  }
  return bal_sequence_list;  
}

async function mutate_uint(call, callSequence, index){
  var uint_sequence_list = [];
  var uint_neighbor_index = 0;
  var uint_neighbor_len = uint_neighbor.length;
  while(uint_neighbor_index <= uint_neighbor_len){
    /// unum_diff is not handled here, because it is relevant to multiple parameters
    /// generate a new call function
    var unum_diff = uint_neighbor[uint_neighbor_index];
    var callFun_set = await modify_callFun_uint(call, unum_diff);
    for(var callFun of callFun_set){
      /// clone the call sequence
      var uint_sequence = callSequence.slice();
      /// replace the given function
      uint_sequence[index] = callFun;
      uint_sequence_list.push(uint_sequence);     
    }
    uint_neighbor_index += 1;
  }
  return uint_sequence_list;
}

async function mutate_callFun(call, callSequence, index) {
  var sequence_new_list = [];
  /// mutate the gas
  var gas_sequence_list = await mutate_gas(call, callSequence, index);
  for(var gas_sequence of gas_sequence_list){
    sequence_new_list.push(gas_sequence);
  }
  /// mutate the input based on the balance
  var bal_sequence_list = await mutate_balance(call, callSequence, index);
  for(var bal_sequence of bal_sequence_list){
    sequence_new_list.push(bal_sequence);
  }
  /// mutate the input based on the neighbor
  var uint_sequence_list = await mutate_uint(call, callSequence, index);
  for(var uint_sequence of uint_sequence_list){
    sequence_new_list.push(uint_sequence);
  }  
  return sequence_new_list;
}


async function mutate_callFun_uint_meaningful(call, callSequence, index) {
  var unum_diff = '0.0000001';
  /// unum_diff is not handled here, because it is relevant to multiple parameters
  /// generate a new call function
  var modify_result = await modify_callFun_uint_meaningful(call, unum_diff);
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
  var gas_diff = '30.0';
  var modify_result = await modify_callFun_gas_meaningful(call, gas_diff);
  /// callSequence itself is changed, not change at its copy 
  if(modify_result[0]){
    callSequence[index] = modify_result[1]; 
    return true;
  }
  else{
    return false;
  }
}

async function mutate_callSequence(callSequence, abis){
  var callSequence_new_set = new Set();
  var mutateSeque_index = 0;
  while(mutateSeque_index < mutateSeque_maxLen){
    /// copy the previous sequence, it would be modified
    var callSequence_new = callSequence.slice();
    var sequence_len = callSequence_new.length;
    var mutateOper_index = 0;
    while(mutateOper_index < mutateOper_maxLen){
      /// the location to mutate
      var sequence_index = randomNum(0, sequence_len);
      /// the type of mutation, e.g., add, delete, and modify
      var mutation_type = randomNum(0, 3);
      if(mutation_type == 0){
        /// add operation
        var operSeque_num = randomNum(0, operSeque_maxLen);
        var operSeque_index = 0;
        while(operSeque_index < operSeque_num){
          var abi_index = randomNum(0, cand_sequence.length);
          var abi = cand_sequence[abi_index];
          var callFun = await gen_callFun(abi);
          /// add the element
          callSequence_new.splice(sequence_index, 0, callFun);
          operSeque_index += 1;
        }
      }
      else if(mutation_type == 1){
        /// delete operation
        var operSeque_num = randomNum(0, operSeque_maxLen);
        /// delete operSeque_num element
        callSequence_new.splice(sequence_index, operSeque_num);     
      }
      else if(mutation_type == 2){
        /// modify operation
        var operSeque_num = randomNum(0, operSeque_maxLen);
        var operSeque_index = 0;
        while(operSeque_index < operSeque_num){
          var abi_index = randomNum(0, cand_sequence.length);
          var abi = cand_sequence[abi_index];
          var callFun = await gen_callFun(abi);
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

async function seed_callSequence(abis) {
  var call_sequence = [];
  /// for different smart contracts
  cand_sequence = [];
  await abis.forEach(function(abi) {
    /// abi.constant == true would not change state variables
    if (abi.type === 'function' && abi.constant == false)
      cand_sequence.push(abi);
  });
  /// at least there are two calls
  var sequence_len = randomNum(2, sequence_maxLen);
  var sequence_index = 0;
  while (sequence_index < sequence_len){
    /// 0 <= call_index < cand_sequence.length
    var abi_index = randomNum(0, cand_sequence.length);
    var abi = cand_sequence[abi_index];
    var callFun = await gen_callFun(abi);
    call_sequence.push(callFun);
    sequence_index += 1;
  }
  return call_sequence;
}

///Redeploy contract
async function redeploy(){
  console.log("redeploy......");
  target_con = await target_con.deploy({data: target_artifact.bytecode, arguments: []})
    .send({
      from: account_list[0],
      gas: 1500000,
      value: web3.utils.toWei("5", "ether")
   });
  attack_con = await attack_con.deploy({data: attack_artifact.bytecode, arguments: [target_con.options.address]})
    .send({
      from: account_list[0],
      gas: 1500000,
      value: web3.utils.toWei("5", "ether")
    });
    console.log(target_con.options.address);
}

/// for debugging
async function print_callSequence(calls_list){
  for(var calls of calls_list){
    console.log(calls);
  }
}


async function exec_sequence_call(){
  // console.log(sequence_call_list[0]);
  if(fuzzing_finish){
    /// we finish the fuzzing
    return;
  }
  /// deal with the results of previous transaction
  /// mutate the function call, e.g., input, gas
  seque_depen_num_bf = seque_depen_set.size;
  /// add into the sequence dependencies
  for(var trans_depen of trans_depen_set){
    if (seque_depen_set.has(trans_depen) == false){
      seque_depen_set.add(trans_depen);
    }
  }
  seque_depen_num_af = seque_depen_set.size;
  console.log("seque before: " + seque_depen_num_bf + " seque after: " + seque_depen_num_af);
  console.log(seque_depen_set);
  if(seque_depen_num_af > seque_depen_num_bf){
    /// mutate the input and gas of the call
    /// sequence_executed, and sequeExe_index is still right
    var calls_new_list = await mutate_callFun(lastCall, sequence_executed, sequeExe_index -1);
    for(var calls_new of calls_new_list){
      sequence_call_list.push(calls_new);
    }      
  }

  if(new_sequence_start){
    /// it a new call sequence, we consider the precious call sequence
    var contr_set_num_bf = contr_depen_set.size; 
    for(var seque_depen of seque_depen_set){
      if(contr_depen_set.has(seque_depen) == false){
        contr_depen_set.add(seque_depen);
      }
    }      
    var contr_set_num_af = contr_depen_set.size;
    if(contr_set_num_af > contr_set_num_bf){
      /// the call sequence generate new coverage, generate the new call sequence
      var callSequence_new_set = await mutate_callSequence(sequence_executed, attack_con._jsonInterface);
      for(var callSequence_new of callSequence_new_set){
        sequence_call_list.push(callSequence_new);
      }
    }

    /// start another statement trace, because another call sequence
    seque_stmt_trace = [];
    /// clear the coverage of call sequence, because we execute the new call sequence
    seque_depen_set.clear();
    sequeExe_meaningful = false;
    if(sequence_call_list.length != 0){
      /// the call sequence for the next execution
      sequence_executed = sequence_call_list[0].slice();
      sequeExe_index = 0;
      console.log("start another sequence.....");
    }
    else{
      console.log("fuzzing finish....");
      return;
    }
  }
  // console.log(sequence_call_list[0]);
  if(sequence_call_list.length !== 0){
    var sequence = sequence_call_list[0];
    var sequence_found = false;
    while(true){
      /// call sequence is empty, which may be generated by delete some calls
      if(sequence.length !== 0){
        sequence_found = true;
        break;
      }
      else{
        sequence_call_list.splice(0, 1);
        if(sequence_call_list.length != 0){
          /// start another statement trace, because another call sequence
          seque_stmt_trace = [];
          /// clear the coverage of call sequence, because we execute the new call sequence
          seque_depen_set.clear();
          sequeExe_meaningful = false;
          /// the call sequence for the next execution
          sequence_executed = sequence_call_list[0].slice();
          sequeExe_index = 0;
     
          sequence = sequence_call_list[0];
        }
        else{
          console.log("fuzzing finish.....");
          return;
        }
      }
    }
    if(sequence_found){
      var call = sequence[0];
      lastCall = call;
      exec_results = await exec_callFun(call);
      if(exec_results === "found"){
        /// stop the running
        fuzzing_finish = true;
        console.log("fuzzing finish....");
        return;
      }
      else if(exec_results[0] === "revert"){
        var mutate_gas_suc = await mutate_callFun_gas_meaningful(call, sequence_executed, sequeExe_index);
        if(mutate_gas_suc){
          sequeExe_meaningful = true;
        }    
        // if(exec_results[1] == exec_results[5] && exec_results[3] == exec_results[7]){
        //   /// here we use sequence_executed[sequeExe_index], because call is changed by its gas before
        //   var mutate_uint_suc = await mutate_callFun_uint_meaningful(sequence_executed[sequeExe_index], sequence_executed, sequeExe_index);
        //   if(mutate_uint_suc){
        //     sequeExe_meaningful = true;
        //   }  
        // } 
        exec_results = exec_results.slice(1);   
        /// sort is performed at the original array, not generate a new copy
        /// it is used in the mutate_callFun
        exec_results.sort(sortNumber);        
      }
      else if(exec_results[0] === "norevert"){
        if(exec_results[1] == exec_results[5] && exec_results[3] == exec_results[7]){
          /// here we use sequence_executed[sequeExe_index], because call is changed by its gas before
          var mutate_uint_suc = await mutate_callFun_uint_meaningful(call, sequence_executed, sequeExe_index);
          if(mutate_uint_suc){
            sequeExe_meaningful = true;
          }  
        } 
        exec_results = exec_results.slice(1);   
        /// sort is performed at the original array, not generate a new copy
        /// it is used in the mutate_callFun
        exec_results.sort(sortNumber);        
      }

      /// delete the call function
      sequence.splice(0, 1);
      /// sequeExe_index increase
      sequeExe_index += 1;
      new_sequence_start = false;
      if(sequence.length === 0){
        /// a call sequence is executed completely, delete the previous call sequence
        sequence_call_list.splice(0, 1);
        new_sequence_start = true;

        /// the sequence_executed becomes more meaningfule
        if(sequeExe_meaningful){
          /// we should use sequence_executed.slice
          /// because sequence_executed may be changer later
          /// we should add them into the front, because it is meaningful verson of last call sequence
          sequence_call_list.unshift(sequence_executed.slice());
        }
        else{
          /// the transferred money cannot be change, we generate another call sequence
          if(sequence_call_list.length <= 3){
            var callSequence_new_set = await mutate_callSequence(sequence_executed, attack_con._jsonInterface);
            for(var callSequence_new of callSequence_new_set){
              sequence_call_list.push(callSequence_new);
            }
          }
        }
        if(reset_index >= reset_num){
          await redeploy();  
          reset_num = randomNum(0, 50);
          reset_index = 0;          
        }
        else{
          reset_index += 1;
        }
      }
    }
  }
}


async function generateFunctionInputs_donate(abi) {
  if (abi.constant) return;
  if (abi.type != 'function') return;

  let parameters = [];  
  await abi.inputs.forEach(function(param) {
    if (param.type == 'address') {
      parameters.push(attack_con.options.address);
    } else if (param.type == 'uint256') {
      // parameters.push(web3.utils.toWei('1', 'ether'));
      parameters.push("200000000000000");
    } else {
      // default parameter
      parameters.push(0);
    }
  });

  let call = {
    from: account_list[0],
    to: attack_con.options.address,
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
      parameters.push(attack_con.options.address);
    } else if (param.type == 'uint256') {
      // parameters.push(web3.utils.toWei('1', 'ether'));
      parameters.push("1000000000");
    } else {
      // default parameter
      parameters.push(0);
    }
  });

  let call = {
    from: account_list[0],
    to: attack_con.options.address,
    abi: abi,
    gas: '35000',
    param: parameters,
  }
  return call;
}

async function getPayableFuns(abis) {
  let cand_functions = [];
  await abis.forEach(function(abi) {
    /// abi.constant == true would not change state variables
    if ((abi.type === 'function' || abi.type === 'fallback') && !abi.constant && abi.payable) {
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

async function simple_callSequence(abis) {
  cand_sequence = [];
  await abis.forEach(function(abi) {
    /// abi.constant == true would not change state variables
    if (abi.type === 'function' && abi.constant == false)
      cand_sequence.push(abi);
  });
  let callFun_list = [];
  await abis.forEach(function(abi) {
    if (abi.constant || abi.type != 'function')
      return;

    if (abi.name == 'donate') {
      generateFunctionInputs_donate(abi).then(function(call) {
      callFun_list.push(call);
      })
    }
  });
  await abis.forEach(function(abi) {
    if (abi.constant || abi.type != 'function')
      return;

    if (abi.name == 'withdraw') {
      generateFunctionInputs_withdraw(abi).then(function(call) {
      callFun_list.push(call);
      })
    }
  });
  return callFun_list;
}
