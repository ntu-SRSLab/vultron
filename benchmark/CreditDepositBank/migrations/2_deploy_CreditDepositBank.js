const CreditDepositBank = artifacts.require("CreditDepositBank"); 
const Attack_CreditDepositBank0 = artifacts.require("Attack_CreditDepositBank0"); 
const Attack_CreditDepositBank1 = artifacts.require("Attack_CreditDepositBank1"); 
const Attack_CreditDepositBank2 = artifacts.require("Attack_CreditDepositBank2"); 
const Attack_CreditDepositBank3 = artifacts.require("Attack_CreditDepositBank3"); 
const Attack_CreditDepositBank4 = artifacts.require("Attack_CreditDepositBank4"); 

module.exports = function(deployer) { 
	deployer.deploy(CreditDepositBank) 
	.then(function() {
		return deployer.deploy(Attack_CreditDepositBank0, CreditDepositBank.address, {value: web3.toWei(100000, "ether")}); 
	}).then(function() {
		return deployer.deploy(Attack_CreditDepositBank1, CreditDepositBank.address, {value: web3.toWei(100000, "ether")}); 
	}).then(function() {
		return deployer.deploy(Attack_CreditDepositBank2, CreditDepositBank.address, {value: web3.toWei(100000, "ether")}); 
	}).then(function() {
		return deployer.deploy(Attack_CreditDepositBank3, CreditDepositBank.address, {value: web3.toWei(100000, "ether")}); 
	}).then(function() {
		return deployer.deploy(Attack_CreditDepositBank4, CreditDepositBank.address, {value: web3.toWei(100000, "ether")}); 
	});
}