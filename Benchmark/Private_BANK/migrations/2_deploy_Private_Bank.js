const Private_Bank = artifacts.require("Private_Bank"); 
const Log = artifacts.require("Log"); 
const Attack_Private_Bank0 = artifacts.require("Attack_Private_Bank0"); 
const Attack_Private_Bank1 = artifacts.require("Attack_Private_Bank1"); 
const Attack_Private_Bank2 = artifacts.require("Attack_Private_Bank2"); 

module.exports = function(deployer) { 
	deployer.deploy(Log)
	.then(function() {
		return deployer.deploy(Private_Bank, Log.address); 
	}).then(function() {
		return deployer.deploy(Attack_Private_Bank0, Private_Bank.address, {value: web3.toWei(100000, "ether")}); 
	}).then(function() {
		return deployer.deploy(Attack_Private_Bank1, Private_Bank.address, {value: web3.toWei(100000, "ether")}); 
	}).then(function() {
		return deployer.deploy(Attack_Private_Bank2, Private_Bank.address, {value: web3.toWei(100000, "ether")}); 
	});
}