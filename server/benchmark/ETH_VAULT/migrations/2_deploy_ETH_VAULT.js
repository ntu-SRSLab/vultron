const ETH_VAULT = artifacts.require("ETH_VAULT"); 
const Log = artifacts.require("Log"); 
const Attack_ETH_VAULT0 = artifacts.require("Attack_ETH_VAULT0"); 
const Attack_ETH_VAULT1 = artifacts.require("Attack_ETH_VAULT1"); 
const Attack_ETH_VAULT2 = artifacts.require("Attack_ETH_VAULT2"); 

module.exports = function(deployer) { 
	deployer.deploy(Log)
	.then(function() {
		return deployer.deploy(ETH_VAULT, Log.address); 
	}).then(function() {
		return deployer.deploy(Attack_ETH_VAULT0, ETH_VAULT.address, {value: web3.toWei(100000, "ether")}); 
	}).then(function() {
		return deployer.deploy(Attack_ETH_VAULT1, ETH_VAULT.address, {value: web3.toWei(100000, "ether")}); 
	}).then(function() {
		return deployer.deploy(Attack_ETH_VAULT2, ETH_VAULT.address, {value: web3.toWei(100000, "ether")}); 
	});
}

