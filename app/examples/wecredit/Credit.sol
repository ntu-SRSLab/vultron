pragma solidity ^0.4.11;

contract Credit {
	bytes32[11] _bytes32Array;
	uint128 _sccAmt;
	string _custDataHash;
	string _reserved;
	address _owner;

	event setOwnerEvent(bytes32 sccId, address preOwner, address owner, address contractAddress);
	event setCreditEvent(bytes32[] bytes32Array, uint128 sccAmt, string custDataHash, address contractAddress);
	event setReservedEvent(bytes32 sccId, string reserved, address contractAddress);

	modifier onlyOwner() {
        require(tx.origin == _owner);
        _;
    }

	function Credit(
		bytes32[11] bytes32Array,
		uint128 sccAmt,
		string custDataHash,
		address owner
	)
		public
	{
		_bytes32Array = bytes32Array;
		_sccAmt = sccAmt;
		_custDataHash = custDataHash;
		_owner = owner;
	}

	function getCredit()
		public
		constant
		returns
	(
		bytes32[],
		uint128,
		string,
		address
	)
	{
        bytes32[] memory dynamicBytes32Array = new bytes32[](11);
        for (uint i = 0; i < 11; i++) {
            dynamicBytes32Array[i] = _bytes32Array[i];
        }
		return (dynamicBytes32Array, _sccAmt, _custDataHash, _owner);
	}

	function getCreditBytes32Array() constant public returns(bytes32[11]){
		return _bytes32Array;
	}

	function getCreditAmt() constant public returns(uint128){
		return _sccAmt;
	}

	function getCreditCustDataHash() constant public returns(string){
		return _custDataHash;
	}

	function getCreditOwner() constant public returns(address){
		return _owner;
	}

	function updateCreditHoldingStatus(bytes32 status) onlyOwner public returns(bool){
		_bytes32Array[8] = status;
		return true;
	}

	function updateCreditClearingStatus(bytes32 status) onlyOwner public returns(bool){
		_bytes32Array[9] = status;
		return true;
	}

	function updateCreditValidStatus(bytes32 status) onlyOwner public returns(bool){
		_bytes32Array[10] = status;
		return true;
	}

	function getCreditOrginSccId() public returns(bytes32){
		return _bytes32Array[2];
	}

	function getCreditAssetId() constant public returns(bytes32){
		return _bytes32Array[4];
	}

	function getCreditMaturityDate() constant public returns(bytes32){
		return _bytes32Array[6];
	}

	function getCreditIssuedDate() constant public returns(bytes32){
		return _bytes32Array[7];
	}

	function getCreditSccHoldingStatus() constant public returns(bytes32){
		return _bytes32Array[8];
	}

	function getCreditSccClearingStatus() constant public returns(bytes32){
		return _bytes32Array[9];
	}

	function getCreditSccValidStatus() constant public returns(bytes32){
		return _bytes32Array[10];
	}

	function getCreditAccountNo() constant public returns(bytes32){
		return _bytes32Array[5];
	}

	function getCustDataHash() constant public returns(string){
		return _custDataHash;
	}

	function setCredit(bytes32[11] bytes32Array, uint128 sccAmt, string custDataHash) onlyOwner public returns(bool) {
		_bytes32Array = bytes32Array;
		_sccAmt = sccAmt;
		_custDataHash = custDataHash;

		setCreditEvent(staticArrayToDynamicArray(_bytes32Array), _sccAmt, _custDataHash, address(this));
		return true;
	}

	function setOwner(address owner) onlyOwner public returns(bool) {
		setOwnerEvent(_bytes32Array[1], _owner, owner, address(this));
		_owner = owner;
		return true;
	}

	function getReserved() constant public returns(string){
		return _reserved;
	}

	function setReserved(string reserved) onlyOwner public returns(bool){
		_reserved = reserved;
		setReservedEvent(_bytes32Array[1], _reserved, address(this));
		return true;
	}

	function staticArrayToDynamicArray(bytes32[11] bytes32Array) constant public returns(bytes32[]){
        bytes32[] memory dynamicBytes32Array = new bytes32[](11);
        for (uint i = 0; i < 11; i++) {
            dynamicBytes32Array[i] = bytes32Array[i];
        }
        return dynamicBytes32Array;
    }
}
