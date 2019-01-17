const SimpleDAO = artifacts.require("SimpleDAO");
const AttackDAO = artifacts.require("AttackDAO");


module.exports = function(deployer) {
  deployer.deploy(SimpleDAO, {value: web3.toWei(10, "ether")}).then(function() {
    return deployer.deploy(AttackDAO, SimpleDAO.address, {value: web3.toWei(15, "ether")});
  });
}