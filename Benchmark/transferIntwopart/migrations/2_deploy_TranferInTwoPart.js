const TranferInTwoPart = artifacts.require("TranferInTwoPart"); 
const Attack_TranferInTwoPart0 = artifacts.require("Attack_TranferInTwoPart0"); 

module.exports = function(deployer) { 
	deployer.deploy(TranferInTwoPart) 
	.then(function() {
		return deployer.deploy(Attack_TranferInTwoPart0, TranferInTwoPart.address, {value: web3.toWei(100000, "ether")}); 
	});
}