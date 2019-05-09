pragma solidity ^0.4.19;

import "/home/osboxes/Develop/vultron/contracts/ABToken.sol";

contract Attack_ABToken3 {

  ABToken public target_contract;

  function Attack_ABToken3(address _targetContract) public payable {
      target_contract = ABToken(_targetContract);
  } 

  function vultron_approve(address _spender, uint256 _value) public {
    target_contract.approve(_spender, _value);
  } 

  function vultron_transferFrom(address _from, address _to, uint256 _value) public {
    target_contract.transferFrom(_from, _to, _value);
  } 

  function vultron_transfer(address _to, uint256 _value) public {
    target_contract.transfer(_to, _value);
  } 

  function vultron_approveAndCall(address _spender, uint256 _value, bytes _extraData) public {
    target_contract.approveAndCall(_spender, _value, _extraData);
  } 

  function() public payable {
    revert();
  }
} 
