const { getWeb3, getContractInstance } = require("./helpers")
const web3 = getWeb3()
const getInstance = getContractInstance(web3)

var SimpleDAO = artifacts.require("SimpleDAO");
var AttackDAO = artifacts.require("AttackDAO");

contract('SimpleDAO', function(accounts) {

  it("Fuzz SimpleDAO contract", function() {
    var dao;
    var att;
    
    return SimpleDAO.deployed().then(function(instance) {
      dao = instance;
    }).then(function() {
      AttackDAO.deployed().then(function(instance) {
        att = instance;
        console.log(att.address);
      });
      console.log(dao.address);
      //dao.sendTransaction('donate', { from: att })
    });
  });
});
