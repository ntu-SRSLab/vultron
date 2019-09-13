pragma solidity ^0.4.19;

import "/home/hjwang/Tools/ContraMaster/contracts/SimpleCoinFlipGame.sol";

contract Attack_SimpleCoinFlipGame2 {

  SimpleCoinFlipGame public target_contract;

  function Attack_SimpleCoinFlipGame2(address _targetContract) public payable {
      target_contract = SimpleCoinFlipGame(_targetContract);
  } 

  function vultron_flipTheCoinAndWin() public {
    target_contract.flipTheCoinAndWin();
  } 

  function vultron_terminate() public {
    target_contract.terminate();
  } 

  function() public payable {
    revert();
  }
} 
