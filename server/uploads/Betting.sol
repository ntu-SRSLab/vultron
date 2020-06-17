pragma solidity ^0.4.11;
import "SafeMath.sol";

contract Betting{
    using SafeMath for uint256; //using safemath
 

    enum States {
        INITIAL,
        BET_OPEN,
        RACE_START,
        RACE_END,
        VOIDED_BET
    }
    States public  state = States.INITIAL;

    address public owner; //owner address

    uint public winnerPoolTotal;
    string public constant version = "0.2.5";

    struct chronus_info {
        bool  betting_open; // boolean: check if betting is open
        bool  race_start; //boolean: check if race has started
        bool  race_end; //boolean: check if race has ended
        bool  voided_bet; //boolean: check if race has been voided
        uint32  starting_time; // timestamp of when the race starts
        uint32  betting_duration;
        uint32  race_duration; // duration of the race
        uint32 voided_timestamp;
    }

    uint public total_reward; // total reward to be awarded
    uint32 total_bettors;


    // tracking events
    event Deposit(address _from, uint256 _value, bytes32 _horse, uint256 _date);
    event Withdraw(address _to, uint256 _value);
    event PriceCallback(bytes32 coin_pointer, uint256 result, bool isPrePrice);
    event RefundEnabled(string reason);

    chronus_info public chronus;

    // constructor
    constructor() public payable {
        owner = msg.sender;
        chronus.betting_open = false;
        chronus.race_start = false;
        chronus.race_end = false;
        chronus.voided_bet = false;
    }


    // modifiers for restricting access to methods
    modifier onlyOwner {
        require(owner == msg.sender);
        _;
    }

    modifier duringBetting {
        require(chronus.betting_open);
        require(now < chronus.starting_time + chronus.betting_duration);
        _;
    }

    modifier beforeBetting {
        require(!chronus.betting_open && !chronus.race_start);
        _;
    }

    modifier afterRace {
        require(chronus.race_end);
        _;
    }

    //function to change owner
    function changeOwnership(address _newOwner) onlyOwner external {
        require(now > chronus.starting_time + chronus.race_duration + 60 minutes);
        owner = _newOwner;
    }

    function priceCallback (bytes32 coin_pointer, uint256 result, bool isPrePrice ) external onlyOwner {
        require(state == States.INITIAL || state == States.BET_OPEN || state == States.RACE_START );

        require (!chronus.race_end);
        emit PriceCallback(coin_pointer, result, isPrePrice);
        chronus.race_start = true;
        chronus.betting_open = false;
        
        state = States.RACE_START;

          if (isPrePrice) {
            if (now >= chronus.starting_time+chronus.betting_duration+ 60 minutes) {
                emit RefundEnabled("Late start price");
                forceVoidRace();
            } else {
            }
        } else if (!isPrePrice){
                    reward();
        }
    }

    // place a bet on a coin(horse) lockBetting
    function placeBet(bytes32 horse) external duringBetting payable  {
        require(msg.value >= 0.01 ether);
    }

    // method to place the oraclize queries
    function setupRace(uint32 _bettingDuration, uint32 _raceDuration) onlyOwner beforeBetting external payable {
    // function setupRace(uint32 _bettingDuration, uint32 _raceDuration)  external payable {
           require(state == States.INITIAL);

            chronus.starting_time = uint32(block.timestamp);
            chronus.betting_open = true;
            chronus.betting_duration = _bettingDuration;
            chronus.race_duration = _raceDuration;
           
            state = States.BET_OPEN;
    }

    // method to calculate reward (called internally by callback)
    function reward() internal {

       chronus.race_end = true;
       state = States.RACE_END;
    }

    // method to calculate an invidual's reward
    function calculateReward(address candidate) internal afterRace view returns(uint winner_reward) {
       winner_reward = 0;
    }

    // method to just check the reward amount
    function checkReward() afterRace external view returns (uint) {
          return calculateReward(msg.sender);
    }

    // method to claim the reward amount
    function claim_reward() afterRace external {

    }

    function forceVoidRace() internal {
       require(state == States.INITIAL || state == States.BET_OPEN || state == States.RACE_START || state == States.RACE_END);
        require(!chronus.voided_bet);
        chronus.voided_bet=true;
        chronus.race_end = true;
        chronus.voided_timestamp=uint32(now);

        state = States.VOIDED_BET;
    }

    //this methohd can only be called by controller contract in case of timestamp errors
    function forceVoidExternal() external onlyOwner {
        forceVoidRace();
        emit RefundEnabled("Inaccurate price timestamp");
    }

    // exposing the coin pool details for DApp
    function getCoinIndex(bytes32 index, address candidate) external view returns (uint, uint, uint, bool, uint) {
       return (0, 0, 0, true, 0);
    }

    // exposing the total reward amount for DApp
    function reward_total() external view returns (uint) {
        return  0;
    }

    function getChronus() external view returns (uint32[] memory) {
        uint32[] memory chronusData = new uint32[](3);
        chronusData[0] = chronus.starting_time;
        chronusData[1] = chronus.betting_duration;
        chronusData[2] = chronus.race_duration;
        return (chronusData);
        // return (chronus.starting_time, chronus.betting_duration ,chronus.race_duration);
    }

    // in case of any errors in race, enable full refund for the Bettors to claim
    function refund() external onlyOwner {
        require(state == States.BET_OPEN || state == States.RACE_START);
        
        // require(now > chronus.starting_time + chronus.race_duration + 60 minutes);
        
        require((chronus.betting_open && !chronus.race_start)
            || (chronus.race_start && !chronus.race_end));
        chronus.voided_bet = true;
        chronus.race_end = true;
        chronus.voided_timestamp=uint32(now);

        state = States.VOIDED_BET;
    }

    // method to claim unclaimed winnings after 30 day notice period
    function recovery() external onlyOwner{
        require((chronus.race_end && now > chronus.starting_time + chronus.race_duration + (30 days))
            || (chronus.voided_bet && now > chronus.voided_timestamp + (30 days)));
    }
}
