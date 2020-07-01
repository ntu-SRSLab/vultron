import assert from "assert";
var beautify = require('js-beautify').js;
import {CMA_normal,   CMA_dummy, CoverState, CoverTransition,  CoverTransitionLoop, BCOS_SUCCESS_STATUS} from "./common.js"
export default class FSMService {
    constructor() {}
    add_contracts(contracts) {
        this.contracts = contracts;
        return this;
    }
    enable_randomTest(){
        this.random_test = true;
        this.add_covering_strategy(this.strategy);
    }
    disable_randomTest(){
        this.random_test = false;
        this.add_covering_strategy(this.strategy);
    }
    get_fsm(){
        return this.fsm;
    }
    get_stateOptions(){
        assert(this.fsm);
        let ret = [];
        for (let state of this.fsm.states){
            ret.push({value: state.name, text: state.name});
        }
        return ret;
    }
    get_possible_transitions(start_state){
        assert(start_state);
        let transitions = [];
         for(let transition of this.fsm.transitions ){
                        if(transition.from==start_state){
                            transitions.push({text: transition.to, value: `${transition.action}`});
                        }
         }
        return transitions;
    }
    generate_dummy_loop_fsm(){
        let dummy_states = JSON.parse(JSON.stringify(this.fsm.states));
        let dummy_transitions = JSON.parse(JSON.stringify(this.fsm.transitions));
        let loopStates = new Set();
        let loopTransitions = {};
        for(let transition of this.fsm.transitions){
            if(transition.from == transition.to){
                loopStates.add(transition.from);
                loopTransitions[transition.from] = transition;
            }
        }
        // add concrete dummy State
        for (let transition of this.fsm.transitions){
            if(transition.from != transition.to && loopStates.has(transition.to)){
                // add concrete dummy state to dummy_states
                for (let state of this.fsm.states){
                    if(state.name == transition.to){
                        let dummyState = JSON.parse(JSON.stringify(state));
                        // add dummy state
                        dummyState.name = `dummy_${state.name.trim()}_${transition.from.trim()}`;
                        dummy_states.push(dummyState);

                       // remove the original transition
                        for (let dtransition of dummy_transitions){
                            if(dtransition.from == transition.from && dtransition.to == transition.to &&  dtransition.action == transition.action){
                                dummy_transitions.splice(dummy_transitions.indexOf(dtransition),1);
                                break;
                            }
                        }
                        let dummyTransitionFrom =  JSON.parse(JSON.stringify(transition));
                        dummyTransitionFrom.to = dummyState.name;
                        let dummyTransitionTo = JSON.parse(JSON.stringify(loopTransitions[transition.to]));
                        dummyTransitionTo.from = dummyState.name;
                        // add dummy transtions
                        dummy_transitions.push(dummyTransitionFrom);
                        dummy_transitions.push(dummyTransitionTo);
                    }
                }
            }
        }
        this.fsm.dummy_states = dummy_states;
        this.fsm.dummy_transitions = dummy_transitions;
    }
    add_covering_strategy(strategy){
        this.strategy = strategy;
        this.activate_states =  new Set();
        this.activate_transition= new Set();
        this.currentState = null;
        this.action_Report =  null;
        this.previous_action_Report = null;
        this.generate_dummy_loop_fsm();
        for(let transition of this.fsm.transitions){
            if(transition.color){
                transition.color = "black";
            }
        }
        for(let state of this.fsm.states){
            if(state.color){
                state.color = "black";
            }
        }
        console.log(this);
        return this;
    }
    add_action_report(action_Report){
        
        // validate currentState
        if (!this.currentState || (action_Report.index && action_Report.index == 1)){
            this.currentState =  this._get_initial_state();
            this.action_Report = null;
            this.previous_action_Report = null;
        }

        this.action_Report  = action_Report;

        console.log(action_Report);
        let action = this.action_Report.action;
        let current_to_state;
         //update currentState
         let transitionID = 0;
         for (let transition of this.fsm.transitions){
            if (transition.from==this.currentState && `action_${transition.action}` == action){
                transition.color = "red";
                this.currentState = transition.to;
                break;
            }
            transitionID ++;
        }
        for(let state of this.fsm.states){
            if (state.name == this.currentState){
                state.color = "red";
                current_to_state = state;
            }
        }
        if(this.activate_transition.has(transitionID)){
            this.isFresh_result = false;
        }else{
            this.isFresh_result = true;
        }
        this.activate_transition.add(transitionID);
        this.activate_states.add(current_to_state);
        console.log(this.currentState);
        return this;
    }
    next_result(){
        if(!this.random_test){
                let path = [];
                for(let i=0;  i< this.action_Report.index; i++){
                    let fullaction = this.action_Report.plan[i];
                    path.push(fullaction.type.split("action_")[1]);
                }
                console.log(`fresh result ${this.isFresh_result? "yes":"no"}`);
                if(this.action_Report && this.isFresh_result == true){
                        let ret =  {
                            //  Contract: this.fsm.target_contract,
                            "#Strategy": this.strategy,
                            "#States": this.currentState,
                            "#Paths": path,
                            // "#Transitions": path.length,
                            "#Test Cases": this.action_Report.test_cases,
                            "#Times(s)": (this.action_Report.currentTime-this.action_Report.startTime).toFixed(3)
                        };
                        this.action_Report  = null;
                        return ret;
                    }else{
                        return null;
                    }
        }else{
            if(this.action_Report){
                this.action_Report.action= [this.action_Report.action.split("action_")[1]];
                if(this.previous_action_Report){
                    this.action_Report.action = this.previous_action_Report.action.concat(this.action_Report.action);
                }
                console.log(`fresh result ${this.isFresh_result? "yes":"no"}`);
                if(this.action_Report && this.isFresh_result == true){
                                let ret =  {
                                    //  Contract: this.fsm.target_contract,
                                    "#Strategy": "Random Test",
                                    "#States": this.currentState,
                                    "#Paths": this.action_Report.action,
                                    "#Test Cases": this.action_Report.test_cases,
                                    "#Times(s)": (this.action_Report.currentTime-this.action_Report.startTime).toFixed(3)
                                };
                                this.previous_action_Report = this.action_Report;
                                this.action_Report  = null;
                                return ret;
                            }else{
                                this.previous_action_Report = this.action_Report;
                                this.action_Report  = null;
                                return null;
                            }
            }
         }
   return null;
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
    __get_sm_state(states){
        let ret = [];
        for(let state of states){
            ret.push({name: state.name, type:state.type, color: state.color?state.color: "black"})
        }
        return ret;
    }
    get_sm_cat() {
        console.log(JSON.stringify({
            states: this.fsm.states,
            transitions: this.fsm.transitions
        }));
        return JSON.stringify({
            states: this.__get_sm_state(this.fsm.states),
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
        let fuzz = await this.fuzzer.full_fuzz_fun("${name}", this.address,  "${abi.name}");
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
                ret.push(ret${fun});
                console.log( "current test case: ", BigInt(ret${fun}.receipt.status.toString())== BigInt(${BCOS_SUCCESS_STATUS})?"passed":"failed");
                executeStatus += BigInt(ret${fun}.receipt.status.toString());`
            }
        }
        return ret;
    }
    _getPrePostPredicateForAction(action){
        let prePredication = [];
        let postPredication = [];
        for( let transition of this.fsm.transitions){
            if(action == transition.action){
                //    prePredication.push(this.fsm.states)
                for(let state of  this.fsm.states){
                    if (transition.from == state.name && state.Predicate){
                            prePredication.push(state.Predicate);
                    }
                    if (transition.to == state.name && state.Predicate){
                           postPredication.push(state.Predicate);
                    }
                } 
            }
        }
        return {
            "prePredicate":   `let preState = await ctx.getState();
            assert(null==preState||${prePredication.join("||").replace(/state/gi, "preState")}, "preCondition violated: current state is "+preState  );`,
            "postPredicate": `let postState = await ctx.getState();
            assert(null==postState||${postPredication.join("||").replace(/state/gi, "postState")},  "postCondition violated: current state is "+postState );`
        }
    }
    _get_action_functions_mapping() {
        let mapping = ``;
        for (let action of Object.keys(this.fsm.actions)) {
             let prepost = this._getPrePostPredicateForAction(action);
            mapping += `async action_${action}(){
                let ret = [];
                if(asyncFlag){
                        // bcos passed status:${BCOS_SUCCESS_STATUS}
                        let executeStatus = BigInt(${BCOS_SUCCESS_STATUS});
                        let ctx =  StateMachineCtx.getInstance();
                        let count = 0;
                        // PreCondition. 
                        ${prepost.prePredicate}\n
                        ${this.__get_action_functions(this.fsm.actions[action])}
                        while(executeStatus != ${BCOS_SUCCESS_STATUS}  && count<MAX_COUNT){
                            count ++;
                            executeStatus = BigInt(${BCOS_SUCCESS_STATUS});
                            ${this.__get_action_functions(this.fsm.actions[action])}
                        }\n
                        if(count>=MAX_COUNT){
                            throw "TIMEOUT,  too many failed test cases!";
                        }
                        ${prepost.postPredicate}
                        // PostCondition. 
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
    constructor(fsmreplayer, fuzzer){
        ${this._get_contracts_interface_instances()}
        this.state = {"id": "${this.fsm.id}"};
        this.fuzzer = fuzzer;
        this.fsmreplayer = fsmreplayer;
    }
    async initialize(){
       this.${this.fsm.target_contract}.address = await  this.fsmreplayer.initialize();
    }
    static getInstance(fsmreplayer, fuzzer) {
        if (!StateMachineCtx.instance)
            StateMachineCtx.instance = new StateMachineCtx(fsmreplayer, fuzzer);
        return StateMachineCtx.instance;
    }
    async getState(){
        //TO DO, set what your state means and how to get the state
        if(this.${this.fsm.target_contract}.state){
            let ret = await  this.${this.fsm.target_contract}.state();
            this.state = BigInt(ret.receipt.result.output.toString());
        }else if(this.${this.fsm.target_contract}.stage){
            let ret =await  this.${this.fsm.target_contract}.stage();
            this.state = BigInt(ret.receipt.result.output.toString());
        }else {
            this.state = null;
        }
        console.log("state:", this.state);
        return this.state;
    }
    // action_functions_mapping
    ${this._get_action_functions_mapping()}
}`;
        return template_state_machine_ctx;
    }

    __get_xstates() {
        let ret = ``;
        let states = this.strategy==CoverTransitionLoop? this.fsm.dummy_states:this.fsm.states;
        let transitions =  this.strategy == CoverTransitionLoop? this.fsm.dummy_transitions: this.fsm.transitions; 
        for (let state of states ) {
            let ons = ``;
            let count = 0;
            for (let transition of transitions ) {
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
    _get_initial_state(){
        for(let state of this.fsm.states){
            if(state.type == "initial")
                return state.name;
        }
        assert(false, "there must be a  initial state defined in model");
    }
    _get_state_machine() {
        let template_state_machine = `// state machine 
const createStateMachine = statectx =>{
    return Machine({
        id: "${this.fsm.id}",
        initial: "${this._get_initial_state()}",
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
        let template_requires = `const assert = require("assert");
const hex2ascii = require('hex2ascii')
const Machine = require("xstate").Machine;
const createModel = require("@xstate/test").createModel;

let asyncFlag = false;
const MAX_COUNT= 60;
function revertAsyncFlag() {
    asyncFlag = !asyncFlag;
}
\n`;
        model_script = template_requires + "\n" +
            this._get_contract_interface() + "\n" +
            this._get_state_machine_ctx() + "\n" +
            this._get_state_machine() + "\n" +
            "module.exports.StateMachineCtx = StateMachineCtx\n"+
            "module.exports.revertAsyncFlag = revertAsyncFlag;\n" + 
            "module.exports.createStateMachine = createStateMachine";   
        if (this.fsm.target_contract=="CreditController" ){
                if(!this.strategy || this.strategy ==CoverState || this.strategy==CoverTransition ){
                    model_script = CMA_normal;
                }
                if(this.strategy==CoverTransitionLoop){
                    model_script = CMA_dummy;
                }
        }
        return beautify(model_script, {
            indent_size: 2,
            space_in_empty_paren: true
        });
    }
    
    to_sm_Xstate() {

    }
}