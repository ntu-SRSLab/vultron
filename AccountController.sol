contract AccountController{
    function AccountController() public {
        _accountMap = new AccountMap();
    }
    function registeAccount(
        bytes32 sysSeqNo,
        bytes32 accountNo,
        bytes32 productId,
        string custDataHash
    )
    public returns(address){
      // ...
    }
    function modifyAccountStatus(
        bytes32 sysSeqNo, 
        bytes32 blockCode, 
        bytes32 accountNo) 
    public returns(bool){
       //...
    }
    function getAccountByAccountNo(bytes32 accountNo) public constant returns(address){
      // ...
    }
    function getAccountMap() public constant returns(AccountMap) {
        //...
    }
}
