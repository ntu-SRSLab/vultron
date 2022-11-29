var SimpleDAO = artifacts.require("SimpleDAO");
var AttackDAO = artifacts.require("AttackDAO");

module.exports = function(deployer) {
  deployer.deploy(SimpleDAO, {value: web3.toWei(3, "ether")}).then(function() {
    return deployer.deploy(AttackDAO, SimpleDAO.address,
			   {value: web3.toWei(2, "ether")});
  });
}
