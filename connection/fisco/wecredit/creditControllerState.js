// CreditControllerState.js
// customize the state definition and prepost conditions about CreditController
//
class CreditInterface {
    constructor() {
        this.abi = undefined;
        this.address = undefined;
    }
    setAbi(abi) {
        this.abi = abi;
    }
    setAddress(address) {
        this.address = address;
    }
    createCredit(raw_tx) {
        return {
            target: tcredit
        }
    }
    transferCredit(raw_tx) {
        return {
            target: tcredit,
            split: scredit,
            origin: ocredit
        }
    }
    discountCredit(raw_tx) {
        return {
            target: tcredit,
            discount: dcredit,
            origin: ocredit
        }
    }
    expireCredit(raw_tx) {
        return {
            target: tcredit,
        }
    }
    clearCredit(raw_tx) {
        return {
            target: tcredit,
        }
    }
    closeCredit(raw_tx) {
        return {
            target: tcredit,
        }
    }
    getStatus() {}
    getSccAmt() {}
    getOwner() {}
}
class CreditControllerState {
    constructor() {
        this.status = {
            holding: undefined,
            clearing: undefined,
            valid: undefined
        };
        this.sccAmt = undefined;
        this.owner = undefined;
        this.credit = new CreditInterface();
    }
    update() {
        this.status = this.credit.getStatus();
        this.sccAmt = this.credit.getSccAmt();
        this.owner = this.credit.getOwner();
    }
    createCredit(raw_tx) {
        this.update();
        //preCondition
        //TO DO
        let ret = this.credit.createCredit(raw_tx);
        //...
        //postCondition
        return ret.target;
    }

    transferCredit(raw_tx) {
        this.update();
        //preCondition
        //TO DO
        let ret = this.credit.transferCredit(raw_tx);
        //...
        //postCondition
        return ret.target;
    }
    discountCredit(raw_tx) {
        this.update();
        //preCondition
        //TO DO
        let ret = this.credit.discountCredit(raw_tx);
        //...
        //postCondition
        return ret.target;
    }
    expireCredit(raw_tx) {
        this.update();
        //preCondition
        //TO DO
        let ret = this.credit.expireCredit(raw_tx);
        //...
        //postCondition
        return ret.target;
    }
    closeCredit(raw_tx) {
        this.update();
        //preCondition
        //TO DO
        let ret = this.credit.closeCredit(raw_tx);
        //...
        //postCondition
        return ret.target;
    }
    clearCredit(raw_tx) {
        this.update();
        //preCondition
        //TO DO
        let ret = this.credit.clearCredit(raw_tx);
        //...
        //postCondition
        return ret.target;
    }
}
class CreditStateMachine() {
    constructor() {
        this.machine = {
	    current_state: undefined,
            initial_state: "null",
            terminate_state: ["expired", "closed", "cleared"],
            transitions: [{
                    start: "null",
                    next: [{
                        action: "create",
                        end: "created"
                    }]
                },
                {
                    start: "create",
                    next: [{
                        action: "transfer",
                        end: "created"
                    }, {
                        action: "discount",
                        end: "discounted"
                    }, {
                        action: "expire",
                        end: "expired"
                    }, {
                        action: "close",
                        end: "closed"
                    }, {
                        action: "clear",
                        end: "cleared"
                    }]
                },
                {
                    start: "discounted",
                    next: [{
                        action: "transfer",
                        end: "discounted"
                    }, {
                        action: "expire",
                        end: "expired"
                    }, {
                        action: "close",
                        end: "closed"
                    }, {
                        action: "clear",
                        end: "cleared"
                    }]

                }
            ]
        }
        this.machine.current_state = this.machine.initial_state;
    }
    next() {
        return this.machine.transitions.filter(transijjjjjjtion=>transition.start=this.machine.current_state);
    }
    isTerminate(){
	return this.machine.terminate_state.includes(this.machine.current_state);
    }
}
