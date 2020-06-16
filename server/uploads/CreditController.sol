pragma solidity ^ 0.4 .4;

import "Credit.sol";
import "CreditMap.sol";
import "AccountController.sol";
import "CommonLib.sol";

contract CreditController is CommonLib {

    bytes32 constant private CREDIT_HOLAING_CREATE_STATUS = "A";
    bytes32 constant private CREDIT_HOLAING_INVALID_STATUS = "T";
    bytes32 constant private CREDIT_HOLAING_DISCOUNTED_STATUS = "D";
    bytes32 constant private CREDIT_CLEARING_CLEARED_STATUS = "AC";
    bytes32 constant private CREDIT_CLEARING_NOCLEARED_STATUS = "NC";
    bytes32 constant private CREDIT_VALID_NOEXPIRED_STATUS = "V";
    bytes32 constant private CREDIT_VALID_EXPIRED_STATUS = "E";
    bytes32 constant private CREDIT_VALID_CLOSED_STATUS = "C";

    bytes32 constant private H1 = CREDIT_HOLAING_CREATE_STATUS;
    bytes32 constant private H2 = CREDIT_HOLAING_INVALID_STATUS;
    bytes32 constant private H3 = CREDIT_HOLAING_DISCOUNTED_STATUS;
    bytes32 constant private C1 = CREDIT_CLEARING_CLEARED_STATUS;
    bytes32 constant private C2 = CREDIT_CLEARING_NOCLEARED_STATUS;
    bytes32 constant private V1 = CREDIT_VALID_NOEXPIRED_STATUS;
    bytes32 constant private V2 = CREDIT_VALID_EXPIRED_STATUS;
    bytes32 constant private V3 = CREDIT_VALID_CLOSED_STATUS;


    AccountController _accountController;
    CreditMap _creditMap;

    event creditEvent(bytes32[] bytes32Array, uint128 sccAmt, address owner, address credit, uint256 timestamp, uint32 status);

    Credit target;
    /**
     *  modifers for state machine
     */
    event creditStateEvent(address sender, bytes4 msg_sig, bytes msg_data, bytes32 holding_status, bytes32 clearing_status, bytes32 valid_status);
    event creditInvariantEvent(address sender, bytes4 msg_sig, bytes msg_data, uint128 sccAmt, address owner);
    modifier preCreateCredit() {
        _;
    }
    modifier postCreateCredit(uint128 sccAmt) {
	 _;
        if (!(target.getCreditSccHoldingStatus() == H1 &&
                target.getCreditSccClearingStatus() == C2 &&
                target.getCreditSccValidStatus() == V1)) {
            creditStateEvent(msg.sender, msg.sig, msg.data, target.getCreditSccHoldingStatus(),
                target.getCreditSccClearingStatus(),
                target.getCreditSccValidStatus());
        }
        if (!(target.getCreditOwner() == tx.origin &&
                target.getCreditAmt() == sccAmt)) {
            creditInvariantEvent(msg.sender, msg.sig, msg.data, sccAmt, target.getCreditOwner());
        }

    }

    function CreditController(address accountControllerAddress) public {
        _accountController = AccountController(accountControllerAddress);
        _creditMap = new CreditMap();
    }

    function createCredit(
        bytes32[9] bytes32Array,
        uint128 sccAmt,
        string custDataHash
    )
    public preCreateCredit postCreateCredit(sccAmt) 
    returns(Credit) {
        uint32 retCode = accountIsOk(bytes32Array[5]);
        if (retCode != ACCOUNT_OK) {
            commonCheckEvent(bytes32Array[8], bytes32Array[1], retCode, CREATE_WECREDIT);
            return;
        }

        Account account = Account(_accountController.getAccountMap().getAccount(bytes32Array[5]));
        if (!account.hashAuth(tx.origin)) {
            commonCheckEvent(bytes32Array[8], bytes32Array[1], ACCOUNT_NO_AUTH, CREATE_WECREDIT);
            return;
        }

	

        if (_creditMap.creditExists(bytes32Array[1])) {
            commonCheckEvent(bytes32Array[8], bytes32Array[1], CREDIT_EXISTS, CREATE_WECREDIT);
            return;
        }

        bytes32[11] memory tempBytes32Array;
        for (uint i = 0; i < 8; i++) {
            tempBytes32Array[i] = bytes32Array[i];
        }
        tempBytes32Array[8] = CREDIT_HOLAING_CREATE_STATUS;
        tempBytes32Array[9] = CREDIT_CLEARING_NOCLEARED_STATUS;
        tempBytes32Array[10] = CREDIT_VALID_NOEXPIRED_STATUS;

        Credit credit = new Credit(tempBytes32Array, sccAmt, custDataHash, tx.origin);
        _creditMap.addCredit(bytes32Array[1], credit);

        creditEvent(staticArrayToDynamicArray(tempBytes32Array), sccAmt, tx.origin, credit, now, CREATE_CREDIT);
        commonCheckEvent(bytes32Array[8], bytes32Array[1], TRANSACTION_SUCCESS, CREATE_WECREDIT);

	target = credit;
        return credit;
    }

    function transferCredit(
        bytes32[6] bytes32Array,
        address targetOwner,
        uint128 transferAmt,
        string targetCustDataHash,
        string splitCustDataHash
    )
    public
    returns(bool) {
        if (!transferAndDiscountCheck(bytes32Array[0], bytes32Array[1], bytes32Array[2], bytes32Array[5], transferAmt, TRANSFER_WECREDIT)) {
            return false;
        }
        // bytes32Array[0]: sccNo 
        Credit credit = Credit(_creditMap.getCredit(bytes32Array[0]));

        uint32 targetAccountCheckCode = accountIsOk(bytes32Array[3]);
        if (targetAccountCheckCode != ACCOUNT_OK) {
            commonCheckEvent(bytes32Array[5], bytes32Array[3], targetAccountCheckCode, TRANSFER_WECREDIT);
            return false;
        }

        uint128 sourceNewAmt = credit.getCreditAmt() - transferAmt;
        bytes32[11] memory tempBytes32Array = credit.getCreditBytes32Array();

        tempBytes32Array[0] = bytes32Array[4];
        tempBytes32Array[3] = bytes32Array[0];

        if (sourceNewAmt > 0) {
            tempBytes32Array[1] = bytes32Array[1];
            Credit spiltCredit = new Credit(tempBytes32Array, sourceNewAmt, splitCustDataHash, tx.origin);
            // bytes32Array[1]：EntityNo
            // ? what is sccNo
            _creditMap.addCredit(bytes32Array[1], spiltCredit);
            creditEvent(staticArrayToDynamicArray(tempBytes32Array), sourceNewAmt, tx.origin, spiltCredit, now, TRANSFER_CREDIT_SPILT);
        }

        tempBytes32Array[1] = bytes32Array[2];
        tempBytes32Array[2] = bytes32Array[2];
        tempBytes32Array[5] = bytes32Array[3];
        if (targetOwner == 0x00) {
            targetOwner = tx.origin;
        }
        Credit targetCredit = new Credit(tempBytes32Array, transferAmt, targetCustDataHash, targetOwner);
        // bytes32Array[2]: orginSCCID
        _creditMap.addCredit(bytes32Array[2], targetCredit);
        creditEvent(staticArrayToDynamicArray(tempBytes32Array), transferAmt, targetOwner, targetCredit, now, TRANSFER_CREDIT_TARGET);
        // updateCredit... has modifier 'onlyOwner' in Credit.sol, and this ensure that only credit owner can call transferCredit
        credit.updateCreditHoldingStatus(CREDIT_HOLAING_INVALID_STATUS);
        creditEvent(staticArrayToDynamicArray(credit.getCreditBytes32Array()), credit.getCreditAmt(), credit.getCreditOwner(), credit, now, TRANSFER_CREDIT_SOURCE);
        commonCheckEvent(bytes32Array[5], bytes32Array[0], TRANSACTION_SUCCESS, TRANSFER_WECREDIT);
        return true;
    }

    function discountCredit(
        bytes32[5] bytes32Array,
        uint128 discountAmt,
        string targetCustDataHash,
        string splitCustDataHash
    )
    public
    returns(bool) {
        if (!transferAndDiscountCheck(bytes32Array[0], bytes32Array[1], bytes32Array[2], bytes32Array[4], discountAmt, DISCOUNT_WECREDIT)) {
            return false;
        }

        Credit credit = Credit(_creditMap.getCredit(bytes32Array[0]));

        uint128 sourceNewAmt = credit.getCreditAmt() - discountAmt;
        bytes32[11] memory tempBytes32Array = credit.getCreditBytes32Array();

        tempBytes32Array[0] = bytes32Array[3];
        tempBytes32Array[3] = bytes32Array[0];
        if (sourceNewAmt > 0) {
            tempBytes32Array[1] = bytes32Array[1];
            Credit spiltCredit = new Credit(tempBytes32Array, sourceNewAmt, splitCustDataHash, tx.origin);
            _creditMap.addCredit(bytes32Array[1], spiltCredit);
            creditEvent(staticArrayToDynamicArray(tempBytes32Array), sourceNewAmt, tx.origin, spiltCredit, now, DISCOUNT_CREDIT_SPILT);
        }

        tempBytes32Array[1] = bytes32Array[2];
        // change targetCredit holding status to DISCOUNTED
        tempBytes32Array[8] = CREDIT_HOLAING_DISCOUNTED_STATUS;
        Credit targetCredit = new Credit(tempBytes32Array, discountAmt, targetCustDataHash, tx.origin);
        _creditMap.addCredit(bytes32Array[2], targetCredit);
        creditEvent(staticArrayToDynamicArray(tempBytes32Array), discountAmt, tx.origin, targetCredit, now, DISCOUNT_CREDIT_TARGET);

        credit.updateCreditHoldingStatus(CREDIT_HOLAING_INVALID_STATUS);
        creditEvent(staticArrayToDynamicArray(credit.getCreditBytes32Array()), credit.getCreditAmt(), credit.getCreditOwner(), credit, now, DISCOUNT_CREDIT_SOURCE);
        commonCheckEvent(bytes32Array[4], bytes32Array[0], TRANSACTION_SUCCESS, DISCOUNT_WECREDIT);
        return true;
    }

    function expireOrClearOrCloseCredit(bytes32 sysSeqNo, bytes32 sccId, uint32 txTagCode, uint32 txCode) public returns(bool) {
        if (!_creditMap.creditExists(sccId)) {
            commonCheckEvent(sysSeqNo, sccId, CREDIT_NOT_EXISTS, txTagCode);
            return false;
        }

        Credit credit = Credit(_creditMap.getCredit(sccId));
        if (credit.getCreditSccHoldingStatus() == CREDIT_HOLAING_INVALID_STATUS) {
            commonCheckEvent(sysSeqNo, sccId, CREDIT_INVAILD, txTagCode);
            return false;
        }

        if (txCode == EXPIRE_CREDIT && credit.getCreditSccValidStatus() == CREDIT_VALID_EXPIRED_STATUS) {
            commonCheckEvent(sysSeqNo, sccId, CREDIT_EXPIRED, txTagCode);
            return false;
        }

        if (txCode == CLEAR_CREDIT && credit.getCreditSccClearingStatus() == CREDIT_CLEARING_CLEARED_STATUS) {
            commonCheckEvent(sysSeqNo, sccId, CREDIT_CLEARED, txTagCode);
            return false;
        }

        if (txCode == CLOSE_CREDIT && credit.getCreditSccValidStatus() == CREDIT_VALID_CLOSED_STATUS) {
            commonCheckEvent(sysSeqNo, sccId, CREDIT_CLOSED, txTagCode);
            return false;
        }

        if ((txCode == EXPIRE_CREDIT && !credit.updateCreditValidStatus(CREDIT_VALID_EXPIRED_STATUS)) ||
            (txCode == CLEAR_CREDIT && !credit.updateCreditClearingStatus(CREDIT_CLEARING_CLEARED_STATUS)) ||
            (txCode == CLOSE_CREDIT && !credit.updateCreditValidStatus(CREDIT_VALID_CLOSED_STATUS))) {
            commonCheckEvent(sysSeqNo, sccId, TRANSACTION_FAILED, txTagCode);
            return false;
        }

        creditEvent(staticArrayToDynamicArray(credit.getCreditBytes32Array()), credit.getCreditAmt(), credit.getCreditOwner(), credit, now, txCode);
        commonCheckEvent(sysSeqNo, sccId, TRANSACTION_SUCCESS, txTagCode);
        return true;
    }

    function getCreditAddressByCreditNo(bytes32 sccId) public constant returns(address) {
        require(_creditMap.creditExists(sccId));
        return _creditMap.getCredit(sccId);
    }

    function accountIsOk(bytes32 accountNo) constant public returns(uint32) {
        if (!_accountController.getAccountMap().accountExists(accountNo)) return ACCOUNT_NOT_EXISTS;
        Account account = Account(_accountController.getAccountMap().getAccount(accountNo));
        if (!account.isAccountNormal()) return ACCOUNT_CANCELED;

        return ACCOUNT_OK;
    }

    function staticArrayToDynamicArray(bytes32[11] bytes32Array) constant public returns(bytes32[]) {
        bytes32[] memory dynamicBytes32Array = new bytes32[](11);
        for (uint i = 0; i < 11; i++) {
            dynamicBytes32Array[i] = bytes32Array[i];
        }
        return dynamicBytes32Array;
    }

    function transferAndDiscountCheck(bytes32 sourceSccId, bytes32 splitSccId, bytes32 targetSccId, bytes32 sysSeqNo, uint128 processAmt, uint32 errorCode) constant public returns(bool) {

        if (!_creditMap.creditExists(sourceSccId)) {
            commonCheckEvent(sysSeqNo, sourceSccId, CREDIT_NOT_EXISTS, errorCode);
            return false;
        }

        if (splitSccId != 0x0 && _creditMap.creditExists(splitSccId)) {
            commonCheckEvent(sysSeqNo, splitSccId, CREDIT_SPLIT_EXISTS, errorCode);
            return false;
        }

        if (_creditMap.creditExists(targetSccId)) {
            commonCheckEvent(sysSeqNo, targetSccId, CREDIT_TARGET_EXISTS, errorCode);
            return false;
        }

        Credit credit = Credit(_creditMap.getCredit(sourceSccId));
        uint32 sourceAccountCheckCode = accountIsOk(credit.getCreditAccountNo());
        if (sourceAccountCheckCode != ACCOUNT_OK) {
            commonCheckEvent(sysSeqNo, credit.getCreditAccountNo(), sourceAccountCheckCode, errorCode);
            return false;
        }

        if (credit.getCreditSccHoldingStatus() == CREDIT_HOLAING_INVALID_STATUS) {
            commonCheckEvent(sysSeqNo, sourceSccId, CREDIT_INVAILD, errorCode);
            return false;
        }

        if (credit.getCreditAmt() < processAmt) {
            commonCheckEvent(sysSeqNo, sourceSccId, CREDIT_OUT_OF_BALANCE, errorCode);
            return false;
        }

        if (credit.getCreditAmt() > processAmt && splitSccId == 0x00) {
            commonCheckEvent(sysSeqNo, splitSccId, CREDIT_SPLIT_NOT_EMPTY, errorCode);
            return false;
        }

        if (credit.getCreditAmt() == processAmt && splitSccId != 0x00) {
            commonCheckEvent(sysSeqNo, splitSccId, CREDIT_SPLIT_MUST_EMPTY, errorCode);
            return false;
        }

        return true;
    }

}
