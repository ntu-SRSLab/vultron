pragma solidity ^0.4.19;

import "./Honey.sol";

contract Attack_Honey2 {

  Honey public target_contract;

  function Attack_Honey2(address _targetContract) public payable {
      target_contract = Honey(_targetContract);
  } 

  function vultron_GetFreebie(uint256 vultron_amount) public payable{
    target_contract.GetFreebie.value(vultron_amount)();
  } 

  function vultron_withdraw(uint256 vultron_amount) public payable{
    target_contract.withdraw.value(vultron_amount)();
  } 

  function vultron_Command(uint256 vultron_amount, address adr, bytes data) public payable{
    target_contract.Command.value(vultron_amount)(adr, data);
  } 

  function() public payable {
    revert();
  }
} 
