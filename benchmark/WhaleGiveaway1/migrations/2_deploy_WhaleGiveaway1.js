const WhaleGiveaway1 = artifacts.require("WhaleGiveaway1"); 
const Attack_WhaleGiveaway10 = artifacts.require("Attack_WhaleGiveaway10"); 
const Attack_WhaleGiveaway11 = artifacts.require("Attack_WhaleGiveaway11"); 
const Attack_WhaleGiveaway12 = artifacts.require("Attack_WhaleGiveaway12"); 

module.exports = function(deployer) { 
	deployer.deploy(WhaleGiveaway1) 
	.then(function() {
		return deployer.deploy(Attack_WhaleGiveaway10, WhaleGiveaway1.address, {value: web3.toWei(100000, "ether")}); 
	}).then(function() {
		return deployer.deploy(Attack_WhaleGiveaway11, WhaleGiveaway1.address, {value: web3.toWei(100000, "ether")}); 
	}).then(function() {
		return deployer.deploy(Attack_WhaleGiveaway12, WhaleGiveaway1.address, {value: web3.toWei(100000, "ether")}); 
	});
}