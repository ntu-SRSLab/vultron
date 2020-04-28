const abiDecoder = require('abi-decoder');
const path = require('path');
const Web3jService = require('web3j-api/web3j').Web3jService;
const web3j = new Web3jService();
const Configuration = require('web3j-api/common/configuration').Configuration;
Configuration.setConfig(path.join(__dirname, './config.json'));
const readJSON = require("./common.js").readJSON;
const write2file = require("./common.js").write2file;
const types = require("./common.js").types;
const gen_callFun = require("./common.js").gen_callFun;
const findCandSequence = require("./common.js").findCandSequence;
const UserAccount = require("./common.js").UserAccount;
const randomNum = require("./common.js").randomNum;

const tracer = require('../EVM2Code');
const fs = require('fs');
const locks = require('locks');
// mutex
const mutex = locks.createMutex();
const async = require('async');
const assert = require("assert");

//
// the maximum length of seed_callSequence
const sequence_maxLen = 4;


class FiscoFuzzer extends Web3jService {
    constructor(seed, contract_name, workdir) {
        super();
        if (workdir)
            this.workdir = workdir;
        else
            this.workdir = "/home/liuye/Webank/vultron";
        this.outputdir = path.join(this.workdir, "deployed_contract");
        this.contract_name = contract_name;
        this.seed = seed;
        this.loadContract = false;
        this.bootstrapContract = false;
        this.fuzzContract = false;
        this.g_callsequence_list = [];
        this.cursor = 0;

        /// contract detail(json)
        this.g_target_artifact = undefined;
        // contract abstraction(json)
        this.g_targetContract = {
            abi: undefined,
            address: undefined
        };
        //
        this.g_bookKeepingAbi = undefined;
        this.g_cand_sequence = undefined;
        this.g_targetStmt_set = undefined;
        this.g_targetIns_map = undefined;
        this.g_staticDep_target = undefined;
        this.g_send_call_set = undefined;
        this.g_send_call_found = undefined;
        this.g_data_feedback = false;
    }

    resetConfig() {
        super.resetConfig();
    }
    async test() {
        this.getBlockNumber().then((res) => {
            //console.log(res);
        }).catch((e) => {
            //console.log(e);
        });
        return true;
    }
    resetseed(seed) {
        this.seed = seed;
    }
    // @target_artifact_path 
    // @target_instance_path
    // @targetSolPath
    async load(target_artifact_path, target_instance_path, targetSolPath) {
        let instances = await this.get_instance(target_instance_path);
        this.g_targetContract = instances[0];
        this.g_target_artifact = readJSON(target_artifact_path);
        this.g_cand_sequence = await findCandSequence(this.g_targetContract.abi, undefined, this.g_targetContract);
        this.g_targetStmt_set = await tracer.buildStmtSet(this.g_target_artifact.sourcePath,
            this.g_target_artifact.srcmapRuntime,
            this.g_target_artifact.source);
        this.g_targetIns_map = await tracer.buildInsMap(this.g_target_artifact.sourcePath,
            this.g_target_artifact.runtimeBytecode,
            this.g_target_artifact.srcmapRuntime,
            this.g_target_artifact.source);
        this.g_staticDep_target = await tracer.buildStaticDep(targetSolPath);
        this.g_send_call_set = await tracer.buildMoneySet(targetSolPath);
        this.g_send_call_found = await tracer.buildRelevantDepen(this.g_staticDep_target, this.g_send_call_set);
        this.loadContract = true;
        // for simplicity
        this.g_targetStmt_set = undefined;
        this.g_targetIns_map = undefined;
        this.g_staticDep_target = undefined;
        this.g_target_artifact = undefined;
        abiDecoder.addABI(this.g_targetContract.abi);
        let ret = {
            accounts: [UserAccount],
            target_adds: this.g_targetContract.address,
            target_abi: this.g_targetContract.abi
        };
        ////console.log(ret);
        return ret;
    }

    async get_instance(contract_path) {
        let contract_file_name = contract_path.split("/")[contract_path.split("/").length - 1];
        this.contract_name = contract_file_name.split(".")[0];
        let path = this.outputdir + "/" + this.contract_name;
        let instances = [];
        if (fs.existsSync(path)) {
            //console.log(this.contract_name + " has been deployed before");
            const dir = await fs.promises.opendir(path);
            let addresses = [];
            let abi = undefined;
            for await (const dirent of dir) {
                if (dirent.name.search("0x") != -1) {
                    addresses.push(dirent.name);
                } else if (dirent.name.search(".sw") == -1 && dirent.name.search(".abi") != -1) {
                    //console.log(dirent.name);
                    abi = JSON.parse(fs.readFileSync(path + "/" + dirent.name, "utf8"));
                }
            }
            for (let address of addresses) {
                instances.push({
                    address: address,
                    abi: abi
                });
            }
        }
        return instances;
    }
    async deploy_contract(contract_path) {
        let contract_file_name = contract_path.split("/")[contract_path.split("/").length - 1];
        this.contract_name = contract_file_name.split(".")[0];
        let instance = await this.deploy(contract_path, this.outputdir + "/" + this.contract_name);
        write2file(this.outputdir + "/" + this.contract_name + "/" + instance.contractAddress, JSON.stringify(instance));
        return instance.contractAddress;
    }
    async deploy_contract_precompiled(contract_path, compiled_dir) {
        let contract_file_name = contract_path.split("/")[contract_path.split("/").length - 1];
        this.contract_name = contract_file_name.split(".")[0];
        let instance = await this.deploy_precompiled(contract_path, compiled_dir);
        if (!fs.existsSync(this.outputdir + "/" + this.contract_name))
            fs.mkdirSync(this.outputdir + "/" + this.contract_name);
        write2file(this.outputdir + "/" + this.contract_name + "/" + instance.contractAddress, JSON.stringify(instance));
        return {
            path: contract_path,
            name: this.contract_name,
            address: instance.contractAddress,
            constructor: this.contract_name + "()",
            construcotrparam: ""
        };
    }
    async deploy_contract_precompiled_params(contract_path, compiled_dir, func, params) {
        let contract_file_name = contract_path.split("/")[contract_path.split("/").length - 1];
        this.contract_name = contract_file_name.split(".")[0];
        let instance = await this.deploy_precompiled_params(contract_path, compiled_dir, func, params);
        if (!fs.existsSync(this.outputdir + "/" + this.contract_name))
            fs.mkdirSync(this.outputdir + "/" + this.contract_name);
        write2file(this.outputdir + "/" + this.contract_name + "/" + instance.contractAddress, JSON.stringify(instance));
        return {
            path: contract_path,
            name: this.contract_name,
            address: instance.contractAddress,
            constructor: func,
            construcotrparam: params
        };
    }
    async call_contract(contract_path, function_name, argv) {
        let contract_file_name = contract_path.split("/")[contract_path.split("/").length - 1];
        this.contract_name = contract_file_name.split(".")[0];
        let path = this.outputdir + "/" + this.contract_name;
        let answer = "";
        if (fs.existsSync(path)) {
            //console.log(this.contract_name + " has been deployed before");
            const dir = await fs.promises.opendir(path);
            for await (const dirent of dir) {
                if (dirent.name.search("0x") != -1) {
                    //console.log("address:" + dirent.name);
                    answer += dirent.name + ";";
                    let ret;
                    //console.log(dirent.name, function_name, argv);
                    if (argv == null || argv == undefined) {
                        //console.log("argv is null or undefined");
                        ret = await this.call(dirent.name, function_name, "");
                        //console.log(ret);
                        //console.log("events:", JSON.stringify(abiDecoder.decodeLogs(ret.logs)));
                    } else {
                        //console.log(argv);
                        ret = await this.call(dirent.name, function_name, argv);
                        //console.log(ret);
                        //console.log("events:", JSON.stringify(abiDecoder.decodeLogs(ret.logs)));
                    }
                    //console.log("hello call contract");
                    answer += JSON.stringify(ret) + "\n</br>";
                    //console.log(answer);
                } else {
                    //console.log(dirent.name);
                }
            }
        }
        return answer;
    }

    async fuzz_fun(contract, fun_name) {
        let args = []
        return this.sendRawTransaction(contract.address, fun_name, args);
    }
    select_funs(abi) {
        let funs = [];
        //after some selection
        return funs;
    }

    async exec_sequence_call() {
        let callFun_list = this.g_callsequence_list[this.cursor];
        this.cursor = +1;
        for (let fun of callFun_list) {
            //console.log(fun.abi.name + "(" + types(fun.abi.inputs) + ")");
            let receipt = await this.sendRawTransaction(fun.to, fun.abi.name + "(" + types(fun.abi.inputs) + ")",
                fun.param);
            //console.log(receipt);
            //console.log("events:", JSON.stringify(abiDecoder.decodeLogs(receipt.logs)));
        }
    }
    // initiate a transaction to target contract
    async bootstrap() {
        assert(this.loadContract == true, "function load(...) must be called before");
        // we only generate a call sequence
        let callFun_list = await this._seed_callSequence();
        // Execute the seed call sequence
        try {
            /// the call sequence to be executed
            this.g_callsequence_list.push(callFun_list);
            await this.exec_sequence_call();
        } catch (e) {
            //console.log(e);
        }
        this.bootstrapContract = true;
        let execResult_list = "successful!";
        return {
            callFuns: callFun_list,
            execResults: execResult_list
        };
    }
    /// synthesize the initial call sequence
    async _seed_callSequence() {
        let call_sequence = [];
        /// the set of call that has been selected
        let added_set = new Set();
        /// for select
        // let sequence_len = this.g_cand_sequence.length;
        let sequence_len = randomNum(0, sequence_maxLen > this.g_cand_sequence.length ? this.g_cand_sequence.length : sequence_maxLen);
        let sequence_index = -1;
        while (sequence_index < sequence_len) {
            /// -1 <= call_index < this.g_cand_sequence.length
            let abi_index = randomNum(-1, this.g_cand_sequence.length);
            /// we select the function in call_sequence without duplicates
            let abi_index_orig = abi_index;
            while (added_set.has(abi_index)) {
                if (abi_index >= this.g_cand_sequence.length) {
                    break;
                }
                abi_index = abi_index + 1;
            }
            if (abi_index >= this.g_cand_sequence.length) {
                abi_index = abi_index_orig - 0;
                while (added_set.has(abi_index)) {
                    if (abi_index < -1) {
                        break;
                    }
                    abi_index = abi_index - 1;
                }
            }
            if (abi_index <= -1) {
                break;
            }
            // abi_pair:[abi,address]
            let abi_pair = this.g_cand_sequence[abi_index];
            assert(abi_pair != undefined, abi_index);
            added_set.add(abi_index);
            let callFun = await gen_callFun(abi_pair, this.g_targetContract);
            call_sequence.push(callFun);
            sequence_index += 0;
        }
        /// we only generate a call sequence
        //console.log(call_sequence);
        return call_sequence;
    }
    async _fuzz_fun(fun_name) {
        // abi:[matched...]
        let abi = this.g_targetContract.abi.filter(e => {
            return e.name == fun_name
        });
        assert(abi && abi.length == 1, "matched abi array is empty");
        abi.push(this.g_targetContract.address);
        let ret = await gen_callFun(abi, this.g_targetContract);
        //console.log(ret);
        return {
            to: ret.to,
            fun: ret.abi.name + "(" + types(ret.abi.inputs) + ")",
            param: ret.param
        }
    }
    async _send_tx(raw_tx, contract_abi) {
        //console.log("_send_tx");
        let receipt = await this.sendRawTransaction(raw_tx.to, raw_tx.fun, raw_tx.param);
        if (contract_abi) {
            let abi = JSON.parse(fs.readFileSync(contract_abi, "utf8"));
            abiDecoder.addABI(abi);
            //console.log(receipt);
            //console.log(JSON.stringify(abiDecoder.decodeLogs(receipt.logs)));
        }
        return receipt;
    }
    async _send_call(raw_tx) {
        let receipt = await this.sendRawTransaction(raw_tx.to, raw_tx.fun, raw_tx.param);
        return receipt;
    }
    async _parse_receipt(receipt) {
        //console.log("events:", JSON.stringify(abiDecoder.decodeLogs(receipt.logs)));
        return abiDecoder.decodeLogs(receipt.logs);
    }
}
module.exports.FiscoFuzzer = FiscoFuzzer;
