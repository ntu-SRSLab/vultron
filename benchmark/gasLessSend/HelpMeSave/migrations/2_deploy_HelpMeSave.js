const HelpMeSave = artifacts.require("HelpMeSave"); 
const Attack_HelpMeSave0 = artifacts.require("Attack_HelpMeSave0"); 
const Attack_HelpMeSave1 = artifacts.require("Attack_HelpMeSave1"); 
const Attack_HelpMeSave2 = artifacts.require("Attack_HelpMeSave2"); 
const Attack_HelpMeSave3 = artifacts.require("Attack_HelpMeSave3"); 

module.exports = function(deployer) { 
	deployer.deploy(HelpMeSave) 
	.then(function() {
		return deployer.deploy(Attack_HelpMeSave0, HelpMeSave.address, {value: web3.toWei(100000, "ether")}); 
	}).then(function() {
		return deployer.deploy(Attack_HelpMeSave1, HelpMeSave.address, {value: web3.toWei(100000, "ether")}); 
	}).then(function() {
		return deployer.deploy(Attack_HelpMeSave2, HelpMeSave.address, {value: web3.toWei(100000, "ether")}); 
	}).then(function() {
		return deployer.deploy(Attack_HelpMeSave3, HelpMeSave.address, {value: web3.toWei(100000, "ether")}); 
	});
}