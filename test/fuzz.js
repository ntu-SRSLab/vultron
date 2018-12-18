const { getWeb3, getContractInstance } = require("./helpers")
const web3 = getWeb3()
const getInstance = getContractInstance(web3)

var SimpleDAO = artifacts.require("SimpleDAO");
var AttackDAO = artifacts.require("AttackDAO");

contract('SimpleDAO', function(accounts) {
  var dao, att;
  
  SimpleDAO.deployed().then(function(ins) { dao = ins; });
  AttackDAO.deployed().then(function(ins) { att = ins; });
  
  it("Fuzz SimpleDAO contract", async () => {
    //let att_con = new web3.eth.Contract(att.abi, att.address);
    
    let iteration = 1;
    while (iteration-- > 0) {
      // Initial contract balance
      let initial_bal = await web3.eth.getBalance(att.address);
      
      // Generate call sequence
      let sequence = await generateCallSequence(att.abi);
      
      // Execute call sequence
      await executeCallSequence(sequence, '1000000');
      
      // Assert oracles
      let final_bal = await web3.eth.getBalance(att.address);

      assert.equal(initial_bal, "2000000000000000000", "Initial balance");
      assert.equal(final_bal, "5000000000000000000", "Final balance");
    }
  });

  async function executeCallSequence(sequence, gasLimitPerCall) {
    while (sequence.length > 0) {
      let payload = await sequence.shift();

      let dao_bal_bf = await web3.eth.getBalance(dao.address);
      
      await web3.eth.sendTransaction({ to: att.address,
				       from: accounts[0],
				       data: payload,
				       gas: gasLimitPerCall,
     				     }, function(error, hash) {
     				       if (!error)
     					 console.log("Transaction " + hash + " is successful!");
				       else
					 console.log(error);
     				     });

      let dao_bal_af = await web3.eth.getBalance(dao.address);
    }
    return;
  }
  
  async function generateFunctionInputs(abi) {
    if (abi.constant) return;
    if (abi.type != 'function') return;
    
    let parameters = [];
    abi.inputs.forEach(function(param) {
      if (param.type == 'address') {
        parameters.push(att.address);
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
  
});
