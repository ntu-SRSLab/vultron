const Forwarder = artifacts.require("Forwarder"); 
const ERC20Interface = artifacts.require("ERC20Interface"); 
const Attack_Forwarder0 = artifacts.require("Attack_Forwarder0"); 
const Attack_Forwarder1 = artifacts.require("Attack_Forwarder1"); 

module.exports = function(deployer) { 
	deployer.deploy(Forwarder) 
	.then(function() {
		return deployer.deploy(Attack_Forwarder0, Forwarder.address, {value: web3.toWei(100000, "ether")}); 
	}).then(function() {
		return deployer.deploy(Attack_Forwarder1, Forwarder.address, {value: web3.toWei(100000, "ether")}); 
	});
}