const contract = require('truffle-contract');
const assert = require('assert');
const tracer = require('./EVM2Code');

// truffle-contract abstractions
var targetContract;
var attackContract;

// web3 abstractions
var web3;
var target_abs, attack_abs;
var target_con;
var account_list;
var bookKeepingAbi;

// tracer abstractions at instruction level
var targetIns_map;
var attackIns_map;

// static dependency
var staticDep_target;
var staticDep_attack;

/// the gas amount
const gasMin = 21000;
const gasMax = 8000000;
const dyn_array_min = 1;
/// dynamci array
const dyn_array_max = 10;

/// the maximum length of seed_callSequence
const sequence_maxLen = 10;
/// the maximum number of muated call sequences 
const mutateSeque_maxLen = 10;
/// the maximum number of muated operation for each call sequence
const mutateOper_maxLen = 5;
/// the maximum length of changed call sequence
const operSeque_maxLen = 5;

/// the set to keep the coverage for guided fuzzing
var trans_len = 0;
var trans_depen_set = new Set();
var seque_depen_set = new Set();
var contr_depen_set = new Set();

/// the mutation operation for neighbor
var neighbor = [];
neighbor.push('1.2');
neighbor.push('0.8');
neighbor.push('1.5');
neighbor.push('0.5');
neighbor.push('2.o');
neighbor.push('0.0');  
neighbor.push(1);
neighbor.push(-1);
neighbor.push(2);
neighbor.push(-2);
neighbor.push(4);
neighbor.push(-4);
neighbor.push(8);
neighbor.push(-8);


module.exports = {
  /// load some static information for the dynamic analysis.e.g., fuzzing
  load: async function(targetPath, attackPath, targetSolPath, attackSolPath) {
    var self = this;
    web3 = self.web3;
    try {
      account_list = await web3.eth.getAccounts();

      const target_artifact = require(targetPath);
      targetContract = contract(target_artifact);
      targetContract.setProvider(self.web3.currentProvider);
      const attack_artifact = require(attackPath);
      attackContract = contract(attack_artifact);
      attackContract.setProvider(self.web3.currentProvider);
      
      // This is workaround: https://github.com/trufflesuite/truffle-contract/issues/57
      if (typeof targetContract.currentProvider.sendAsync !== "function") {
        targetContract.currentProvider.sendAsync = function() {
          return targetContract.currentProvider.send.apply(
            targetContract.currentProvider, arguments
          );
        };
      }
      
      if (typeof attackContract.currentProvider.sendAsync !== "function") {
        attackContract.currentProvider.sendAsync = function() {
          return attackContract.currentProvider.send.apply(
            attackContract.currentProvider, arguments
          );
        };
      }
      
      target_abs = await targetContract.deployed();
      attack_abs = await attackContract.deployed();
      target_con = await new web3.eth.Contract(target_abs.abi, target_abs.address);

      // find bookkeeping var
      bookKeepingAbi = findBookKeepingAbi(target_abs.abi);
      
      /// the map that the instruction corresponds to the statement 
      targetIns_map = await tracer.buildInsMap(
        target_artifact.sourcePath,
        target_artifact.deployedBytecode,
        target_artifact.deployedSourceMap,
        target_artifact.source);

      attackIns_map = await tracer.buildInsMap(
        attack_artifact.sourcePath,
        attack_artifact.deployedBytecode,
        attack_artifact.deployedSourceMap,
        attack_artifact.source);

      /// the static dependencies
      staticDep_target = await tracer.buildStaticDep(targetSolPath);
      staticDep_attack = await tracer.buildStaticDep(attackSolPath);
    } catch (e) {
      console.log(e);
      return e.message;
    }
    
    return {
      accounts: account_list,
      target_adds: target_abs.address,
      attack_adds: attack_abs.address,
      target_abi: target_abs.abi,
      attack_abi: attack_abs.abi
    };
  },

  /// the dynamic fuzzing
  fuzz: async function() {
    if (target_abs === undefined || target_con === undefined) {
      throw "Target contract is not loaded!";
    }
    if (attack_abs === undefined) {
      throw "Attack contract is not loaded!";
    }
    // Generate call sequence
    var callFun_list = await seed_callSequence(attack_abs.abi);
    // Execute the seed call sequence
    var execResult_list = await exec_callSequence(callFun_list);

    var callSequence_list = [];
    callSequence_list.push(callFun_list);
    while(callSequence_list.length != 0){
      /// callSequence used to be mutated
      var callSequence = callSequence_list.pop();
      var callSequence_new_set = mutate_callSequence(callSequence, attack_abs.abi);
      for(var callSequence_new of callSequence_new_set){
        /// the number of dependencies before the execution of next call sequence
        var contr_set_bf = contr_depen_set.length; 
        await exec_callSequence(callSequence_new);
        for(var seque_depen of seque_depen_set){
          if(contr_depen_set.has(seque_depen) == false){
            contr_depen_set.add(seque_depen);
          }
        }
        /// the number of dependencies after the execution of next call sequence
        var contr_set_af = contr_depen_set.length;
        if(contr_set_af > contr_set_bf){
          /// continue to mutate this call sequence
          callSequence_list.push(callSequence_new);
        }
      }
    }
    return {
      callFuns: callFun_list,
      execResults: execResult_list
    };
  },

  trace: async function(ins_trace) {
    if (target_abs === undefined || target_con === undefined) {
      throw "Target contract is not loaded!";
    }
    if (attack_abs === undefined) {
      throw "Attack contract is not loaded!";
    }

    /// ins_trace is the instrcution trace
    /// stmt_trace is the line nunmber trace
    let stmt_trace = await tracer.buildTraceMap(ins_trace,
						attackIns_map,
						targetIns_map);
    /// used to guide gas mutation
    trans_len = stmt_trace.length;
    /// the dynamic dependencies in the stmt_trace
    trans_depen_set = await tracer.buildDynDep(stmt_trace,
					  staticDep_attack,
					  staticDep_target);
    /// add into the sequence dependencies
    for(var trans_depen of trans_depen_set){
      if (seque_depen_set.has(trans_depen) == false){
        seque_depen_set.add(trans_depen);
      }
    }
  }
}

/// find the bookkeeping variable
function findBookKeepingAbi(abis) {
  for (var abi of abis) {
    if (abi.type === 'function' && abi.constant &&
      abi.inputs.length === 1 && abi.inputs[0].type === 'address' &&
      abi.outputs.length === 1 && abi.outputs[0].type === 'uint256') {
      return abi;
    }
  }
  throw "Cannot find bookkeeping variable!";
  return;
}

/// get the balacne of given address in the bookkeeping variable
async function getBookBalance(acc_address) {
  let bal = 0;
  let encode = web3.eth.abi.encodeFunctionCall(bookKeepingAbi, [acc_address]);

  await web3.eth.call({
    to: target_abs.address,
    data: encode}, 
    function(err, result) {
      if (!err) {
        if (web3.utils.isHex(result))
          bal = web3.utils.toBN(result);
      }
    });
  return bal;
}

/// get the balance of attack in the bookkeeping variable
async function getAccountBalance() {
  let bal = await getBookBalance(attack_abs.address);
  return bal;
}

/// get the sum of bookkeeping variable
async function getBookSum() {
  var sum = 0;
  for (var account of account_list) { 
    sum += await getBookBalance(account);
  }
  sum += await getBookBalance(attack_abs.address);
  return sum;
}

/// execute the call and generate the transaction
async function exec_callFun(call){
  let target_bal_bf = await web3.eth.getBalance(target_abs.address);
  let target_bal_sum_bf = await getBookSum();
  console.log("Balance sum before: " + target_bal_sum_bf);
  let attack_bal_bf = await web3.eth.getBalance(attack_abs.address);
  let attack_bal_acc_bf = await getAccountBalance();
  console.log("Balance account before: " + attack_bal_acc_bf);
  
  await web3.eth.sendTransaction({ from: call.from,
                                   to: call.to, 
                                   gas: call.gas,                               
                                   data: web3.eth.abi.encodeFunctionCall(call.abi, call.param)                                   
                                 },
                                 function(error, hash) {
                                   if (!error)
                                     console.log("Transaction " + hash + " is successful!");
                                   else
                                     console.log(error);
                                 });
  
  let target_bal_af = await web3.eth.getBalance(target_abs.address);
  let target_bal_sum_af = await getBookSum();
  console.log("Balance sum after: " + target_bal_sum_af);
  let attack_bal_af = await web3.eth.getBalance(attack_abs.address);
  let attack_bal_acc_af = await getAccountBalance();
  console.log("Balance account after: " + attack_bal_acc_af);
  
  // Asserting oracles
  // Balance Invariant
  /// TODO still not consider the price of token in bookkeeping variable
  assert.equal(target_bal_bf - target_bal_sum_bf,
               target_bal_af - target_bal_sum_af,
               "Balance invariant should always hold.");
  // Transaction Invariant
  assert.equal(attack_bal_af - attack_bal_bf,
               attack_bal_acc_bf - attack_bal_acc_af,
               "Transaction invariant should always hold.");  
  return [
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

/// min <= r < max
function randomNum(min, max){
  if(min >= max){
    return min;
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
async function gen_address(adds_type){
  /// returns -1, if the value to search for never occurs
  if(adds_type.indexOf('[') == -1){
    /// primitive type
    return account_list[0];
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

/// generate an unsigned integer
async function gen_uint(uint_type, unum_min, unum_max){
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
  var num_str = "0x"
  while(byte_index < byte_num){
    num_str += 'ff';
    byte_index += 1;
  }
  if(unum_max === undefined){
    /// unum_max is undefined, we use the default maximum value
    var unum_max = parseInt(num_str, 16);  
  }
  else{
    var num_int = parseInt(num_str, 16);
    if(num_int < unum_max){
      unum_max = num_int;
    }
  }
  if(uint_type.indexOf('[') == -1){
    /// primitive type
    var value = "" + randomNum(unum_min, unum_max);
    return value;
  }
  else if(adds_type.indexOf('[]') != -1){
    /// dynamic array
    var value_list = [];
    var value_num = randomNum(dyn_array_min, dyn_array_max);
    var value_index = 0;
    while(value_index < value_num){
      var value = "" + randomNum(unum_min, unum_max);
      value_list.push(value);
      value_index += 1;
    }
    return value_list;
  }
  else{
    /// static array
    var adds_list = [];
    var left_index = uint_type.indexOf('[');
    var right_index = uint_type.indexOf(']');
    var value_num = parseInt(uint_type.slice(left_index +1, right_index), 10);
    var value_index = 0;
    while(value_index < value_num){
      var value = "" + randomNum(unum_min, unum_max);
      value_list.push(value);
      value_index += 1;
    }
    return value_list;
  }
}

/// modify the 'input_orig_list' at 'input_index' with 'unum_diff' 
async function modify_uint(input_orig_list, input_index, unum_diff){
  /// generate a copy to mutate, otherwise the original input will be modified
  var input_orig = input_orig_list[input_index].slice();

  if (input_orig instanceof string){
    /// it is primitive, e.g., uint
    var input_orig_int = parseInt(input_orig, 10);
    if(unum_diff instanceof nunmber){
      /// modify with the instant value
      var input_modify = input_orig_int + unum_diff;
      if(input_modify >= 0){
        return "" + input_modify;
      }
      else{
        return '0';
      }
    }
    else if(unum_diff instanceof string){
      /// modify with 'xxx' times
      var unum_diff_int = parseInt(unum_diff, 10);
      var input_modify = input_orig_int * unum_diff;
      return "" + Math.round(input_modify);               
    }
  }
  else if (input_orig instanceof Array){
    /// select an element to mutate
    var index = randomNum(0, input_orig.length);
    var input_orig_int = parseInt(input_orig[index], 10);
    if(unum_diff instanceof nunmber){
      var input_modify = input_orig_int + unum_diff;
      if(input_modify >= 0){
        input_orig[index] = "" + input_modify;
      }
      else{
        input_orig[index] = '0';
      } 
    }
    else if(unum_diff instanceof string){
      var unum_diff_int = parseInt(unum_diff, 10);
      var input_modify = input_orig_int * unum_diff;
      input_orig[index] = "" + Math.round(input_modify);               
    }
    return input_orig;
  }
  else{
    return input_orig;
  }
}

/// generate the call input
async function gen_callInput(abi, unum_min, unum_max) {
  var param_list = [];  
  abi.inputs.forEach(function(param) {
    if (param.type.indexOf('address') == 0) {
      param_list.push(gen_address(param.type));
    }
    else if (param.type.indexOf('uint') == 0){
      /// uint type, its minimu is '0'
      param_list.push(gen_uint(param.type, 0, unum_max));
    }
    else {
      // default parameter
      param_list.push(0);
    }
  });
  return param_list;
}

async function modify_callInput(call, unum_diff) {
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
          param_list.push(modify_uint(input_orig_list, param_j, unum_diff));
          /// param_i can be speed up
          param_i = param_j +1;
          modify_found = true;
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
  return param_list_set;
}


async function gen_callGas(gas_min, gas_max){
  var gas_limit = "" + randomNum(gas_min, gas_max);
  return gas_limit;
}

/// generate a call function based on the abi
async function gen_callFun(abi) {
  let parameters; 
  let gasLimit;
  gen_callInput(abi, 0, undefined).then(function(param_list) {
      parameters = param_list;
  });
  gen_callGas(gasMin, gasMax).then(function(gas_limit) {
      gasLimit = gas_limit;
  });

  let callFun = {
    from: accounts[0],
    to: attack_abs.address,
    abi: abi,
    gas: gasLimit,
    param: parameters
  }
  return callFun;
}

/// generate a call function based on the existing call
async function gen_anotherCall(call, unum_min, unum_max, gas_min, gas_max) {
  let parameters; 
  let gasLimit;
  gen_callInput(call.abi, unum_min, unum_max).then(function(param_list) {
      parameters = param_list;
  });
  gen_callGas(gas_min, gas_max).then(function(gas_limit) {
      gasLimit = gas_limit;
  });

  let callFun = {
    from: call.from,
    to: call.to,
    abi: call.abi,
    gas: gasLimit,
    param: parameters
  }
  return callFun;
}

async function modify_callFun(call, unum_diff){
  var callFun_list_set = new Set();
  var parameters_set; 
  modify_callInput(call, unum_diff).then(function(param_list_set) {
    /// it returns a set of parameter list, because unum_diff can change many parameters
    parameters_set = param_list_set;
  });
  for(var parameters of parameters_set){
    var gasLimit;
    gen_callGas(gasMin, gasMax).then(function(gas_limit) {
      gasLimit = gas_limit;
    });
    var callFun = {
      from: call.from,
      to: call.to,
      abi: call.abi,
      gas: gasLimit,
      param: parameters
    }
    callFun_list_set.add(callFun);
  }
  return callFun_list_set;
}

/// mutate the gas, we first find the gas_max that cost by execution,
/// then, we use different gas limit
async function mutate_gas(call){
  var gas_min = gasMin;
  var gas_max = gasMax;
  /// estimate the gas_max
  while(true){
    callFun = gen_anotherCall(call, 0, undefined, (gas_min + gas_max) / 2, gas_max);
    exec_callFun(callFun);
    var exec_maxLen = trans_len;
    callFun = gen_anotherCall(call, 0, undefined, gas_min, (gas_min + gas_max) / 2);
    exec_callFun(callFun);
    var exec_minLen = trans_len;
    var diff = 5;
    if(exec_minLen < exec_maxLen + diff){
      break;
    }
    else{
      gas_max = (gas_min + gas_max) / 2
    }                     
  }
  /// divide into 50 
  var num_divide = 50;
  /// become integer, in case of '0.*''
  var internal = Math.ceil((gas_max - gas_min) / num_divide);
  var num_index = 0;
  while(num_index < num_divide){
    callFun = gen_anotherCall(call, 0, undefined, gas_min, gas_min + internal);
    exec_callFun(callFun);
    gas_min = gas_min + internal;
    num_index += 1;
  }
}

/// mutate the uint based on previous balances
async function mutate_balance(call, exec_results){
  var exec_index = 0, exec_max = 9;
  while(exec_index < exec_max){
    if(exec_index == 0){
      unum_min = 0;
    }
    else{
      unum_min = exec_results[exec_index -1];
    }
    if(exec_index == 8){
      unum_max = undefined;
    }
    else{
      unum_max = exec_results[exec_index];
    }      
    /// generate the new calls and execute them
    call = gen_anotherCall(call, unum_min, unum_max, gasMin, gasMax);
    /// every time ,exec_result would be updated
    exec_results = exec_callFun(call);
    /// sort is performed at the original array, not generate a new copy
    exec_results.sort(sortNumber);
    exec_index += 1;
  }  
}

async function mutate_neighbor(call){
  var neighbor_call_list = [];
  neighbor_call_list.push(call);

  while(neighbor_call_list.length != 0){
    var callFun = neighbor_call_list.pop();
    for(var unum_diff of neighbor){
      var callFun_new_set = modify_callFun(callFun, unum_diff)
      for(var callFun_new of callFun_new_set){
        /// the dependencies in sequence before execution
        var seque_depen_bf = seque_depen_set.length;
        exec_callFun(callFun_new);
        /// the dependencies in sequence before execution
        var seque_depen_af = seque_depen_set.length;
        if(seque_depen_af > seque_depen_bf){
          neighbor_call_list.push(callFun_new);
        }
      }
    }
  }
}

async function exec_callSequence(callSequence) {
  /// clear the previous call sequences
  seque_depen_set.clear();
  for (var call of callSequence) {
    /// mutate the gas
    mutate_gas(call);
    var exec_results = exec_callFun(call);
    /// sort is performed at the original array, not generate a new copy
    exec_results.sort(sortNumber);
    /// mutate the input based on the balance
    mutate_balance(call, exec_results);
    /// mutate the input based on the neighbor
    mutate_neighbor(call);
  }
  return "Test succeeded!";
}

async function seed_callSequence(abis) {
  var call_sequence = [];
  var cand_sequence = [];
  abis.forEach(function(abi) {
    /// abi.constant == true would not change state variables
    if (abi.type === 'function' && abi.constant == false)
      cand_sequence.push(abi);
  });
  
  var sequence_len = randomNum(1, sequence_maxLen);
  var sequence_index = 0;
  while (sequence_index < sequence_len){
    /// 0 <= call_index < cand_sequence.length
    var call_index = randomNum(0, cand_sequence.length);
    var abi = cand_sequence[call_index];
    let callfun = await gen_callFun(abi);
    call_sequence.push(callFun);
    sequence_index += 1;
  }
  return call_sequence;
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
          var abi = abis[randomNum(0, abis.length)];
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
          var abi = abis[randomNum(0, abis.length)];
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

// async function generateFunctionInputs(abi) {
//   if (abi.constant) return;
//   if (abi.type != 'function') return;

//   let parameters = [];  
//   abi.inputs.forEach(function(param) {
//     if (param.type == 'address') {
//       parameters.push(attack_abs.address);
//     } else if (param.type == 'uint256') {
//       parameters.push(web3.utils.toWei('1', 'ether'));
//     } else {
//       // default parameter
//       parameters.push(0);
//     }
//   });

//   let call = {
//     from: account_list[0],
//     to: attack_abs.address,
//     gas: '1000000',
//     func: abi.name,
//     param: parameters,
//     encode: web3.eth.abi.encodeFunctionCall(abi, parameters)
//   }
//   return call;
// }

// async function simple_callSequence(abis) {
//   let calls = [];
//   abis.forEach(function(abi) {
//     if (abi.constant || abi.type != 'function')
//       return;

//     // if (abi.name == 'donate' || abi.name == 'withdraw') {
//     if (abi.name == 'attack') {
//       generateFunctionInputs(abi).then(function(call) {
//         calls.push(call);
//       })
//     }
//   });
  
//   return calls;
// }
