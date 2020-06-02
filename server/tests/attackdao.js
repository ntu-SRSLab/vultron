const { getWeb3, getContractInstance } = require("./helpers")
const web3 = getWeb3()
const getInstance = getContractInstance(web3)

var AttackDAO = artifacts.require("AttackDAO");

contract('AttackDAO', function(accounts) {

  it("Enable SimpleDAO attack", function() {
    var att;    
    return AttackDAO.deployed().then(function(instance) {
      att = instance;
      return web3.eth.getBalance(att.address);
    }).then(function(balance) {
      assert.equal(balance, '2000000000000000000');
    }).then(function() {
      att.attack();
    }).then(function() {
      return web3.eth.getBalance(att.address);
    }).then(function(balance) {
      assert.equal(balance, '5000000000000000000');
    });
  });
});
