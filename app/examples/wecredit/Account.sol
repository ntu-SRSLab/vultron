pragma solidity ^0.4.11;

contract Account{
	bytes32 _accountNo;
	bytes32 _blockCode;
	bytes32 _productId;
	string _custDataHash;
	string _reserved;
	address _owner;

	bytes32 constant private ACCOUNT_CANCEL_STATUS = "C";

	event setAccountEvent(bytes32 accountNo, bytes32 productId, string custDataHash, address contractAddress);
	event setOwnerEvent(bytes32 accountNo, address preOwner, address owner, address contractAddress);
	event setReservedEvent(bytes32 accountNo, string reserved, address contractAddress);

	modifier onlyOwner() {
        require(tx.origin == _owner);
        _;
    }

	function Account(
		bytes32 accountNo,
		bytes32 blockCode,
		bytes32 productId,
		string custDataHash
	)
		public
	{
		_accountNo = accountNo;
		_blockCode = blockCode;
		_productId = productId;
		_custDataHash = custDataHash;
		_owner = tx.origin;
	}

	function getAccount() public constant returns(bytes32, bytes32, bytes32, string, address) {
		return (_accountNo, _blockCode, _productId, _custDataHash, _owner);
	}


	function modifyAccountStatus(bytes32 blockCode) onlyOwner public returns(bool) {
		_blockCode = blockCode;
		return true;
	}

	function isAccountNormal() public constant returns(bool) {
		if(_blockCode == ACCOUNT_CANCEL_STATUS) return false;
		return true;
	}

	function hashAuth(address owner) public constant returns(bool) {
		if(owner == _owner) return true;
		return false;
	}

	function setAccount(bytes32 accountNo, bytes32 productId, string custDataHash) onlyOwner public returns(bool) {
		_accountNo = accountNo;
		_productId = productId;
		_custDataHash = custDataHash;
		setAccountEvent(_accountNo, _productId, _custDataHash, address(this));
		return true;
	}

	function setOwner(address owner) onlyOwner public returns(bool){
		setOwnerEvent(_accountNo, _owner, owner, address(this));
		_owner = owner;
		return true;
	}

	function getReserved() constant public returns(string){
		return _reserved;
	}

	function setReserved(string reserved) onlyOwner public returns(bool){
		_reserved = reserved;
		setReservedEvent(_accountNo, _reserved, address(this));
		return true;
	}

}