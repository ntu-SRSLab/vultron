pragma solidity ^0.4.19;

import "./SimpleLotto.sol";

contract Attack_SimpleLotto3 {

  SimpleLotto public target_contract;

  function Attack_SimpleLotto3(address _targetContract) public payable {
      target_contract = SimpleLotto(_targetContract);
  } 

  function vultron_play(address receiver, uint256 amount) public {
    target_contract.play(receiver, amount);
  } 

  function vultron_terminate() public {
    target_contract.terminate();
  } 

  function vultron_terminateAlt() public {
    target_contract.terminateAlt();
  } 

  function() public payable {
    revert();
  }
} 
