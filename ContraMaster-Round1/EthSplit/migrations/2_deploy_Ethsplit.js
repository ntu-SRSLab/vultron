const Ethsplit = artifacts.require("Ethsplit"); 
const AmIOnTheFork = artifacts.require("AmIOnTheFork"); 
const Attack_Ethsplit0 = artifacts.require("Attack_Ethsplit0"); 

module.exports = function(deployer) { 
	deployer.deploy(Ethsplit) 
	.then(function() {
		return deployer.deploy(Attack_Ethsplit0, Ethsplit.address, {value: web3.toWei(100000, "ether")}); 
	});
}