const SimpleDAO = artifacts.require("SimpleDAO"); 
const Attack_SimpleDAO0 = artifacts.require("Attack_SimpleDAO0"); 
const Attack_SimpleDAO1 = artifacts.require("Attack_SimpleDAO1"); 
const Attack_SimpleDAO2 = artifacts.require("Attack_SimpleDAO2"); 

module.exports = function(deployer) { 
	deployer.deploy(SimpleDAO) 
	.then(function() {
		return deployer.deploy(Attack_SimpleDAO0, SimpleDAO.address, {value: web3.toWei(10000000000000, "ether")}); 
	}).then(function() {
		return deployer.deploy(Attack_SimpleDAO1, SimpleDAO.address, {value: web3.toWei(10000000000000, "ether")}); 
	}).then(function() {
		return deployer.deploy(Attack_SimpleDAO2, SimpleDAO.address, {value: web3.toWei(10000000000000, "ether")}); 
	});
}