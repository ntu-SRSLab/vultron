import assert from "assert";
var beautify = require('js-beautify').js;
export default class FSMService {
    constructor() {}
    add_contracts(contracts) {
        this.contracts = contracts;
    }
    get_fsm(){
        return this.fsm;
    }
    add_action_report(action_Report){
        console.log(action_Report);
        this.action_Report  = action_Report;
        // let plan = this.action_Report.plan;
        // console.log(plan);
        let action = this.action_Report.action;
        // validate currentState
        if (!this.currentState){
            this.currentState = "initial";
        }
        let count = 0;
        for (let transition of this.fsm.transitions){
            if (transition.from==this.currentState){
                count ++;
            }
        }
        if (count ==0)
                this.currentState = "initial";
        //update currentState
         for (let transition of this.fsm.transitions){
            if (transition.from==this.currentState && `action_${transition.action}` == action){
                transition.color = "red";
                this.currentState = transition.to;
            }
        }
        console.log(this.currentState);
        return this;
    }
    next_result(){
        let path = [];
        for(let fullaction of this.action_Report.plan){
            if (fullaction.type ==this.action_Report.action){
                path.push(fullaction.type.split("action_")[1]);
                break;
            }
            path.push(fullaction.type.split("action_")[1]);
        }
        return {
            FSM: this.fsm.id,
            "#States": this.currentState,
            "#Paths": path,
            "#Transitions": path.length,
            "#Times(s)": this.action_Report.currentTime-this.action_Report.startTime
        };
    }
    add_fsm(fsm) {
        this.fsm = JSON.parse(fsm);
        //State Machine cat
        assert(this.fsm.id, "id error");
        assert(this.fsm.states, "states error");
        assert(this.fsm.transitions, "transitions error");
        // Customized actions
        assert(this.fsm.actions, "actions error");
        //  Related contracts
        assert(this.fsm.contracts, "contracts error");
        return this;
    }
    get_sm_cat() {
        console.log(JSON.stringify({
            states: this.fsm.states,
            transitions: this.fsm.transitions
        }));
        return JSON.stringify({
            states: this.fsm.states,
            transitions: this.fsm.transitions
        });
    }
    _get_abi_interface(name, address, abis) {
        let template_iterface = ``;
        for (let abi of abis) {
            // many Library contract  usually has function with all upper-case name.
            if (abi.name && abi.type == "function" && abi.name != abi.name.toUpperCase()) {
                template_iterface += `
    async ${abi.name}(){
        let fuzz = await this.fuzzer.full_fuzz_fun("${name}", "${address}", "${abi.name}");
        return fuzz;
    }
        `
            }
        }
        return template_iterface;
    }
    _get_contract_interface() {
        let template_contract_interfaces = ``;
        for (let contract of Object.keys(this.fsm.contracts)) {
            template_contract_interfaces += `// contract interface \n
    class ${contract}{
      constructor(fuzzer){
        this.address = "${this.fsm.contracts[contract].address}";
        this.name = "${contract}";
        this.fuzzer  = fuzzer;
      }
      ${this._get_abi_interface(this.fsm.contracts[contract].name, this.fsm.contracts[contract].address, this.contracts[this.fsm.contracts[contract].name])}
    }`;
        }
        return template_contract_interfaces;
    }


    _get_fsm_fuzzer() {
        let template_fuzzer = `
      class FiscoStateMachineFuzzer extends FiscoFuzzer {
        constructor(seed, contract_name,) {
            super(seed, contract_name);
        }
        static getInstance(seed, contract_name) {
            if (!FiscoStateMachineFuzzer.instance) {
                FiscoStateMachineFuzzer.instance = new FiscoStateMachineFuzzer(seed, contract_name)
            }
            return FiscoStateMachineFuzzer.instance;
        }
        async bootstrap(socket) {
            let stateMachine = createStateMachine(
                StateMachineCtx.getInstance(
                    FiscoStateMachineFuzzer.getInstance()
                ));
            // console.log(stateMachine.context);
            let service = interpret(stateMachine).onTransition(state => {
                console.log(state.value);
            });
            service = aa.promisifyAll(service);
            // console.log(stateMachine);
            const toggleModel = createModel(stateMachine);
            console.log(JSON.stringify(toggleModel));
            console.log(toggleModel.machine.context);
            console.log("******************************");
            let plans = toggleModel.getSimplePathPlans();
            console.log("size of  simplepath plans:", plans.length);
            let index = 1;
            for (let plan of plans) {
                console.log("plan#", index++);
                for (let path of plan.paths) {
                    console.log(path.description);
                }
            }
            console.log("******************************");
            plans = toggleModel.getShortestPathPlans();
            console.log("size of shortestpath plans:", plans.length);
            index = 1;
            for (let plan of plans) {
                console.log("plan#", index++);
                for (let path of plan.paths) {
                    console.log(path.description);
                }
            }
            console.log("******************************");
            index = 1;
            for (let plan of plans) {
                console.log("plan#", index++);
                for (let path of plan.paths) {
                    let start = service.start();
                    let events = path.description.split("via ")[1].split(" → ");
                    console.log(path.description);
                    console.log("transition by event ", events);
                    let state = service.send(events);
                    // console.log(state);
                    console.log(state.actions);
                    revertAsyncFlag();
                    let startTime = Date.now()/1000;
                    for (let action of state.actions) {
    
                        let ret = await action.exec(start.context, undefined);
                        console.log(action.type, ret);
                        console.log( {event: "Action_Report", data:{startTime: startTime, currentTime: Date.now()/1000, plan:  state.actions,  action: action.type}});
                        socket.emit("server", {event: "Action_Report", data:{startTime: startTime, currentTime:Date.now()/1000, plan:  state.actions,  action: action.type}});
                        // while (ret.length == 0) {
                        //     ret = await action.exec(start.context, undefined);
                        //     console.log(action.type, ret);
                        // }
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
    
        async _seed_callSequence() {
            console.log(__filename, "_seed_callSequence");
            let ret = await super._seed_callSequence();
            return ret;
        }
    } `;

        return template_fuzzer;
    }

    _get_contracts_interface_instances() {
        let instances = ``;
        for (let contract of Object.keys(this.fsm.contracts)) {
            instances += `this.${contract} = new ${contract}(fuzzer);\n`
        }
        return instances;
    }
    __get_action_functions(funs) {
        let ret = ``;
        for (let contract of Object.keys(funs)) {
            for (let fun of funs[contract]) {
                ret += `let ret${fun} = await StateMachineCtx.getInstance().${contract}.${fun}();
                ret.push(ret${fun});\n`
            }
        }
        return ret;
    }
    _get_action_functions_mapping() {
        let mapping = ``;
        for (let action of Object.keys(this.fsm.actions)) {
            mapping += `async action_${action}(){
                let ret = [];
                if(asyncFlag){
                        // PreCondition. TO DO
                        ${this.__get_action_functions(this.fsm.actions[action])}
                        // PostCondition. TO DO
                }
                return ret;
            }`
        }
        return mapping;
    }

    // record state msg, and action execution
    _get_state_machine_ctx() {
        let template_state_machine_ctx = `// state machine context
class StateMachineCtx{
    constructor(fuzzer){
        ${this._get_contracts_interface_instances()}
        this.state = {"id": "${this.fsm.id}"};
        this.fuzzer = fuzzer;
    }
    static getInstance(fuzzer) {
        if (!StateMachineCtx.instance)
            StateMachineCtx.instance = new StateMachineCtx(fuzzer);
        return StateMachineCtx.instance;
    }
    getState(){
        //TO DO, set what your state means and how to get the state
        
    }
    // action_functions_mapping
    ${this._get_action_functions_mapping()}
}`;
        return template_state_machine_ctx;
    }

    __get_xstates() {
        let ret = ``;
        for (let state of this.fsm.states) {
            let ons = ``;
            let count = 0;
            for (let transition of this.fsm.transitions) {
                if (transition.from == state.name) {
                    count++;
                    ons +=
                        `\n                 ${transition.action}:{
                            target:  "${transition.to}",
                            actions: "action_${transition.action}"
                        },`;
                }
            }
            if (ons.charAt(ons.length - 1) == ",")
                ons = ons.substring(0, ons.length - 1);
            if (count != 0) {
                ret +=
                    `\n         ${state.name}:{
                    on:{${ons}
                    }
                },`;
            } else {
                ret +=
                    `\n       ${state.name}:{
                    type: "final"
                },`;
            }
        }
        if (ret.charAt(ret.length - 1) == ",") {
            ret = ret.substring(0, ret.length - 1);
        }
        return ret;
    }
    __get_xactions() {
        let ret = ``;
        let array = [];
        for (let action of Object.keys(this.fsm.actions)) {
            array.push(`action_${action}:statectx.action_${action}`);
        }
        ret += `{\n${array.join(",")}\n}`;
        return ret;
    }
    _get_state_machine() {
        let template_state_machine = `// state machine 
const createStateMachine = statectx =>{
    return Machine({
        id: "${this.fsm.id}",
        initial: "initial",
        context: {
               ctx: statectx
        },
        states:{
                    ${this.__get_xstates()}
                }
        },{actions:${this.__get_xactions()}});
}
`;
        return template_state_machine;
    }

    get_model_script() {
        // console.log(this.contracts);
        let model_script = "";
        // TO DO
        let template_requires = `const aa = require("aa");
const assert = require("assert");
const hex2ascii = require('hex2ascii')
const Machine = require("xstate").Machine;
const assign = require("xstate").assign;
const interpret = require("xstate").interpret;
const createModel = require("@xstate/test").createModel;
const FiscoFuzzer = require("../connection/fisco/fuzzer.js").FiscoFuzzer;
const FiscoDeployer = require("../connection/fisco/fuzzer.js").FiscoDeployer;
let asyncFlag = false;
function revertAsyncFlag() {
    asyncFlag = !asyncFlag;
}
\n`;

        model_script = template_requires + "\n" +
            this._get_contract_interface() + "\n" +
            this._get_state_machine_ctx() + "\n" +
            this._get_state_machine() + "\n" +
            this._get_fsm_fuzzer() + "\n" +
            "module.exports.FiscoStateMachineFuzzer = FiscoStateMachineFuzzer";   
        return beautify(model_script, {
            indent_size: 2,
            space_in_empty_paren: true
        });
    }
    to_sm_Xstate() {

    }
}