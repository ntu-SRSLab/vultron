const MultiplicatorX4 = artifacts.require("MultiplicatorX4"); 
const Attack_MultiplicatorX40 = artifacts.require("Attack_MultiplicatorX40"); 
const Attack_MultiplicatorX41 = artifacts.require("Attack_MultiplicatorX41"); 

module.exports = function(deployer) { 
	deployer.deploy(MultiplicatorX4) 
	.then(function() {
		return deployer.deploy(Attack_MultiplicatorX40, MultiplicatorX4.address, {value: web3.toWei(100000, "ether")}); 
	}).then(function() {
		return deployer.deploy(Attack_MultiplicatorX41, MultiplicatorX4.address, {value: web3.toWei(100000, "ether")}); 
	});
}