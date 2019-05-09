pragma solidity ^0.4.19;

import "/home/osboxes/Develop/vultron/contracts/AciToken.sol";

contract Attack_AciToken2 {

  AciToken public target_contract;

  function Attack_AciToken2(address _targetContract) public payable {
      target_contract = AciToken(_targetContract);
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

  function vultron_pause() public {
    target_contract.pause();
  } 

  function vultron_transfer(address _to, uint256 _value) public {
    target_contract.transfer(_to, _value);
  } 

  function vultron_transferOwnership(address newOwner) public {
    target_contract.transferOwnership(newOwner);
  } 

  function vultron_withdraw(address _toAddress, uint256 amount) public {
    target_contract.withdraw(_toAddress, amount);
  } 

  function vultron_setEthPrice(uint256 _tokenPrice) public {
    target_contract.setEthPrice(_tokenPrice);
  } 

  function vultron_generateTokens(address _reciever, uint256 _amount) public {
    target_contract.generateTokens(_reciever, _amount);
  } 

  function() public payable {
    target_contract.unpause();
  }
} 
