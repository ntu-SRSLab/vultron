const Private_accumulation_fund = artifacts.require("Private_accumulation_fund"); 
const Log = artifacts.require("Log"); 
const Attack_Private_accumulation_fund0 = artifacts.require("Attack_Private_accumulation_fund0"); 
const Attack_Private_accumulation_fund1 = artifacts.require("Attack_Private_accumulation_fund1"); 
const Attack_Private_accumulation_fund2 = artifacts.require("Attack_Private_accumulation_fund2"); 

module.exports = function(deployer) { 
	deployer.deploy(Log)
	.then(function() {
		return deployer.deploy(Private_accumulation_fund, Log.address); 
	}).then(function() {
		return deployer.deploy(Attack_Private_accumulation_fund0, Private_accumulation_fund.address, {value: web3.toWei(100000, "ether")}); 
	}).then(function() {
		return deployer.deploy(Attack_Private_accumulation_fund1, Private_accumulation_fund.address, {value: web3.toWei(100000, "ether")}); 
	}).then(function() {
		return deployer.deploy(Attack_Private_accumulation_fund2, Private_accumulation_fund.address, {value: web3.toWei(100000, "ether")}); 
	});
}