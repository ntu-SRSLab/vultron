pragma solidity ^0.4.19;

import "/home/osboxes/Develop/vultron/contracts/AbyssToken.sol";

contract Attack_AbyssToken4 {

  AbyssToken public target_contract;

  function Attack_AbyssToken4(address _targetContract) public payable {
      target_contract = AbyssToken(_targetContract);
  } 

  function vultron_approve(address _spender, uint256 _value) public {
    target_contract.approve(_spender, _value);
  } 

  function vultron_disableLimit() public {
    target_contract.disableLimit();
  } 

  function vultron_transferFrom(address _from, address _to, uint256 _value) public {
    target_contract.transferFrom(_from, _to, _value);
  } 

  function vultron_decreaseApproval(address _spender, uint256 _subtractedValue) public {
    target_contract.decreaseApproval(_spender, _subtractedValue);
  } 

  function vultron_delLimitedWalletAddress(address _wallet) public {
    target_contract.delLimitedWalletAddress(_wallet);
  } 

  function vultron_issue(address _to, uint256 _value) public {
    target_contract.issue(_to, _value);
  } 

  function vultron_destroy(address _from, uint256 _value) public {
    target_contract.destroy(_from, _value);
  } 

  function vultron_transfer(address _to, uint256 _value) public {
    target_contract.transfer(_to, _value);
  } 

  function vultron_setListener(address _listener) public {
    target_contract.setListener(_listener);
  } 

  function vultron_finishIssuance() public {
    target_contract.finishIssuance();
  } 

  function vultron_increaseApproval(address _spender, uint256 _addedValue) public {
    target_contract.increaseApproval(_spender, _addedValue);
  } 

  function vultron_setAllowTransfers(bool _allowTransfers) public {
    target_contract.setAllowTransfers(_allowTransfers);
  } 

  function vultron_addLimitedWalletAddress(address _wallet) public {
    target_contract.addLimitedWalletAddress(_wallet);
  } 

  function vultron_setOwners(address[] _owners) public {
    target_contract.setOwners(_owners);
  } 

  function() public payable {
    target_contract.issue(this,  10000);
  }
} 
