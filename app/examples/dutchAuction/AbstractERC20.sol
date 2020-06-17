pragma solidity 0.4.19;

/// @title Abstract token contract - Functions to be implemented by token contracts.
contract Token {

    uint public totalSupply;
    
    function totalSupply() public constant returns(uint total_Supply);

    function balanceOf(address who) public constant returns(uint256);

    function allowance(address owner, address spender) public constant returns(uint);

    function transferFrom(address from, address to, uint value) public returns(bool ok);

    function approve(address spender, uint value) public returns(bool ok);

    function transfer(address to, uint value)public returns(bool ok);

    event Transfer(address indexed from, address indexed to, uint value);

    event Approval(address indexed owner, address indexed spender, uint value);

}
