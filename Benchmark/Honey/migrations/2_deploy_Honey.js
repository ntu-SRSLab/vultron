const Honey = artifacts.require("Honey"); 
const Attack_Honey0 = artifacts.require("Attack_Honey0"); 
const Attack_Honey1 = artifacts.require("Attack_Honey1"); 
const Attack_Honey2 = artifacts.require("Attack_Honey2"); 

module.exports = function(deployer) { 
	deployer.deploy(Honey) 
	.then(function() {
		return deployer.deploy(Attack_Honey0, Honey.address, {value: web3.toWei(100000, "ether")}); 
	}).then(function() {
		return deployer.deploy(Attack_Honey1, Honey.address, {value: web3.toWei(100000, "ether")}); 
	}).then(function() {
		return deployer.deploy(Attack_Honey2, Honey.address, {value: web3.toWei(100000, "ether")}); 
	});
}