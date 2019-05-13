const SimpleDAO = artifacts.require("SimpleDAO"); 
const Attack_SimpleDAO0 = artifacts.require("Attack_SimpleDAO0"); 
const Attack_SimpleDAO1 = artifacts.require("Attack_SimpleDAO1"); 
const Attack_SimpleDAO2 = artifacts.require("Attack_SimpleDAO2");

const Adoption = artifacts.require("Adoption");
const AdminInterface = artifacts.require("AdminInterface");
const EtherTower = artifacts.require("EtherTower");
const AmIOnTheFork = artifacts.require("AmIOnTheFork");
const ReplaySafeSplit = artifacts.require("ReplaySafeSplit");
const Etheramid = artifacts.require("Etheramid");


module.exports = function(deployer) {
	deployer.deploy(AmIOnTheFork).then(function() {
		return deployer.deploy(ReplaySafeSplit, AmIOnTheFork.address)})

	deployer.deploy(Adoption);
	deployer.deploy(AdminInterface);
	deployer.deploy(EtherTower);
	deployer.deploy(Etheramid);

	deployer.deploy(SimpleDAO)
	.then(function() {
    return deployer.deploy(Attack_SimpleDAO0, SimpleDAO.address, {value: web3.toWei(10000000000000, "ether")});
  }).then(function() {
    return deployer.deploy(Attack_SimpleDAO1, SimpleDAO.address, {value: web3.toWei(10000000000000, "ether")});
  }).then(function() {
    return deployer.deploy(Attack_SimpleDAO2, SimpleDAO.address, {value: web3.toWei(10000000000000, "ether")});
  });
}