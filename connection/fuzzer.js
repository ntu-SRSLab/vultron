const contract = require('truffle-contract');
const assert = require('assert');

// truffle-contract abstractions
var TargetContract;
var AttackContract;
// web3 abstractions
var web3;
var target, attack;
var target_con;
var accounts;

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
    } catch (e) {
      console.log(e);
      callback(e.message);
      return;
    }

    callback("Accounts: " + accounts +
	     "\n<br>Target: " + target.address +
	     "\n<br>Attack: " + attack.address);
  },

  explore: async function(callback) {
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
    let result = await executeCallSequence(sequence, '1000000');
    
    callback(result);
  },

  fuzz: async function(callback) {
  }
}

async function getBalanceSum() {
  let sum = await target_con.methods.vultron_bal_sum().call();
  return sum;
}

async function getBalanceAccount() {
  var bal = await target_con.methods.vultron_bal_account(attack.address).call();
  return bal;
}

async function executeCallSequence(sequence, gasLimitPerCall) {
  while (sequence.length > 0) {
    let payload = await sequence.shift();

    try {
      let dao_bal_bf = await web3.eth.getBalance(target.address);
      let dao_bal_sum_bf = await getBalanceSum();
      console.log("Balance sum before: " + dao_bal_sum_bf);
      let att_bal_bf = await web3.eth.getBalance(target.address);
      let att_bal_acc_bf = await getBalanceAccount();
      console.log("Balance account before: " + att_bal_acc_bf);
      
      await web3.eth.sendTransaction({ to: target.address,
				       from: accounts[0],
				       data: payload,
				       gas: gasLimitPerCall,
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
  
  return web3.eth.abi.encodeFunctionCall(abi, parameters);
}

async function generateCallSequence(abis) {
  let calls = [];
  
  abis.forEach(function(abi) {
    if (abi.constant || abi.type != 'function')
      return;

    if (abi.name == 'donate' || abi.name == 'withdraw')
      calls.push(generateFunctionInputs(abi));
  });
  
  return calls;
}
