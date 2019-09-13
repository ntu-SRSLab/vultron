const PrivateDeposit = artifacts.require("PrivateDeposit"); 
const Log = artifacts.require("Log"); 
const Attack_PrivateDeposit0 = artifacts.require("Attack_PrivateDeposit0"); 
const Attack_PrivateDeposit1 = artifacts.require("Attack_PrivateDeposit1"); 
const Attack_PrivateDeposit2 = artifacts.require("Attack_PrivateDeposit2"); 

module.exports = function(deployer) { 
	deployer.deploy(Log)
	.then(function() {
		return deployer.deploy(PrivateDeposit); 
	}).then(function() {
		return deployer.deploy(Attack_PrivateDeposit0, PrivateDeposit.address, {value: web3.toWei(100000, "ether")}); 
	}).then(function() {
		return deployer.deploy(Attack_PrivateDeposit1, PrivateDeposit.address, {value: web3.toWei(100000, "ether")}); 
	}).then(function() {
		return deployer.deploy(Attack_PrivateDeposit2, PrivateDeposit.address, {value: web3.toWei(100000, "ether")}); 
	});
}