const SafeConditionalHFTransfer = artifacts.require("SafeConditionalHFTransfer"); 
const Attack_SafeConditionalHFTransfer0 = artifacts.require("Attack_SafeConditionalHFTransfer0"); 

module.exports = function(deployer) { 
	deployer.deploy(SafeConditionalHFTransfer) 
	.then(function() {
		return deployer.deploy(Attack_SafeConditionalHFTransfer0, SafeConditionalHFTransfer.address, {value: web3.toWei(100000, "ether")}); 
	});
}