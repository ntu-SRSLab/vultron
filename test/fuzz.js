const { getWeb3, getContractInstance } = require("./helpers")
const web3 = getWeb3()
const getInstance = getContractInstance(web3)

var SimpleDAO = artifacts.require("SimpleDAO");
var AttackDAO = artifacts.require("AttackDAO");

contract('SimpleDAO', function(accounts) {

  it("Fuzz SimpleDAO contract", async () => {
    let dao = await SimpleDAO.deployed();
    let att = await AttackDAO.deployed();
    let att_con = await new web3.eth.Contract(att.abi, att.address);
    
    let balance = await web3.eth.getBalance(att.address);
    let balance_before = balance;

    // Generate call sequence
    let payload1 = web3.eth.abi.encodeFunctionCall(att.abi[3], [att.address,
								web3.utils.toWei('1', 'ether')]);
    let payload2 = web3.eth.abi.encodeFunctionCall(att.abi[4], [web3.utils.toWei('1', 'ether')]);
    
    let sequence = [payload1, payload2];
    
    while (sequence.length > 0) {
      let payload = seeds.shift();
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

    assert.equal(balance_before, "2000000000000000000", "Initial balance");
    assert.equal(balance_after, "5000000000000000000", "Final balance");
  });
});
