pragma solidity ^0.4.19;

import "/home/osboxes/vultron/contracts/PIGGY_BANK.sol";

contract Attack_PIGGY_BANK1 {

  PIGGY_BANK public target_contract;

  function Attack_PIGGY_BANK1(address _targetContract) public payable {
      target_contract = PIGGY_BANK(_targetContract);
  } 

  function vultron_Put(uint256 vultron_amount, address to) public payable{
    target_contract.Put.value(vultron_amount)(to);
  } 

  function vultron_Collect(uint256 vultron_amount, uint256 _am) public payable{
    target_contract.Collect.value(vultron_amount)(_am);
  } 

  function() public payable {
    revert();
  }
} 
