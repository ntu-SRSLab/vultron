const Pie = artifacts.require("Pie"); 
const Attack_Pie0 = artifacts.require("Attack_Pie0"); 
const Attack_Pie1 = artifacts.require("Attack_Pie1"); 
const Attack_Pie2 = artifacts.require("Attack_Pie2"); 

module.exports = function(deployer) { 
	deployer.deploy(Pie) 
	.then(function() {
		return deployer.deploy(Attack_Pie0, Pie.address, {value: web3.toWei(100000, "ether")}); 
	}).then(function() {
		return deployer.deploy(Attack_Pie1, Pie.address, {value: web3.toWei(100000, "ether")}); 
	}).then(function() {
		return deployer.deploy(Attack_Pie2, Pie.address, {value: web3.toWei(100000, "ether")}); 
	});
}