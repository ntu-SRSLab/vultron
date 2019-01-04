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

const sequence_maxLen = 100; 
const gas_min = 21000;
const gas_max = 8000000;
const dyn_array_min = 1;
const dyn_array_max = 10;

module.exports = {

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

  seed: async function() {
    if (target_abs === undefined || target_con === undefined) {
      throw "Target contract is not loaded!";
    }
    if (attack_abs === undefined) {
      throw "Attack contract is not loaded!";
    }
    // Generate call sequence
    let callFun_list = await simple_callSequence(attack_abs.abi);
    // Execute call sequence
    let execResult_list = await exec_callSequence(callFun_list);
    return {
      callFuns: callFun_list,
      execResults: execResult_list
    };
  },

  fuzz: async function(ins_trace) {
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
    let dynDep = await tracer.buildDynDep(stmt_trace,
					  staticDep_attack,
					  staticDep_target);
    // console.log(dynDep);
    return stmt_trace;
  }
}

/// min <= r < max
function randomNum(min, max){
  var range = max - min;
  var rand = Math.random();
  var num = min + Math.floor(rand * range);
  return num;
}

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

async function getBalanceSum() {
  var sum = 0;
  for (var account of account_list) { 
    sum += await getBalance(account);
  }
  sum += await getBalance(attack_abs.address);

  return sum;
}

async function getBalanceAccount() {
  let bal = await getBalance(attack_abs.address);
  return bal;
}

async function getBalance(acc_address) {
  let bal = 0;
  let encode = web3.eth.abi.encodeFunctionCall(bookKeepingAbi, [acc_address]);

  await web3.eth.call({
    to: target_abs.address,
    data: encode}, function(err, result) {
      if (!err) {
	// console.log(result);
	if (web3.utils.isHex(result))
	  bal = web3.utils.toBN(result);
      }
    });

  return bal;
}

async function exec_callSequence(callSequence) {
  for (var call of callSequence) {
    let dao_bal_bf = await web3.eth.getBalance(target_abs.address);
    let dao_bal_sum_bf = await getBalanceSum();
    console.log("Balance sum before: " + dao_bal_sum_bf);
    let att_bal_bf = await web3.eth.getBalance(attack_abs.address);
    let att_bal_acc_bf = await getBalanceAccount();
    console.log("Balance account before: " + att_bal_acc_bf);
    
    await web3.eth.sendTransaction({ to: call.to,
                                     from: call.from,
                                     data: call.encode,
                                     gas: call.gas,
                                   }, function(error, hash) {
                                     if (!error)
                                       console.log("Transaction " + hash + " is successful!");
                                     else
                                       console.log(error);
                                   });
    
    let dao_bal_af = await web3.eth.getBalance(target_abs.address);
    let dao_bal_sum_af = await getBalanceSum();
    console.log("Balance sum after: " + dao_bal_sum_af);
    let att_bal_af = await web3.eth.getBalance(attack_abs.address);
    let att_bal_acc_af = await getBalanceAccount();
    console.log("Balance account after: " + att_bal_acc_af);
    
    // Asserting oracles
    // Balance Invariant
    assert.equal(dao_bal_bf - dao_bal_sum_bf,
                 dao_bal_af - dao_bal_sum_af,
                 "Balance invariant should always hold.");
    // Transaction Invariant
    assert.equal(att_bal_af - att_bal_bf,
                 att_bal_acc_bf - att_bal_acc_af,
                 "Transaction invariant should always hold.");
  }
  
  return "Test succeeded!";
}


async function gen_address(adds_type){
  if(adds_type.indexOf('[') == -1){
    /// primitive type
    /// TODO: use the default account
    return account_list[0];
  } else if(adds_type.indexOf('[]') != -1){
    /// dynamic array
    var adds_list = [];
    var adds_num = randomNum(dyn_array_min, dyn_array_max);
    var adds_index = 0;
    while(adds_index < adds_num){
      var account_index = randomNum(0, accounts.length);
      var account = accounts[account_index];
      adds_list.push(account);
      adds_index += 1;
    }
    return adds_list;
  } else{
    /// static array
    var adds_list = [];
    var left_index = adds_type.indexOf('[');
    var right_index = adds_type.indexOf(']');
    var adds_num = parseInt(adds_type.slice(left_index +1, right_index), 10);
    var adds_index = 0;
    while(adds_index < adds_num){
      var account_index = randomNum(0, accounts.length);
      var account = accounts[account_index];
      adds_list.push(account);
      adds_index += 1;
    }
    return adds_list;
  }
}


async function gen_uint(uint_type){
  var num_left = 4;
  var num_right = uint_type.indexOf('[');
  if(num_right == -1){
    num_right = uint_type.length;
  } 
  var byte_num = parseInt(uint_type.slice(num_left, num_right), 10) / 8;
  var byte_index = 0;
  var num_str = "0x"
  while(byte_index < byte_num){
    num_str += 'ff';
    byte_index += 1;
  }
  var num_max = parseInt(num_str, 16);
  if(uint_type.indexOf('[') == -1){
    /// primitive type
    var value = "" + randomNum(0, num_max);
    return value;
  } else if(adds_type.indexOf('[]') != -1){
    /// dynamic array
    var value_list = [];
    var value_num = randomNum(dyn_array_min, dyn_array_max);
    var value_index = 0;
    while(value_index < value_num){
      var value = "" + randomNum(0, num_max);
      value_list.push(value);
      value_index += 1;
    }
    return value_list;
  } else{
    /// static array
    var adds_list = [];
    var left_index = uint_type.indexOf('[');
    var right_index = uint_type.indexOf(']');
    var value_num = parseInt(uint_type.slice(left_index +1, right_index), 10);
    var value_index = 0;
    while(value_index < value_num){
      var value = "" + randomNum(0, num_max);
      value_list.push(value);
      value_index += 1;
    }
    return value_list;
  }
}

async function gen_callInput(abi) {
  let param_list = [];  
  abi.inputs.forEach(function(param) {
    if (param.type.indexOf('address') == 0) {
      param_list.push(gen_address(param.type));
    } else if (param.type.indexOf('uint') == 0){
      param_list.push(gen_uint(param.type));
    } else {
      // default parameter
      param_list.push(0);
    }
  });
  return param_list;
}

async function gen_callGas(){
  var gas_limit = "" + randomNum(gas_min, gas_max);
  return gas_limit;
}

async function gen_callFun(abi) {
  let parameters; 
  let gasLimit;
  gen_callInput(abi).then(function(param_list) {
      parameters = param_list;
  });
  gen_callGas().then(function(gas_limit) {
      gasLimit = gas_limit;
  });

  let callFun = {
    from: accounts[0],
    to: attack_abs.address,
    gas: gasLimit,
    func: abi.name,
    param: parameters,
    encode: web3.eth.abi.encodeFunctionCall(abi, parameters)
  }
  return callFun;
}

async function seed_callSequence(abis) {
  let call_sequence = [];
  let cand_sequence = [];
  abis.forEach(function(abi) {
    /// abi.constant == true would not change state variables
    if (abi.type === 'function' && abi.constant == false)
      cand_sequence.push(abi);
  });
  
  var sequence_len = randomNum(1, sequence_maxLen);
  var sequence_index = 0;
  while (sequence_index < sequence_len){
    var call_index = randomNum(0, cand_sequence.length);
    var abi = cand_sequence[call_index];
    let callfun = await gen_callFun(abi);
    console.log(callfun);
    call_sequence.push(callFun);
    sequence_index += 1;
  }
  return call_sequence;
}

async function generateFunctionInputs(abi) {
  if (abi.constant) return;
  if (abi.type != 'function') return;

  let parameters = [];  
  abi.inputs.forEach(function(param) {
    if (param.type == 'address') {
      parameters.push(attack_abs.address);
    } else if (param.type == 'uint256') {
      parameters.push(web3.utils.toWei('1', 'ether'));
    } else {
      // default parameter
      parameters.push(0);
    }
  });

  let call = {
    from: account_list[0],
    to: attack_abs.address,
    gas: '1000000',
    func: abi.name,
    param: parameters,
    encode: web3.eth.abi.encodeFunctionCall(abi, parameters)
  }
  return call;
}

async function simple_callSequence(abis) {
  let calls = [];
  abis.forEach(function(abi) {
    if (abi.constant || abi.type != 'function')
      return;

    if (abi.name == 'donate' || abi.name == 'withdraw') {
      generateFunctionInputs(abi).then(function(call) {
        calls.push(call);
      })
    }
  });
  
  return calls;
}
