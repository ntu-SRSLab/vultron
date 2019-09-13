const Soleau = artifacts.require("Soleau"); 
const Attack_Soleau0 = artifacts.require("Attack_Soleau0"); 

module.exports = function(deployer) { 
	deployer.deploy(Soleau) 
	.then(function() {
		return deployer.deploy(Attack_Soleau0, Soleau.address, {value: web3.toWei(100000, "ether")}); 
	});
}