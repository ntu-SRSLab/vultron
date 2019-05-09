pragma solidity ^0.4.19;

import "/home/osboxes/Develop/vultron/contracts/AACToken.sol";

contract Attack_AACToken0 {

  AACToken public target_contract;

  function Attack_AACToken0(address _targetContract) public payable {
      target_contract = AACToken(_targetContract);
  } 

  function vultron_approve(address _spender, uint256 _value) public {
    target_contract.approve(_spender, _value);
  } 

  function vultron_transferFrom(address _from, address _to, uint256 _value) public {
    target_contract.transferFrom(_from, _to, _value);
  } 

  function vultron_decreaseApproval(address _spender, uint256 _subtractedValue) public {
    target_contract.decreaseApproval(_spender, _subtractedValue);
  } 

  function vultron_transfer(address _to, uint256 _value) public {
    target_contract.transfer(_to, _value);
  } 

  function vultron_increaseApproval(address _spender, uint256 _addedValue) public {
    target_contract.increaseApproval(_spender, _addedValue);
  } 

  function() public payable {
    target_contract.approve(this,  10000);
  }
} 
