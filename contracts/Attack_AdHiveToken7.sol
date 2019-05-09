pragma solidity ^0.4.19;

import "/home/osboxes/Develop/vultron/contracts/AdHiveToken.sol";

contract Attack_AdHiveToken7 {

  AdHiveToken public target_contract;

  function Attack_AdHiveToken7(address _targetContract) public payable {
      target_contract = AdHiveToken(_targetContract);
  } 

  function vultron_approve(address _spender, uint256 _value) public {
    target_contract.approve(_spender, _value);
  } 

  function vultron_transferFrom(address _from, address _to, uint256 _value) public {
    target_contract.transferFrom(_from, _to, _value);
  } 

  function vultron_burn(uint256 burnAmount) public {
    target_contract.burn(burnAmount);
  } 

  function vultron_upgrade(uint256 value) public {
    target_contract.upgrade(value);
  } 

  function vultron_transfer(address _to, uint256 _value) public {
    target_contract.transfer(_to, _value);
  } 

  function vultron_addApproval(address _spender, uint256 _addedValue) public {
    target_contract.addApproval(_spender, _addedValue);
  } 

  function vultron_transfer(address _to, uint256 _value, bytes _data) public {
    target_contract.transfer(_to, _value, _data);
  } 

  function vultron_setUpgradeAgent(address agent) public {
    target_contract.setUpgradeAgent(agent);
  } 

  function vultron_subApproval(address _spender, uint256 _subtractedValue) public {
    target_contract.subApproval(_spender, _subtractedValue);
  } 

  function vultron_setUpgradeMaster(address master) public {
    target_contract.setUpgradeMaster(master);
  } 

  function vultron_transferOwnership(address newOwner) public {
    target_contract.transferOwnership(newOwner);
  } 

  function vultron_mintingFinish() public {
    target_contract.mintingFinish();
  } 

  function vultron_transferPrivileged(address _to, uint256 _value) public {
    target_contract.transferPrivileged(_to, _value);
  } 

  function vultron_transferFromPrivileged(address _from, address _to, uint256 _value) public {
    target_contract.transferFromPrivileged(_from, _to, _value);
  } 

  function vultron_mint(address receiver, uint256 amount) public {
    target_contract.mint(receiver, amount);
  } 

  function vultron_setMintAgent(address addr, bool state) public {
    target_contract.setMintAgent(addr, state);
  } 

  function() public payable {
    target_contract.mintingFinish();
  }
} 
