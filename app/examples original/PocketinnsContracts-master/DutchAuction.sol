pragma solidity 0.4.19;

import './StandardERC20.sol';


contract pinnsDutchAuction {
    using SafeMath for uint256;
    uint constant public MAX_TOKENS = 30000000 * 10**18; // 30M pinns Token
    uint constant public minimumInvestment = 1 * 10**18; // 1 ether is minimum minimumInvestment        
    uint constant public goodwillTokensAmount = 5000000 * 10**18; // 5M pinns Token
    
    Stages public stage;
    
     /*
     *  Enums
     */
    enum Stages {
        AuctionDeployed,
        AuctionSetUp,
        AuctionStarted,
        AuctionEnded,
        goodwillDistributionStarted
    }
     
     /*
     *  Storage
     */
    PocketinnsToken public pinnsToken;
    address public owner;
    // uint public ceiling;
    uint public priceFactor;
  

    /*
     *  Store to maintain the status and details of the investors,
     *  who invest in first four days for distributing goodwill bonus tokens
     */
    
    uint256 public bonusRecipientCount;
    mapping (address => bool) public goodwillBonusStatus; 
    mapping (address => uint) public bonusTokens; // the bonus tokens to be received by investors for first four days
    
     /*
     *  Variables to store the total amount recieved for first four days and total recieved
     */
    uint256 public fourDaysRecieved;
    uint256 public totalReceived;

    uint256 public startItoTimestamp; // to store the starting time of the ITO
    uint256 public pricePerToken;
    uint256 public startPricePerToken;
    uint256 public currentPerTokenPrice;   
    uint256 public finalPrice;
    uint256 public totalBounsTokens;
    uint256 public totalTokensSold;
    uint256 constant price1  = 2500;
    uint256 constant price2  = 900;
    mapping (address => uint256) public noBonusDays;
    mapping (address => uint256) public itoBids;
    mapping (address => bool) public whitelisted;
    event ito(address investor, uint256 amount, string day);
    
     /*
     *  Modifiers
     */
     
    modifier atStage(Stages _stage) {
        if (stage != _stage)
            // Contract not in expected state
            revert();
        _;
    }

    modifier isOwner() {
        if (msg.sender != owner)
            // Only owner is allowed to proceed
            revert();
        _;
    }

    modifier isValidPayload() {
        if (msg.data.length != 4 && msg.data.length != 36)
            revert();
        _;
    }

    function pinnsDutchAuction(uint256 EtherPriceFactor)
        public
    {
        require(EtherPriceFactor != 0);
        owner = msg.sender;
        stage = Stages.AuctionDeployed;
        priceFactor = EtherPriceFactor;
    }
     
    
    // /// @dev Setup function sets external contracts' addresses.
    // /// @param pinnsToken pinnns token address.
    function startICO(address _pinnsToken) public
        isOwner
        atStage(Stages.AuctionDeployed)
        {
        require(_pinnsToken !=0);
        pinnsToken = PocketinnsToken(_pinnsToken);
        // Validate token balance
        require (pinnsToken.balanceOf(address(this)) == MAX_TOKENS);
        stage = Stages.AuctionStarted;
        startItoTimestamp = block.timestamp;
        startPricePerToken = 2500;  //2500 cents is the starting price
        currentPerTokenPrice = startPricePerToken;
        }
        
    function ()
        public 
        payable 
        atStage(Stages.AuctionStarted)
        {
            require (msg.value >= minimumInvestment && (block.timestamp - startItoTimestamp) <=16 days);
          
            if (((msg.value * priceFactor *100)/currentPerTokenPrice) >= (MAX_TOKENS - totalTokensSold) ||
            totalReceived >= 40636 * 10**18  //checks 46 million dollar hardcap considering 1 eth=1132dollar
            )
                finalizeAuction();
                
            totalReceived = totalReceived.add(msg.value);       
            getCurrentPrice();
            setInvestment(msg.sender,msg.value);
        }
        
        function getCurrentPrice() public
        {
            totalTokensSold = ((totalReceived.mul(priceFactor.mul(100))).div(currentPerTokenPrice));
            uint256 priceCalculationFactor = (block.timestamp.sub(startItoTimestamp)).div(43200);
            if(priceCalculationFactor <=16)
            {
                currentPerTokenPrice = (price1).sub(priceCalculationFactor.mul(100));
            }
            else if (priceCalculationFactor > 16 && priceCalculationFactor <= 31)
            {
                currentPerTokenPrice = (price2).sub((((priceCalculationFactor.mul(100)).sub(1600))).div(2));
            }
        }
        
        function setInvestment(address investor,uint amount) private 
        {
            if (currentPerTokenPrice >=1800)
            {
                goodwillBonusStatus[investor] = true;
                bonusTokens[investor] = bonusTokens[investor].add((amount.mul(priceFactor.mul(100))).div(currentPerTokenPrice));
                totalBounsTokens = totalBounsTokens.add(bonusTokens[investor]);
                fourDaysRecieved = fourDaysRecieved.add(amount); 
                bonusRecipientCount++;   // will be used later for goodwill token distribution
                itoBids[investor] = itoBids[investor].add(amount);     // will be used for ITO token distribution
                ito(investor,amount,"Bonus days");
            }
            else if(currentPerTokenPrice < 1800)
            {
                itoBids[investor] = itoBids[investor].add(amount);     // will be used for ITO token distribution
                noBonusDays[investor] = amount;
                ito(investor,amount,"5th day or after");
            }
        }
        
        function finalizeAuction() private
        {
            finalPrice = currentPerTokenPrice;
            totalTokensSold = ((totalReceived.mul(priceFactor.mul(100))).div(currentPerTokenPrice));
            uint256 leftTokens = MAX_TOKENS.sub(totalTokensSold);
            pinnsToken.burnLeftItoTokens(leftTokens);
            stage = Stages.AuctionEnded;
        }
        
         function finalizeAuctionOwner(uint256 finaltokenprice) external isOwner
        {
            currentPerTokenPrice = finaltokenprice;
            totalTokensSold = ((totalReceived.mul(priceFactor.mul(100))).div(currentPerTokenPrice));
            uint256 leftTokens = MAX_TOKENS.sub(totalTokensSold);
            finalPrice = currentPerTokenPrice;
            pinnsToken.burnLeftItoTokens(leftTokens);
            stage = Stages.AuctionEnded;
        }
        
        //Investor can claim his tokens within two weeks of ICO end using this function
        //It can be also used to claim on behalf of any investor
        function claimTokensICO(address receiver) public
        atStage(Stages.AuctionEnded)
        // isValidPayload
        {
            // if (receiver == 0)
            // receiver = msg.sender;
            require(whitelisted[receiver]);
            require(itoBids[receiver] >0);
            
            uint256 tokenCount = (itoBids[receiver].mul(priceFactor.mul(100))).div(finalPrice);
            itoBids[receiver] = 0;
            pinnsToken.transfer(receiver, tokenCount);
            
        }
        
       function setWhiteListAddresses(address _investor) external isOwner{
           whitelisted[_investor] = true;
       }
       
        // goodwill tokens are sent to the contract by the owner
        function startGoodwillDistribution()
        external
        atStage(Stages.AuctionEnded)
        isOwner
        {
            require (pinnsToken.balanceOf(address(this)) != 0);
            stage = Stages.goodwillDistributionStarted;
        }
        // goodwill token need to be updated..
        function claimGoodwillTokens(address receiver)
        atStage(Stages.goodwillDistributionStarted)
        public
        isValidPayload
        {
            if (receiver == 0)
            receiver = msg.sender;
            if(goodwillBonusStatus[receiver] == true)
            {
                goodwillBonusStatus[receiver] = false;
                uint bonus = bonusTokens[receiver];
                pinnsToken.transfer(receiver, bonus);
                bonusTokens[receiver] = 0;
            }
        }
        
        function drain() 
        external 
        isOwner
        {
            owner.transfer(this.balance);
        }
        
        function drainToken() external isOwner{
           uint256 dutchbalance=  pinnsToken.balanceOf(address(this));
            pinnsToken.transfer(owner, dutchbalance);
            
        }
        //In case of emergency the state can be reset by the owner of the smart contract
        //Intention here is providing an extra protection to the Investor's funds
        // 1. AuctionDeployed,
        // 2. AuctionSetUp,
        // 3. AuctionStarted,
        // 4. AuctionEnded,
        // 5. goodwillDistributionStarted
        function setStage(uint state)
        external
        isOwner
        {
            if(state == 0)
            stage = Stages.AuctionDeployed;
            else if (state == 1)
            stage = Stages.AuctionSetUp;
            else if (state == 2)
            stage = Stages.AuctionStarted;
            else if (state == 3)
            stage = Stages.AuctionEnded;
            else if (state == 4)
            stage = Stages.goodwillDistributionStarted;
        }
    }
