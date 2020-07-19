pragma solidity ^0.4.19;

import "/home/hjwang/Tools/ContraMaster/contracts/HFConditionalTransfer.sol";

contract Attack_HFConditionalTransfer0 {

  HFConditionalTransfer public target_contract;

  function Attack_HFConditionalTransfer0(address _targetContract) public payable {
      target_contract = HFConditionalTransfer(_targetContract);
  } 

  function vultron_transferIfHF(uint256 vultron_amount, address to) public payable{
    target_contract.transferIfHF.value(vultron_amount)(to);
  } 

  function vultron_transferIfNoHF(uint256 vultron_amount, address to) public payable{
    target_contract.transferIfNoHF.value(vultron_amount)(to);
  } 

  function() public payable {
    revert();
  }
} 
