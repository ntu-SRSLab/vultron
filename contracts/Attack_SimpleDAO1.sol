pragma solidity>=0.4.19;

import "./SimpleDAO.sol";

contract Attack_SimpleDAO1 {

  SimpleDAO public target_contract;

  function Attack_SimpleDAO1(address _targetContract) public payable {
      target_contract = SimpleDAO(_targetContract);
  } 

  function vultron_vultron_reset(address user) public {
    target_contract.vultron_reset(user);
  } 

  function vultron_withdraw(uint256 amount) public {
    target_contract.withdraw(amount);
  } 

  function vultron_donate(uint256 vultron_amount, address to) public payable{
    target_contract.donate.value(vultron_amount)(to);
  } 

  function() public payable {
    revert();
  }
} 
