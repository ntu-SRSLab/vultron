pragma solidity>=0.4.24;

contract SimpleDAO {
  address public owner;
  mapping (address => uint) public credit;

  constructor () public payable {
    owner = msg.sender;
  }

  modifier onlyOwner {
    require(msg.sender == owner, "Sender not authorized!");
    _;
  }
  
  function donate(address to) public payable {
    credit[to] += msg.value;
  }
  
  function withdraw(uint amount) public {
    if (credit[msg.sender] >= amount) {
      bool res = msg.sender.call.value(amount)();
      credit[msg.sender] -= amount;
    }
  }

  function withdrawAll() public onlyOwner {
    bool res = msg.sender.call.value(this.balance)();
  }

  function() public payable {
  }
}
