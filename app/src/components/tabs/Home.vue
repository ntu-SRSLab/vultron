<template>
  <div class="container">
    <b-card class="mt-3" header="ModCon: The Model-based Platforms for Smart Contract."  header-class= "lg"   header-bg-variant="light" header-text-variant="default">
      <b-form>
        <b-form-group id="input-group-1" label-align="left" label="Contracts(.sol):" label-for="input-select-upload"
          description="We'll never share your software asset with anyone else.">
          <b-form-file id="input-select-upload" v-model="files" :state="Boolean(file)" accetpt=".sol"
            placeholder="Choose smart contract or drop it here..." drop-placeholder="Drop file here..."
            @change="onFileChange" multiple>
          </b-form-file>
        </b-form-group>
        <b-progress :value="value*100/files.length" variant="success" v-if="status_upload_start"></b-progress>
        <!-- <b-table striped hover :items="selected"></b-table> -->
        <b-button :variant="variant_upload" :disabled="disable_upload" @click="OnUpload" class=" mr-1"> 
                <b-icon   icon="cloud-upload" scale="1" aria-hidden="true"> </b-icon>
                <span> Upload </span>
        </b-button>
        <!-- <b-table striped hover :items="uploaded"></b-table> -->
        <b-button :variant="variant_compile" :disabled="disable_compile" @click="OnCompile" class="mr-1"> 
                <span>Compile</span>
                <b-icon   icon="check2" v-if="status_compile"> </b-icon>
                <b-spinner small   v-if = "status_compile_start"></b-spinner>
          <!-- Compile -->
        </b-button>
        <!-- <b-table striped hover :items="compiled"></b-table> -->
        <b-form class="mt-3" inline v-if="status_compile">
          <label class="mr-sm-2" for="inline-form-custom-select-contract">contract </label>
          <b-form-select id="inline-form-custom-select-contract" v-model="selected_contract" :options="contracts"
            class="mb-2 mr-sm-2 mb-sm-0" @change="OnSelectContract"></b-form-select>

          <label v-if="selected_contract" class="mr-sm-2" for="inline-form-custom-select-contract-address">address
          </label>
          <b-form-select id="inline-form-custom-select-contract-address" v-model="selected_address"
            :options="contract_addresses" class="mb-2 mr-sm-2 mb-sm-0" v-if="selected_contract"></b-form-select>

          <label v-if="selected_contract" class="mr-sm-2" for="inline-form-custom-select-contract-abi">abi </label>
          <b-form-select id="inline-form-custom-select-contract-abi" v-model="selected_abi" :options="abis"
            class="mb-2 mr-sm-2 mb-sm-0" v-if="selected_contract" @change="OnChangeAbi"></b-form-select>
        </b-form>

        <div class="mt-2" v-for="(value, name) in selected_abi" v-bind:key="name">
          <b-form-group label-cols-sm="3" :label="`${name}`" label-align-sm="right" :label-for="`${name}`">
            <b-form-input v-if="selected_abi" :plaintext="readonly(`${name}`)" class="mr-sm-2" :id="`${name}`"
              :ref="`${name}`" :type="`${value}`" :placeholder="`${value}`" :disabled="readonly(`${name}`)">
            </b-form-input>
          </b-form-group>
        </div>
        <b-button v-if="status_compile"  :disabled="!selected_abi" block variant="outline-primary" @click="OnDeploy" class="mt-2">  {{selected_abi?selected_abi.name==selected_contract.split(".sol")[0]?"Deploy":"SendTx":"Deploy Or SendTransaction"}}</b-button>
        <!-- <b-table striped hover :items="deployed"></b-table> -->
        <b-card class="mt-3" header="Result">
          <span v-html="log"></span>
        </b-card>
      </b-form>
    </b-card>
  </div>
</template>


<script>
  const event_Upload = "Upload";
  const event_Compile = "Compile";
  const event_Deploy = "Deploy";
  const event_Transaction = "Transaction";
  const event_Call = "Call";
  const client_Upload = "Upload_client";
  const client_Compile = "Compile_client";
  const client_Deploy = "Deploy_client";
  const client_Transaction = "Transaction_client";
  const client_Call = "Call_client";
  export default {
    name: "Home",
    data: function () {
      return {
        object: {
          title: 'How to do lists in Vue',
          author: 'Jane Doe',
          publishedAt: '2016-04-10',
          hello: 'How to do lists in Vue',
          world: 'Jane Doe',
          int: '2016-04-10'
        },
        selected: [],
        files: [],
        // if upload complete
        status_upload: false,
        // if upload start
        status_upload_start : false,
        value : 0,

        // if compile complete
        status_compile: false,
       // if compile start
        status_compile_start: false,

        status_deploy: false,
        options: [],
        contracts: [],
        contract_addresses: [], 
        selected_contract: null,
        selected_abi: null,
        selected_address: null,
        log: "",
        server_data: null,
        addresses: {}
      };
    },
    created: function () {
      // lisent server event
      var obj = this;
      this.$socket.on(event_Compile, function (data) {
        console.log(data);
        obj.status_compile = true;
        // obj.log += "<br>" + event_Compile + " done";
        obj.$fsmservice.add_contracts(data);
        if (!obj.server_data)
          obj.server_data = {};
        obj.server_data[event_Compile] = data;
        obj.status_compile= true;
        obj.status_compile_start = false;
      });
      this.$socket.on(event_Upload, function (data) {
        if (!obj.server_data)
          obj.server_data = {};
        obj.server_data[event_Upload] = data;
      });
      this.$socket.on(event_Deploy, function (data) {
        console.log(event_Deploy, data);
        obj.status_deploy = true;
        obj.log += "<br>" + event_Deploy + ": " + data.name + "-" + data.address;
        if (!obj.addresses[data.name]) {
          obj.addresses[`${data.name}`] = [];
        }
        obj.addresses[`${data.name}`].push(`${data.address}`);
        if (obj.contract_addresses[0].value=="0x"){
            obj.contract_addresses = [{
                value: data.address,
                text: data.address
            }];
        }else {
            obj.contract_addresses.push({
                value: data.address,
                text: data.address
            });
        }

        if (!obj.server_data)
          obj.server_data = {};
        obj.server_data[event_Deploy] = data;
      });
      this.$socket.on(event_Transaction, function (data) {
        obj.log += "<br>" + event_Transaction + ": " + JSON.stringify(data);
        if (!obj.server_data)
          obj.server_data = {};
        obj.server_data[event_Transaction] = data;
      });
      this.$socket.on(event_Call, function (data) {
        if (!obj.server_data)
          obj.server_data = {};
        obj.server_data[event_Call] = data;
      });
    
     this.$uploader.addEventListener("complete", function (event) {
        console.log(event.file.name, " has uploaded");
        // console.log(obj.selected);
        obj.status_upload = true;
        // obj.log += "<br>" + "upload" + " done";
        obj.value += 1;
      });
      this.$uploader.addEventListener("progress", function(event){
        console.log(event, "upload in progress");
      });

    },
    methods: {
      onFileChange(e) {
        this.value = 0;
        var files = e.target.files || e.dataTransfer.files;
        if (!files.length)
          return;
        // console.log(files);
        this.selected = [];
        for (var file of files) {
          this.selected.push({
            contract: file.name
          });
        }
        this.files = files;
        this.status_upload = false;
        this.status_compile = false;
        this.status_deploy = false;
        
        this.status_upload_start = false;
        this.status_compile_start = false;
      },
      OnUpload() {
        // this.log += "<br> uploaded contracts to server:" + JSON.stringify(this.selected);
        this.$socket.emit("client", {
          type: client_Upload,
          data: this.selected
        });
        this.$uploader.submitFiles(this.files);
        this.status_upload_start = true;
      },
      OnCompile() {
        this.$socket.emit("client", {
          type: client_Compile,
          data: this.selected
        });
        this.status_compile_start = true;
        // this.log += "<br> server compiled " + JSON.stringify(this.selected);
        for (var instance of this.selected) {
          this.contracts.push({
            value: instance.contract,
            text: instance.contract
          });
        }
      },
      OnDeploy() {
        console.log(client_Call);
        console.log(client_Transaction);
        if (this.selected_address === "0x") {
          var deployEvent = {
            type: client_Deploy,
            data: {
              contract: this.selected_contract.split(".sol")[0],
              address: this.selected_address,
              func: this.selected_abi.name + "(" + this.selected_abi.inputs + ")",
              params: JSON.parse("[" + this.$refs.inputs[0].localValue + "]")
            }
          }
          console.log(deployEvent);
          this.$socket.emit("client", deployEvent);
          // this.log += "<br> server deployed:" + this.selected_contract;
        } else {
          var transactionEvent = {
            type: client_Transaction,
            data: {
              contract: this.selected_contract.split(".sol")[0],
              address: this.selected_address,
              func: this.selected_abi.name + "(" + this.selected_abi.inputs + ")",
              params: JSON.parse("[" + this.$refs.inputs[0].localValue + "]")
            }
          }
          console.log(transactionEvent);
          this.$socket.emit("client", transactionEvent);
          // this.log += `<br> server will handle transaction from ${this.selected_contract}`;
        }
      },

      OnSelectContract(e) {
        console.log(e);
        console.log(`address of ${this.selected_contract}:`);
        console.log(this.addresses);
        if (undefined == this.addresses[this.selected_contract.split(".sol")[0]])
           this.contract_addresses = [{
            value: "0x",
            text: "0x"
          }];
        else {
          let ret = [];
          for (let address of this.addresses[this.selected_contract.split(".sol")[0]]) {
            ret.push({
              value: address,
              text: address
            });
          }
          this.contract_addresses = ret;
        }

      },
      OnChangeAbi(){
        console.log(this.selected_abi);
        this.labelDeployAndSendTx = this.selected_abi.name==this.selected_contract.split(".sol")[0]?"Deploy":"SendTx";
        console.log(this.labelDeployAndSendTx);
      },
      types(inputs) {
        let input_types = [];
        if (inputs && inputs.length >= 1)
          for (let input of inputs)
            input_types.push(input.type);
        return input_types.join();
      },
      readonly(field_name) {
        //  alert( !(field_name === 'inputs'));
        return !(field_name === 'inputs');
      }
    },
    computed: {
      variant_upload: function () {
        return this.status_upload == false ? "primary" : "success";
      },
      variant_compile: function () {
        return this.status_upload == false ? "secondary" : this.status_compile == false ? "primary" : "success";
      },
      disable_upload: function () {
        return this.selected.length == 0;
      },
      disable_compile: function () {
        return this.status_upload == false;
      },
      // contract_addresses: function () {
      //   console.log(`address of ${this.selected_contract}:`);
      //   console.log(this.addresses);
      //   if (undefined == this.addresses[this.selected_contract.split(".sol")[0]])
      //     return [{
      //       value: "0x",
      //       text: "0x"
      //     }];
      //   else {
      //     let ret = [];
      //     for (let address of this.addresses[this.selected_contract.split(".sol")[0]]) {
      //       ret.push({
      //         value: address,
      //         text: address
      //       });
      //     }
      //     return ret;
      //   }
      // },
      
      abis: function () {
        var existConstructorFunction = false;
        var abis = [];
        console.log(this.server_data[event_Compile]);
        console.log(this.server_data[event_Compile][this.selected_contract.split(".sol")[0]]);
        for (var fun of JSON.parse(JSON.stringify(this.server_data[event_Compile][this.selected_contract.split(".sol")[0]]))) {
              if (fun.type == "function" || fun.type == "constructor") {
                  if(fun.type == "constructor"){
                        existConstructorFunction = true;
                  }
                    fun.inputs = this.types(fun.inputs);
                    fun.outputs = this.types(fun.outputs);
                    console.log(fun);
                    if (fun.name == undefined || fun.name == null || fun.name == "") {
                          fun.name = this.selected_contract.split(".sol")[0];
                          abis.push({
                            value: fun,
                            text: this.selected_contract.split(".sol")[0]
                          })
                    } else {
                          abis.push({
                            value: fun,
                            text: fun.name
                          })
                    }
              }
        }
        if(existConstructorFunction==false){
              abis.push({
                value:{
                  name: this.selected_contract.split(".sol")[0], 
                  inputs: "", 
                  type: "constructor"
                  },
                text: this.selected_contract.split(".sol")[0]
            });
        }

        let obj = this;
        return abis.filter(e =>{
          return obj.selected_address=="0x"?e.value.type=="constructor":e.value.type!="constructor";
        });
      }
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