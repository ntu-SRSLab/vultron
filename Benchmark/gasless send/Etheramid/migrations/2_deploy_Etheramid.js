const Etheramid = artifacts.require("Etheramid"); 
const Attack_Etheramid0 = artifacts.require("Attack_Etheramid0"); 

module.exports = function(deployer) { 
	deployer.deploy(Etheramid) 
	.then(function() {
		return deployer.deploy(Attack_Etheramid0, Etheramid.address, {value: web3.toWei(100000, "ether")}); 
	});
}