pragma solidity ^0.4.24;

contract SimpleDAO {
  mapping (address => uint) public credit;

  constructor () public payable { }
  
  function donate(address to) public payable {
    credit[to] += msg.value;
  }
  
  function withdraw(uint amount) public {
    if (credit[msg.sender]>= amount) {
      bool res = msg.sender.call.value(amount)();
      credit[msg.sender]-=amount;
    }
  }

  function queryCredit(address to) public view returns (uint){
    return credit[to];
  }

  function queryBalance() public view returns (uint) {
    return address(this).balance;
  }

  function queryTest() public pure returns (uint){
    return 3;
  }

  function() external payable {
  }
}
