pragma solidity ^0.4.4;

import "Account.sol";
import "AccountMap.sol";
import "CommonLib.sol";

contract AccountController is CommonLib{

    AccountMap _accountMap;

    event registeAccountEvent(bytes32 sysSeqNo, bytes32 accountNo, bytes32 productId, string custDataHash);
    event modifyBlockStatusEvent(bytes32 sysSeqNo, bytes32 blockCode, bytes32 accountNo);

    function AccountController() public {
        _accountMap = new AccountMap();
    }

    function registeAccount(
        bytes32 sysSeqNo,
        bytes32 accountNo,
        bytes32 productId,
        string custDataHash
    )
        public
        returns(address)
    {
        if(_accountMap.accountExists(accountNo)){
            commonCheckEvent(sysSeqNo, accountNo, ACCOUNT_EXISTS, REGISTE_ACCOUNT);
            return;
        }
        Account account = new Account(accountNo, bytes32(0x00), productId, custDataHash);
        _accountMap.addAccount(accountNo, account);
        registeAccountEvent(sysSeqNo, accountNo, productId, custDataHash);
        commonCheckEvent(sysSeqNo, accountNo, TRANSACTION_SUCCESS, REGISTE_ACCOUNT);
        return account;
    }

    function modifyAccountStatus(bytes32 sysSeqNo, bytes32 blockCode, bytes32 accountNo) public returns(bool){
        if(!_accountMap.accountExists(accountNo)){
            commonCheckEvent(sysSeqNo, accountNo, ACCOUNT_NOT_EXISTS, CANCEL_ACCOUNT);
            return false;
        }
        Account account = Account(_accountMap.getAccount(accountNo));
        if(!account.isAccountNormal()){
            commonCheckEvent(sysSeqNo, accountNo, ACCOUNT_CANCELED, CANCEL_ACCOUNT);
            return false;
        }
        if(account.modifyAccountStatus(blockCode)){
            modifyBlockStatusEvent(sysSeqNo, blockCode, accountNo);
            commonCheckEvent(sysSeqNo, accountNo, TRANSACTION_SUCCESS, CANCEL_ACCOUNT);
            return true;
        }
        commonCheckEvent(sysSeqNo, accountNo, TRANSACTION_FAILED, CANCEL_ACCOUNT);
        return false;
    }

    function getAccountByAccountNo(bytes32 accountNo) public constant returns(address){
        require(_accountMap.accountExists(accountNo));
        return Account(_accountMap.getAccount(accountNo));
    }

    function getAccountMap() public constant returns(AccountMap) {
        return _accountMap;
    }

}
