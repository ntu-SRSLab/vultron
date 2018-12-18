pragma solidity ^0.4.24;

contract SimpleDAO {
  mapping (address => uint) public credit;
  // vultron instrumentation
  address[] public vultron_user_addresses;
  // end of vultron instrumentation
  
  constructor () public payable { }
  
  function donate(address to) public payable {
    credit[to] += msg.value;
    // vultron instrumentation
    vultron_user_addresses.push(to);
    // end of vultron instrumentation
  }
  
  function withdraw(uint amount) public {
    if (credit[msg.sender] >= amount) {
      bool res = msg.sender.call.value(amount)();
      credit[msg.sender] -= amount;
    }
  }

  // vultron instrumentation
  function vultron_bal_account(address to) public view returns (uint){
    return credit[to];
  }

  function vultron_bal_sum() public view returns (uint) {
    uint256 sum = 0;
    for (uint i = 0; i < vultron_user_addresses.length; ++i ) {
      sum += credit[vultron_user_addresses[i]];
    }
    return sum;
  }
  // end of vultron instrumentation

  function() public payable {
  }
}
