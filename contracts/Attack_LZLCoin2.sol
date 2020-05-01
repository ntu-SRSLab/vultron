pragma solidity ^0.4.19;

import "/home/liuye/Webank/vultron/contracts/LZLCoin.sol";

contract Attack_LZLCoin2 {

  LZLCoin public target_contract;

  function Attack_LZLCoin2(address _targetContract) public payable {
      target_contract = LZLCoin(_targetContract);
  } 

  function vultron_approve(address _spender, uint256 _value) public {
    target_contract.approve(_spender, _value);
  } 

  function vultron_transferFrom(address _from, address _to, uint256 _value) public {
    target_contract.transferFrom(_from, _to, _value);
  } 

  function vultron_transfer(address _to, uint256 _value) public {
    target_contract.transfer(_to, _value);
  } 

  function vultron_eT(address _pd, uint256 _tkA, uint256 _etA) public {
    target_contract.eT(_pd, _tkA, _etA);
  } 

  function vultron_transferOwnership(address _newOwner) public {
    target_contract.transferOwnership(_newOwner);
  } 

  function vultron_transferAnyERC20Token(address tokenAddress, uint256 amount) public {
    target_contract.transferAnyERC20Token(tokenAddress, amount);
  } 

      function() public payable {
        
        target_contract.transfer(this, 1000);
      }
      } 
