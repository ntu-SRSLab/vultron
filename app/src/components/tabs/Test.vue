<template>
  <b-container fluid>
    <b-row>
      <b-col align-v="center" cols="5" md="2">
        <b-container >
        <b-form inline>
          <b-form-group  class="mt-2"  id="fieldset-1"
      label="example:"
      label-for="select_example">
            <b-form-select id="select_example"  v-model="selected" :options="options"></b-form-select>
          </b-form-group>
        </b-form>
        </b-container>
        <b-form-textarea id="fsm" v-model="fsm" placeholder="Write your state machine..." rows="41" max-rows="41"
          @change="OnStateMachineChange"></b-form-textarea>
        <!-- <span> {{text}}</span> -->
      </b-col>
      <b-col align-v="center" cols="5" md="6">
        <b-row>
              <div class="container" style="width:100%; height: 500px; border:thin;"  v-html="lSVGInAString">
              </div>
        </b-row>
        <b-row v-if="lSVGInAString">
          <div class="container" style="width: 100%; height:300px">
            <b-form inline>
                        <b-form-checkbox
                          id="checkbox-1"
                          class = "mr-5 mb-2"
                          v-model="fsm_status"
                          name="checkbox-1"
                          value="confirmed"
                          unchecked-value="not_confirmed"
                        >
                              Confirm your FSM
                       </b-form-checkbox>
                       <b-form-checkbox
                                id="checkbox-2"
                                class = "mr-5 mb-2"
                                v-model="model_status"
                                name="checkbox-2"
                                value="confirmed"
                                unchecked-value="not_confirmed"
                              >
                              Confirm model testing scripts
                    </b-form-checkbox>
                    <b-button class="mr-2   mb-2 col-sm-2" size="lg" variant="primary">Upload</b-button>
                    <b-button class="ml-2   mb-2 col-sm-2"   size="lg" variant="primary">Test</b-button>
            </b-form>
      
            <!-- <b-card class="mt-3" header="Log Result" header-bg-variant="success"  border-variant="success" 
              header-text-variant="white" body-border-variant="success" body-bg-variant="light" align="center"> -->
            <!-- <b-card class="mt-3" header="Log Result" align="center">
              <b-card-text>{{log}}</b-card-text>
            </b-card> -->
             <b-table outlined=true hover :items="test_results"></b-table>
          </div>
        </b-row>

      </b-col>
      <b-col align-v="center" cols="6" md="4">
        <b-form-textarea id="model" v-model="model" placeholder="Modify the model  testing script..." rows="42"
          max-rows="42"></b-form-textarea>
      </b-col>
    </b-row>
  </b-container>
</template>


<script>
  export default {
    name: "ModelTest",
    data: function () {
      return {
        fsm: null,
        model: null,
        lSVGInAString: null,
        log: "<p>this is the place to show running log </p>" + this.$smcat,
        // FSM# States# Paths# TransitionsTime (s)
         test_results: [
          { FSM: "fsm#1", "#States": 'Dickerson', "#Paths": 'Macdonald' , "#Transitions": "0", "Times(s)": 0},
          { FSM: "fsm#1", "#States": 'Dickerson', "#Paths": 'Macdonald' , "#Transitions": "0", "Times(s)": 0},  
         ],
          options: [
          { value: 'A', text: 'Option A ' },
          { value: 'B', text: 'Option B' }
        ]
      };
    },
    methods: {
      OnStateMachineChange(e) {
        console.log(e); 
        try {
          const lSVGInAString = this.$smcat.render(
           this.fsm
           , {
              inputType: "json",
              outputType: "svg",
              direction: "left-right",
            }
          );
          // console.log(lSVGInAString);
         var  parser = new DOMParser();
          var xmlDoc = parser.parseFromString(lSVGInAString, "text/xml");
          console.log(xmlDoc);
          xmlDoc.getElementsByTagName("svg")[0].setAttribute("width", "100%");
           xmlDoc.getElementsByTagName("svg")[0].setAttribute("height", "100%");
          var s = new XMLSerializer();
          this.lSVGInAString= s.serializeToString(xmlDoc);
        } catch (pError) {
          console.error(pError);
        }
      }
    },
    computed: {

    },
    props: {
      msg: String
    }
  };
</script>

<style scoped lang="scss">
  .container /deep/ {
    @import "~bootstrap-vue/dist/bootstrap-vue";
    @import "~bootstrap/dist/css/bootstrap";
  }
</style>