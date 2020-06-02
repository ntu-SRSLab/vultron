<template>
  <div class="container">
    <b-card class="mt-3" header="Vultron" header-bg-variant="light" header-text-variant="muted">
      <b-form>
        <b-form-group id="input-group-1" label-align="left" label="Contracts(.sol):" label-for="input-select-upload"
          description="We'll never share your software asset with anyone else.">
          <b-form-file id="input-select-upload" v-model="files" :state="Boolean(file)" accetpt=".sol"
            placeholder="Choose smart contract or drop it here..." drop-placeholder="Drop file here..."
            @change="onFileChange" multiple>
          </b-form-file>
        </b-form-group>
        <!-- <b-table striped hover :items="selected"></b-table> -->
        <b-button :variant="variant_upload" @click="OnUpload" class=" mr-1"> Upload</b-button>
        <!-- <b-table striped hover :items="uploaded"></b-table> -->
        <b-button :variant="variant_compile" @click="OnCompile" class="mr-1"> Compile</b-button>
        <!-- <b-table striped hover :items="compiled"></b-table> -->
        <b-form class="mt-3" inline v-if="compiled.length>0">
          <label class="mr-sm-2" for="inline-form-custom-select-contract">contract </label>
          <b-form-select id="inline-form-custom-select-contract" v-model="selected_contract" :options="contracts"
            class="mb-2 mr-sm-2 mb-sm-0" @click="OnSelectContract"></b-form-select>
            
            <label  v-if="selected_contract"  class="mr-sm-2" for="inline-form-custom-select-contract-address">address </label>
          <b-form-select id="inline-form-custom-select-contract-address" v-model="selected_address" :options="addresses"
            class="mb-2 mr-sm-2 mb-sm-0" v-if="selected_contract"></b-form-select>

          <label  v-if="selected_contract"  class="mr-sm-2" for="inline-form-custom-select-contract-abi">abi </label>
          <b-form-select id="inline-form-custom-select-contract-abi" v-model="selected_abi" :options="abis"
            class="mb-2 mr-sm-2 mb-sm-0" v-if="selected_contract"></b-form-select>
        </b-form>
 
        <div  class = "mt-2" v-for="(value, name) in selected_abi" v-bind:key="name">
                      <b-form-group
                        label-cols-sm="3"
                        :label="`${name}`"
                        label-align-sm="right"
                        :label-for="`${name}`"
                      >
                       <b-form-input  v-if="selected_abi"  :plaintext="readonly(`${name}`)"  class="mr-sm-2"  :id="`${name}`" :type="`${value}`" :placeholder="`${value}`"    :disabled="readonly(`${name}`)" ></b-form-input>
                     </b-form-group>
        </div>
        <b-button v-if="selected_abi"  block variant="outline-primary" @click="OnDeploy" class="mt-2"> Deploy</b-button>
        <!-- <b-table striped hover :items="deployed"></b-table> -->
        <b-card class="mt-3" header="Log Result">
            <span v-html="log"></span>
        </b-card>
      </b-form>
    </b-card>
  </div>
</template>


<script>

  export default {
    name: "Home",
    data: function () {
      return {
        abi: [{
          "constant": false,
          "inputs": [{
            "name": "reserved",
            "type": "string"
          }],
          "name": "setReserved",
          "outputs": [{
            "name": "",
            "type": "bool"
          }],
          "payable": false,
          "stateMutability": "nonpayable",
          "type": "function"
        }, {
          "constant": true,
          "inputs": [],
          "name": "getReserved",
          "outputs": [{
            "name": "",
            "type": "string"
          }],
          "payable": false,
          "stateMutability": "view",
          "type": "function"
        }, {
          "constant": false,
          "inputs": [{
            "name": "status",
            "type": "bytes32"
          }],
          "name": "updateCreditClearingStatus",
          "outputs": [{
            "name": "",
            "type": "bool"
          }],
          "payable": false,
          "stateMutability": "nonpayable",
          "type": "function"
        }, {
          "constant": false,
          "inputs": [{
            "name": "owner",
            "type": "address"
          }],
          "name": "setOwner",
          "outputs": [{
            "name": "",
            "type": "bool"
          }],
          "payable": false,
          "stateMutability": "nonpayable",
          "type": "function"
        }, {
          "constant": true,
          "inputs": [],
          "name": "getCreditAssetId",
          "outputs": [{
            "name": "",
            "type": "bytes32"
          }],
          "payable": false,
          "stateMutability": "view",
          "type": "function"
        }, {
          "constant": true,
          "inputs": [],
          "name": "getCreditCustDataHash",
          "outputs": [{
            "name": "",
            "type": "string"
          }],
          "payable": false,
          "stateMutability": "view",
          "type": "function"
        }, {
          "constant": false,
          "inputs": [],
          "name": "getCreditOrginSccId",
          "outputs": [{
            "name": "",
            "type": "bytes32"
          }],
          "payable": false,
          "stateMutability": "nonpayable",
          "type": "function"
        }, {
          "constant": true,
          "inputs": [],
          "name": "getCreditSccValidStatus",
          "outputs": [{
            "name": "",
            "type": "bytes32"
          }],
          "payable": false,
          "stateMutability": "view",
          "type": "function"
        }, {
          "constant": true,
          "inputs": [],
          "name": "getCreditMaturityDate",
          "outputs": [{
            "name": "",
            "type": "bytes32"
          }],
          "payable": false,
          "stateMutability": "view",
          "type": "function"
        }, {
          "constant": true,
          "inputs": [],
          "name": "getCreditSccClearingStatus",
          "outputs": [{
            "name": "",
            "type": "bytes32"
          }],
          "payable": false,
          "stateMutability": "view",
          "type": "function"
        }, {
          "constant": true,
          "inputs": [],
          "name": "getCredit",
          "outputs": [{
            "name": "",
            "type": "bytes32[]"
          }, {
            "name": "",
            "type": "uint128"
          }, {
            "name": "",
            "type": "string"
          }, {
            "name": "",
            "type": "address"
          }],
          "payable": false,
          "stateMutability": "view",
          "type": "function"
        }, {
          "constant": true,
          "inputs": [],
          "name": "getCustDataHash",
          "outputs": [{
            "name": "",
            "type": "string"
          }],
          "payable": false,
          "stateMutability": "view",
          "type": "function"
        }, {
          "constant": true,
          "inputs": [],
          "name": "getCreditOwner",
          "outputs": [{
            "name": "",
            "type": "address"
          }],
          "payable": false,
          "stateMutability": "view",
          "type": "function"
        }, {
          "constant": true,
          "inputs": [],
          "name": "getCreditAccountNo",
          "outputs": [{
            "name": "",
            "type": "bytes32"
          }],
          "payable": false,
          "stateMutability": "view",
          "type": "function"
        }, {
          "constant": true,
          "inputs": [{
            "name": "bytes32Array",
            "type": "bytes32[11]"
          }],
          "name": "staticArrayToDynamicArray",
          "outputs": [{
            "name": "",
            "type": "bytes32[]"
          }],
          "payable": false,
          "stateMutability": "view",
          "type": "function"
        }, {
          "constant": false,
          "inputs": [{
            "name": "status",
            "type": "bytes32"
          }],
          "name": "updateCreditValidStatus",
          "outputs": [{
            "name": "",
            "type": "bool"
          }],
          "payable": false,
          "stateMutability": "nonpayable",
          "type": "function"
        }, {
          "constant": true,
          "inputs": [],
          "name": "getCreditBytes32Array",
          "outputs": [{
            "name": "",
            "type": "bytes32[11]"
          }],
          "payable": false,
          "stateMutability": "view",
          "type": "function"
        }, {
          "constant": false,
          "inputs": [{
            "name": "bytes32Array",
            "type": "bytes32[11]"
          }, {
            "name": "sccAmt",
            "type": "uint128"
          }, {
            "name": "custDataHash",
            "type": "string"
          }],
          "name": "setCredit",
          "outputs": [{
            "name": "",
            "type": "bool"
          }],
          "payable": false,
          "stateMutability": "nonpayable",
          "type": "function"
        }, {
          "constant": true,
          "inputs": [],
          "name": "getCreditSccHoldingStatus",
          "outputs": [{
            "name": "",
            "type": "bytes32"
          }],
          "payable": false,
          "stateMutability": "view",
          "type": "function"
        }, {
          "constant": true,
          "inputs": [],
          "name": "getCreditIssuedDate",
          "outputs": [{
            "name": "",
            "type": "bytes32"
          }],
          "payable": false,
          "stateMutability": "view",
          "type": "function"
        }, {
          "constant": true,
          "inputs": [],
          "name": "getCreditAmt",
          "outputs": [{
            "name": "",
            "type": "uint128"
          }],
          "payable": false,
          "stateMutability": "view",
          "type": "function"
        }, {
          "constant": false,
          "inputs": [{
            "name": "status",
            "type": "bytes32"
          }],
          "name": "updateCreditHoldingStatus",
          "outputs": [{
            "name": "",
            "type": "bool"
          }],
          "payable": false,
          "stateMutability": "nonpayable",
          "type": "function"
        }, {
          "inputs": [{
            "name": "bytes32Array",
            "type": "bytes32[11]"
          }, {
            "name": "sccAmt",
            "type": "uint128"
          }, {
            "name": "custDataHash",
            "type": "string"
          }, {
            "name": "owner",
            "type": "address"
          }],
          "payable": false,
          "stateMutability": "nonpayable",
          "type": "constructor"
        }, {
          "anonymous": false,
          "inputs": [{
            "indexed": false,
            "name": "sccId",
            "type": "bytes32"
          }, {
            "indexed": false,
            "name": "preOwner",
            "type": "address"
          }, {
            "indexed": false,
            "name": "owner",
            "type": "address"
          }, {
            "indexed": false,
            "name": "contractAddress",
            "type": "address"
          }],
          "name": "setOwnerEvent",
          "type": "event"
        }, {
          "anonymous": false,
          "inputs": [{
            "indexed": false,
            "name": "bytes32Array",
            "type": "bytes32[]"
          }, {
            "indexed": false,
            "name": "sccAmt",
            "type": "uint128"
          }, {
            "indexed": false,
            "name": "custDataHash",
            "type": "string"
          }, {
            "indexed": false,
            "name": "contractAddress",
            "type": "address"
          }],
          "name": "setCreditEvent",
          "type": "event"
        }, {
          "anonymous": false,
          "inputs": [{
            "indexed": false,
            "name": "sccId",
            "type": "bytes32"
          }, {
            "indexed": false,
            "name": "reserved",
            "type": "string"
          }, {
            "indexed": false,
            "name": "contractAddress",
            "type": "address"
          }],
          "name": "setReservedEvent",
          "type": "event"
        }],
        object: {
          title: 'How to do lists in Vue',
          author: 'Jane Doe',
          publishedAt: '2016-04-10',
          hello: 'How to do lists in Vue',
          world: 'Jane Doe',
          int: '2016-04-10'
        },
        selected: [],
        uploaded: [],
        compiled: [],
        deployed: [],
        options: [],

        contracts:[],
        selected_contract:null,
        selected_abi: null,
        selected_address: null,
        log: "",

        server_data: null
      };
    },
    created: function(){
      // lisent server event
      const event_Upload = "Upload";
      const event_Compile = "Compile";
      const event_Deploy = "Deploy";
      const event_Transaction = "Transaction";
      const event_Call = "Call";
      const events = [event_Upload, event_Compile, event_Deploy, event_Transaction, event_Call];
      for (let event of events){
          this.$socket.on(event, function(data){
            if(!this.server_data)
                this.server_data={};
            this.server_data[event] = data;
          })
      }
    },
    methods: {
      onFileChange(e) {
        var files = e.target.files || e.dataTransfer.files;
        if (!files.length)
          return;
        console.log(files);
        this.selected = [];
        for (var file of files) {
          this.selected.push({
            contract: file.name
          });
        }
        this.uploaded = [];
        this.compiled = [];
        this.deployed = [];
      },
      OnUpload(e) {
        console.log(e);
        this.uploaded = this.selected;
        this.log +="<br> uploaded contracts to server:" + JSON.stringify(this.selected);
      },
      OnCompile(e) {
        console.log(e);
        this.compiled = this.uploaded;
         this.log +="<br> compiled:" + JSON.stringify(this.selected);
        for (var instance of this.compiled) {
          this.contracts.push({
            value: instance.contract,
            text: instance.contract
          });
         }
      },
    
      OnDeploy(e) {
        console.log(e);
        this.deployed = this.compiled;
        this.log +="<br> deployed:" + JSON.stringify(this.selected);
        // alert(e.toString() + "compiled:" + JSON.stringify(this.selected));
      },
        
      OnSelectContract(e) {
        console.log(e);
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
        return this.uploaded.length == 0 ? "primary" : "success";
      },
      variant_compile: function () {
        return this.compiled.length == 0 ? "primary" : "success";
      },
      addresses: function(){
        return [{value: "0x", text: "0x"}];
      },
      abis:function(){
          var abis = [];
           for(var fun of this.abi){
             if(fun.type=="function" || fun.type=="constructor"){
            fun.inputs = this.types(fun.inputs);
            fun.outputs = this.types(fun.outputs);
            if (fun.name==undefined || fun.name==null || fun.name == ""){
                  abis.push({
                  value: fun,
                  text:  this.selected_contract.split(".sol")[0]
            })}else{ 
                abis.push({
                  value: fun,
                  text:  fun.name
                })
            }
        }
           }
        return abis;
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