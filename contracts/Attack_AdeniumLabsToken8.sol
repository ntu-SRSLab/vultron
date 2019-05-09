pragma solidity ^0.4.19;

import "/home/osboxes/Develop/vultron/contracts/AdeniumLabsToken.sol";

contract Attack_AdeniumLabsToken8 {

  AdeniumLabsToken public target_contract;

  function Attack_AdeniumLabsToken8(address _targetContract) public payable {
      target_contract = AdeniumLabsToken(_targetContract);
  } 

  function vultron_approve(address _spender, uint256 _value) public {
    target_contract.approve(_spender, _value);
  } 

  function vultron_transferFrom(address _from, address _to, uint256 _value) public {
    target_contract.transferFrom(_from, _to, _value);
  } 

  function vultron_unpause() public {
    target_contract.unpause();
  } 

  function vultron_burn(uint256 _value) public {
    target_contract.burn(_value);
  } 

  function vultron_decreaseApproval(address _spender, uint256 _subtractedValue) public {
    target_contract.decreaseApproval(_spender, _subtractedValue);
  } 

  function vultron_pause() public {
    target_contract.pause();
  } 

  function vultron_transfer(address _to, uint256 _value) public {
    target_contract.transfer(_to, _value);
  } 

  function vultron_increaseApproval(address _spender, uint256 _addedValue) public {
    target_contract.increaseApproval(_spender, _addedValue);
  } 

  function vultron_transferOwnership(address newOwner) public {
    target_contract.transferOwnership(newOwner);
  } 

  function() public payable {
    revert();
  }
} 
