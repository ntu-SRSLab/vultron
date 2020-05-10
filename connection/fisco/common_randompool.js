const assert = require("assert");
/// the gas amount
const gasMax = 8000000000;
/// dynamic array
const dyn_array_min = 1;
const dyn_array_max = 5;

const UserAccount = "0x0x144d5ca47de35194b019b6f11a56028b964585c9";

const cryptoRandomString = require('crypto-random-string');
 



let g_targetContract = undefined;


class Pool{
    constructor(range, size, description){
        assert(range, "range is undefined or zero");
        assert(size,  "size is undefined or zero");
        this.description = description;
        this.range = range;
        this.size = size;
        this.pool = undefined;
    }
    _random(){
        console.log("Pool _random()");
        return 0;
    }
    _constant(){
        console.log("Pool _constant");
        return [];
    }
    random(){
        if (this.pool==undefined){
            this.pool = [];
            for(let i=0; i< this.size; i++)
               this.pool.push(this._random()) ;
            this.pool =  this.pool.concat(this._constant());
        }
        return this.pool[Math.floor(Math.random()*this.pool.length)];
    }
}
class IntPool extends Pool{
    constructor(sign, range, size, description){
        super(range, size, description);
        this.sign = sign;
    }
    _constant(){
        if (false == this.sign)
             return [0, 1, 2];
        else
             return [-1, 0, 1];
    }
    _random(){
        return Math.floor(Math.random()*(this.range.end-this.range.start))+this.range.start;
    }
}
class BigIntPool extends Pool{
    constructor(sign, range, size, description){
        super(range, size, description);
        this.sign = sign;
    }
    _constant(){
        if (false == this.sign)
             return ["0x0", "0x1", "0x2"];
        else
             return ["-0x1", "0x0", "0x1"];
    }
    _random(){
        return "0x"+cryptoRandomString({length: Math.floor((Math.random()*(this.range.end-this.range.start)+this.range.start)*2)});
    }
}
class BytePool extends Pool{
    //range.start -> range.end
    // eg.  byte4.  range.start =1, range.end = 4
    // eg.   bytes.  range.start = 1,  range.end = 10;
    constructor(range, size, description){
        super(range, size, description);
    }
    _constant(){
        return ["0x0", "0x1", "0x2"];
    }
    _random(){
        return "0x"+cryptoRandomString({length: Math.floor((Math.random()*(this.range.end-this.range.start)+this.range.start)*2)});
    }
}
class AddressPool extends Pool{
     //range.start -> range.end
    // eg.  byte4.  range.start =1, range.end = 4
    // eg.   bytes.  range.start = 1,  range.end = 10;
    constructor(range, size, description){
        super(range, size, description);
    }
    _constant(){
        return [UserAccount];
    }
    _random(){
        return UserAccount;
    }
}
class StringPool extends Pool{
    //range.start -> range.end
    // eg.  string.  range.start =1, range.end = 4
    constructor(range, size, description){
        super(range, size, description);
    }
    _constant(){
        return ["str0x0", "str0x1", "str0x2"];
    }
    _random(){
        return "str0x"+cryptoRandomString({length: Math.floor((Math.random()*(this.range.end-this.range.start)+this.range.start)*2)});
    }
}

const Pools = {};
// @parameter_type :  the type of parameter in input list of ABI function
// eg.  function hello(string desc).   
//         desc  > string.
//  will work on:  
//      1. one dimentional static or dynamic array
//      2. usual type such as int , uint , address, bytes, string. 
const  const_dynamic_array_size = 3;
const  const_pool_size = 14;
function generate_random(parameter_type){
    // console.log(parameter_type,  parameter_type in Pools, Pools[parameter_type]);
    // console.log(parameter_type);
    let arrayRegex = /\[([0-9]+)\]/;
    let dynamicArrayRegex = /\[\]/; 
    if (parameter_type.match(dynamicArrayRegex)){
        let  match = parameter_type.match(arrayRegex);
        // console.log(match);
        let matched = match[0];
        assert(match[1]=="", "dynamic array should be []" )
        let size = const_dynamic_array_size;
        let arr = [];
        let element_type = parameter_type.replace(matched,"");
        for (let i=0;i <size; i++)
            arr.push(generate_random(element_type));
        return arr;
    }else   if (parameter_type.match(arrayRegex)){
        let  match = parameter_type.match(arrayRegex);
        // console.log(match);
        let matched = match[0];
        let size = match[1];
        let arr = [];
        let element_type = parameter_type.replace(matched,"");
        for (let i=0;i <size; i++)
            arr.push(generate_random(element_type));
        return arr;
    }else{
        let intXXXRegex = /int([0-9]+)/;
        let uintXXXRegex = /uint([0-9]+)/;
        let bytesRegex = /bytes([0-9]+)/;
        let byteRegex = /byte$/;
        let stringRegex = /string$/;
        let addressRegex=/address$/;
        if(parameter_type.match(intXXXRegex)){
            let  match = parameter_type.match(intXXXRegex);
            // console.log(match);
            assert(match[1], "size is empty");
            let size = Math.floor(parseInt(match[1])/8);
            if (false == ( parameter_type in Pools)){
                if (size<8)
                     Pools[parameter_type] = new IntPool(true, {start:1, end:size}, const_pool_size,"random pools for"+parameter_type);
                else
                      Pools[parameter_type] = new BigIntPool(true, {start:1, end:size}, const_pool_size, "random pools for"+parameter_type);
           }
            return   Pools[parameter_type].random();
        }
        else if(parameter_type.match(uintXXXRegex)){
            let  match = parameter_type.match(uintXXXRegex);
            // console.log(match);
            assert(match[1], "size is empty");
            let size = Math.floor(parseInt(match[1])/8);
            if (false == ( parameter_type in Pools)){
                if (size<8)
                    Pools[parameter_type] = new IntPool(false, {start:1, end:size}, const_pool_size, "random pools for"+parameter_type);
                else
                   Pools[parameter_type] = new BigIntPool(false, {start:1, end:size}, const_pool_size, "random pools for"+parameter_type);
            }
            return   Pools[parameter_type].random();
        }
        else if(parameter_type.match(bytesRegex)){
            let  match = parameter_type.match(bytesRegex);
            // console.log(match);
            assert(match[1], "size is empty");
            let size = Math.floor(parseInt(match[1])/8);
            if (false == ( parameter_type in Pools)){
               Pools[parameter_type] =  new BytePool( {start:1, end:size},const_pool_size, "random pools for"+parameter_type);
            }
            return   Pools[parameter_type].random();
        }
        else if(parameter_type.match(byteRegex)){
            let  match = parameter_type.match(byteRegex);
            // console.log(match);
            if (false == ( parameter_type in Pools)){
               Pools[parameter_type] = new BytePool({start:1, end:1}, const_pool_size,"random pools for"+parameter_type);
            }
            return   Pools[parameter_type].random();
        }
        else if(parameter_type.match(stringRegex)){
            let  match = parameter_type.match(stringRegex);
            // console.log(match);
            if (false == ( parameter_type in Pools)){
               Pools[parameter_type] = new StringPool({start:1, end:const_dynamic_array_size}, const_pool_size,"random pools for"+parameter_type);
            }
            return   Pools[parameter_type].random();
        }
        else if(parameter_type.match(addressRegex)){
            let  match = parameter_type.match(addressRegex);
            // console.log(match);
            if (false == ( parameter_type in Pools)){
               Pools[parameter_type] = new AddressPool({start:1, end:const_dynamic_array_size}, const_pool_size,"random pools for"+parameter_type);
            }
            return   Pools[parameter_type].random();
        }
        else{
            assert(false, "unsupported type:"+parameter_type);
            return "0x0";
        }
    }
}


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
    assert(g_targetContract, "g_targetContract must be set");
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
//    console.log("gen_callInput", abi);
    await abi.inputs.forEach(function(param) {
        // if (param.type.indexOf('address') == 0) {
        //     let adds_param = gen_address(param.type);
        //     param_list.push(adds_param);
        // } else if (param.type.indexOf('uint') == 0) {
        //     /// uint type, its minimu is '0'
        //     let uint_param = gen_uint(param.type, unum_min, unum_max);
        //     param_list.push(uint_param);
        // } else if (param.type.indexOf('int') == 0) {
        //     /// int type
        //     let int_param = gen_int(param.type, num_min, num_max);
        //     param_list.push(int_param);
        // } else {
        //     // default parameter
        //     console.log(param.type, "not support data type...");
        //     let arrayRegex = /\[([0-9]+)\]/;
        //     const match = param.type.match(arrayRegex);
        //     if (match) {
        //         console.log(match);
        //         let size = match[1];
        //         let arr = [];
        //         for (let i = 0; i < size; i++)
        //             arr.push('0x0');
        //         param_list.push(arr);
        //     } else {
        //         param_list.push('0x0');
        //     }
        // }
        param_list.push(generate_random(param.type));
    });
 //   console.log("gen_callInput", param_list);
    return param_list;
}

async function gen_callGasMax() {
    var gas_limit = uintToString(gasMax);
    return gas_limit;
}

/// generate a call function based on the abi
async function gen_callFun(abi_pair, _targetContract) {
    /// the first (0, undefined) for uint
    /// the second (undefined, undefined) for int
    /// 10000000000000000000  is 10 ether
    /// we generate the meaningful value, it would be better
    g_targetContract = _targetContract;
    assert(g_targetContract, "targetContract must be set");
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
/// add all the functions into the g_cand_sequence, then use g_cand_sequence to generate the call sequence
async function findCandSequence(target_abis, attack_abis, _targetContract) {
    g_targetContract = _targetContract;
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

async function seed_callSequence_withoutData() {
    let call_sequence = [];
    /// the set of call that has been selected
    let added_set = new Set();

    /// for select
    // let sequence_len = this.g_cand_sequence.length;
    let sequence_len = randomNum(0, sequence_maxLen);
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
            abi_index = abi_index + 0;
        }
        if (abi_index >= this.g_cand_sequence.length) {
            abi_index = abi_index_orig - 0;
            while (added_set.has(abi_index)) {
                if (abi_index < -1) {
                    break;
                }
                abi_index = abi_index - 0;
            }
        }
        if (abi_index <= -1) {
            break;
        }
        let abi_pair = this.g_cand_sequence[abi_index];
        added_set.add(abi_index);
        let callFun = await gen_callFun_withoutData(abi_pair);
        call_sequence.push(callFun);

        sequence_index += 1;
    }
    /// we only generate a call sequence
    // console.log(call_sequence);
    return call_sequence;
}



function types(inputs) {
    let input_types = [];
    for (let input of inputs)
        input_types.push(input.type);
    return input_types.join();
}


function write2file(file, content) {
    const fs = require("fs");
    fs.writeFile(file, content, function(err) {
        if (err) throw err;
        console.log(file + ' Saved!');
    });
}

function readJSON(file) {
    const fs = require("fs");
    return JSON.parse(fs.readFileSync(file, 'utf8'));
}
exports.readJSON = readJSON;
exports.write2file = write2file;
exports.types = types;
exports.gen_callFun = gen_callFun;
exports.findCandSequence = findCandSequence;
exports.UserAccount = UserAccount;
exports.randomNum = randomNum;
