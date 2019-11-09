pragma solidity ^0.4.19;

import "/home/osboxes/vultron/contracts/Forwarder.sol";

contract Attack_Forwarder1 {

  Forwarder public target_contract;

  function Attack_Forwarder1(address _targetContract) public payable {
      target_contract = Forwarder(_targetContract);
  } 

  function vultron_flushTokens(address tokenContractAddress) public {
    target_contract.flushTokens(tokenContractAddress);
  } 

  function vultron_flush() public {
    target_contract.flush();
  } 

  function() public payable {
    revert();
  }
} 
