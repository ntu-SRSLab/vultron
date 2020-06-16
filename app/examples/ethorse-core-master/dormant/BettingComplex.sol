pragma solidity ^0.4.10;
import "./usingOraclize.sol";

contract Betting is usingOraclize {

    string public BTC_pre;
    string public BTC_post;
    string public ETH_pre;
    string public ETH_post;
    uint reward_amount;
    uint public voter_count=0;
    bytes32 BTC_ID;
    bytes32 ETH_ID;
    string public winner_horse;
    struct info{
        string horse;
        uint amount;
    }
    mapping (address => info) voter;
    mapping (uint => address) voterIndex;
    bool public price_check_btc = false;
    bool public price_check_eth = false;
    bool public other_price_check = false;
    bool public pointer_check = false;

    uint public winner_factor = 0;
    uint public winner_count = 0;
    uint public winner_reward;

    event newOraclizeQuery(string description);
    event newPriceTicker(string price);
    event Deposit(address _from, uint256 _value);
    event Withdraw(address _to, uint256 _value);

    function Betting() {
        oraclize_setProof(proofType_TLSNotary | proofStorage_IPFS);
        // update(180);
    }

    function __callback(bytes32 myid, string result, bytes proof) {
        if (msg.sender != oraclize_cbAddress()) throw;
        if (myid == BTC_ID){
          if (price_check_btc == false) {
            BTC_pre = result;
            price_check_btc = true;
            newPriceTicker(BTC_pre);
            update(300);
          } else if (price_check_btc == true){
            BTC_post = result;
            newPriceTicker(BTC_post);
            if (other_price_check == true){
              reward();
            } else {
                other_price_check = true;
            }
          }
        } else if (myid == ETH_ID) {
          if (price_check_eth == false) {
            ETH_pre = result;
            price_check_eth = true;
            newPriceTicker(ETH_pre);
            update(300);
          } else if (price_check_eth == true){
            ETH_post = result;
            newPriceTicker(ETH_post);
            if (other_price_check == true){
              reward();
            } else {
                other_price_check = true;
            }
          }
        }
    }

    function placeBet(string horse) payable {
      voter[msg.sender].horse = horse;
      voter[msg.sender].amount = msg.value;
      voterIndex[voter_count] = msg.sender;
      voter_count = voter_count + 1;
      Deposit(msg.sender, msg.value);
    }

    function () payable {
      Deposit(msg.sender, msg.value);
    }

    function update(uint betting_duration) payable {
        if (oraclize_getPrice("URL") > this.balance) {
            newOraclizeQuery("Oraclize query was NOT sent, please add some ETH to cover for the query fee");
        } else {
            newOraclizeQuery("Oraclize query was sent, standing by for the answer..");
            BTC_ID = oraclize_query(betting_duration, "URL", "json(http://api.coinmarketcap.com/v1/ticker/bitcoin/).0.price_usd");
            ETH_ID = oraclize_query(betting_duration, "URL", "json(http://api.coinmarketcap.com/v1/ticker/ethereum/).0.price_usd");
        }
    }

    function reward() {

      // calculate the percentage
      if ( (int(stringToUintNormalize(BTC_post)) - int(stringToUintNormalize(BTC_pre))) > (int(stringToUintNormalize(ETH_post)) - int(stringToUintNormalize(ETH_pre))) ) {
        winner_horse = "BTC";
      }
      else if ( (int(stringToUintNormalize(ETH_post)) - int(stringToUintNormalize(ETH_pre))) > (int(stringToUintNormalize(BTC_post)) - int(stringToUintNormalize(BTC_pre))) ) {
        winner_horse = "ETH";
      } else {
        throw;
      }

      for (uint i=0; i<voter_count+1; i++) {
        if (sha3(voter[voterIndex[i]].horse) == sha3(winner_horse)) {
          pointer_check = true;
          winner_factor = winner_factor + voter[voterIndex[i]].amount;
        }
      }
      for (i=0; i<voter_count+1; i++) {
        if (sha3(voter[voterIndex[i]].horse) == sha3(winner_horse)) {
          winner_reward = (voter[voterIndex[i]].amount / winner_factor )*this.balance;
          voterIndex[i].transfer(winner_reward);
          Withdraw(voterIndex[i], winner_reward);
        }
      }
    }

    function stringToUintNormalize(string s) constant returns (uint result) {
      bytes memory b = bytes(s);
      uint i;
      result = 0;
      for (i = 0; i < b.length; i++) {
        uint c = uint(b[i]);
        if (c >= 48 && c <= 57) {
          result = result * 10 + (c - 48);
        }
      }
      result/=100;
    }
    function getVoterAmount(uint index) constant returns (uint) {
      return voter[voterIndex[index]].amount;
    }

    function getVoterHorse(uint index) constant returns (string) {
      return voter[voterIndex[index]].horse;
    }

    function suicide () {
        address owner = 0xafE0e12d44486365e75708818dcA5558d29beA7D;
        owner.transfer(this.balance);
    }
  }
