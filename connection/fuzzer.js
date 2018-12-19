const contract = require('truffle-contract');

module.exports = {
  start: async function(targetPath, attackPath, callback) {
    var self = this;

    const target_artifact = require(targetPath);
    const TargetContract = contract(target_artifact);
    TargetContract.setProvider(self.web3.currentProvider);
    const attack_artifact = require(attackPath);
    const AttackContract = contract(attack_artifact);
    AttackContract.setProvider(self.web3.currentProvider);

    // This is workaround: https://github.com/trufflesuite/truffle-contract/issues/57
    if (typeof TargetContract.currentProvider.sendAsync !== "function") {
      TargetContract.currentProvider.sendAsync = function() {
        return TargetContract.currentProvider.send.apply(
          TargetContract.currentProvider, arguments
        );
      };
    }
    
    if (typeof AttackContract.currentProvider.sendAsync !== "function") {
      AttackContract.currentProvider.sendAsync = function() {
        return AttackContract.currentProvider.send.apply(
          AttackContract.currentProvider, arguments
        );
      };
    }

    var target, attack;
    target = await TargetContract.deployed();
    attack = await AttackContract.deployed();

    callback("Target: " + target.address + "\n" + "Attack: " + attack.address);

    
  }

}
