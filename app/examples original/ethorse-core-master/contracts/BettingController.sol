pragma solidity ^0.5.2;

import {Betting as Race} from "./Betting.sol";
import "./lib/usingOraclize.sol";

contract oraclizeController is usingOraclize {
    address owner;
    
    event newOraclizeQuery();
    event RemoteBettingCloseInfo(address _race);
    
    struct horsesInfo {
        bytes32 BTC;
        bytes32 ETH;
        bytes32 LTC;
        uint256 customPreGasLimit;
        uint256 customPostGasLimit;
    }
    
    struct coinInfo {
        uint256 pre;
        uint256 post;
        bytes32 preOraclizeId;
        bytes32 postOraclizeId;
    }
    
    mapping (address => mapping (bytes32 => coinInfo)) public coinIndex; 
    mapping (address => mapping (bytes32 => bytes32)) oraclizeIndex; // mapping oraclize IDs with coins
    mapping (bytes32 => address) oraclizeInverseIndex; // mapping oraclize IDs with coins
    
    horsesInfo horses;
    constructor() public {
        oraclize_setProof(proofType_TLSNotary | proofStorage_IPFS);
        // oraclize_setCustomGasPrice(10000000000 wei);
        oraclize_setCustomGasPrice(30000000000 wei);
        horses.BTC = bytes32("BTC");
        horses.ETH = bytes32("ETH");
        horses.LTC = bytes32("LTC");
        owner = msg.sender;
        horses.customPreGasLimit = 120000;
        horses.customPostGasLimit = 230000;
    }
    
    modifier onlyOwner {
        require(owner == msg.sender);
        _;
    }
    
    // safemath addition
    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        assert(c >= a);
        return c;
    }
    
    // utility function to convert string to integer with precision consideration
    function stringToUintNormalize(string memory s) internal pure returns (uint result) {
        uint p =2;
        bool precision=false;
        bytes memory b = bytes(s);
        uint i;
        result = 0;
        for (i = 0; i < b.length; i++) {
            if (precision) {p = p-1;}
            // if (uint(b[i]) == uint(46)){precision = true;}
            if (uint8(b[i]) == uint8(46)){precision = true;}
            uint8 c = uint8(b[i]);
            if (c >= 48 && c <= 57) {result = result * 10 + (c - 48);}
            if (precision && p == 0){return result;}
        }
        while (p!=0) {
            result = result*10;
            p=p-1;
        }
    }
    
    function changeOraclizeGasPrice(uint _newGasPrice) external onlyOwner {
        oraclize_setCustomGasPrice(_newGasPrice);
    }
    
    // method to place the oraclize queries
    function setupRace(uint delay, uint locking_duration, address raceAddress) public payable onlyOwner {
        if (oraclize_getPrice("URL" , horses.customPreGasLimit)*3 + oraclize_getPrice("URL", horses.customPostGasLimit)*3  > address(this).balance) {
        } else {
            bytes32 temp_ID; // temp variable to store oraclize IDs
            emit newOraclizeQuery();
            temp_ID = oraclize_query(delay, "URL", "json(https://api.coinmarketcap.com/v2/ticker/1027/).data.quotes.USD.price",horses.customPreGasLimit);
            oraclizeIndex[raceAddress][temp_ID] = horses.ETH;
            oraclizeInverseIndex[temp_ID] = raceAddress;
            coinIndex[raceAddress][horses.ETH].preOraclizeId = temp_ID;

            temp_ID = oraclize_query(delay, "URL", "json(https://api.coinmarketcap.com/v2/ticker/2/).data.quotes.USD.price",horses.customPreGasLimit);
            oraclizeIndex[raceAddress][temp_ID] = horses.LTC;
            oraclizeInverseIndex[temp_ID] = raceAddress;
            coinIndex[raceAddress][horses.LTC].preOraclizeId = temp_ID;

            temp_ID = oraclize_query(delay, "URL", "json(https://api.coinmarketcap.com/v2/ticker/1/).data.quotes.USD.price",horses.customPreGasLimit);
            oraclizeIndex[raceAddress][temp_ID] = horses.BTC;
            oraclizeInverseIndex[temp_ID] = raceAddress;
            coinIndex[raceAddress][horses.BTC].preOraclizeId = temp_ID;

            //bets closing price query
            delay = add(delay,locking_duration);

            temp_ID = oraclize_query(delay, "URL", "json(https://api.coinmarketcap.com/v2/ticker/1027/).data.quotes.USD.price",horses.customPostGasLimit);
            oraclizeIndex[raceAddress][temp_ID] = horses.ETH;
            oraclizeInverseIndex[temp_ID] = raceAddress;
            coinIndex[raceAddress][horses.ETH].postOraclizeId = temp_ID;

            temp_ID = oraclize_query(delay, "URL", "json(https://api.coinmarketcap.com/v2/ticker/2/).data.quotes.USD.price",horses.customPostGasLimit);
            oraclizeIndex[raceAddress][temp_ID] = horses.LTC;
            oraclizeInverseIndex[temp_ID] = raceAddress;
            coinIndex[raceAddress][horses.LTC].postOraclizeId = temp_ID;

            temp_ID = oraclize_query(delay, "URL", "json(https://api.coinmarketcap.com/v2/ticker/1/).data.quotes.USD.price",horses.customPostGasLimit);
            oraclizeIndex[raceAddress][temp_ID] = horses.BTC;
            oraclizeInverseIndex[temp_ID] = raceAddress;
            coinIndex[raceAddress][horses.BTC].postOraclizeId = temp_ID;
        }
    }
    
    //oraclize callback method
    function __callback(bytes32 myid, string memory result, bytes memory proof) public {
        require (msg.sender == oraclize_cbAddress());
        require (stringToUintNormalize(result) > 0);
        bytes32 coin_pointer; // variable to differentiate different callbacks
        address raceAddress = oraclizeInverseIndex[myid];
        Race race = Race(raceAddress);
        coin_pointer = oraclizeIndex[raceAddress][myid];
        emit RemoteBettingCloseInfo(raceAddress);
        
        if (myid == coinIndex[raceAddress][coin_pointer].preOraclizeId) {
            if (coinIndex[raceAddress][coin_pointer].pre > 0) {
            } else {
                coinIndex[raceAddress][coin_pointer].pre = stringToUintNormalize(result);
                race.priceCallback(coin_pointer,coinIndex[raceAddress][coin_pointer].pre,true);
            }
        } else if (myid == coinIndex[raceAddress][coin_pointer].postOraclizeId){
            if (coinIndex[raceAddress][coin_pointer].post > 0) {
            } else {
                coinIndex[raceAddress][coin_pointer].post = stringToUintNormalize(result);
                race.priceCallback(coin_pointer,coinIndex[raceAddress][coin_pointer].post,false);
            }
        }
    }
    
    function ethorseOracle(address raceAddress, bytes32 coin_pointer, string calldata result, bool isPrePrice, uint32 lastUpdated ) external onlyOwner {
        emit RemoteBettingCloseInfo(raceAddress);
        Race race = Race(raceAddress);
        uint32 starting_time;
        uint32 betting_duration;
        uint32 race_duration;
        if (isPrePrice) {
            starting_time = race.getChronus()[0];
            betting_duration = race.getChronus()[1];
            if (lastUpdated < starting_time + betting_duration + 800 &&
                lastUpdated > starting_time + betting_duration - 800) {
                    coinIndex[raceAddress][coin_pointer].pre = stringToUintNormalize(result);
                    race.priceCallback(coin_pointer, stringToUintNormalize(result), isPrePrice);
            } else {
                race.forceVoidExternal();
            }
        } else {
            starting_time = race.getChronus()[0];
            race_duration = race.getChronus()[2];
            if (lastUpdated < starting_time + race_duration + 800 &&
                lastUpdated > starting_time + race_duration - 800) {
                    coinIndex[raceAddress][coin_pointer].post = stringToUintNormalize(result);
                    race.priceCallback(coin_pointer, stringToUintNormalize(result), isPrePrice);
            }
        }
    }
}

contract BettingController is oraclizeController {
    address payable owner;
    Race race;

    mapping (address => bool) public isOraclizeEnabled;
    event RaceDeployed(address _address, address _owner, uint256 _bettingDuration, uint256 _raceDuration, uint256 _time);
    event AddFund(uint256 _value);

    modifier onlyOwner {
        require(msg.sender == owner);
        _;
    }

    constructor() public payable {
        owner = msg.sender;
    }

    function addFunds() external onlyOwner payable {
        emit AddFund(msg.value);
    }

    function spawnRaceManual(uint256 _bettingDuration, uint256 _raceDuration, bool _isOraclizeUsed) external onlyOwner {
        race = (new Race)();
        emit RaceDeployed(address(race), race.owner(), _bettingDuration, _raceDuration, now);
        if (_isOraclizeUsed) {
            isOraclizeEnabled[address(race)] = true;
            setupRace(_bettingDuration, _raceDuration, address(race));
        }
        uint32 bettingDuration = uint32(_bettingDuration);
        uint32 raceDuration = uint32(_raceDuration);
        raceDuration = uint32(add(bettingDuration,raceDuration));
        bettingDuration = uint32(bettingDuration);
        race.setupRace(bettingDuration,raceDuration);
    }

    function enableRefund(address _race) external onlyOwner {
        Race raceInstance = Race(_race);
        emit RemoteBettingCloseInfo(_race);
        raceInstance.refund();
    }

    function manualRecovery(address _race) external onlyOwner {
        Race raceInstance = Race(_race);
        raceInstance.recovery();
    }

    function changeRaceOwnership(address _race, address _newOwner) external onlyOwner {
        Race raceInstance = Race(_race);
        raceInstance.changeOwnership(_newOwner);
    }

    function extractFund(uint256 _amount) external onlyOwner {
        if (_amount == 0) {
            owner.transfer(address(this).balance);
        } else {
            require(_amount <= address(this).balance);
            owner.transfer(_amount);
        }
    }
}
