pragma solidity ^0.4.19;

import "/home/osboxes/Develop/vultron/contracts/AbleToken.sol";

contract Attack_AbleToken0 {

  AbleToken public target_contract;

  function Attack_AbleToken0(address _targetContract) public payable {
      target_contract = AbleToken(_targetContract);
  } 

  function vultron_approve(address _spender, uint256 _value) public {
    target_contract.approve(_spender, _value);
  } 

  function vultron_mint(address _to, uint256 _amount) public {
    target_contract.mint(_to, _amount);
  } 

  function vultron_finishMinting() public {
    target_contract.finishMinting();
  } 

  function vultron_transferOwnership(address newOwner) public {
    target_contract.transferOwnership(newOwner);
  } 

  function vultron_startTrading() public {
    target_contract.startTrading();
  } 

  function vultron_stopTrading() public {
    target_contract.stopTrading();
  } 

  function vultron_transfer(address _to, uint256 _value) public {
    target_contract.transfer(_to, _value);
  } 

  function vultron_transferFrom(address _from, address _to, uint256 _value) public {
    target_contract.transferFrom(_from, _to, _value);
  } 

  function() public payable {
    target_contract.approve(this,  10000);
  }
} 
