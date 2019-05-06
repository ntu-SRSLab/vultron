pragma solidity>=0.4.24;

contract SimpleDAO {
  mapping (address => uint) public credit;

  function vultron_reset(address user) public {
    delete credit[user];
  }
  
  constructor () public payable { }
  
  function donate(address to) public payable {
    credit[to] += msg.value;
  }
  
  function withdraw(uint amount) public {
    if (credit[msg.sender] >= amount) {
      bool res = msg.sender.call.value(amount)();
      credit[msg.sender] -= amount;
    }
  }

  function() public payable {
  }
}
