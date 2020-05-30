contract CreditController {
     function CreditController(address accountControllerAddress) public {
        _accountController = AccountController(accountControllerAddress);
        _creditMap = new CreditMap();
    }
    function createCredit(
        bytes32[9] bytes32Array,
        uint128 sccAmt,
        string custDataHash
    )
    public  
    returns(Credit) {
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
       ...
    }
    function discountCredit(
        bytes32[5] bytes32Array,
        uint128 discountAmt,
        string targetCustDataHash,
        string splitCustDataHash
    )
    public
    returns(bool) {
       ...
    }
    function expireOrClearOrCloseCredit(
        bytes32 sysSeqNo,
         bytes32 sccId, 
         uint32 txTagCode, 
         uint32 txCode) 
    public returns(bool) {
      ....
    }
  }
