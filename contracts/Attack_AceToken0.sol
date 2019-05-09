pragma solidity ^0.4.19;

import "/home/osboxes/Develop/vultron/contracts/AceToken.sol";

contract Attack_AceToken0 {

  AceToken public target_contract;

  function Attack_AceToken0(address _targetContract) public payable {
      target_contract = AceToken(_targetContract);
  } 

  function vultron_approve(address _spender, uint256 _value) public {
    target_contract.approve(_spender, _value);
  } 

  function vultron_finishMinting() public {
    target_contract.finishMinting();
  } 

  function vultron_transferOwnership(address newOwner) public {
    target_contract.transferOwnership(newOwner);
  } 

  function vultron_transfer(address _to, uint256 _value) public {
    target_contract.transfer(_to, _value);
  } 

  function vultron_transferFrom(address _from, address _to, uint256 _value) public {
    target_contract.transferFrom(_from, _to, _value);
  } 

  function vultron_toggleTransfer() public {
    target_contract.toggleTransfer();
  } 

  function vultron_toggleTransferFor(address _for) public {
    target_contract.toggleTransferFor(_for);
  } 

  function vultron_mint(address _to, uint256 _amount) public {
    target_contract.mint(_to, _amount);
  } 

  function vultron_increaseApproval(address _spender, uint256 _addedValue) public {
    target_contract.increaseApproval(_spender, _addedValue);
  } 

  function vultron_decreaseApproval(address _spender, uint256 _subtractedValue) public {
    target_contract.decreaseApproval(_spender, _subtractedValue);
  } 

  function() public payable {
    target_contract.approve(this,  10000);
  }
} 
