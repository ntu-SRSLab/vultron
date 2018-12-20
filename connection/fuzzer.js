const contract = require('truffle-contract');
const assert = require('assert');
const tracer = require('./EVM2Code');

// truffle-contract abstractions
var TargetContract;
var AttackContract;
// web3 abstractions
var web3;
var target, attack;
var target_con;
var accounts;
// tracer abstractions
var target_map;
var attack_map;

module.exports = {

  load: async function(targetPath, attackPath, callback) {
    var self = this;
    web3 = self.web3;
    
    const target_artifact = require(targetPath);
    TargetContract = contract(target_artifact);
    TargetContract.setProvider(self.web3.currentProvider);
    const attack_artifact = require(attackPath);
    AttackContract = contract(attack_artifact);
    AttackContract.setProvider(self.web3.currentProvider);

    // This is workaround: https://github.com/trufflesuite/truffle-contract/issues/57
    if (typeof TargetContract.currentProvider.sendAsync !== "function") {
      TargetContract.currentProvider.sendAsync = function() {
        return TargetContract.currentProvider.send.apply(
          TargetContract.currentProvider, arguments
        );
      };
    }
    
    if (typeof AttackContract.currentProvider.sendAsync !== "function") {
      AttackContract.currentProvider.sendAsync = function() {
        return AttackContract.currentProvider.send.apply(
          AttackContract.currentProvider, arguments
        );
      };
    }

    try {
      target = await TargetContract.deployed();
      attack = await AttackContract.deployed();
      target_con = await new web3.eth.Contract(target.abi, target.address);
      accounts = await web3.eth.getAccounts();

      target_map = await tracer.buildInsMap(
        target_artifact.sourcePath,
				target_artifact.deployedBytecode,
				target_artifact.deployedSourceMap,
				target_artifact.source);
      attack_map = await tracer.buildInsMap(
        attack_artifact.sourcePath,
				attack_artifact.deployedBytecode,
				attack_artifact.deployedSourceMap,
				attack_artifact.source);
      
      console.log(tracer.buildInsMap);
      console.log(target_map);
    } catch (e) {
      console.log(e);
      callback(e.message);
      return;
    }

    callback({
      accs: accounts,
      target: target.address,
      attack: attack.address
    });
  },

  seed: async function(callback) {
    if (target === undefined || target_con === undefined) {
      callback("Target contract is not loaded!");
      return;
    }

    if (attack === undefined) {
      callback("Attack contract is not loaded!");
      return;
    }

    // Generate call sequence
    let sequence = await generateCallSequence(attack.abi);
    // Execute call sequence
    let result = await executeCallSequence(sequence);

    callback({
      calls: sequence,
      status: result
    });
  },

  fuzz: async function(trace, callback) {
    if (target === undefined || target_con === undefined) {
      callback("Target contract is not loaded!");
      return;
    }

    if (attack === undefined) {
      callback("Attack contract is not loaded!");
      return;
    }

    // TODO
    let mapped_trace = tracer.buildTraceMap(trace, attack_map, target_map);
    callback(mapped_trace);
  }
}

async function getBalanceSum() {
  let sum = await target_con.methods.vultron_bal_sum().call();
  return sum;
}

async function getBalanceAccount() {
  let bal = await target_con.methods.vultron_bal_account(attack.address).call();
  return bal;
}

async function executeCallSequence(sequence) {

  for (const s of sequence) {
    try {
      let dao_bal_bf = await web3.eth.getBalance(target.address);
      let dao_bal_sum_bf = await getBalanceSum();
      console.log("Balance sum before: " + dao_bal_sum_bf);
      let att_bal_bf = await web3.eth.getBalance(attack.address);
      let att_bal_acc_bf = await getBalanceAccount();
      console.log("Balance account before: " + att_bal_acc_bf);
      
      await web3.eth.sendTransaction({ to: s.to,
				       from: s.from,
				       data: s.encode,
				       gas: s.gas,
     				     }, function(error, hash) {
     				       if (!error)
     					 console.log("Transaction " + hash + " is successful!");
				       else
					 console.log(error);
     				     });
      
      let dao_bal_af = await web3.eth.getBalance(target.address);
      let dao_bal_sum_af = await getBalanceSum();
      console.log("Balance sum after: " + dao_bal_sum_af);
      let att_bal_af = await web3.eth.getBalance(attack.address);
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
    } catch(e) {
      console.log(e);
      return e.message;
    }
  }
  
  return "Test succeeded!";
}

async function generateFunctionInputs(abi) {
  if (abi.constant) return;
  if (abi.type != 'function') return;

  let parameters = [];  
  abi.inputs.forEach(function(param) {
    if (param.type == 'address') {
      parameters.push(attack.address);
    } else if (param.type == 'uint256') {
      parameters.push(web3.utils.toWei('1', 'ether'));
    } else {
      // default parameter
      parameters.push(0);
    }
  });

  let call = {
    from: accounts[0],
    to: attack.address,
    gas: '1000000',
    func: abi.name,
    param: parameters,
    encode: web3.eth.abi.encodeFunctionCall(abi, parameters)
  }
  return call;
}

async function generateCallSequence(abis) {
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
