// CreditControllerState.js
// customize the state definition and prepost conditions about CreditController
//
const aa = require("aa");
const assert = require("assert");
const Machine = require("xstate").Machine;
const assign = require("xstate").assign;
const interpret = require("xstate").interpret;
const createModel = require("@xstate/test").createModel;
const FiscoFuzzer = require("../fisco/fuzzer.js").FiscoFuzzer;
let  asyncFlag = false;
function revertAsyncFlag(){
    asyncFlag =  asyncFlag?false:true; 
}
function check_raw_tx(raw_tx) {
    assert(raw_tx["to"]);
    assert(raw_tx["fun"]);
    assert(raw_tx["param"]);
}
class CreditInterface {
    constructor(fuzzer) {
        this.fuzzer = fuzzer
        this.abi = this.fuzzer.g_targetContract.abi;
        this.address = this.fuzzer.g_targetContract.address;
    }
    _setAbi(abi) {
        this.abi = abi;
    }
    _setAddress(address) {
        this.address = address;
    }
    async createCredit() {
        let raw_tx = await this.fuzzer._fuzz_fun("createCredit");
        let receipt = await this.fuzzer._send_tx(raw_tx, this.abi);
        let events = await this.fuzzer._parse_receipt(receipt);
        let creditEvents = events.filter((e) => {
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
                target: credits
            }
        }
        return {
            target: []
        }
    }
    async transferCredit() {
        let raw_tx = await this.fuzzer._fuzz_fun("transferCredit");
        let receipt = await this.fuzzer._send_tx(raw_tx, this.abi);
        let events = await this.fuzzer._parse_receipt(receipt);
        let creditEvents = events.filter((e) => {
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
                target: credits,
                split: [],
                origin: []
            }
        }

        return {
            target: [],
            split: [],
            origin: []
        }
    }
    async discountCredit() {
        let raw_tx = await this.fuzzer._fuzz_fun("discountCredit");
        let receipt = await this.fuzzer._send_tx(raw_tx, this.abi);
        let events = await this.fuzzer._parse_receipt(receipt);
        let creditEvents = events.filter((e) => {
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
                target: credits,
                discount: [],
                origin: []
            }
        }

        return {
            target: [],
            discount: [],
            origin: []
        }
    }
    async expireCredit() {
        let raw_tx = await this.fuzzer._fuzz_fun("expireOrClearOrCloseCredit");
        let receipt = await this.fuzzer._send_tx(raw_tx, this.abi);
        let events = await this.fuzzer._parse_receipt(receipt);
        let creditEvents = events.filter((e) => {
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
                target: credits
            }
        }

        return {
            target: [],
        }
    }
    async clearCredit() {
        let raw_tx = await this.fuzzer._fuzz_fun("expireOrClearOrCloseCredit");
        let receipt = await this.fuzzer._send_tx(raw_tx, this.abi);
        let events = await this.fuzzer._parse_receipt(receipt);
        let creditEvents = events.filter((e) => {
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
                target: credits
            }
        }

        return {
            target: [],
        }
    }
    async closeCredit() {
        let raw_tx = await this.fuzzer._fuzz_fun("expireOrClearOrCloseCredit");
        let receipt = await this.fuzzer._send_tx(raw_tx, this.abi);
        let events = await this.fuzzer._parse_receipt(receipt);
        let creditEvents = events.filter((e) => {
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
                target: credits
            }
        }

        return {
            target: [],
        }
    }
    async getStatus() {
        return 0;
    }
    async getSccAmt() {
        return 0;
    }
    async getOwner() {
        return 0;
    }
}
class CreditControllerState {
    constructor(fuzzer) {
        this.status = {
            holding: 0,
            clearing: 0,
            valid: 0
        };
        this.sccAmt = 0;
        this.owner = 0;
        this.credit = new CreditInterface(fuzzer);
    }
    static getInstance(_fuzzer) {
        if (!CreditControllerState.instance)
            CreditControllerState.instance = new CreditControllerState(_fuzzer);
        console.log(CreditControllerState.instance);
        return CreditControllerState.instance;
    }
   async  update() {
        this.status = await this.credit.getStatus();
        this.sccAmt = await this.credit.getSccAmt();
        this.owner = await this.credit.getOwner();
    }
    async createCredit() {
        await this.update();
        //preCondition
        //TO DO
        let ret = await this.credit.createCredit();
        //...
        //postCondition
        return ret.target;
    }

    async transferCredit() {
        await this.update();
        //preCondition
        //TO DO
        let ret = await this.credit.transferCredit();
        //...
        //postCondition
        return ret.target;
    }
    async discountCredit() {
        await this.update();
        //preCondition
        //TO DO
        let ret = await this.credit.discountCredit();
        //...
        //postCondition
        return ret.target;
    }
    async expireCredit() {
        await  this.update();
        //preCondition
        //TO DO
        let ret = await  this.credit.expireCredit();
        //...
        //postCondition
        return ret.target;
    }
    async closeCredit() {
        await this.update();
        //preCondition
        //TO DO
        let ret = await this.credit.closeCredit();
        //...
        //postCondition
        return ret.target;
    }
    async clearCredit() {
        await this.update();
        //preCondition
        //TO DO
        let ret = await this.credit.clearCredit();
        //...
        //postCondition
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
class FiscoStateMachineFuzzer extends FiscoFuzzer {
    constructor(seed, contract_name, outputdir) {
        super(seed, contract_name, outputdir);
    }
    static getInstance(seed, contract_name, workdir) {
        if (!FiscoStateMachineFuzzer.instance) {
            FiscoStateMachineFuzzer.instance = new FiscoStateMachineFuzzer(seed, contract_name, workdir)
        }
        return FiscoStateMachineFuzzer.instance;
    }
    async bootstrap() {

        let creditStateMachine = createCreditStateMachine(CreditControllerState.getInstance(FiscoStateMachineFuzzer.getInstance()));
        // console.log(creditStateMachine.context);
        let service = interpret(creditStateMachine).onTransition(state => {
            console.log(state.value);
        });
        service = aa.promisifyAll(service);
        // console.log(creditStateMachine);
        const toggleModel = createModel(creditStateMachine);
        let plans = toggleModel.getSimplePathPlans();
        console.log("size of plans:", plans.length);
        let index = 1;
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
