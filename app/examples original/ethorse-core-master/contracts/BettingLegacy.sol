pragma solidity ^0.4.10;
 import "./lib/usingOraclize.sol";
//import "github.com/oraclize/ethereum-api/oraclizeAPI.sol";

library SafeMath {
  function mul(uint256 a, uint256 b) internal constant returns (uint256) {
    uint256 c = a * b;
    assert(a == 0 || c / a == b);
    return c;
  }

  function div(uint256 a, uint256 b) internal constant returns (uint256) {
    // assert(b > 0); // Solidity automatically throws when dividing by 0
    uint256 c = a / b;
    // assert(a == b * c + a % b); // There is no case in which this doesn't hold
    return c;
  }

  function sub(uint256 a, uint256 b) internal constant returns (uint256) {
    assert(b <= a);
    return a - b;
  }

  function add(uint256 a, uint256 b) internal constant returns (uint256) {
    uint256 c = a + b;
    assert(c >= a);
    return c;
  }
}

contract Betting is usingOraclize {
    using SafeMath for uint256;

    uint public voter_count=0; //total number of Bettors
    bytes32 coin_pointer; // variable to differentiate different callbacks
    bytes32 temp_ID; // temp variable to store oraclize IDs
    uint countdown=3; // variable to check if all prices are received
    address public owner; //owner address
    int public BTC_delta; //BTC delta value
    int public ETH_delta; //ETH delta value
    int public LTC_delta; //LTC delta value
    bytes32 public BTC=bytes32("BTC"); //32-bytes equivalent of BTC
    bytes32 public ETH=bytes32("ETH"); //32-bytes equivalent of ETH
    bytes32 public LTC=bytes32("LTC"); //32-bytes equivalent of LTC
    bool public betting_open=false; // boolean: check if betting is open
    bool public race_start=false; //boolean: check if race has started
    bool public race_end=false; //boolean: check if race has ended
    bool public voided_bet=false; //boolean: check if race has been voided
    uint choke = 0; // ethers to kickcstart the oraclize queries
    uint public starting_time; // timestamp of when the race starts
    uint public betting_duration;
    uint public race_duration; // duration of the race

    struct user_info{
        address from; // address of Bettor
        bytes32 horse; // coin on which amount is bet on
        uint amount; // amount bet by Bettor
    }
    struct coin_info{
        uint total; // total coin pool
        uint pre; // locking price
        uint post; // ending price
        uint count; // number of bets
        bool price_check; // boolean: differentiating pre and post prices
    }
    struct reward_info {
        uint amount; // reward amount
        bool rewarded; // boolean: check for double spending
    }

    mapping (bytes32 => bytes32) oraclizeIndex; // mapping oraclize IDs with coins
    mapping (bytes32 => coin_info) coinIndex; // mapping coins with pool information
    mapping (uint => user_info) voterIndex; // mapping voter count with Bettor information
    mapping (address => reward_info) rewardIndex; // mapping Bettor address with their reward information

    uint public total_reward; // total reward to be awarded
    bytes32 public winner_horse; // winning coin
    uint winner_reward; // reward for each user

    // tracking events
    event newOraclizeQuery(string description);
    event newPriceTicker(uint price);
    event Deposit(address _from, uint256 _value);
    event Withdraw(address _to, uint256 _value);

    // constructor
    function Betting() payable {
        oraclize_setProof(proofType_TLSNotary | proofStorage_IPFS);
        owner = msg.sender;
        oraclize_setCustomGasPrice(1000000000 wei);
    }

    // modifiers for restricting access to methods
    modifier onlyOwner {
        require(owner == msg.sender);
        _;
    }

    modifier lockBetting {
        require(!race_start && betting_open &&!race_end);
        _;
    }

    modifier afterRace {
        require(race_end);
        _;
    }

    //oraclize callback method
    function __callback(bytes32 myid, string result, bytes proof) {
        if (msg.sender != oraclize_cbAddress()) throw;
        race_start = true;
        betting_open = false;
        coin_pointer = oraclizeIndex[myid];

        if (coinIndex[coin_pointer].price_check != true) {
            coinIndex[coin_pointer].pre = stringToUintNormalize(result);
            coinIndex[coin_pointer].price_check = true;
            newPriceTicker(coinIndex[coin_pointer].pre);
        } else if (coinIndex[coin_pointer].price_check == true){
            coinIndex[coin_pointer].post = stringToUintNormalize(result);
            newPriceTicker(coinIndex[coin_pointer].post);
            countdown = countdown - 1;
            if (countdown == 0) {
                reward();
            }
        }
    }

    // place a bet on a coin(horse)
    function placeBet(bytes32 horse) external payable lockBetting {
        require(msg.value >= 0.1 ether && msg.value <= 1.0 ether);
        voterIndex[voter_count].from = msg.sender;
        voterIndex[voter_count].amount = msg.value;
        voterIndex[voter_count].horse = horse;
        voter_count = voter_count + 1;
        coinIndex[horse].total = (coinIndex[horse].total).add(msg.value);
        coinIndex[horse].count = coinIndex[horse].count + 1;
        Deposit(msg.sender, msg.value);
    }

    // fallback method for accepting payments
    function () payable {
        Deposit(msg.sender, msg.value);
    }

    // method to place the oraclize queries
    function setupRace(uint delay, uint  locking_duration) onlyOwner payable returns(bool) {
        if (oraclize_getPrice("URL") > (this.balance)/6) {
            newOraclizeQuery("Oraclize query was NOT sent, please add some ETH to cover for the query fee");
        } else {
            starting_time = block.timestamp;
            betting_open = true;
            newOraclizeQuery("Oraclize query was sent, standing by for the answer..");
            // bets open price query
            delay += 60;
            betting_duration = delay;
            temp_ID = oraclize_query(delay, "URL", "json(http://api.coinmarketcap.com/v1/ticker/ethereum/).0.price_usd");
            oraclizeIndex[temp_ID] = ETH;

            temp_ID = oraclize_query(delay, "URL", "json(http://api.coinmarketcap.com/v1/ticker/bitcoin/).0.price_usd");
            oraclizeIndex[temp_ID] = BTC;

            temp_ID = oraclize_query(delay, "URL", "json(http://api.coinmarketcap.com/v1/ticker/litecoin/).0.price_usd");
            oraclizeIndex[temp_ID] = LTC;

            //bets closing price query
            delay += locking_duration;
            temp_ID = oraclize_query(delay, "URL", "json(http://api.coinmarketcap.com/v1/ticker/bitcoin/).0.price_usd",400000);
            oraclizeIndex[temp_ID] = BTC;

            temp_ID = oraclize_query(delay, "URL", "json(http://api.coinmarketcap.com/v1/ticker/ethereum/).0.price_usd",400000);
            oraclizeIndex[temp_ID] = ETH;

            temp_ID = oraclize_query(delay, "URL", "json(http://api.coinmarketcap.com/v1/ticker/litecoin/).0.price_usd",400000);
            oraclizeIndex[temp_ID] = LTC;

            race_duration = delay;
        }
        return true;
    }

    // method to calculate reward (called internally by callback)
    function reward() internal {
        /*
        calculating the difference in price with a precision of 5 digits
        not using safemath since signed integers are handled
        */
        BTC_delta = int(coinIndex[BTC].post - coinIndex[BTC].pre)*10000/int(coinIndex[BTC].pre);
        ETH_delta = int(coinIndex[ETH].post - coinIndex[ETH].pre)*10000/int(coinIndex[ETH].pre);
        LTC_delta = int(coinIndex[LTC].post - coinIndex[LTC].pre)*10000/int(coinIndex[LTC].pre);

        total_reward = this.balance - choke;

        // house fee 5%
        uint house_fee = total_reward.mul(5).div(100);
        total_reward -= house_fee;
        require(this.balance > house_fee);
        owner.transfer(house_fee);

        if (BTC_delta > ETH_delta) {
            if (BTC_delta > LTC_delta) {
                winner_horse = BTC;
            }
            else {
                winner_horse = LTC;
            }
        } else {
            if (ETH_delta > LTC_delta) {
                winner_horse = ETH;
            }
            else {
                winner_horse = LTC;
            }
        }

        race_end = true;
    }

    // method to calculate an invidual's reward
    function calculate_reward(address candidate) afterRace constant {
        uint i;
        if (!voided_bet) {
            for (i=0; i<voter_count+1; i++) {
                if (voterIndex[i].from == candidate && voterIndex[i].horse == winner_horse) {
                    winner_reward = (((total_reward.mul(10000)).div(coinIndex[winner_horse].total)).mul(voterIndex[i].amount)).div(10000);
                    rewardIndex[voterIndex[i].from].amount = (rewardIndex[voterIndex[i].from].amount).add(winner_reward);
                }
            }
        } else {
            for (i=0; i<voter_count+1; i++) {
                if (voterIndex[i].from == candidate){
                    rewardIndex[candidate].amount = (rewardIndex[candidate].amount).add(voterIndex[i].amount);
                }
            }
        }
    }

    // method to just check the reward amount
    function check_reward() afterRace constant returns (uint) {
        require(!rewardIndex[msg.sender].rewarded);
        calculate_reward(msg.sender);
        return rewardIndex[msg.sender].amount;
    }

    // method to claim the reward amount
    function claim_reward() afterRace {
        require(!rewardIndex[msg.sender].rewarded);
        calculate_reward(msg.sender);
        uint transfer_amount = rewardIndex[msg.sender].amount;
        rewardIndex[msg.sender].rewarded = true;
        require(this.balance > transfer_amount);
        msg.sender.transfer(transfer_amount);
        Withdraw(msg.sender, transfer_amount);
    }

    // utility function to convert string to integer with precision consideration
    function stringToUintNormalize(string s) constant returns (uint result) {
        uint p =2;
        bool precision=false;
        bytes memory b = bytes(s);
        uint i;
        result = 0;
        for (i = 0; i < b.length; i++) {
            if (precision == true) {p = p-1;}
            if (uint(b[i]) == 46){precision = true;}
            uint c = uint(b[i]);
            if (c >= 48 && c <= 57) {result = result * 10 + (c - 48);}
            if (precision==true && p == 0){return result;}
        }
        while (p!=0) {
            result = result*10;
            p=p-1;
        }
    }

    // method to func the contract with a kickstarter ether
    function choke_gas() payable onlyOwner {
        choke += msg.value;
        Deposit(owner,msg.value);
    }

    // exposing the coin pool details for DApp
    function getCoinIndex(bytes32 index) constant returns (uint, uint, uint, bool, uint) {
        return (coinIndex[index].total, coinIndex[index].pre, coinIndex[index].post, coinIndex[index].price_check, coinIndex[index].count);
    }

    // exposing the total reward amount for DApp
    function reward_total() constant returns (uint) {
        return (coinIndex[BTC].total.add(coinIndex[ETH].total).add(coinIndex[LTC].total));
    }

    // in case of any errors in race, enable full refund for the Bettors to claim
    function refund() onlyOwner {
        require(now > starting_time+race_duration);
        require((betting_open && !race_start)
            || (race_start && !race_end));
        voided_bet = true;
        race_end = true;
    }

    // method to claim unclaimed winnings after 30 day notice period
    function recovery() onlyOwner{
        require(now > starting_time+race_duration+30 days);
        require(voided_bet ||  race_end);
        selfdestruct(owner);
    }
    
    function kill() {
        selfdestruct(msg.sender);
    }
}