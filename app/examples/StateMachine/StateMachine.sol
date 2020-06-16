pragma solidity ^0.4.15;
//source https://gist.github.com/subhodi/0cdec0ddbef26890d2b976aef04ee799#6-contract-as-state-machine
contract StateMachine {
    
    enum Stages {  // State flow from applied to Finished
        Applied,
        Initiated,
        Approved,
        Received,
        Finished
        
    }

    // This is the current stage of the contract
    Stages public stage = Stages.Applied;

    modifier atStage(Stages _stage) {
        require(stage == _stage);
        _;
    }

    // Forward state of enum stage by 1
    function nextStage() internal {
        stage = Stages(uint(stage) + 1);
    }

    // This modifier goes to the next stage
    // after the function is done.
    modifier transitionNext() {
        _;
        nextStage();
    }

    function initiate()
        atStage(Stages.Applied) // initialize requires current state to be `Applied`
        transitionNext {        // Forward state

    }

    function approve()
        atStage(Stages.Initiated) // initialize requires current state to be `Initiated`
        transitionNext {          // Forward state    

    }

    function receive()
        atStage(Stages.Approved) // initialize requires current state to be `Approved`
        transitionNext {         // Forward state

    }
    
     function finish()
        atStage(Stages.Received) // initialize requires current state to be `Received`
        transitionNext {         // Forward state

    }
}