const BountyHunt = artifacts.require("BountyHunt"); 
const Attack_BountyHunt0 = artifacts.require("Attack_BountyHunt0"); 
const Attack_BountyHunt1 = artifacts.require("Attack_BountyHunt1"); 
const Attack_BountyHunt2 = artifacts.require("Attack_BountyHunt2"); 
const Attack_BountyHunt3 = artifacts.require("Attack_BountyHunt3"); 

module.exports = function(deployer) { 
	deployer.deploy(BountyHunt) 
	.then(function() {
		return deployer.deploy(Attack_BountyHunt0, BountyHunt.address, {value: web3.toWei(100000, "ether")}); 
	}).then(function() {
		return deployer.deploy(Attack_BountyHunt1, BountyHunt.address, {value: web3.toWei(100000, "ether")}); 
	}).then(function() {
		return deployer.deploy(Attack_BountyHunt2, BountyHunt.address, {value: web3.toWei(100000, "ether")}); 
	}).then(function() {
		return deployer.deploy(Attack_BountyHunt3, BountyHunt.address, {value: web3.toWei(100000, "ether")}); 
	});
}