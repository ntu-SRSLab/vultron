pragma solidity ^0.4.11;

import "./usingOraclize.sol";

contract BettingSimple is usingOraclize{

  address public ac = 0x65AdFe318C8101e5F78123766c007ABD2D640431;
  address public myaccount = this;
  string public BTC;
  uint betting_duration = 0;


  event Deposit(address _from, uint256 _value);
  event Withdraw(address _to, uint256 _value);
  event newPriceTicker(string price);
  event newOraclizeQuery(string description);

  function Betting()  {

  }

  function priceTicker() {
      oraclize_setProof(proofType_TLSNotary | proofStorage_IPFS);
      update();
  }

  function update() payable {
      if (oraclize_getPrice("URL") > this.balance) {
          newOraclizeQuery("Oraclize query was NOT sent, please add some ETH to cover for the query fee");
      } else {
          newOraclizeQuery("Oraclize query was sent, standing by for the answer..");
          oraclize_query(betting_duration, "URL", "json(http://api.coinmarketcap.com/v1/ticker/bitcoin/).0.price_usd");
      }
  }

  function __callback(bytes32 myid, string result, bytes proof) {
      if(msg.sender != oraclize_cbAddress()) throw;
      BTC = result;
      newPriceTicker(BTC);
      // return ETHXBT;
      /*reward();*/
  }

  function sendEther() payable returns (uint) {
    return msg.value;
  }
  function () payable {
   Deposit(msg.sender, msg.value);
  }
  function reward() payable {
    ac.transfer(0.05 ether);
    Withdraw(ac, 0.05 ether);
  }

  function getBlocktime() returns (uint) {
    return block.timestamp;
  }

}
