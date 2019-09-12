const LZLCoin = artifacts.require("LZLCoin"); 
const Attack_LZLCoin0 = artifacts.require("Attack_LZLCoin0"); 
const Attack_LZLCoin1 = artifacts.require("Attack_LZLCoin1"); 
const Attack_LZLCoin2 = artifacts.require("Attack_LZLCoin2"); 
const Attack_LZLCoin3 = artifacts.require("Attack_LZLCoin3"); 
const Attack_LZLCoin4 = artifacts.require("Attack_LZLCoin4"); 
const Attack_LZLCoin5 = artifacts.require("Attack_LZLCoin5"); 

module.exports = function(deployer) { 
	deployer.deploy(LZLCoin, {value: web3.toWei(10000000000000, "ether")}) 
	.then(function() {
		return deployer.deploy(Attack_LZLCoin0, LZLCoin.address, {value: web3.toWei(10000000000000, "ether")}); 
	}).then(function() {
		return deployer.deploy(Attack_LZLCoin1, LZLCoin.address, {value: web3.toWei(10000000000000, "ether")}); 
	}).then(function() {
		return deployer.deploy(Attack_LZLCoin2, LZLCoin.address, {value: web3.toWei(10000000000000, "ether")}); 
	}).then(function() {
		return deployer.deploy(Attack_LZLCoin3, LZLCoin.address, {value: web3.toWei(10000000000000, "ether")}); 
	}).then(function() {
		return deployer.deploy(Attack_LZLCoin4, LZLCoin.address, {value: web3.toWei(10000000000000, "ether")}); 
	}).then(function() {
		return deployer.deploy(Attack_LZLCoin5, LZLCoin.address, {value: web3.toWei(10000000000000, "ether")}); 
	});
}