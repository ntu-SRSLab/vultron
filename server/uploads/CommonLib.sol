pragma solidity ^0.4.11;

contract CommonLib {
    uint32 constant public ACCOUNT_EXISTS = 2;
    uint32 constant public ACCOUNT_NOT_EXISTS = 3;
    uint32 constant public ACCOUNT_CANCELED = 4;
    uint32 constant public ACCOUNT_NO_AUTH = 5;
    uint32 constant public ACCOUNT_OK = 6;

    uint32 constant public CREDIT_EXISTS = 7;
    uint32 constant public CREDIT_NOT_EXISTS = 8;
    uint32 constant public CREDIT_OUT_OF_BALANCE = 9;
    uint32 constant public CREDIT_INVAILD = 10;
    uint32 constant public CREDIT_SPILT_EMPTY = 11;
    uint32 constant public CREDIT_EXPIRED = 12;
    uint32 constant public CREDIT_CLEARED = 13;
    uint32 constant public CREDIT_CLOSED = 14;
    uint32 constant public CREDIT_SPLIT_EXISTS = 15;
    uint32 constant public CREDIT_SPILT_NOT_EXISTS = 16;
    uint32 constant public CREDIT_TARGET_EXISTS = 17;
    uint32 constant public CREDIT_TARGET_NOT_EXISTS = 18;
    uint32 constant public CREDIT_SPLIT_NOT_EMPTY = 19;
    uint32 constant public CREDIT_SPLIT_MUST_EMPTY = 20;

    uint32 constant public TRANSACTION_SUCCESS = 0;
    uint32 constant public TRANSACTION_FAILED = 1;

    uint32 constant public CREATE_CREDIT = 100;
    uint32 constant public TRANSFER_CREDIT_SPILT = 200;
    uint32 constant public TRANSFER_CREDIT_TARGET = 201;
    uint32 constant public TRANSFER_CREDIT_SOURCE = 202;
    uint32 constant public DISCOUNT_CREDIT_SPILT = 300;
    uint32 constant public DISCOUNT_CREDIT_TARGET = 301;
    uint32 constant public DISCOUNT_CREDIT_SOURCE = 302;
    uint32 constant public EXPIRE_CREDIT = 400;
    uint32 constant public CLEAR_CREDIT = 500;
    uint32 constant public CLOSE_CREDIT = 600;

    uint32 constant public REGISTE_ACCOUNT = 1000;
    uint32 constant public CANCEL_ACCOUNT = 1001;
    uint32 constant public CREATE_WECREDIT = 2000;
    uint32 constant public TRANSFER_WECREDIT = 2001;
    uint32 constant public DISCOUNT_WECREDIT = 2002;
    uint32 constant public EXPIRE_WECREDIT = 2003;
    uint32 constant public CLEAR_WECREDIT = 2004;
    uint32 constant public CLOSE_WECREDIT = 2005;

    event commonCheckEvent(bytes32 sysSeqNo, bytes32 entityNo, uint32 retCode, uint32 txCode);
}