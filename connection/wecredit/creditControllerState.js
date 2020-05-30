// CreditControllerState.js
// customize the state definition and prepost conditions about CreditController
//
const aa = require("aa");
const assert = require("assert");
const hex2ascii = require('hex2ascii')
const Machine = require("xstate").Machine;
const assign = require("xstate").assign;
const interpret = require("xstate").interpret;
const createModel = require("@xstate/test").createModel;
const FiscoFuzzer = require("../fisco/fuzzer.js").FiscoFuzzer;
const FiscoDeployer = require("../fisco/fuzzer.js").FiscoDeployer;
let  asyncFlag = false;
function revertAsyncFlag(){
    asyncFlag =  asyncFlag?false:true; 
}
function check_raw_tx(raw_tx) {
    assert(raw_tx["to"]);
    assert(raw_tx["fun"]);
    assert(raw_tx["param"]);
}
const  EXPIRE_CREDIT = 400;
const  CLEAR_CREDIT = 500;
const  CLOSE_CREDIT = 600;

const  CREDIT_HOLAING_CREATE_STATUS = "A";
const  CREDIT_HOLAING_INVALID_STATUS = "T";
const  CREDIT_HOLAING_DISCOUNTED_STATUS = "D";
const  CREDIT_CLEARING_CLEARED_STATUS = "AC";
const  CREDIT_CLEARING_NOCLEARED_STATUS = "NC";
const  CREDIT_VALID_NOEXPIRED_STATUS = "V";
const  CREDIT_VALID_EXPIRED_STATUS = "E";
const  CREDIT_VALID_CLOSED_STATUS = "C";
const  H1 = CREDIT_HOLAING_CREATE_STATUS;
const  H2 = CREDIT_HOLAING_INVALID_STATUS;
const  H3 = CREDIT_HOLAING_DISCOUNTED_STATUS;
const  C1 = CREDIT_CLEARING_CLEARED_STATUS;
const  C2 = CREDIT_CLEARING_NOCLEARED_STATUS;
const  V1 = CREDIT_VALID_NOEXPIRED_STATUS;
const  V2 = CREDIT_VALID_EXPIRED_STATUS;
const  V3 = CREDIT_VALID_CLOSED_STATUS;
class CreditInterface {
    constructor(CreditController, Credit) {
        this.CreditController = CreditController;
       this.Credit = undefined;
    }
    async createCredit() {
        // let raw_tx = await this.fuzzer._fuzz_fun("createCredit");
        // let receipt = await this.fuzzer._send_tx(raw_tx, this.abi);
        // let events = await this.fuzzer._parse_receipt(receipt);
        let fuzz = await this.CreditController.fuzz_fun("createCredit");
        assert(fuzz.events);
        let creditEvents = fuzz.events.filter((e) => {
            return e.name == "creditEvent"
        });
        if (creditEvents.length >= 1) {
            console.log(creditEvents);
            let credits = [];
            for (let creditEvent of creditEvents) {
               assert(creditEvent.events.filter((e) => {
                   return e.name == "credit"
                }).length == 1);
                credits.push(creditEvent.events.filter((e) => {
                    return e.name == "credit"
                })[0].value);
            }
            console.log("credit:", credits);
            return {
                raw_tx: fuzz.raw_tx,
                target: credits
            }
        }
        return {
            raw_tx: fuzz.raw_tx,
            target: []
        }
    }
    async transferCredit() {
        // let raw_tx = await this.fuzzer._fuzz_fun("transferCredit");
        // let receipt = await this.fuzzer._send_tx(raw_tx, this.abi);
        // let events = await this.fuzzer._parse_receipt(receipt);
        let fuzz = await this.CreditController.fuzz_fun("transferCredit");
        assert(fuzz.events);
        let creditEvents = fuzz.events.filter((e) => {
            return e.name == "creditEvent"
        });
        if (creditEvents.length >= 1) {
            console.log(JSON.stringify(creditEvents));
            let credits = [];
            for (let creditEvent of creditEvents) {
                assert(creditEvent.events.filter((e) => {
                    return   e.name == "credit"
                }).length == 1);
                credits.push(creditEvent.events.filter((e) => {
                  return   e.name == "credit"
                })[0].value);
            }
            console.log("credit:", credits);
            return {
                raw_tx: fuzz.raw_tx,
                target: credits,
                split: [],
                origin: []
            }
        }

        return {
            raw_tx: fuzz.raw_tx,
            target: [],
            split: [],
            origin: []
        }
    }
    async discountCredit() {
        // let raw_tx = await this.fuzzer._fuzz_fun("discountCredit");
        // let receipt = await this.fuzzer._send_tx(raw_tx, this.abi);
        // let events = await this.fuzzer._parse_receipt(receipt);
        let fuzz = await this.CreditController.fuzz_fun("discountCredit");
        assert(fuzz.events);
        let creditEvents = fuzz.events.filter((e) => {
            return e.name == "creditEvent"
        });
        if (creditEvents.length >= 1) {
            console.log(JSON.stringify(creditEvents));
            let credits = [];
            for (let creditEvent of creditEvents) {
                assert(creditEvent.events.filter((e) => {
                    return e.name == "credit"
                }).length == 1);
                credits.push(creditEvent.events.filter((e) => {
                  return   e.name == "credit"
                })[0].value);
            }
            console.log("credit:", credits);
            return {
                raw_tx: fuzz.raw_tx,
                target: credits,
                discount: [],
                origin: []
            }
        }

        return {     
             raw_tx: fuzz.raw_tx,
            target: [],
            discount: [],
            origin: []
        }
    }
    async expireCredit() {
        // let raw_tx = await this.fuzzer._fuzz_fun("expireOrClearOrCloseCredit");
        // let receipt = await this.fuzzer._send_tx(raw_tx, this.abi);
        // let events = await this.fuzzer._parse_receipt(receipt);
        let fuzz = await this.CreditController.fuzz_fun("expireOrClearOrCloseCredit", {static:[{index:3, value:EXPIRE_CREDIT}]});
        assert(fuzz.events);
        let creditEvents = fuzz.events.filter((e) => {
            return e.name == "creditEvent"
        });
        if (creditEvents.length >= 1) {
            console.log(JSON.stringify(creditEvents));
            let credits = [];
            for (let creditEvent of creditEvents) {
                assert(creditEvent.events.filter((e) => {
                   return e.name == "credit"
                }).length == 1);
                credits.push(creditEvent.events.filter((e) => {
                   return  e.name == "credit"
                })[0].value);
            }
            console.log("credit:", credits);
            return {
                raw_tx: fuzz.raw_tx,
                target: credits
            }
        }

        return {
            raw_tx: fuzz.raw_tx,
            target: [],
        }
    }
    async clearCredit() {
        // let raw_tx = await this.fuzzer._fuzz_fun("expireOrClearOrCloseCredit");
        // let receipt = await this.fuzzer._send_tx(raw_tx, this.abi);
        // let events = await this.fuzzer._parse_receipt(receipt);
        let fuzz =  await this.CreditController.fuzz_fun("expireOrClearOrCloseCredit", {static:[{index:3, value:CLEAR_CREDIT}]});
        assert(fuzz.events);
        let creditEvents = fuzz.events.filter((e) => {
            return e.name == "creditEvent"
        });
        if (creditEvents.length >= 1) {
            console.log(JSON.stringify(creditEvents));
            let credits = [];
            for (let creditEvent of creditEvents) {
                assert(creditEvent.events.filter((e) => {
                    return e.name == "credit"
                }).length == 1);
                credits.push(creditEvent.events.filter((e) => {
                   return  e.name == "credit"
                })[0].value);
            }
            console.log("credit:", credits);
            return {
                raw_tx: fuzz.raw_tx,
                target: credits
            }
        }
        return {
            raw_tx: fuzz.raw_tx,
            target: [],
        }
    }
    async closeCredit() {
        // let raw_tx = await this.fuzzer._fuzz_fun("expireOrClearOrCloseCredit");
        // let receipt = await this.fuzzer._send_tx(raw_tx, this.abi);
        // let events = await this.fuzzer._parse_receipt(receipt);
        let fuzz = await this.CreditController.fuzz_fun("expireOrClearOrCloseCredit", {static:[{index:3, value:CLOSE_CREDIT}]});
        assert(fuzz.events);
        let creditEvents = fuzz.events.filter((e) => {
            return e.name == "creditEvent"
        });
        if (creditEvents.length >= 1) {
            console.log(JSON.stringify(creditEvents));
            let credits = [];
            for (let creditEvent of creditEvents) {
                assert(creditEvent.events.filter((e) => {
                    return e.name == "credit"
                }).length == 1);
                credits.push(creditEvent.events.filter((e) => {
                   return  e.name == "credit"
                })[0].value);
            }
            console.log("credit:", credits);
            return {
                raw_tx: fuzz.raw_tx,
                target: credits
            }
        }
        return {
            raw_tx: fuzz.raw_tx,
            target: [],
        }
    }
    async getStatus(address) {
        FiscoDeployer.getInstance().addInstance(address, "Credit");
        this.Credit = new FiscoFuzzer(1, "Credit");
        this.Credit.load();
        let ret1 = await this.Credit.call_contract("getCreditSccHoldingStatus");
        let ret2 = await this.Credit.call_contract("getCreditSccClearingStatus");
        let ret3 = await this.Credit.call_contract("getCreditSccValidStatus");
        // console.log(ret1, ret2, ret3);
    
        let aret1  = hex2ascii(ret1.result.output.toString());
        let aret2  = hex2ascii(ret2.result.output.toString());
        let aret3  = hex2ascii(ret3.result.output.toString());
        console.log(aret1, aret2, aret3);
        return {Holding:aret1 , Clearing:aret2, Valid:aret3};
    }
    async getSccAmt(address) {
        FiscoDeployer.getInstance().addInstance(address, "Credit");
        this.Credit = new FiscoFuzzer(1, "Credit");
        this.Credit.load();
        let ret = await this.Credit.call_contract("getCreditAmt");
        console.log("sccAmt:", BigInt(ret.result.output.toString()));
        return BigInt(ret.result.output.toString());
    }
    async getOwner(address) {
        FiscoDeployer.getInstance().addInstance(address, "Credit");
        this.Credit = new FiscoFuzzer(1, "Credit");
        this.Credit.load();
        let ret = await this.Credit.call_contract("getCreditOwner");
        return ret.result.output.toString().replace(/^0x0+/, "0x");
    }
}
class CreditControllerState {
    constructor(CreditController, Credit) {
        this.status = {
            holding: 0,
            clearing: 0,
            valid: 0
        };
        this.sccAmt = 0;
        this.owner = 0;
        this.credit = new CreditInterface(CreditController, Credit);
    }
    static getInstance(CreditController, Credit) {
        if (!CreditControllerState.instance)
            CreditControllerState.instance = new CreditControllerState(CreditController, Credit);
        // console.log(CreditControllerState.instance);
        return CreditControllerState.instance;
    }
   async  update(address) {
        this.status = await this.credit.getStatus(address);
        this.sccAmt = await this.credit.getSccAmt(address);
        this.owner = await this.credit.getOwner(address);
        return {status: this.status, sccAmt:this.sccAmt, owner:this.owner};
    }
    async createCredit() {
        // await this.update();
        //preCondition
        //TO DO
         let ret = await this.credit.createCredit();
       
         while(ret.target.length==0){
            ret = await this.credit.createCredit();
         }
         console.log("passed tx:", ret.raw_tx);
         let state = await this.update(ret.target[0]);
         console.log("update:", state);
         //...
        //postCondition
        assert(state.status.Holding==H1 && state.status.Clearing==C2 && state.status.Valid == V1, "status error");
        assert(state.owner == ret.raw_tx.from, "credit owner error in createCredit");
        assert(state.sccAmt ==  BigInt(ret.raw_tx.param[1]), "sccAmt error in createCredit");
        return ret.target;
    }

    async transferCredit() {
        // await this.update();
        //preCondition
        //TO DO
        let ret = await this.credit.transferCredit();
     
        while(ret.target.length==0){
            ret = await this.credit.transferCredit();
        }
         console.log("passed tx:", ret.raw_tx);
        let states = [];
        for (let target of ret.target){
            let states = await this.update(target);
            console.log("update:",state);
            states.push(state);
        }
        assert(
            states[2].status.Holding==H2&& 
            states[1].status.Holding!=H2 && states[1].status.Holding == states[0].status.Holding && 
            states[2].status.Clearing == states[1].status.Clearing && states[1].status.Clearing == states[0].status.Clearing &&
            states[2].status.Valid == states[1].status.Valid && states[1].status.Valid == states[0].status.Valid,
            "status error in transferCredit"
            );
        assert(states[2].sccAmt == states[1].sccAmt+states[0].sccAmt, "sccAmt error in transferCredit");
        assert(states[1].owner == ret.raw_tx.param[1] && states[0].owner == ret.raw_tx.from, "credit owner error in transferCredit");
        //...
        //postCondition
        return ret.target;
    }
    async discountCredit() {
        // await this.update();
        //preCondition
        //TO DO
        let ret = await this.credit.discountCredit();
        while(ret.target.length==0){
            ret = await this.credit.discountCredit();
        }
        console.log("passed tx:", ret.raw_tx);
        //...
        //postCondition
        let states = [];
        for (let target of ret.target){
            let state = await this.update(target);
            console.log("update:",state);
            states.push(state);
        }
        assert(
            states[2].status.Holding==H2&& 
            states[1].status.Holding==H3 && 
            states[0].status.Holding!=H2 && 
            states[2].status.Clearing == states[1].status.Clearing && states[1].status.Clearing == states[0].status.Clearing &&
            states[2].status.Valid == states[1].status.Valid && states[1].status.Valid == states[0].status.Valid,
            "status error in transferCredit"
            );
        assert(states[2].sccAmt == states[1].sccAmt+states[0].sccAmt, "sccAmt error in transferCredit");
        assert(states[1].owner == ret.raw_tx.from && states[0].owner == ret.raw_tx.from, "credit owner error in transferCredit");
  
        return ret.target;
    }
    async expireCredit() {
        // await  this.update();
        //preCondition
        //TO DO
        let ret = await  this.credit.expireCredit();
        while(ret.target.length==0){
            ret = await this.credit.expireCredit();
        }
        
        console.log("passed tx:", ret.raw_tx);
         let state = await this.update(ret.target[0]);
         console.log("update:", state);
        //...
        //postCondition
    
        assert(state.status.Valid == V2, "status error in expireCredit");
   
        return ret.target;
    }
    async closeCredit() {
        // await this.update();
        //preCondition
        //TO DO
        let ret = await this.credit.closeCredit(); 
        while(ret.target.length==0){
            ret = await this.credit.closeCredit();
        }

        console.log("passed tx:", ret.raw_tx);
        let state = await this.update(ret.target[0]);
        console.log("update:", state);
        //...
        //postCondition
        assert(state.status.Valid ==V3 , "status error in closeCredit");
        return ret.target;
    }
    async clearCredit() {
        // await this.update();
        //preCondition
        //TO DO
        let ret = await this.credit.clearCredit();
        while(ret.target.length==0){
            ret = await this.credit.clearCredit();
        }
     
        console.log("passed tx:", ret.raw_tx);
        let state = await this.update(ret.target[0]);
        console.log("update:", state);
        //...
        //postCondition
         //postCondition
         assert(state.status.Clearing == C1, "status error in clearCredit");
         return ret.target;
    }
}

// actions
let     createCredit = async (context, event) => {
        let ret = [];
        if (asyncFlag)
            ret = await context.ctx.createCredit();
        return ret;
    };
let     transferCredit  = async (context, event) => {
        let ret = [];
        if (asyncFlag)
             ret = await context.ctx.transferCredit();
        return ret;
    };
  let   discountCredit =  async (context, event) => {
        let ret = [];
        if (asyncFlag)
             ret = await context.ctx.discountCredit();
        return ret;
    };
let     expireCredit = async (context, event) => {
        let ret = [];
        if (asyncFlag)
            ret = await context.ctx.expireCredit();
        return ret;
    };
let   clearCredit= async (context, event) => {
        let ret = [];
        if (asyncFlag)
              ret =  await context.ctx.clearCredit();
        return ret;
    };
 let   closeCredit = async (context, event) => {
        let ret = [];
        if (asyncFlag)
                ret = await context.ctx.closeCredit();
        return ret;
    } ;


const createCreditStateMachine = statectx => {
    return Machine({
        id: "creditFSM",
        initial: "empty",
        context: {
            ctx: statectx
        },
        states: {
            empty: {
                on: {
                    create: {
                        target: "created",
                        actions: "createCredit"
                    }
                }
            },
            created: {
                on: {
                    transfer: {
                        target: "created",
                        actions: "transferCredit"
                    },
                    discount: {
                        target: "discounted",
                        actions: "discountCredit"
                    },
                    expire: {
                        target: "expired",
                        actions: "expireCredit"
                    },
                    clear: {
                        target: "cleared",
                        actions: "clearCredit"
                    },
                    close: {
                        target: "closed",
                        actions: "closeCredit"
                    }
                }
            },
            discounted: {
                on: {
                    transfer: {
                        target: "discounted",
                        actions: "transferCredit"
                    },
                    discount: {
                        target: "discounted",
                        actions: "discountCredit"
                    },
                    expire: {
                        target: "expired",
                        actions: "expireCredit"
                    },
                    clear: {
                        target: "cleared",
                        actions: "clearCredit"
                    },
                    close: {
                        target: "closed",
                        actions: "closeCredit"
                    }

                }
            },
            expired: {
                type: "final"
            },
            cleared: {
                type: "final"
            },
            closed: {
                type: "final"
            }
        }
    }, {
        actions: {
            createCredit:  createCredit,
            transferCredit: transferCredit,
            discountCredit: discountCredit,
            expireCredit: expireCredit,
            clearCredit: clearCredit,
            closeCredit:  closeCredit
        }
    })
};
// let CreditFuzzer = new FiscoFuzzer(1, "Credit");
class FiscoStateMachineFuzzer extends FiscoFuzzer {
    constructor(seed, contract_name) {
        super(seed, contract_name);
    }
    static getInstance(seed, contract_name) {
        if (!FiscoStateMachineFuzzer.instance) {
            FiscoStateMachineFuzzer.instance = new FiscoStateMachineFuzzer(seed, contract_name)
        }
        return FiscoStateMachineFuzzer.instance;
    }
    async bootstrap() {

        let creditStateMachine = createCreditStateMachine(
            CreditControllerState.getInstance(
                            FiscoStateMachineFuzzer.getInstance(),
                             undefined,
                    ));
        // console.log(creditStateMachine.context);
        let service = interpret(creditStateMachine).onTransition(state => {
            console.log(state.value);
        });
        service = aa.promisifyAll(service);
        // console.log(creditStateMachine);
        const toggleModel = createModel(creditStateMachine);
        console.log(toggleModel.machine.context);
        console.log("******************************");
        let plans = toggleModel.getSimplePathPlans();
        console.log("size of  simplepath plans:", plans.length);
        let index = 1;
        for (let plan of plans){
            console.log("plan#", index++);
            for (let path of plan.paths){
                console.log(path.description);
            }
        }
        console.log("******************************");
        plans = toggleModel.getShortestPathPlans();
        console.log("size of shortestpath plans:", plans.length);
        index = 1;
        for (let plan of plans){
            console.log("plan#", index++);
            for (let path of plan.paths){
                console.log(path.description);
            }
        }
        console.log("******************************");
        index = 1;
        for (let plan of plans) {
            console.log("plan#", index++);
            for (let path of plan.paths) {
                let start =  service.start();
                let events = path.description.split("via ")[1].split(" → ");
                console.log(path.description);
                console.log("transition by event ", events);
                let state = service.send(events);
                // console.log(state);
                console.log(state.actions);
                revertAsyncFlag();
                for (let action of state.actions){
                    
                    let ret = await action.exec(start.context, undefined);
                    console.log(action.type, ret);
                    while(ret.length==0){
                        ret = await action.exec(start.context, undefined);
                        console.log(action.type, ret);
                    }
                }
                revertAsyncFlag();
                service.stop();
                // console.log(path.segments);
            }
            console.log("Approaching fsm state->", plan.state.value);
            console.log("********************************************");
            // if (index == 3)
            //     break;
        }

        return {
            callFuns: [],
            execResults: []
        };
    }

    //        let ret = await super.bootstrap();
    //      return ret;

    async _seed_callSequence() {
        console.log(__filename, "_seed_callSequence");
        let ret = await super._seed_callSequence();
        return ret;
    }
}
/*
let creditStateMachine = createCreditStateMachine(CreditControllerState.getInstance(FiscoStateMachineFuzzer.getInstance()));
console.log(creditStateMachine);
//const service = interpret(creditStateMachine).onTransition(state => {
//   console.log(state.value);
//});
const toggleModel = createModel(creditStateMachine);
console.log(toggleModel.getSimplePathPlans());
*/
module.exports.FiscoStateMachineFuzzer = FiscoStateMachineFuzzer;
