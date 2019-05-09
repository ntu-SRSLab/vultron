pragma solidity ^0.4.19;

import "/home/osboxes/Develop/vultron/contracts/AdverzToken.sol";

contract Attack_AdverzToken1 {

  AdverzToken public target_contract;

  function Attack_AdverzToken1(address _targetContract) public payable {
      target_contract = AdverzToken(_targetContract);
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

  function vultron_approveAndCall(address _spender, uint256 _value, bytes _extraData) public {
    target_contract.approveAndCall(_spender, _value, _extraData);
  } 

  function vultron_burn(uint256 _value) public {
    target_contract.burn(_value);
  } 

  function vultron_burnFrom(address _from, uint256 _value) public {
    target_contract.burnFrom(_from, _value);
  } 

  function() public payable {
    target_contract.transferFrom(this,  this,  10000);
  }
} 
