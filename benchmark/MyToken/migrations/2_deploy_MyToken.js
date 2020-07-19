const MyToken = artifacts.require("MyToken"); 
const Attack_MyToken0 = artifacts.require("Attack_MyToken0"); 
const Attack_MyToken1 = artifacts.require("Attack_MyToken1"); 
const Attack_MyToken2 = artifacts.require("Attack_MyToken2"); 

module.exports = function(deployer) { 
	deployer.deploy(MyToken) 
	.then(function() {
		return deployer.deploy(Attack_MyToken0, MyToken.address, {value: web3.toWei(100000, "ether")}); 
	}).then(function() {
		return deployer.deploy(Attack_MyToken1, MyToken.address, {value: web3.toWei(100000, "ether")}); 
	}).then(function() {
		return deployer.deploy(Attack_MyToken2, MyToken.address, {value: web3.toWei(100000, "ether")}); 
	});
}