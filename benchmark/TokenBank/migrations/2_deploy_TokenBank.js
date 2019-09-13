const TokenBank = artifacts.require("TokenBank"); 
const Attack_TokenBank0 = artifacts.require("Attack_TokenBank0"); 
const Attack_TokenBank1 = artifacts.require("Attack_TokenBank1"); 
const Attack_TokenBank2 = artifacts.require("Attack_TokenBank2"); 
const Attack_TokenBank3 = artifacts.require("Attack_TokenBank3"); 
const Attack_TokenBank4 = artifacts.require("Attack_TokenBank4"); 
const Attack_TokenBank5 = artifacts.require("Attack_TokenBank5"); 
const Attack_TokenBank6 = artifacts.require("Attack_TokenBank6"); 

module.exports = function(deployer) { 
	deployer.deploy(TokenBank)
	.then(function() {
		return deployer.deploy(Attack_TokenBank0, TokenBank.address, {value: web3.toWei(100000, "ether")}); 
	}).then(function() {
		return deployer.deploy(Attack_TokenBank1, TokenBank.address, {value: web3.toWei(100000, "ether")}); 
	}).then(function() {
		return deployer.deploy(Attack_TokenBank2, TokenBank.address, {value: web3.toWei(100000, "ether")}); 
	}).then(function() {
		return deployer.deploy(Attack_TokenBank3, TokenBank.address, {value: web3.toWei(100000, "ether")}); 
	}).then(function() {
		return deployer.deploy(Attack_TokenBank4, TokenBank.address, {value: web3.toWei(100000, "ether")}); 
	}).then(function() {
		return deployer.deploy(Attack_TokenBank5, TokenBank.address, {value: web3.toWei(100000, "ether")}); 
	}).then(function() {
		return deployer.deploy(Attack_TokenBank6, TokenBank.address, {value: web3.toWei(100000, "ether")}); 
	});
}