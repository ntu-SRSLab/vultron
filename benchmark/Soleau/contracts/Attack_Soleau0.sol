pragma solidity ^0.4.19;

import "/home/hjwang/Tools/ContraMaster/contracts/Soleau.sol";

contract Attack_Soleau0 {

  Soleau public target_contract;

  function Attack_Soleau0(address _targetContract) public payable {
      target_contract = Soleau(_targetContract);
  } 

  function vultron_record(uint256 vultron_amount, string hash) public payable{
    target_contract.record.value(vultron_amount)(hash);
  } 

  function() public payable {
    revert();
  }
} 
