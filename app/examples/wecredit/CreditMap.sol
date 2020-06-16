pragma solidity ^0.4.11;

import "Credit.sol";

contract CreditMap {

	mapping (bytes32 => address) creditMapping;
    address _owner;

    event updateMapEvent(bytes32 sccNo, address addr,  address contractAddress);

    modifier onlyOwner() {
        require(tx.origin == _owner);
        _;
    }

    function CreditMap() public {
        _owner = tx.origin;
    }

	function addCredit(bytes32 sccNo, Credit credit) public returns(Credit) {
        creditMapping[sccNo] = credit;
        return credit;
    }

	function getCredit(bytes32 sccNo) public constant returns(address) {
        return creditMapping[sccNo];
    }

	function creditExists(bytes32 sccNo) constant public returns(bool){
    	address creditAddr = creditMapping[sccNo];
    	if(creditAddr == 0x00) return false;
    	return true;
    }

    function updateMap(bytes32 sccNo, address addr) onlyOwner public returns(bool){
        creditMapping[sccNo] = addr;
        updateMapEvent(sccNo, addr, address(this));
        return true;
    }

}