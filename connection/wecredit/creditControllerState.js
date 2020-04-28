// CreditControllerState.js
// customize the state definition and prepost conditions about CreditController
//
const assert = require("assert");
const Machine = require("xstate").Machine;
const assign = require("xstate").assign;
const interpret = require("xstate").interpret;
const createModel = require("@xstate/test").createModel;
const FiscoFuzzer = require("../fisco/fuzzer.js").FiscoFuzzer;

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
        console.log(raw_tx);
        let receipt = await this.fuzzer._send_tx(raw_tx);
        let events = await this.fuzzer._parse_receipt(receipt);
        let creditEvents = events.filter((e) => {
            return e.name == "creditEvent"
        });
        if (creditEvents.length >= 1) {
            console.log(creditEvents);
            let credits = [];
            for (let creditEvent of creditEvents) {
                assert(creditEvent.events.filter((e) => {
                    e.name == "credit"
                }).length == 1);
                credits.push(creditEvent.events.filter((e) => {
                    e.name == "credit"
                })[0].value);
            }
            console.log(credits);
            return {
                target: credits
            }
        }
        return {
            target: []
        }
    }
    async transferCredit() {
        return {
            target: tcredit,
            split: scredit,
            origin: ocredit
        }
    }
    async discountCredit() {
        return {
            target: tcredit,
            discount: dcredit,
            origin: ocredit
        }
    }
    async expireCredit(raw_tx) {
        return {
            target: tcredit,
        }
    }
    async clearCredit(raw_tx) {
        return {
            target: tcredit,
        }
    }
    async closeCredit(raw_tx) {
        return {
            target: tcredit,
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
            holding: undefined,
            clearing: undefined,
            valid: undefined
        };
        this.sccAmt = undefined;
        this.owner = undefined;
        this.credit = new CreditInterface(fuzzer);
    }
    static getInstance(_fuzzer) {
        if (!CreditControllerState.instance)
            CreditControllerState.instance = new CreditControllerState(_fuzzer);
        console.log(CreditControllerState.instance);
        return CreditControllerState.instance;
    }
    update() {
        this.status = this.credit.getStatus();
        this.sccAmt = this.credit.getSccAmt();
        this.owner = this.credit.getOwner();
    }
    async createCredit() {
        this.update();
        //preCondition
        //TO DO
        let ret = await this.credit.createCredit();
        //...
        //postCondition
        return ret.target;
    }

    async transferCredit() {
        this.update();
        //preCondition
        //TO DO
        let ret = this.credit.transferCredit();
        //...
        //postCondition
        return ret.target;
    }
    async discountCredit() {
        this.update();
        //preCondition
        //TO DO
        let ret = this.credit.discountCredit();
        //...
        //postCondition
        return ret.target;
    }
    async expireCredit() {
        this.update();
        //preCondition
        //TO DO
        let ret = this.credit.expireCredit();
        //...
        //postCondition
        return ret.target;
    }
    async closeCredit() {
        this.update();
        //preCondition
        //TO DO
        let ret = this.credit.closeCredit();
        //...
        //postCondition
        return ret.target;
    }
    async clearCredit() {
        this.update();
        //preCondition
        //TO DO
        let ret = this.credit.clearCredit();
        //...
        //postCondition
        return ret.target;
    }
}

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
            createCredit: async (context, event) => {
                await context.ctx.createCredit();
            },
            transferCredit: async (context, event) => {
                await context.ctx.transferCredit();
            },
            discountCredit: async (context, event) => {
                await context.ctx.discountCredit();
            },
            expireCredit: async (context, event) => {
                await context.ctx.expireCredit();
            },
            clearCredit: async (context, event) => {
                await context.ctx.clearCredit();
            },
            closeCredit: async (context, event) => {
                await context.ctx.closeCredit();
            }

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
        const service = interpret(creditStateMachine).onTransition(state => {
            console.log(state.value);
        });

        const toggleModel = createModel(creditStateMachine);
        let plans = toggleModel.getSimplePathPlans();
	console.log("size of plans:", plans.length);
	console.log("plans[1]:" , plans[1].state, "->", plans[1].paths);
        await service.start();
        await service.send("create");
        await service.stop();

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
