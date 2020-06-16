<template>
  <b-container fluid>
    <b-row>
      <b-col align-v="center" cols="5"  :md="2">
        <b-container >
        <b-form inline>
          <span class = "secondary mt-2 mr-2" >Specification </span>
          <b-form-group  class="mt-2"  id="fieldset-1"
      label="example:"
      label-for="select_example">
            <b-form-select id="select_example"  v-model="selected" :options="options" @change="OnSelectExample"></b-form-select>
          </b-form-group>
        </b-form>
        </b-container>
        <!-- style="width:100%; height: 820px; border:thin;" -->
          <b-container  id="FSMContainer" :class = "zoom"  @mouseover="OnMouseOverFSM"  @mouseleave="OnMouseOutFSM"   >
                 <codemirror  class="MyCodeMirror" id="fsm"  v-model="fsm"   :options="cmOptions_json" @change="OnStateMachineChange"  />
          </b-container>
      </b-col>
      <b-col align-v="center" cols="5"  :md="5">
         <span class = "secondary mt-2 mr-2" >Control Panel </span>
        <b-row  v-show="!mouseOverFSM" >
              <div class="container"  style="width:100%; height: 500px; border:thin;"  v-html="lSVGInAString">
              </div>
        </b-row>
        <b-row v-if="lSVGInAString "  v-show="!mouseOverFSM" >
        <div class="container" style="width: 100%; height:300px">
          <b-row>
              <b-col>
               <b-form-group  class="align-baseline text-left" label="Strategy" >
                  <b-form-radio-group id="strategy-radio-group" v-model="covering_strategy" name="strategy-radios"  @input="OnCoverStrategy" stacked>
                      <b-form-radio   class="text-left mr-3"  value="States"   >Cover State</b-form-radio>
                      <b-form-radio   class="text-left mr-5"  value="Transitions-Without-Loop"     >Cover Transition</b-form-radio>
                      <b-form-radio   class="text-left mr-5"   value="Transitions-With-Loop"     >Cover Transition(Loop)</b-form-radio>
                  </b-form-radio-group>   
                </b-form-group>
              </b-col>
              <b-col>
               <b-form-group  class="text-left" label="Test Case Priority on State/Transition" >
                 <b-form inline class="mt-2 mb-2">
                  <label class="mr-sm-2" for="inline-form-custom-select-state">State: </label>
                  <b-form-select id="inline-form-custom-select-state" v-model="selected_state" :options="states"
                    class="mb-2 mr-sm-2 mb-sm-0 col-sm-2" ></b-form-select>
                 </b-form>
                 <b-form inline  class="mt-2 mb-2">
                     <label class="mr-sm-2">Transition: </label>
                       <b-form-select v-model="selected_transition_startstate" :options="states" @change="OnTransitions"
                                class="mb-2 mr-sm-2 mb-sm-0 col-sm-2" ></b-form-select>
                        <span> --> </span>
                        <b-form-select v-model="selected_transition"  :options="transitions"
                                class="mb-2 mr-sm-2 mb-sm-0  col-sm-2" ></b-form-select>
                 </b-form> 
               
                </b-form-group>
              </b-col>
          </b-row>
            <b-form inline>
                        <b-form-checkbox
                          id="checkbox-1"
                          class = "mr-5 mb-2"
                          v-model="fsm_status"
                          name="checkbox-1"
                          value="confirmed"
                          unchecked-value="not_confirmed"
                        >
                              Confirm the FSM above
                       </b-form-checkbox>
                       <b-form-checkbox
                                id="checkbox-2"
                                class = "mr-5 mb-2"
                                v-model="model_status"
                                name="checkbox-2"
                                value="confirmed"
                                unchecked-value="not_confirmed"
                              >
                              Confirm the Model righthand
                    </b-form-checkbox>
                    <b-button :disabled ="disableTest"  class="ml-2   mb-2 col-sm-2"   size="lg" :variant="variantTest" @click="OnTest()">Test</b-button>
                     <b-button :disabled ="disableTest"  class="ml-2   mb-2 col-sm-2"   size="lg" :variant="variantRandomTest" @click="OnRandomTest()">Random Test</b-button>
            </b-form>
             <b-table outlined=true  sticky-header=true hover :items="test_results"></b-table>
          </div>
        </b-row>

      </b-col>
      <b-col  cols="6"  md="5">
           <span class = "secondary mt-2 mr-2" > Model Driver </span>
          <b-container  class ="normal"  >
                 <codemirror   class="ModelCodeMirror" v-model="model"  :options="cmOptions"  />
          </b-container> 
      </b-col>
      
    
    </b-row>
  </b-container>
</template>


<script>
  import dedent from 'dedent'
  
  import stringify from "json-stringify-pretty-compact"

// base style
  import 'codemirror/lib/codemirror.css'

  // theme css
  import 'codemirror/theme/monokai.css'
  import 'codemirror/theme/solarized.css'
  // language
  import 'codemirror/mode/vue/vue.js'

  // active-line.js
  import 'codemirror/addon/selection/active-line.js'

  // styleSelectedText
  import 'codemirror/addon/selection/mark-selection.js'
  import 'codemirror/addon/search/searchcursor.js'

  // highlightSelectionMatches
  import 'codemirror/addon/scroll/annotatescrollbar.js'
  import 'codemirror/addon/search/matchesonscrollbar.js'
  import 'codemirror/addon/search/searchcursor.js'
  import 'codemirror/addon/search/match-highlighter.js'

  // keyMap
  import 'codemirror/mode/clike/clike.js'
  import 'codemirror/addon/edit/matchbrackets.js'
  import 'codemirror/addon/comment/comment.js'
  import 'codemirror/addon/dialog/dialog.js'
  import 'codemirror/addon/dialog/dialog.css'
  import 'codemirror/addon/search/searchcursor.js'
  import 'codemirror/addon/search/search.js'
  import 'codemirror/keymap/sublime.js'

  // foldGutter
  import 'codemirror/addon/fold/foldgutter.css'
  import 'codemirror/addon/fold/brace-fold.js'
  import 'codemirror/addon/fold/comment-fold.js'
  import 'codemirror/addon/fold/foldcode.js'
  import 'codemirror/addon/fold/foldgutter.js'
  import 'codemirror/addon/fold/indent-fold.js'
  import 'codemirror/addon/fold/markdown-fold.js'
  import 'codemirror/addon/fold/xml-fold.js'

  import credit from '../../assets/wecredit.json'
  import blindAction from '../../assets/blindAuction.json'
  import dummyAction from '../../assets/dummyAuction.json'
  export default {
    name: "ModelTest",
    data: function () {
      return {
        fsm: null,
        status_fsm: false,
        status_fsm_change: false,

        fsm_status:"not_confirmed",
        model_status: "not_confirmed",
        lSVGInAString: null,
        mouseOverFSM: false, // if mouse over fsm box
        status_test: false,  // if test completed
        status_randomtest: false, // if random test finished
        covering_strategy: null, // which covering strategy  is selected
        
        // test case priority
        states:[],
        selected_state: null, 
        selected_transition_startstate: null, 
        transitions: null,
        selected_transition: null, 

         log: "<p>this is the place to show running log </p>" + this.$smcat,
         test_results: [
         ],
         test_priority: {}, 
          options: [
          { value: blindAction, text: 'blindAction' },
          { value:  credit, text: 'credit' },
          {value: dummyAction,      text:"dummyAuction"},
          { value: 'null', text: 'Empty' }
        ],
       cmOptions_json: {
          mode: {
              name: "javascript",
              json: true,
              statementIndent: 2
          },
          viewportMargin: Infinity,
          tabSize: 4,
          styleActiveLine: true,
          lineNumbers: true,
          line: true,
          foldGutter: true,
          styleSelectedText: true,
          keyMap: "sublime",
          matchBrackets: true,
          showCursorWhenSelecting: true,
          theme: "default",
          extraKeys: { "Ctrl": "autocomplete" },
          hintOptions:{
            completeSingle: false
          }
        },
        cmOptions: {
          mode: 'text/javascript',
          viewportMargin: Infinity,
          tabSize: 4,
          styleActiveLine: true,
          lineNumbers: true,
          line: true,
          foldGutter: true,
          styleSelectedText: true,
          keyMap: "sublime",
          matchBrackets: true,
          showCursorWhenSelecting: true,
          theme: "default",
          extraKeys: { "Ctrl": "autocomplete" },
          hintOptions:{
            completeSingle: false
          }
        }
      };
    },
    created: function(){
      let obj = this;
      const event_Test = "Test";
      this.$socket.on(event_Test, data=> {
        console.log(event_Test, data);
      } )
      this.$socket.on("server", data =>{
           alert(JSON.stringify(data));
           console.log(JSON.stringify(data));
           if(data.event=="event_Test_Done"){
                          obj.status_test = true;
                          console.log(data);
                          return;
              }else if (data.event == "RandomTestAction_Report"){
                          obj.$fsmservice.enable_randomTest();
              }
              // obj.$fsmservice.add_action_report(data.data)
           
               const lSVGInAString = obj.$smcat.render(
                                                                 obj.$fsmservice.add_action_report(data.data).get_sm_cat(), 
                                                                       {
                                                                           inputType: "json",
                                                                           outputType: "svg",
                                                                           direction: "left-right",
                                                                         }
                   ); 
                 var result = obj.$fsmservice.next_result();
                 if(result)
                       obj.test_results.push(result);
                 var  parser = new DOMParser();
                 var xmlDoc = parser.parseFromString(lSVGInAString, "text/xml");
                 // console.log(xmlDoc);
                 xmlDoc.getElementsByTagName("svg")[0].setAttribute("width", "100%");
                 xmlDoc.getElementsByTagName("svg")[0].setAttribute("height", "100%");
                 var s = new XMLSerializer();
                 obj.lSVGInAString= s.serializeToString(xmlDoc);
      });
    },
    methods: {
      GenerateSVGXMLString(sm_cat_json){
              const lSVGInAString = this.$smcat.render(
                sm_cat_json
                , {
                    inputType: "json",
                    outputType: "svg",
                    direction: "left-right",
                  }
                );
                // console.log(lSVGInAString);
                var  parser = new DOMParser();
                var xmlDoc = parser.parseFromString(lSVGInAString, "text/xml");
                // console.log(xmlDoc);
                xmlDoc.getElementsByTagName("svg")[0].setAttribute("width", "100%");
                xmlDoc.getElementsByTagName("svg")[0].setAttribute("height", "100%");
                var s = new XMLSerializer();
                this.lSVGInAString= s.serializeToString(xmlDoc);
      },
      OnSelectExample(){
        if(this.selected!="null"){
              this.fsm = stringify(this.selected);
              try {
                this.GenerateSVGXMLString( this.$fsmservice.add_fsm(this.fsm).get_sm_cat());
                this.states = this.$fsmservice.get_stateOptions();
                this.status_fsm = true;
                this.model =  dedent(`${this.$fsmservice.get_model_script()}`);
                console.log(this.model);
              } catch (pError) {
                alert(pError);
                console.error(pError);
              }
        }else{
           this.fsm = null;
           this.model = null;
        }
      },
      OnStateMachineChange() {
        console.log("OnStateMachineChange");
        try {
          this.GenerateSVGXMLString( this.$fsmservice.add_fsm(this.fsm).get_sm_cat());
          this.states = this.$fsmservice.get_stateOptions();
          this.status_fsm = true;
          this.model =  dedent(this.$fsmservice.get_model_script());
          this.status_test = false;
        } catch (pError) {
          alert(pError);
          console.error(pError);
        }
      },
      OnTest(){
        const client_Test = "Test_client";
        console.log(client_Test);
        this.$socket.emit("client",{type: client_Test,
        data: {
              covering_strategy: this.covering_strategy,
              test_priority: {state: this.selected_state, transition:this.selected_transition}, 
              target_contract:this.$fsmservice.get_fsm().target_contract, 
              file_name: "statemachine.js", 
              model_script: this.model
          }
        });
    },
      OnRandomTest(){
        const client_Test = "Test_client";
        console.log(client_Test);
        this.$socket.emit("client",{type: client_Test,
        data: {
              random_test: true, 
              covering_strategy: this.covering_strategy,
              test_priority: {state: this.selected_state, transition:this.selected_transition}, 
              target_contract:this.$fsmservice.get_fsm().target_contract, 
              file_name: "statemachine.js", 
              model_script: this.model
          }
        });
    },
      OnMouseOverFSM(){
          console.log("MouseOverFSM");
          this.mouseOverFSM = true;
          this.OnStateMachineChange();
      },
      OnMouseOutFSM(){
        console.log("MouseLeaveFSM");
         this.mouseOverFSM = false;
      },
      OnCoverStrategy(){
        console.log(`current strategy ${this.covering_strategy}`)
         this.model = this.$fsmservice.add_covering_strategy(this.covering_strategy).get_model_script();
         this.GenerateSVGXMLString( this.$fsmservice.get_sm_cat());
      },
      OnTransitions(){
        console.log(this.selected_transition_startstate);
        this.transitions = this.$fsmservice.get_possible_transitions(this.selected_transition_startstate);
      }
      

    },
    computed: {
      disable_model_script(){
        return this.status_fsm==false;
      },
      zoom(){
        console.log( this.mouseOverFSM?"large stack-top": "normal stack-top");
        return this.mouseOverFSM?"large stack-top": "normal stack-top";
      },
      disableTest(){
        console.log(this.fsm_status, this.model_status);
        return !(this. fsm_status == "confirmed" && this.model_status == "confirmed");
      },
      variantTest(){
        return (this. fsm_status == "confirmed" && this.model_status == "confirmed")?this.status_test?"success":"primary": "secondary";
      },
      variantRandomTest(){
        return (this. fsm_status == "confirmed" && this.model_status == "confirmed")?this.status_randomtest?"success":"primary": "secondary";
      }
    },
    props: {
      msg: String
    }
  };
</script>

<style  lang="scss">
  .container /deep/ {
    @import "~bootstrap-vue/dist/bootstrap-vue";
    @import "~bootstrap/dist/css/bootstrap";
  }
  .ModelCodeMirror {
           text-align: left!important;
           height: 820px !important;
           width: 100%;
  }
  .MyCodeMirror {
           text-align: left!important;
           height: 98%;
           width: 100%;
  }
  .CodeMirror {
      width: 100%;
      height: 100%;
      border: 1px solid #eee;
     }
     .normal{
             width:98%   !important; 
             height: 800px; border:thin
     }
     .large{
              width:300%  !important; 
              height: 800px; border:thin
     }
      .stack-top{
        z-index: 9;
        margin: 20px; /* for demo purpose  */
    }
    div {
        z-index: 1; /* integer */
    }
</style>
