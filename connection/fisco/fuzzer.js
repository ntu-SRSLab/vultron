const path = require('path');
const Web3jService = require('web3j-api/web3j').Web3jService;
const web3j = new Web3jService();
const Configuration = require('web3j-api/common/configuration').Configuration;

Configuration.setConfig(path.join(__dirname, './config.json'));

const tracer = require('../EVM2Code');
const fs = require('fs');
const locks = require('locks');
// mutex
const mutex = locks.createMutex();
const async = require('async');
const assert = require("assert");
var g_data_feedback = false;

/// contract detail(json)
let g_target_artifact;
// contract abstraction(json)
let g_targetContract;
//
let g_bookKeepingAbi;
let g_cand_sequence;
let g_targetStmt_set;
let g_targetIns_map;
let g_staticDep_target;

/// the gas amount
const gasMax = 8000000000;
/// dynamci array
const dyn_array_min = 1;
const dyn_array_max = 5;
/// the maximum length of seed_callSequence
const sequence_maxLen = 4;

const UserAccount = "0x0x144d5ca47de35194b019b6f11a56028b964585c9";

let g_send_call_set;
let g_send_call_found;

function randomNum(min, max) {
    if (min >= max) {
        return Math.floor(min);
    } else {
        let range = max - min;
        let rand = Math.random();
        let num = min + Math.floor(rand * range);
        return num;
    }
}

function sortNumber(a, b) {
    return a - b;
}

/// generate an account address
/// if it is primitive type, e.g., address, we use the attack contract address
function gen_address(adds_type) {
    /// returns -1, if the value to search for never occurs
    if (adds_type.indexOf('[') == -1) {
        /// primitive type
        let account = g_targetContract.address
        return account;
    } else if (adds_type.indexOf('[]') != -1) {
        /// dynamic array
        let adds_list = [];
        let adds_index = 0;
        let adds_num = randomNum(dyn_array_min, dyn_array_max);
        while (adds_index < adds_num) {
            let account_index = randomNum(0, g_account_list.length);
            let account = g_account_list[account_index];
            adds_list.push(account);
            adds_index += 1;
        }
        return adds_list;
    } else {
        /// static array
        let adds_list = [];
        let left_index = adds_type.indexOf('[');
        let right_index = adds_type.indexOf(']');
        let adds_num = parseInt(adds_type.slice(left_index + 1, right_index), 10);
        let adds_index = 0;
        while (adds_index < adds_num) {
            let account_index = randomNum(0, g_account_list.length);
            let account = g_account_list[account_index];
            adds_list.push(account);
            adds_index += 1;
        }
        return adds_list;
    }
}

/// conver scientific number to string
function uintToString(num) {
    let num_str = "" + num;
    let index = num_str.indexOf("+");
    /// it is a scientific number
    if (index != -1) {
        let result = num_str[0];
        /// donot need BigInt, because it is not very big
        let power_len = parseInt(num_str.slice(index + 1), 10);
        let power_index = 0;
        while (power_index < power_len) {
            /// num_str[index-1:] is 'e+...'
            if ((power_index + 2) < (index - 1)) {
                result += num_str[power_index + 2];
            } else {
                result += '0';
            }
            power_index += 1;
        }
        var big_result = BigInt(result);
        var hex_result = big_result.toString(16);
        var hex_result = "0x" + hex_result;
        return hex_result;
    } else {
        var big_result = BigInt(num_str);
        var hex_result = big_result.toString(16);
        var hex_result = "0x" + hex_result;
        return hex_result;
    }
}

/// generate the maximum uint number
function gen_uintMax(uint_type) {
    /// get rid of uint in e.g., 'uint256'
    let num_left = 4;
    /// maybe it is an array, e,g., 'uint256[]'
    let num_right = uint_type.indexOf('[');
    if (num_right == -1) {
        /// it is primitive unit, not an array
        num_right = uint_type.length;
    }
    /// the number of bytes
    let byte_num;
    if (num_left < num_right) {
        byte_num = parseInt(uint_type.slice(num_left, num_right), 10) / 8;
    } else {
        /// uint is equivelant to uint256
        byte_num = 32;
    }

    let num_str = '0x';
    let byte_index = 0;
    while (byte_index < byte_num) {
        num_str += 'ff';
        byte_index += 1;
    }
    /// don't use BigInt, because it is used in late, BigInt only be used with BigInt
    var unum_max = parseInt(num_str);
    return unum_max;
}

/// generate the maximum int number
function gen_intMax(int_type) {
    /// get rid of int in e.g., 'int256'
    let num_left = 4;
    /// maybe it is an array, e,g., 'uint256[]'
    let num_right = int_type.indexOf('[');
    if (num_right == -1) {
        /// it is primitive int, not an array
        num_right = int_type.length;
    }
    /// the number of bytes
    let byte_num;
    if (num_left < num_right) {
        byte_num = parseInt(int_type.slice(num_left, num_right), 10) / 8;
    } else {
        byte_num = 32;
    }
    /// the first bit is sign (+, -) bit
    let num_str = '0x7f';
    /// start from 1, because the first byte has been appended
    let byte_index = 1;
    while (byte_index < byte_num) {
        num_str += 'ff';
        byte_index += 1;
    }
    /// don't use BigInt, because it is used in late, BigInt only be used with BigInt
    var num_max = parseInt(num_str);
    return num_max;
}

/// generate the maximum int number
function gen_intMin(int_type) {
    /// get rid of uint in e.g., 'uint256'
    let num_left = 4;
    /// maybe it is an array, e,g., 'uint256[]'
    let num_right = int_type.indexOf('[');
    if (num_right == -1) {
        /// it is primitive int, not an array
        num_right = int_type.length;
    }
    /// the number of bytes
    let byte_num;
    if (num_left < num_right) {
        byte_num = parseInt(int_type.slice(num_left, num_right), 10) / 8;
    } else {
        byte_num = 32;
    }

    let num_str = '-0x7f';
    /// start from 1, because the first byte has been appended
    let byte_index = 1;
    while (byte_index < byte_num) {
        num_str += 'ff';
        byte_index += 1;
    }
    /// don't use BigInt, because it is used in late, BigInt only be used with BigInt
    var num_min = parseInt(num_str);
    return num_min;
}

/// generate an singed integer
/// num_min and num_max may not be defined, e.g., undefined
function gen_int(int_type, num_min, num_max) {
    var intMin = gen_intMin(int_type);
    if (num_min === undefined) {
        /// num_min is undefined, we use the default minimum value
        num_min = intMin;
    } else {
        if (intMin > num_max) {
            num_min = intMin;
        }
    }
    var intMax = gen_intMax(int_type);
    if (num_max === undefined) {
        /// num_max is undefined, we use the default maximum value
        num_max = intMax;
    } else {
        if (intMax < num_max) {
            num_max = intMax;
        }
    }
    if (int_type.indexOf('[') == -1) {
        /// primitive type
        let value_int = randomNum(num_min, num_max);
        let value = uintToString(value_int);
        return value;
    } else if (int_type.indexOf('[]') != -1) {
        /// dynamic array
        let value_list = [];
        let value_num = randomNum(dyn_array_min, dyn_array_max);
        let value_index = 0;
        while (value_index < value_num) {
            let value_int = randomNum(num_min, num_max);
            let value = uintToString(value_int);;
            value_list.push(value);
            value_index += 1;
        }
        return value_list;
    } else {
        /// static array
        let value_list = [];
        let left_index = uint_type.indexOf('[');
        let right_index = uint_type.indexOf(']');
        let value_num = parseInt(uint_type.slice(left_index + 1, right_index), 10);
        let value_index = 0;
        while (value_index < value_num) {
            let value_int = randomNum(num_min, num_max);
            let value = uintToString(value_int);
            value_list.push(value);
            value_index += 1;
        }
        return value_list;
    }
}

/// generate an unsigned integer
/// unum_min is defined, in most case it is 0
/// unum_max may not be defined, e.g., undefined
function gen_uint(uint_type, unum_min, unum_max) {
    var uintMax = gen_uintMax(uint_type);
    if (unum_min == undefined) {
        unum_min = uintMax;
    } else {
        if (unum_min < 0) {
            unum_min = 0;
        }
    }
    if (unum_max == undefined) {
        /// unum_max is undefined, we use the default maximum value
        unum_max = uintMax;
    } else {
        if (uintMax < unum_max) {
            unum_max = uintMax;
        }
    }
    if (uint_type.indexOf('[') == -1) {
        /// primitive type
        let value_int = randomNum(unum_min, unum_max);
        let value = uintToString(value_int);
        return value;
    } else if (uint_type.indexOf('[]') != -1) {
        /// dynamic array
        let value_list = [];
        let value_num = randomNum(dyn_array_min, dyn_array_max);
        let value_index = 0;
        while (value_index < value_num) {
            let value_int = randomNum(unum_min, unum_max);
            let value = uintToString(value_int);;
            value_list.push(value);
            value_index += 1;
        }
        return value_list;
    } else {
        /// static array
        let value_list = [];
        let left_index = uint_type.indexOf('[');
        let right_index = uint_type.indexOf(']');
        let value_num = parseInt(uint_type.slice(left_index + 1, right_index), 10);
        let value_index = 0;
        while (value_index < value_num) {
            let value_int = randomNum(unum_min, unum_max);
            let value = uintToString(value_int);
            value_list.push(value);
            value_index += 1;
        }
        return value_list;
    }
}

/// generate the call input
/// unum_min is defined, in most case it is 0
/// unum_max may not be defined, e.g., undefined
async function gen_callInput(abi, unum_min, unum_max, num_min, num_max) {
    let param_list = [];
    await abi.inputs.forEach(function(param) {
        if (param.type.indexOf('address') == 0) {
            let adds_param = gen_address(param.type);
            param_list.push(adds_param);
        } else if (param.type.indexOf('uint') == 0) {
            /// uint type, its minimu is '0'
            let uint_param = gen_uint(param.type, unum_min, unum_max);
            param_list.push(uint_param);
        } else if (param.type.indexOf('int') == 0) {
            /// int type
            let int_param = gen_int(param.type, num_min, num_max);
            param_list.push(int_param);
        } else {
            // default parameter
            console.log(param.type, "not support data type...");
	    let arrayRegex = /\[([0-9]+)\]/;
	    const match = param.type.match(arrayRegex);
	    if (match){
	    	console.log(match);
		let size = match[1];
		let arr = [];
		for(let i=0; i<size; i++)
		    arr.push('0x0');
		param_list.push(arr);
	    }else{
		param_list.push('0x0');
	    }
        }
    });
    return param_list;
}

async function gen_callGasMax() {
    var gas_limit = uintToString(gasMax);
    return gas_limit;
}

/// generate a call function based on the abi
async function gen_callFun(abi_pair) {
    /// the first (0, undefined) for uint
    /// the second (undefined, undefined) for int
    /// 10000000000000000000  is 10 ether
    /// we generate the meaningful value, it would be better
    let parameters = await gen_callInput(abi_pair[0], 0, 10000000000000000000, -10000000, 10000000000000000000);
    let gasLimit = await gen_callGasMax();
    let callFun = {
        /// g_account_list[0] is the initial account, which is also a miner account
        from: UserAccount,
        to: abi_pair[1],
        abi: abi_pair[0],
        gas: gasLimit,
        param: parameters
    }
    return callFun;
}

/// synthesize the initial call sequence
async function seed_callSequence() {
    var call_sequence = [];
    /// the set of call that has been selected
    var added_set = new Set();
    /// for select
    // var sequence_len = g_cand_sequence.length;
    var sequence_len = randomNum(1, sequence_maxLen > g_cand_sequence.length ? g_cand_sequence.length : sequence_maxLen);
    var sequence_index = 0;
    while (sequence_index < sequence_len) {
        /// 0 <= call_index < g_cand_sequence.length
        var abi_index = randomNum(0, g_cand_sequence.length);
        /// we select the function in call_sequence without duplicates
        var abi_index_orig = abi_index;
        while (added_set.has(abi_index)) {
            if (abi_index >= g_cand_sequence.length) {
                break;
            }
            abi_index = abi_index + 1;
        }
        if (abi_index >= g_cand_sequence.length) {
            abi_index = abi_index_orig - 1;
            while (added_set.has(abi_index)) {
                if (abi_index < 0) {
                    break;
                }
                abi_index = abi_index - 1;
            }
        }
        if (abi_index < 0) {
            break;
        }
        let abi_pair = g_cand_sequence[abi_index];
        added_set.add(abi_index);

        let callFun = await gen_callFun(abi_pair);
        call_sequence.push(callFun);

        sequence_index += 1;
    }
    /// we only generate a call sequence
    // console.log(call_sequence);
    return call_sequence;
}

async function seed_callSequence_withoutData() {
    var call_sequence = [];
    /// the set of call that has been selected
    var added_set = new Set();

    /// for select
    // var sequence_len = g_cand_sequence.length;
    var sequence_len = randomNum(1, sequence_maxLen);
    var sequence_index = 0;
    while (sequence_index < sequence_len) {
        /// 0 <= call_index < g_cand_sequence.length
        var abi_index = randomNum(0, g_cand_sequence.length);
        /// we select the function in call_sequence without duplicates
        var abi_index_orig = abi_index;
        while (added_set.has(abi_index)) {
            if (abi_index >= g_cand_sequence.length) {
                break;
            }
            abi_index = abi_index + 1;
        }
        if (abi_index >= g_cand_sequence.length) {
            abi_index = abi_index_orig - 1;
            while (added_set.has(abi_index)) {
                if (abi_index < 0) {
                    break;
                }
                abi_index = abi_index - 1;
            }
        }
        if (abi_index < 0) {
            break;
        }
        var abi_pair = g_cand_sequence[abi_index];
        added_set.add(abi_index);
        var callFun = await gen_callFun_withoutData(abi_pair);
        call_sequence.push(callFun);

        sequence_index += 1;
    }
    /// we only generate a call sequence
    // console.log(call_sequence);
    return call_sequence;
}

/// add all the functions into the g_cand_sequence, then use g_cand_sequence to generate the call sequence
async function findCandSequence(target_abis, attack_abis) {
    let cand_sequence = [];
    if (attack_abis) {
        await attack_abis.forEach(function(abi) {
            if (abi.type === 'function' && abi.constant == false) {
                let notsupport = false;

                let input_index = 0;
                let input_len = abi.inputs.length;
                while (input_index < input_len) {
                    var input = abi.inputs[input_index];
                    /// at present, we only support the types of "address", "uint*", and "int*"
                    if (input.type.indexOf('address') !== 0 && input.type.indexOf('uint') !== 0 && input.type.indexOf('int') !== 0) {
                        notsupport = true;
                        break;
                    }
                    input_index += 1;
                }
                /// change to all functions, because we use 0 as parameters
                if (!notsupport || notsupport) {
                    if (abi.name.indexOf("terminate") == -1) {
                        var abi_pair = [abi, g_attackContract.address]
                        cand_sequence.push(abi_pair);
                    }
                }
            }
        });
    }

    if (target_abis) {
        await target_abis.forEach(function(abi) {
            /// if abi.constant is true, it would not change state variables
            /// thus, it may not be a transaction if we call it
            if (abi.type === 'function' && abi.constant == false) {
                let notsupport = false;

                let input_len = abi.inputs.length;
                let input_index = 0;
                while (input_index < input_len) {
                    let input = abi.inputs[input_index];
                    /// at present, we only support the types of "address", "uint*", and "int*"
                    if (input.type.indexOf('address') !== 0 && input.type.indexOf('uint') !== 0 && input.type.indexOf('int') !== 0) {
                        notsupport = true;
                        break;
                    }
                    input_index += 1;
                }
                /// change to all functions, because we use 0 as parameters
                if (!notsupport || notsupport) {
                    if (abi.name.indexOf("terminate") == -1) {
                        let abi_pair = [abi, g_targetContract.address]
                        cand_sequence.push(abi_pair);
                    }
                }
            }
        });
    }
    return cand_sequence;
}

function types(inputs) {
    let input_types = [];
    for (let input of inputs)
        input_types.push(input.type);
    return input_types.join();
}


function write2file(file, content) {
    fs.writeFile(file, content, function(err) {
        if (err) throw err;
        console.log(file + ' Saved!');
    });
}

function readJSON(file) {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
}
class FiscoFuzzer extends Web3jService {
    constructor(seed, contract_name, outputdir) {
        super();
        if (!outputdir)
            this.outputdir = "./deployed_contract";
        this.contract_name = contract_name;
        this.seed = seed;
        this.loadContract = false;
        this.bootstrapContract = false;
        this.fuzzContract = false;
        this.g_callsequence_list = [];
        this.cursor = 0;
    }

    resetConfig() {
        super.resetConfig();
    }
    // @target_artifact_path 
    // @target_instance_path
    // @targetSolPath
    async load(target_artifact_path, target_instance_path, targetSolPath) {
        let instances = await this.get_instance(target_instance_path);
        g_targetContract = instances[0];
        //	console.log(g_targetContract);
        g_target_artifact = readJSON(target_artifact_path);
        g_cand_sequence = await findCandSequence(g_targetContract.abi);
        g_targetStmt_set = await tracer.buildStmtSet(g_target_artifact.sourcePath,
            g_target_artifact.srcmapRuntime,
            g_target_artifact.source);
        g_targetIns_map = await tracer.buildInsMap(g_target_artifact.sourcePath,
            g_target_artifact.runtimeBytecode,
            g_target_artifact.srcmapRuntime,
            g_target_artifact.source);
        g_staticDep_target = await tracer.buildStaticDep(targetSolPath);
        g_send_call_set = await tracer.buildMoneySet(targetSolPath);
        g_send_call_found = await tracer.buildRelevantDepen(g_staticDep_target, g_send_call_set);
        // console.log(g_targetIns_map);
        //	console.log(g_staticDep_target);
        //	console.log(g_send_call_set);
        //	console.log(g_send_call_found);
        this.loadContract = true;
        let ret = {
            target_adds: g_targetContract.address,
            target_abi: g_targetContract.abi
        };
        console.log(ret);
        return ret;
    }
    async test() {
        this.getBlockNumber().then((res) => {
            console.log(res);
        }).catch((e) => {
            console.log(e);
        });
        return true;
    }
    async get_instance(contract_path) {
        let contract_file_name = contract_path.split("/")[contract_path.split("/").length - 1];
        this.contract_name = contract_file_name.split(".")[0];
        let path = this.outputdir + "/" + this.contract_name;
        let instances = [];
        if (fs.existsSync(path)) {
            console.log(this.contract_name + " has been deployed before");
            const dir = await fs.promises.opendir(path);
            let addresses = [];
            let abi = undefined;
            for await (const dirent of dir) {
                if (dirent.name.search("0x") != -1) {
                    addresses.push(dirent.name);
                } else if (dirent.name.search(".sw") == -1 && dirent.name.search(".abi") != -1) {
                    console.log(dirent.name);
                    abi = JSON.parse(fs.readFileSync(path + "/" + dirent.name, "utf8"));
                }
            }
            console.log(addresses);
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
        //     console.log(instance);
        write2file(this.outputdir + "/" + this.contract_name + "/" + instance.contractAddress, JSON.stringify(instance));
        return instance.contractAddress;
    }
    async deploy_contract_precompiled(contract_path, compiled_dir) {
        let contract_file_name = contract_path.split("/")[contract_path.split("/").length - 1];
        this.contract_name = contract_file_name.split(".")[0];
        let instance = await this.deploy_precompiled(contract_path, compiled_dir);
        //    console.log(instance);
        if (!fs.existsSync(this.outputdir + "/" + this.contract_name))
            fs.mkdirSync(this.outputdir + "/" + this.contract_name);
        write2file(this.outputdir + "/" + this.contract_name + "/" + instance.contractAddress, JSON.stringify(instance));
        return instance.contractAddress;
    }
    async deploy_contract_precompiled_params(contract_path, compiled_dir, func, params) {
        let contract_file_name = contract_path.split("/")[contract_path.split("/").length - 1];
        this.contract_name = contract_file_name.split(".")[0];
        let instance = await this.deploy_precompiled_params(contract_path, compiled_dir, func, params);
        //   console.log(instance);
        if (!fs.existsSync(this.outputdir + "/" + this.contract_name))
            fs.mkdirSync(this.outputdir + "/" + this.contract_name);
        write2file(this.outputdir + "/" + this.contract_name + "/" + instance.contractAddress, JSON.stringify(instance));

        return instance.contractAddress;
    }
    async call_contract(contract_path, function_name, argv) {
        let contract_file_name = contract_path.split("/")[contract_path.split("/").length - 1];
        this.contract_name = contract_file_name.split(".")[0];
        let path = this.outputdir + "/" + this.contract_name;
        let answer = "";
        if (fs.existsSync(path)) {
            console.log(this.contract_name + " has been deployed before");
            const dir = await fs.promises.opendir(path);
            console.log(dir);
            for await (const dirent of dir) {
                if (dirent.name.search("0x") != -1) {
                    console.log("address:" + dirent.name);
                    answer += dirent.name + ";";
                    let ret;
                    console.log(dirent.name, function_name, argv);
                    if (argv == null || argv == undefined) {
                        console.log("argv is null or undefined");
                        ret = await this.sendRawTransaction(dirent.name, function_name, "");
                        console.log(ret);
                    } else {
                        console.log(argv);
                        ret = await this.sendRawTransaction(dirent.name, function_name, argv);
                        console.log(ret);
                    }
                    console.log("hello call contract");
                    answer += JSON.stringify(ret) + "\n</br>";
                    console.log(answer);
                } else {
                    console.log(dirent.name);
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
    resetseed(seed) {
        this.seed = seed;
    }
    async exec_sequence_call() {
        let callFun_list = this.g_callsequence_list[this.cursor];
        this.cursor = +1;
        for (let fun of callFun_list) {
	    console.log(fun);
	    console.log(fun.abi.name + "(" + types(fun.abi.inputs) + ")");
            let receipt = await this.sendRawTransaction(fun.to, fun.abi.name + "(" + types(fun.abi.inputs) + ")", 
			fun.param);
            console.log(fun, receipt);
        }
    }
    // initiate a transaction to target contract
    async bootstrap() {
        assert(this.loadContract == true, "function load(...) must be called before");

        // we only generate a call sequence
        let callFun_list;
        callFun_list = await seed_callSequence();
        console.log(callFun_list);
        // Execute the seed call sequence

        try {
            /// the call sequence to be executed
            this.g_callsequence_list.push(callFun_list);
            await this.exec_sequence_call();
        } catch (e) {
            console.log(e);
        }
        this.bootstrapContract = true;
        let execResult_list = "successful!";
        return {
            callFuns: callFun_list,
            execResults: execResult_list
        };
    }

    // based on feedback to fuzz later
    async fuzz(contract) {
        let abi = contract.abi;
        let funs = select_funs(abi);
        for (let fun of funs) {
            await fuzz_fun(contract, fun);
        }
    }
    promise_callback(msg) {
        // handle aync return
    }
    callback(feedback) {
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
let fuzzer = new FiscoFuzzer(0, "CreditController");
async function test() {
    await fuzzer.test();
    await fuzzer.load("/home/liuye/Webank/vultron/deployed_contract/CreditController/CreditController.artifact",
        "/home/liuye/Webank/vultron/deployed_contract/CreditController",
        "/home/liuye/Webank/vultron/Vultron-Fisco/fisco/wecredit/CreditController.sol");

    await fuzzer.bootstrap();
}

test().then(() => {
            console.log("success");
            })
        .catch((e) => {
            console.log(e);
            console.trace();
        });
