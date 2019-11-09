const path = require('path');
const Web3jService = require('web3j-api/web3j').Web3jService;
const web3j = new Web3jService();
const Configuration = require('web3j-api/common/configuration').Configuration;

Configuration.setConfig(path.join(__dirname, './config.json'));

const fs = require('fs');
const locks = require('locks');
// mutex
const mutex = locks.createMutex();
const async = require('async');

var g_data_feedback = false;

/// contract detail(json)
let g_target_artifact;
// contract abstraction(json)
let g_targetContract;



function write2file(file, content){
  fs.writeFile(file, content, function (err) {
     if (err) throw err;
     console.log(file+' Saved!');
  });
}

// artifact
// {
//  address:,
//  abi:,
//  sourcePath:
//  source:
//  deployedSourceMap:
// }

class FiscoFuzzer extends Web3jService{
    constructor(seed) {
        super();
	this.outputdir = "./deployed_contract";
	this.contract_name = undefined;
        this.seed = seed;	

    }

    resetConfig() {
        super.resetConfig();
    }
    async test(){
  	this.getBlockNumber().then((res) => {
	    console.log(res);
	  }).catch((e) => {
	    console.log(e);
	  });
	  return true;
    }
    async get_instance(contract_path){
     let contract_file_name = contract_path.split("/")[contract_path.split("/").length-1];
     this.contract_name = contract_file_name.split(".")[0]; 
     let path = this.outputdir+"/"+this.contract_name; 
     let instances = [];
     if (fs.existsSync(path)){
    	      console.log(this.contract_name+" has been deployed before");
	      const dir = await fs.promises.opendir(path);
	      let addresses = [];
	      let abi = undefined;
	      for await (const dirent of dir) {
		    if(dirent.name.search("0x")!=-1){
			    addresses.push(dirent.name);
		    } else if(dirent.name.search(".abi")!=-1){
			    abi = JSON.parse(fs.readFileSync(path+"/"+dirent.name, "utf8"));
		    }
	      }
	      console.log(addresses);
	      for (let address of addresses){
		 instances.push({address:address, abi: abi});
	      }
      }
      return instances;
   }
   async deploy_contract(contract_path){
     let contract_file_name = contract_path.split("/")[contract_path.split("/").length-1];
     this.contract_name = contract_file_name.split(".")[0];
     let instance = await this.deploy(contract_path,this.outputdir+"/"+this.contract_name);
     write2file(this.outputdir+"/"+this.contract_name+"/"+instance.contractAddress, JSON.stringify(instance));
     return instance.contractAddress;
   }
   async deploy_contract_compiled(contract_path, compiled_dir){
     let contract_file_name = contract_path.split("/")[contract_path.split("/").length-1];
     this.contract_name = contract_file_name.split(".")[0];
     let instance = await this.deploy_compiled(contract_path,compiled_dir+"/"+this.contract_name);
     write2file(this.outputdir+"/"+this.contract_name+"/"+instance.contractAddress, JSON.stringify(instance));
     return instance.contractAddress;
   }
   async call_contract(contract_path, function_name, argv){
     let contract_file_name = contract_path.split("/")[contract_path.split("/").length-1];
     this.contract_name = contract_file_name.split(".")[0]; 
     let path = this.outputdir+"/"+this.contract_name;
     let answer="";
     if (fs.existsSync(path)){
    	      console.log(this.contract_name+" has been deployed before");
	      const dir = await fs.promises.opendir(path);
	      console.log(dir);
	      for await (const dirent of dir) {
		    if(dirent.name.search("0x")!=-1){
		       console.log("address:"+dirent.name);
		       answer += dirent.name+";";
		       let ret;
		       console.log(dirent.name, function_name, argv);
		       if (argv==null || argv==undefined){
			  console.log("argv is null or undefined");
			  ret = await this.sendRawTransaction(dirent.name, function_name, "");
			  console.log(ret);
		       }
		       else {
			  console.log(argv);
		          ret = await this.sendRawTransaction(dirent.name, function_name, argv);
			  console.log(ret);
		       }
		       console.log("hello call contract");
		       answer += JSON.stringify(ret)+"\n</br>";
		       console.log(answer);
		    }else{
		       console.log(dirent.name);
		    }
	      }
      }
     return answer;
   }
   
   async fuzz_fun(contract, fun_name){
     let args = []
     return this.sendRawTransaction(contract.address,fun_name, args);
   }
   select_funs(abi){
     let funs = [];
	   //after some selection
     return funs;
   }
   resetseed(seed){
     this.seed = seed;
   }
   async fuzz(contract){
	   let abi = contract.abi;
	   let funs = select_funs(abi); 
	   for (let fun of funs)
	   {
	     await fuzz_fun(contract, fun);
	   }
   }
   promise_callback(msg){
      // handle aync return
   }
   callback(feedback){
      // handle monitor feedback
   }
} 
module.exports.FiscoFuzzer = FiscoFuzzer;
/*
module.exports.test_deployed = function() {
  web3j.getBlockNumber().then((res) => {
    console.log(res);
  }).catch((e) => {
    console.log(e);
  });
  return true;
}*/
