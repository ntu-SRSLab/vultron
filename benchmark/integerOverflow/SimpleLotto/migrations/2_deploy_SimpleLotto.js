const SimpleLotto = artifacts.require("SimpleLotto"); 
const Attack_SimpleLotto0 = artifacts.require("Attack_SimpleLotto0"); 
const Attack_SimpleLotto1 = artifacts.require("Attack_SimpleLotto1"); 
const Attack_SimpleLotto2 = artifacts.require("Attack_SimpleLotto2"); 
const Attack_SimpleLotto3 = artifacts.require("Attack_SimpleLotto3"); 

module.exports = function(deployer) { 
	deployer.deploy(SimpleLotto) 
	.then(function() {
		return deployer.deploy(Attack_SimpleLotto0, SimpleLotto.address, {value: web3.toWei(100000, "ether")}); 
	}).then(function() {
		return deployer.deploy(Attack_SimpleLotto1, SimpleLotto.address, {value: web3.toWei(100000, "ether")}); 
	}).then(function() {
		return deployer.deploy(Attack_SimpleLotto2, SimpleLotto.address, {value: web3.toWei(100000, "ether")}); 
	}).then(function() {
		return deployer.deploy(Attack_SimpleLotto3, SimpleLotto.address, {value: web3.toWei(100000, "ether")}); 
	});
}