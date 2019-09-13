const PIGGY_BANK = artifacts.require("PIGGY_BANK"); 
const Log = artifacts.require("Log"); 
const Attack_PIGGY_BANK0 = artifacts.require("Attack_PIGGY_BANK0"); 
const Attack_PIGGY_BANK1 = artifacts.require("Attack_PIGGY_BANK1"); 

module.exports = function(deployer) { 
	deployer.deploy(Log)
	.then(function() {
		return deployer.deploy(PIGGY_BANK, Log.address); 
	}).then(function() {
		return deployer.deploy(Attack_PIGGY_BANK0, PIGGY_BANK.address, {value: web3.toWei(100000, "ether")}); 
	}).then(function() {
		return deployer.deploy(Attack_PIGGY_BANK1, PIGGY_BANK.address, {value: web3.toWei(100000, "ether")}); 
	});
}