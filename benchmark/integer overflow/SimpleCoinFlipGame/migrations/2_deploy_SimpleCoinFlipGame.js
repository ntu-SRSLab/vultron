const SimpleCoinFlipGame = artifacts.require("SimpleCoinFlipGame"); 
const Attack_SimpleCoinFlipGame0 = artifacts.require("Attack_SimpleCoinFlipGame0"); 
const Attack_SimpleCoinFlipGame1 = artifacts.require("Attack_SimpleCoinFlipGame1"); 
const Attack_SimpleCoinFlipGame2 = artifacts.require("Attack_SimpleCoinFlipGame2"); 

module.exports = function(deployer) { 
	deployer.deploy(SimpleCoinFlipGame) 
	.then(function() {
		return deployer.deploy(Attack_SimpleCoinFlipGame0, SimpleCoinFlipGame.address, {value: web3.toWei(100000, "ether")}); 
	}).then(function() {
		return deployer.deploy(Attack_SimpleCoinFlipGame1, SimpleCoinFlipGame.address, {value: web3.toWei(100000, "ether")}); 
	}).then(function() {
		return deployer.deploy(Attack_SimpleCoinFlipGame2, SimpleCoinFlipGame.address, {value: web3.toWei(100000, "ether")}); 
	});
}