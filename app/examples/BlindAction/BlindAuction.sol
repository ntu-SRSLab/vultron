//source: https://arxiv.org/pdf/1711.09327
contract BlindAuction {
    // States definition 
       enum States {
        ABB,
        RB,
        F,
        C
    }
    States public  state = States.ABB;


    // Variables definition 
    struct Bid {
        bytes32 blindedBid;
        uint deposit;
    }
    mapping(address => Bid[])   private bids;
    mapping(address => uint)    private pendingReturns;
    address private highestBidder;
    uint private highestBid;
    uint private creationTime = now;
    // Locking 
    bool private locked = false;
    modifier locking {
        require(!locked);
        locked = true;
        _;
        locked = false;
    }
    // Transition counter 
    uint private transitionCounter = 0;
    modifier transitionCounting(uint nextTransitionNumber) {
        require(nextTransitionNumber == transitionCounter);
        transitionCounter += 1;
        _;
    }
    // Transitions 
    // Transition bid 
    function bid(uint nextTransitionNumber, bytes32 blindedBid) public payable locking transitionCounting(nextTransitionNumber) {
        require(state == States.ABB); // Actions
        bids[msg.sender].push(Bid({
            blindedBid: blindedBid,
            deposit: msg.value
        }));
        pendingReturns[msg.sender] += msg.value;
    }
    // Transition close 
    function close(uint nextTransitionNumber)  public locking transitionCounting(nextTransitionNumber) {
        require(state == States.ABB);
        // Guards
        // require(now >= creationTime + 5 days);
        //State change
        state = States.RB;
    }
    // Transition reveal 
    function reveal(uint nextTransitionNumber, uint[] values, bytes32[] secrets) public locking transitionCounting(nextTransitionNumber) {
        require(state == States.RB);
        // Guards 
        require(values.length == secrets.length);
        // Actions 
        for (uint i = 0; i < (bids[msg.sender].length < values.length ? bids[msg.sender].length : values.length); i++) {
            var bid = bids[msg.sender][i];
            var (value, secret) = (values[i], secrets[i]);
            if (bid.blindedBid != keccak256(value, secret)) { // Do not add to refund value. 
                continue;
            }
            if (bid.deposit >= value && value > highestBid) {
                highestBid = value;
                highestBidder = msg.sender;
            }
        }
    }
    // Transition finish
    function finish(uint nextTransitionNumber) public locking transitionCounting(nextTransitionNumber) {
        require(state == States.RB);
        // Guards 
        // require(now >= creationTime + 10 days);
        //State change 
        state = States.F;
    }
    // Transition cancelABB 
    function cancelABB(uint nextTransitionNumber) public locking transitionCounting(nextTransitionNumber) {
        require(state == States.ABB);
        //State change 
        state = States.C;
    }
    // Transition cancelRB 
    function cancelRB(uint nextTransitionNumber) public locking transitionCounting(nextTransitionNumber) {
        require(state == States.RB);
        //State change
        state = States.C;
    }
    //
    // Transition withdraw 
    function withdraw(uint nextTransitionNumber) public locking transitionCounting(nextTransitionNumber) {
        uint amount;
        require(state == States.F);
        // Actions 
        amount = pendingReturns[msg.sender];
        if (amount > 0 && msg.sender != highestBidder) {
            msg.sender.transfer(amount);
            pendingReturns[msg.sender] = 0;
        } else {
            msg.sender.transfer(amount - highestBid);
            pendingReturns[msg.sender] = 0;
        }
    }
    // Transition unbid 
    function unbid(uint nextTransitionNumber) public locking transitionCounting(nextTransitionNumber) {
        uint amount;
        require(state == States.C);
        // Actions 
        amount = pendingReturns[msg.sender];
        if (amount > 0) {
            msg.sender.transfer(amount);
            pendingReturns[msg.sender] = 0;
        }
    }
}