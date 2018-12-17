const { getWeb3, getContractInstance } = require("./helpers")
const web3 = getWeb3()
const getInstance = getContractInstance(web3)

var SimpleDAO = artifacts.require("SimpleDAO");
var AttackDAO = artifacts.require("AttackDAO");

contract('SimpleDAO', function(accounts) {
  var dao;
  var att;
  
  SimpleDAO.deployed().then(function(ins) { dao = ins; });
  AttackDAO.deployed().then(function(ins) { att = ins; });
  
  it("Fuzz SimpleDAO contract", async () => {
    //let att_con = new web3.eth.Contract(att.abi, att.address);
    let balance = await web3.eth.getBalance(att.address);
    let balance_before = balance;

    // Generate call sequence
    //let payload1 = web3.eth.abi.encodeFunctionCall(att.abi[3], [att.address,
		//						web3.utils.toWei('1', 'ether')]);
    //let payload2 = web3.eth.abi.encodeFunctionCall(att.abi[4], [web3.utils.toWei('1', 'ether')]);
    let sequence = await generateCallSequence(att.abi);
    
    // Execute call sequence
    while (sequence.length > 0) {
      let payload = sequence.shift();
      await web3.eth.sendTransaction({ to: att.address,
				     from: accounts[0],
				     data: payload,
				     gas: '1000000',
     				   }, function(error, hash) {
     				     if (!error)
     				       console.log("Transaction " + hash + " is successful!");
				     else
				       console.log(error);
     				   });
    }
    
    balance = await web3.eth.getBalance(att.address);
    let balance_after = balance;

    // Assert oracles
    assert.equal(balance_before, "2000000000000000000", "Initial balance");
    assert.equal(balance_after, "5000000000000000000", "Final balance");
  });

  function generateFunctionInputs(abi) {
    if (abi.constant) return;
    if (abi.type != 'function') return;
    
    var parameters = [];
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
  
  function generateCallSequence(abis) {
    var calls = [];
    
    abis.forEach(function(abi) {
      if (abi.constant || abi.type != 'function')
        return;

      if (abi.name == 'donate' || abi.name == 'withdraw')
        calls.push(generateFunctionInputs(abi));
    });
    
    return calls;
  }
  
});
