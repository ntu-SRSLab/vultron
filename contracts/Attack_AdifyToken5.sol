pragma solidity ^0.4.19;

import "/home/osboxes/Develop/vultron/contracts/AdifyToken.sol";

contract Attack_AdifyToken5 {

  AdifyToken public target_contract;

  function Attack_AdifyToken5(address _targetContract) public payable {
      target_contract = AdifyToken(_targetContract);
  } 

  function vultron_unpause() public {
    target_contract.unpause();
  } 

  function vultron_pause() public {
    target_contract.pause();
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

  function vultron_approve(address _spender, uint256 _value) public {
    target_contract.approve(_spender, _value);
  } 

  function() public payable {
    revert();
  }
} 
