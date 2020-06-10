const aa = require("aa");
const assert = require("assert");
const hex2ascii = require('hex2ascii')
const Machine = require("xstate").Machine;
const assign = require("xstate").assign;
const interpret = require("xstate").interpret;
const createModel = require("@xstate/test").createModel;
const FiscoFuzzer = require("../fisco/fuzzer.js").FiscoFuzzer;
const FiscoDeployer = require("../fisco/fuzzer.js").FiscoDeployer;

// contract interface 

class CreditController{
   constructor(){
       this.address = "0x000";
   }
 
   getCreditAddressByCreditNo(){

   }
       
   transferAndDiscountCheck(){

   }
       
   transferCredit(){

   }
       
   staticArrayToDynamicArray(){

   }
       
   accountIsOk(){

   }
       
   expireOrClearOrCloseCredit(){

   }
       
   discountCredit(){

   }
       
   createCredit(){

   }
       
}
// state machine context
class StateMachineCtx{
   constructor(){
       this.CreditController = new CreditControllerInterface();

       this.state = undefined;
   }
   getState(){
       //TO DO, set what your state means and how to get the state
       
   }
   // action_functions_mapping
   action_CREATE(){
               // PreCondition. TO DO
               CreditController.createCredit();

               // PostCondition. TO DO
           }
}
// state machine 
const createStateMachine = statectx =>{
   return Machine({
       id: "FSM#1",
       initial: "initial",
       context: {
              ctx: statectx
       },
       states:{
                   
        initial:{
                   on:{
                           
                CREATE:{
                           target:  "created",
                           actions: "action_CREATE"
                       
                   }
               },
        created:{
                   on:{
                           
                TRANFER:{
                           target:  "created",
                           actions: "action_TRANFER"
                       },
                DISCOUNT:{
                           target:  "discounted",
                           actions: "action_DISCOUNT"
                       },
                EXPIRE:{
                           target:  "expired",
                           actions: "action_EXPIRE"
                       },
                CLEAR:{
                           target:  "cleared",
                           actions: "action_CLEAR"
                       },
                CLOSE:{
                           target:  "closed",
                           actions: "action_CLOSE"
                       
                   }
               },
        discounted:{
                   on:{
                           
                EXPIRE:{
                           target:  "expired",
                           actions: "action_EXPIRE"
                       },
                CLEAR:{
                           target:  "cleared",
                           actions: "action_CLEAR"
                       },
                CLOSE:{
                           target:  "closed",
                           actions: "action_CLOSE"
                       
                   }
               },
      expired:{
                   type: "final"
               },
      cleared:{
                   type: "final"
               },
      closed:{
                   type: "final"
               
               }
            
       });
}


// FSM fuzzer 
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
     let creditStateMachine = createStateMachine(
         CreditControllerState.getInstance(
                         FiscoStateMachineFuzzer.getInstance(),
                          undefined,
                 ));
     let service = interpret(creditStateMachine).onTransition(state => {
         console.log(state.value);
     });
     service = aa.promisifyAll(service);
     const toggleModel = createModel(creditStateMachine);
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
     }
     return {
         callFuns: [],
         execResults: []
     };
 } 
}