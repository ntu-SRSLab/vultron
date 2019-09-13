const HFConditionalTransfer = artifacts.require("HFConditionalTransfer"); 
const Attack_HFConditionalTransfer0 = artifacts.require("Attack_HFConditionalTransfer0"); 

module.exports = function(deployer) { 
	deployer.deploy(HFConditionalTransfer) 
	.then(function() {
		return deployer.deploy(Attack_HFConditionalTransfer0, HFConditionalTransfer.address, {value: web3.toWei(100000, "ether")}); 
	});
}