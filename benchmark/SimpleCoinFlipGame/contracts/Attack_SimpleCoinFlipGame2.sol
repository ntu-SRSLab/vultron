pragma solidity ^0.4.19;

import "./SimpleCoinFlipGame.sol";

contract Attack_SimpleCoinFlipGame2 {

  SimpleCoinFlipGame public target_contract;

  function Attack_SimpleCoinFlipGame2(address _targetContract) public payable {
      target_contract = SimpleCoinFlipGame(_targetContract);
  } 

  function vultron_flipTheCoinAndWin(uint256 _amount) public {
    target_contract.flipTheCoinAndWin.value(_amount)();
  } 

  function vultron_terminate() public {
    target_contract.terminate();
  } 

  function() public payable {
    revert();
  }
} 
