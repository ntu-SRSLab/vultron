pragma solidity ^0.4.19;

import "/home/hjwang/Tools/ContraMaster/contracts/CreditDepositBank.sol";

contract Attack_CreditDepositBank4 {

  CreditDepositBank public target_contract;

  function Attack_CreditDepositBank4(address _targetContract) public payable {
      target_contract = CreditDepositBank(_targetContract);
  } 

  function vultron_takeOver() public {
    target_contract.takeOver();
  } 

  function vultron_setManager(address _manager) public {
    target_contract.setManager(_manager);
  } 

  function vultron_withdraw(address client) public {
    target_contract.withdraw(client);
  } 

  function vultron_showBalance(address account) public {
    target_contract.showBalance(account);
  } 

  function vultron_close() public {
    target_contract.close();
  } 

  function vultron_deposit(uint256 vultron_amount) public payable{
    target_contract.deposit.value(vultron_amount)();
  } 

  function vultron_credit(uint256 vultron_amount) public payable{
    target_contract.credit.value(vultron_amount)();
  } 

  function() public payable {
    revert();
  }
} 
