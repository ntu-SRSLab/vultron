pragma solidity ^0.4.11;

import "Account.sol";

contract AccountMap {

	mapping (bytes32 => address) accountMapping;
    address _owner;

    event updateMapEvent(bytes32 accountNo, address addr,  address contractAddress);

    modifier onlyOwner() {
        require(tx.origin == _owner);
        _;
    }

    function AccountMap() public {
        _owner = tx.origin;
    }

	function addAccount(bytes32 accountNo, Account account) public returns(Account) {
		require(!accountExists(accountNo));
        accountMapping[accountNo] = account;
        return account;
    }

	function getAccount(bytes32 accountNo) public constant returns(address) {
        return accountMapping[accountNo];
    }

	function accountExists(bytes32 accountNo) constant public returns(bool) {
    	address accAddr = accountMapping[accountNo];
    	if(accAddr == 0x00) return false;
    	return true;
    }

    function updateMap(bytes32 accountNo, address addr) onlyOwner public returns(bool){
        accountMapping[accountNo] = addr;
        updateMapEvent(accountNo, addr, address(this));
        return true;
    }

}