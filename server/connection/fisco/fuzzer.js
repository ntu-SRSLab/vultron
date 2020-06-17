const abiDecoder = require('abi-decoder');
const path = require('path');
const shell = require("shelljs");
const Web3jService = require('web3j-api/web3j').Web3jService;
const Configuration = require('web3j-api/common/configuration').Configuration;
Configuration.setConfig(path.join(__dirname, './config.json'));
const readJSON = require("./common.js").readJSON;
const write2file = require("./common.js").write2file;
const types = require("./common.js").types;
// const gen_callFun = require("./common.js").gen_callFun;
const gen_callFun = require("./common_randompool.js").gen_callFun;

const findCandSequence = require("./common.js").findCandSequence;
const UserAccount = require("./common.js").UserAccount;
const randomNum = require("./common.js").randomNum;

const tracer = require('../EVM2Code');
const fs = require('fs');
const assert = require("assert");


// the maximum length of seed_callSequence
const sequence_maxLen = 4;

function IsJsonObject(json) {
    try {
        JSON.stringify(json);
    } catch (e) {
        return false;
    }
    return true;
}
// @ Workdir setting.
//  eg.  ./deployed_contract/Helloworld/Helloworld.sol  Helloworld.abi   ../Helloworld.bin
//    workdir = deployed_contract/;
//   contract_name = Helloworld;
const contract_mapping = {};
class FiscoDeployer extends Web3jService {
    constructor(workdir) {
        super();
        this.workdir = workdir;
        // this.contract_mapping = {};
    }
    static getInstance(workdir) {
        if (!FiscoDeployer.instance) {
            FiscoDeployer.instance = new FiscoDeployer(workdir);
        }
        return FiscoDeployer.instance;
    }
    /**
     * Not precompiled
     * contract HelloWorld{
     *    HelloWorld(){
     *    }
     * }
     * @param {string} contract_name : HelloWorld
     */
    async deploy_contract(contract_name) {
        assert(fs.existsSync(path.join(this.workdir, contract_name, contract_name + ".sol")), "contract not exist");
        let instance = await this.deploy(path.join(this.workdir, contract_name, contract_name + ".sol"), path.join(this.workdir, contract_name));
        write2file(path.join(this.workdir, contract_name, instance.contractAddress), JSON.stringify(instance));
        contract_mapping[contract_name] = {
            path: path.join(this.workdir, contract_name, contract_name + ".sol"),
            abi: path.join(this.workdir, contract_name, contract_name + ".abi"),
            name: contract_name,
            address: instance.contractAddress,
            constructor: contract_name + "()",
            construcotrparam: ""
        };
        return contract_mapping[contract_name];
    }
    /**
     * contract HelloWorld{
     *    HelloWorld(){
     *    }
     * }
     * @param {string} contract_name : HelloWorld
     */
    async deploy_contract_precompiled(contract_name) {
        assert(fs.existsSync(path.join(this.workdir, contract_name, contract_name + ".sol")), "contract not exist");
        let instance = await this.deploy_precompiled(path.join(this.workdir, contract_name, contract_name + ".sol"),
            path.join(this.workdir, contract_name));
        write2file(path.join(this.workdir, contract_name, instance.contractAddress), JSON.stringify(instance));
        contract_mapping[contract_name] = {
            path: path.join(this.workdir, contract_name, contract_name + ".sol"),
            abi: path.join(this.workdir, contract_name, contract_name + ".abi"),
            name: contract_name,
            address: instance.contractAddress,
            constructor: contract_name + "()",
            construcotrparam: ""
        };
        return contract_mapping[contract_name];
    }
    /**
     *  contract HelloWorld{
     *   HelloWorld(string msg){
     *    }
     * }
     * @param {string} contract_name   the name of contract: HelloWorld
     * @param {string} func  HelloWorld(string)
     * @param {array} params     ["world"]
     */
    async deploy_contract_precompiled_params(contract_name, full_func, params) {
        assert(fs.existsSync(path.join(this.workdir, contract_name, contract_name + ".sol")), "contract not exist");
        let instance = await this.deploy_precompiled_params(path.join(this.workdir, contract_name, contract_name + ".sol"),
            path.join(this.workdir, contract_name), full_func, params);
        // console.log(instance);
        write2file(path.join(this.workdir, contract_name, instance.contractAddress), JSON.stringify(instance));
        contract_mapping[contract_name] = {
            path: path.join(this.workdir, contract_name, contract_name + ".sol"),
            abi: path.join(this.workdir, contract_name, contract_name + ".abi"),
            name: contract_name,
            address: instance.contractAddress,
            constructor: full_func,
            construcotrparam: params
        };
        return contract_mapping[contract_name];
    }
    async transcation_send(contract_name, address, full_func, params){
        console.log(`send transaction to contract ${contract_name}...`);
       
        // console.log(receipt);
        let abi_path = this.addContractInstance(address, contract_name).getContractInstance(contract_name).abi;
        let receipt = null;
        let logs = null;
        if (abi_path) {
            let abi =JSON.parse(fs.readFileSync(abi_path, "utf8"));
            assert(abi, "abi is undefined, contract_abi is not well defined");
            let func_abi = abi.filter(e => {
                return e.name == full_func.split("(")[0]
            });
            if (!(func_abi[0].constant || func_abi[0].stateMutability=="view")){
                       receipt = await this.sendRawTransaction(`${address}`, `${full_func}`, params);   
                       abiDecoder.addABI(abi);
                       let logs = abiDecoder.decodeLogs(receipt.logs);
            }
            else {
                        receipt = await this.call(`${address}`, `${full_func}`, params);   
                        logs = null;
            }
            console.log(`done`);
            return {receipt:receipt, "logs":logs};
        }else{
            receipt = await this.sendRawTransaction(`${address}`, `${full_func}`, params);   
        }
        return {receipt:receipt, "logs":null};
    }

    getContractInstance(contract_name) {
        // console.log("getInstance");
        assert(contract_name in contract_mapping, contract_name + " not deployed");
        return contract_mapping[contract_name];
    }
    addContractInstance(address, contract_name) {
        contract_mapping[contract_name] = {
            path: path.join(this.workdir, contract_name, contract_name + ".sol"),
            abi: path.join(this.workdir, contract_name, contract_name + ".abi"),
            name: contract_name,
            address: address,
            constructor: "NA",
            construcotrparam: "NA"
        };
        return this;
    }
}
class FiscoFuzzer extends Web3jService {
    constructor(seed, contract_name) {
        super();
        this.seed = seed;
        this.contract_name = contract_name;
        this.instance = "NA";
        this.loadContract = false;
        this.bootstrapContract = false;
        assert(this.seed, "seed is undefined");
        assert(this.contract_name, "contract name is undefined");
        assert(this.instance);
    }
    async test() {
        this.getBlockNumber().then((res) => {
            console.log("UserAccount:", UserAccount);
            console.log("connected to fisco");
        }).catch((e) => {
            //console.log(e);
        });
        return true;
    }
    set_seed(seed) {
        this.seed = seed;
    }
    // @target_artifact_path 
    // @target_instance_path
    // @targetSolPath
    async load() {
        // assert(this.loadContract ==false, "error loaded already") ;
        // console.log(FiscoDeployer.getInstance());
        this.instance = FiscoDeployer.getInstance().getContractInstance(this.contract_name);
        // console.log(this.instance);
        abiDecoder.addABI(readJSON(this.instance.abi));
        let ret = {
            accounts: [UserAccount],
            target_adds: this.instance.address,
            target_abi: this.instance.abi
        };
        this.loadContract = true;
        ////console.log(ret);
        return ret;
    }

    // initiate a transaction to target contract
    async bootstrap() {
        assert(this.loadContract == true, "function load(...) must be called before");
         this.bootstrapContract = true;
        return {
            callFuns: [],
            execResults: []
        };
    }

    async call_contract(fun_name, argv) {
        let abis = readJSON(this.instance.abi);
        let abi = abis.filter((e) => {
            return e.name == fun_name;
        });
        // console.log(abis,  fun_name, abi);
        let fun_fullname = fun_name;
        if (-1 == fun_name.indexOf("("))
            fun_fullname = abi[0].name + "(" + types(abi[0].inputs) + ")";
        let answer = "";
        let ret = "";
        if (argv == null || argv == undefined) {
            console.log(this.instance.address, fun_fullname, "");
            ret = await this.call(this.instance.address, fun_fullname, "");
        } else {
            console.log(this.instance.address, fun_fullname, argv);
            ret = await this.call(this.instance.address, fun_fullname, argv);
        }
        answer += JSON.stringify(ret) + "\n</br>";
        // console.log(answer);
        return ret;
    }

　async full_fuzz_fun(name, address, fun_name, option){
        let instance = FiscoDeployer.getInstance().addContractInstance(address, name).getContractInstance(name);
        let raw_tx = await this._fuzz_fun(instance.address, readJSON(instance.abi), fun_name, option);
        let abi = readJSON(instance.abi).filter(e => {
            return e.name == fun_name.split("(")[0]
        });
        console.log(fun_name, abi);
        // console.log(abi.constant, abi.stateMutability);
        if (abi[0].constant || abi[0].stateMutability=="view") {
            let receipt = await this._send_call(raw_tx, readJSON(instance.abi));
            // return {raw_tx: raw_tx, receipt:receipt};
            return {receipt: receipt, logs: null, raw_tx:raw_tx};
        } else {
            let receipt = await this._send_tx(raw_tx, readJSON(instance.abi));
            let log = await this._parse_receipt(receipt);
            return {receipt: receipt,  logs: log, raw_tx:raw_tx};
        }
    }

    async fuzz_fun(fun_name, option) {

        let raw_tx = await this._fuzz_fun(this.instance.address, readJSON(this.instance.abi), fun_name, option);
        let abi = readJSON(this.instance.abi).filter(e => {
            return e.name == fun_name
        });
        // console.log(abi.constant, abi.stateMutability);
        if (abi[0].constant) {
            let receipt = await this._send_call(raw_tx, readJSON(this.instance.abi));
            return {raw_tx: raw_tx, receipt:receipt};
        } else {
            let receipt = await this._send_tx(raw_tx, readJSON(this.instance.abi));
            let log = await this._parse_receipt(receipt);
            return {raw_tx:raw_tx, events:log};
        }
    }
    async _fuzz_fun(address, abis, fun_name, option) {
        // abi:[matched...]
        let abi = abis.filter(e => {
            return e.name == fun_name
        });
        assert(abi && abi.length == 1, "matched abi array is empty");
        // console.log(abi, fun_name);
        let ret = await gen_callFun(abi[0], address, option);
        //console.log(ret);
        return {
            from: ret.from,
            to: ret.to,
            fun: ret.abi.name + "(" + types(ret.abi.inputs) + ")",
            param: ret.param
        }
    }
    async _send_tx(raw_tx, contract_abi) {
        console.log("_send_tx", raw_tx);
        let receipt = await this.sendRawTransaction(raw_tx.to, raw_tx.fun, raw_tx.param);
        // console.log(receipt);
        if (contract_abi) {
            let abi = undefined;
            if (IsJsonObject(contract_abi))
                abi = contract_abi;
            else
                abi = JSON.parse(fs.readFileSync(contract_abi, "utf8"));
            assert(abi, "abi is undefined, contract_abi is not well defined");
            abiDecoder.addABI(abi);
        }
        return receipt;
    }
    async _send_call(raw_tx) {
        // console.log("_send_call", raw_tx);
        let receipt = await this.call(raw_tx.to, raw_tx.fun, raw_tx.param);
        return receipt;
    }
    _parse_receipt(receipt) {
        //console.log("events:", JSON.stringify(abiDecoder.decodeLogs(receipt.logs)));
        return abiDecoder.decodeLogs(receipt.logs);
    }
}
module.exports.FiscoFuzzer = FiscoFuzzer;
module.exports.FiscoDeployer = FiscoDeployer;