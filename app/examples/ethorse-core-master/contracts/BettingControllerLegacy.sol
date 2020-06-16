pragma solidity ^0.4.19;

import {Betting as Race, usingOraclize} from "./Betting.sol";
 

contract BettingController is usingOraclize {
    address owner;
    bool paused;
    uint256 raceCounter;
    Race race;
    
    enum raceStatusChoices { Betting, Cooldown, Racing, RaceEnd, Aborted }
    
    struct raceInfo {
        uint256 spawnTime;
        raceStatusChoices raceStatus;
    }
    
    mapping (address => raceInfo) raceIndex;
    event RaceDeployed(address _address, address _owner, uint256 _time);
    event HouseFeeDeposit(address _race, uint256 _value);
    event newOraclizeQuery(string description);
    event AddFund(uint256 _value);

    modifier onlyOwmner {
        require(msg.sender == owner);
        _;
    }
    
    modifier whenNotPaused {
        require(!paused);
        _;
    }
    
    function BettingController() public payable {
        owner = msg.sender;
    }
    
    function addFunds() external onlyOwmner payable {
        AddFund(msg.value);
    }
    
    function () external payable{
        require(raceIndex[msg.sender].raceStatus == raceStatusChoices.RaceEnd);
        HouseFeeDeposit(msg.sender, msg.value);
    }

    function spawnRace() whenNotPaused {
        // require(!paused);
        race = (new Race).value(0.1 ether)();
        raceIndex[race].raceStatus = raceStatusChoices.Betting;
        raceIndex[race].spawnTime = now;
        assert(race.setupRace(60,60));
        RaceDeployed(address(race), race.owner(), now);
    }
    
    function __callback(bytes32 myid, string result, bytes proof) {
        require (msg.sender == oraclize_cbAddress());
        spawnRace();
        update(4000000);
    }
    
    function update( uint oraclizeGasLimit) payable {
        if (oraclize_getPrice("URL") > this.balance) {
            newOraclizeQuery("Oraclize query was NOT sent, please add some ETH to cover for the query fee");
        } else {
            newOraclizeQuery("Oraclize query was sent, standing by for the answer..");
            oraclize_query(0, "URL", "", oraclizeGasLimit);
            oraclize_query(30 days, "URL", "", oraclizeGasLimit);
        }
    }
    
    function raceSpawnSwitch(bool _status) external onlyOwmner {
        paused=_status;
    }
}