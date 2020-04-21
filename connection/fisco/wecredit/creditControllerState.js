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
