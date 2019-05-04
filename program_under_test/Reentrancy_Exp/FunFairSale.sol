pragma solidity ^0.4.4;

contract Owned {
    address public owner;

    function Owned() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) throw;
        _;
    }

    address newOwner;

    function changeOwner(address _newOwner) onlyOwner {
        newOwner = _newOwner;
    }

    function acceptOwnership() {
        if (msg.sender == newOwner) {
            owner = newOwner;
        }
    }
}

contract FunFairSale is Owned{

    event logTokenTransfer(address token, address to, uint amount);

    uint public deadline = 1499436000;
    uint public startTime = 1498140000;
    uint public capAmount;

    mapping (address => uint256) public balances;

    function FunFairSale() {}

    function transfer(address _to, uint256 _value) returns (bool) {
        require(balances[msg.sender] >= _value);
        balances[msg.sender] -= _value;
        balances[_to] += _value;
        return true;
    }

    function balanceOf(address _owner) returns (uint256) {
        return balances[_owner];
    }


    function claimTokens(address _to) onlyOwner returns (bool) {
        uint balance = balanceOf(this);
        if (transfer(_to, balance)) {
            logTokenTransfer(_token, _to, balance);
            return true;
        }
        return false;
    }

    function setSoftCapDeadline(uint t) onlyOwner {
        if (t > deadline) throw;
        deadline = t;
    }

    function launch(uint _cap) onlyOwner {
        capAmount = _cap;
    }

    function () payable {
        if (block.timestamp < startTime || block.timestamp >= deadline) throw;

        if (this.balance > capAmount) {
            deadline = block.timestamp - 1;
        }
    }

    function withdraw() onlyOwner {
        if (block.timestamp < deadline) throw;

        //testing return value doesn't do anything here
        //but it stops a compiler warning
        if (!owner.call.value(this.balance)()) throw;
    }

    function setStartTime(uint _startTime, uint _deadline) onlyOwner {
        if (block.timestamp >= startTime) throw;
        startTime = _startTime;
        deadline = _deadline;
    }

}