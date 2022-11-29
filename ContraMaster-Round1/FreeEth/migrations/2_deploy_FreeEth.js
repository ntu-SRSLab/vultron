const FreeEth = artifacts.require("FreeEth"); 
const Attack_FreeEth0 = artifacts.require("Attack_FreeEth0"); 
const Attack_FreeEth1 = artifacts.require("Attack_FreeEth1"); 
const Attack_FreeEth2 = artifacts.require("Attack_FreeEth2"); 

module.exports = function(deployer) { 
	deployer.deploy(FreeEth) 
	.then(function() {
		return deployer.deploy(Attack_FreeEth0, FreeEth.address, {value: web3.toWei(100000, "ether")}); 
	}).then(function() {
		return deployer.deploy(Attack_FreeEth1, FreeEth.address, {value: web3.toWei(100000, "ether")}); 
	}).then(function() {
		return deployer.deploy(Attack_FreeEth2, FreeEth.address, {value: web3.toWei(100000, "ether")}); 
	});
}