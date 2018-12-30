var fs = require('fs');
var getLineFromPos = require('get-line-from-pos');

var separator_set = new Set();
separator_set.add("JUMP");
separator_set.add("JUMPI");
separator_set.add("RETURN");
separator_set.add("STOP");
separator_set.add("REVERT");
separator_set.add("CALL");
separator_set.add("CALLCODE");
separator_set.add("DELEGATECALL");
separator_set.add("STATICCALL");

var STOP =0x0,
    ADD =0x1,
    MUL =0x2,
    SUB =0x3,
    DIV =0x4,
    SDIV =0x5,
    MOD =0x6,
    SMOD =0x7,
    ADDMOD =0x8,
    MULMOD =0x9,
    EXP =0xa,
    SIGNEXTEND =0xb,

    LT =0x10,
    GT =0x11,
    SLT =0x12,
    SGT =0x13,
    EQ =0x14,
    ISZERO =0x15,
    AND =0x16,
    OR =0x17,
    XOR =0x18,
    NOT =0x19,
    BYTE =0x1a,
    SHL =0x1b,
    SHR =0x1c,
    SAR =0x1d,

    SHA3 = 0x20,

    ADDRESS =0x30,
    BALANCE =0x31,
    ORIGIN =0x32,
    CALLER =0x33,
    CALLVALUE =0x34,
    CALLDATALOAD =0x35,
    CALLDATASIZE =0x36,
    CALLDATACOPY =0x37,
    CODESIZE =0x38,
    CODECOPY =0x39,
    GASPRICE =0x3a,
    EXTCODESIZE =0x3b,
    EXTCODECOPY =0x3c,
    RETURNDATASIZE =0x3d,
    RETURNDATACOPY =0x3e,
    EXTCODEHASH =0x3f,

    BLOCKHASH =0x40,
    COINBASE =0x41,
    TIMESTAMP =0x42,
    NUMBER =0x43,
    DIFFICULTY =0x44,
    GASLIMIT =0x45,

    POP =0x50,
    MLOAD =0x51,
    MSTORE =0x52,
    MSTORE8 =0x53,
    SLOAD =0x54,
    SSTORE =0x55,
    JUMP =0x56,
    JUMPI =0x57,
    PC =0x58,
    MSIZE =0x59,
    GAS =0x5a,
    JUMPDEST =0x5b,

    PUSH1 =0x60,
    PUSH2 =0x61,
    PUSH3 =0x62,
    PUSH4 =0x63,
    PUSH5 =0x64,
    PUSH6 =0x65,
    PUSH7 =0x66,
    PUSH8 =0x67,
    PUSH9 =0x68,
    PUSH10 =0x69,
    PUSH11 =0x6a,
    PUSH12 =0x6b,
    PUSH13 =0x6c,
    PUSH14 =0x6d,
    PUSH15 =0x6e,
    PUSH16 =0x6f,
    PUSH17 =0x70,
    PUSH18 =0x71,
    PUSH19 =0x72,
    PUSH20 =0x73,
    PUSH21 =0x74,
    PUSH22 =0x75,
    PUSH23 =0x76,
    PUSH24 =0x77,
    PUSH25 =0x78,
    PUSH26 =0x79,
    PUSH27 =0x7a,
    PUSH28 =0x7b,
    PUSH29 =0x7c,
    PUSH30 =0x7d,
    PUSH31 =0x7e,
    PUSH32 =0x7f,
    DUP1 =0x80,
    DUP2 =0x81,
    DUP3 =0x82,
    DUP4 =0x83,
    DUP5 =0x84,
    DUP6 =0x85,
    DUP7 =0x86,
    DUP8 =0x87,
    DUP9 =0x88,
    DUP10 =0x89,
    DUP11 =0x8a,
    DUP12 =0x8b,
    DUP13 =0x8c,
    DUP14 =0x8d,
    DUP15 =0x8e,
    DUP16 =0x8f,
    SWAP1 =0x90,
    SWAP2 =0x91,
    SWAP3 =0x92,
    SWAP4 =0x93,
    SWAP5 =0x94,
    SWAP6 =0x95,
    SWAP7 =0x96,
    SWAP8 =0x97,
    SWAP9 =0x98,
    SWAP10 =0x99,
    SWAP11 =0x9a,
    SWAP12 =0x9b,
    SWAP13 =0x9c,
    SWAP14 =0x9d,
    SWAP15 =0x9e,
    SWAP16 =0x9f,

    LOG0 =0xa0,
    LOG1 =0xa1,
    LOG2 =0xa2,
    LOG3 =0xa3,
    LOG4 =0xa4,

    PUSH =0xb0,
    DUP =0xb1,
    SWAP =0xb2,

    CREATE =0xf0,
    CALL =0xf1,
    CALLCODE =0xf2,
    RETURN =0xf3,
    DELEGATECALL =0xf4,
    CREATE2 =0xf5,
    STATICCALL =0xfa,

    REVERT =0xfd,
    SELFDESTRUCT =0xff;

var opCodeToString = {};
// 0x0 range - arithmetic ops.
opCodeToString[STOP] = "STOP";
opCodeToString[ADD] = "ADD";
opCodeToString[MUL] = "MUL";
opCodeToString[SUB] = "SUB";
opCodeToString[DIV] = "DIV";
opCodeToString[SDIV] = "SDIV";
opCodeToString[MOD] = "MOD";
opCodeToString[SMOD] = "SMOD";
opCodeToString[EXP] = "EXP";
opCodeToString[NOT] = "NOT";
opCodeToString[LT] =  "LT";
opCodeToString[GT] =  "GT";
opCodeToString[SLT] = "SLT";
opCodeToString[SGT] = "SGT";
opCodeToString[EQ] =  "EQ";
opCodeToString[ISZERO] ="ISZERO";
opCodeToString[SIGNEXTEND] = "SIGNEXTEND";

// 0x10 range - bit ops.
opCodeToString[AND] = "AND";
opCodeToString[OR] ="OR";
opCodeToString[XOR] = "XOR";
opCodeToString[BYTE] ="BYTE";
opCodeToString[SHL] = "SHL";
opCodeToString[SHR] = "SHR";
opCodeToString[SAR] = "SAR";
opCodeToString[ADDMOD] ="ADDMOD";
opCodeToString[MULMOD] ="MULMOD";

// 0x20 range - crypto.
opCodeToString[SHA3] ="SHA3";

// 0x30 range - closure state.
opCodeToString[ADDRESS] = "ADDRESS";
opCodeToString[BALANCE] = "BALANCE";
opCodeToString[ORIGIN] = "ORIGIN";
opCodeToString[CALLER] = "CALLER";
opCodeToString[CALLVALUE] = "CALLVALUE";
opCodeToString[CALLDATALOAD] ="CALLDATALOAD";
opCodeToString[CALLDATASIZE] ="CALLDATASIZE";
opCodeToString[CALLDATACOPY] ="CALLDATACOPY";
opCodeToString[CODESIZE] = "CODESIZE";
opCodeToString[CODECOPY] = "CODECOPY";
opCodeToString[GASPRICE] = "GASPRICE";
opCodeToString[EXTCODESIZE] = "EXTCODESIZE";
opCodeToString[EXTCODECOPY] = "EXTCODECOPY";
opCodeToString[RETURNDATASIZE] ="RETURNDATASIZE";
opCodeToString[RETURNDATACOPY] ="RETURNDATACOPY";
opCodeToString[EXTCODEHASH] = "EXTCODEHASH";

// 0x40 range - block operations.
opCodeToString[BLOCKHASH] ="BLOCKHASH";
opCodeToString[COINBASE] ="COINBASE";
opCodeToString[TIMESTAMP] ="TIMESTAMP";
opCodeToString[NUMBER] ="NUMBER";
opCodeToString[DIFFICULTY] ="DIFFICULTY";
opCodeToString[GASLIMIT] ="GASLIMIT";

// 0x50 range - 'storage' and execution.
opCodeToString[POP] ="POP";
//DUP] ="DUP",
//SWAP] = "SWAP",
opCodeToString[MLOAD] = "MLOAD";
opCodeToString[MSTORE] ="MSTORE";
opCodeToString[MSTORE8] ="MSTORE8";
opCodeToString[SLOAD] = "SLOAD";
opCodeToString[SSTORE] ="SSTORE";
opCodeToString[JUMP] ="JUMP";
opCodeToString[JUMPI] = "JUMPI";
opCodeToString[PC] = "PC";
opCodeToString[MSIZE] = "MSIZE";
opCodeToString[GAS] ="GAS";
opCodeToString[JUMPDEST] ="JUMPDEST";

// 0x60 range - push.
opCodeToString[PUSH1] ="PUSH1";
opCodeToString[PUSH2] ="PUSH2";
opCodeToString[PUSH3] ="PUSH3";
opCodeToString[PUSH4] ="PUSH4";
opCodeToString[PUSH5] ="PUSH5";
opCodeToString[PUSH6] = "PUSH6";
opCodeToString[PUSH7] = "PUSH7";
opCodeToString[PUSH8] = "PUSH8";
opCodeToString[PUSH9] = "PUSH9";
opCodeToString[PUSH10] ="PUSH10";
opCodeToString[PUSH11] ="PUSH11";
opCodeToString[PUSH12] ="PUSH12";
opCodeToString[PUSH13] ="PUSH13";
opCodeToString[PUSH14] ="PUSH14";
opCodeToString[PUSH15] ="PUSH15";
opCodeToString[PUSH16] ="PUSH16";
opCodeToString[PUSH17] ="PUSH17";
opCodeToString[PUSH18] ="PUSH18";
opCodeToString[PUSH19] ="PUSH19";
opCodeToString[PUSH20] ="PUSH20";
opCodeToString[PUSH21] ="PUSH21";
opCodeToString[PUSH22] ="PUSH22";
opCodeToString[PUSH23] ="PUSH23";
opCodeToString[PUSH24] ="PUSH24";
opCodeToString[PUSH25] ="PUSH25";
opCodeToString[PUSH26] ="PUSH26";
opCodeToString[PUSH27] ="PUSH27";
opCodeToString[PUSH28] ="PUSH28";
opCodeToString[PUSH29] ="PUSH29";
opCodeToString[PUSH30] ="PUSH30";
opCodeToString[PUSH31] ="PUSH31";
opCodeToString[PUSH32] ="PUSH32";

opCodeToString[DUP1] = "DUP1";
opCodeToString[DUP2] = "DUP2";
opCodeToString[DUP3] = "DUP3";
opCodeToString[DUP4] = "DUP4";
opCodeToString[DUP5] = "DUP5";
opCodeToString[DUP6] = "DUP6";
opCodeToString[DUP7] = "DUP7";
opCodeToString[DUP8] = "DUP8";
opCodeToString[DUP9] = "DUP9";
opCodeToString[DUP10] ="DUP10";
opCodeToString[DUP11] ="DUP11";
opCodeToString[DUP12] ="DUP12";
opCodeToString[DUP13] ="DUP13";
opCodeToString[DUP14] ="DUP14";
opCodeToString[DUP15] ="DUP15";
opCodeToString[DUP16] ="DUP16";

opCodeToString[SWAP1] = "SWAP1";
opCodeToString[SWAP2] = "SWAP2";
opCodeToString[SWAP3] = "SWAP3";
opCodeToString[SWAP4] = "SWAP4";
opCodeToString[SWAP5] = "SWAP5";
opCodeToString[SWAP6] = "SWAP6";
opCodeToString[SWAP7] = "SWAP7";
opCodeToString[SWAP8] = "SWAP8";
opCodeToString[SWAP9] = "SWAP9";
opCodeToString[SWAP10] ="SWAP10";
opCodeToString[SWAP11] ="SWAP11";
opCodeToString[SWAP12] ="SWAP12";
opCodeToString[SWAP13] ="SWAP13";
opCodeToString[SWAP14] ="SWAP14";
opCodeToString[SWAP15] ="SWAP15";
opCodeToString[SWAP16] ="SWAP16";
opCodeToString[LOG0] ="LOG0";
opCodeToString[LOG1] ="LOG1";
opCodeToString[LOG2] ="LOG2";
opCodeToString[LOG3] ="LOG3";
opCodeToString[LOG4] ="LOG4";

// 0xf0 range.
opCodeToString[CREATE] = "CREATE";
opCodeToString[CALL] =  "CALL";
opCodeToString[RETURN] = "RETURN";
opCodeToString[CALLCODE] ="CALLCODE";
opCodeToString[DELEGATECALL] ="DELEGATECALL";
opCodeToString[CREATE2] ="CREATE2";
opCodeToString[STATICCALL] ="STATICCALL";
opCodeToString[REVERT] = "REVERT";
opCodeToString[SELFDESTRUCT] ="SELFDESTRUCT";

opCodeToString[PUSH] ="PUSH";
opCodeToString[DUP] = "DUP";
opCodeToString[SWAP] ="SWAP";

const json_parse = (fileName, srcmap, srccode) =>{
  /// the first "" is set undefined (map ([s, l, f, j])), l,f,j does not exist.
  const src_number = srcmap
        .split(";")
        .map(l => l.split(":"))
        .map(([s, l, f, j]) => ({ s: s === "" ? undefined : s, l, f, j }))
        .reduce(
          ([last, ...list], {s, l, f, j }) => [
            {
              s: parseInt(s || last.s, 10),
              l: parseInt(l || last.l, 10),
              f: parseInt(f || last.f, 10),
              j: j || last.j
            },
            last,
            ...list
          ],
          [{}]
        )
        .reverse()
        .slice(1)
        .map(
          ({ s, l, f, j }) => `${fileName}:${getLineFromPos(srccode, s)}`
        );
  return src_number;
}

const isPush = inst => inst >= 0x60 && inst < 0x7f;
const pushDataLength = inst => inst - 0x5f;
const instructionLength = inst => (isPush(inst) ? 1 + pushDataLength(inst) : 1);

/// each byte to the source code
const byteToInstIndex = (src_number, binary) => {
  const byteToSrc = [];
  /// "0x" is removed from binary
  let byteIndex = 0;
  let instIndex = 0;
  /// for the binary code
  const binmap = Buffer.from(binary.substring(2), "hex");
  while (byteIndex < binmap.length) {
    const length = instructionLength(binmap[byteIndex]);
    if(opCodeToString[binmap[byteIndex]] !== undefined){
      var pair = [byteIndex + opCodeToString[binmap[byteIndex]], src_number[instIndex]];
      byteToSrc.push(pair);
    }
    byteIndex += length;
    instIndex += 1;
  }
  return byteToSrc;
};

const filtString = str => {
  for(var i =0; i < str.length; i++){
    var ch = str.charAt(i);
    if(ch < '0' || ch > '9'){
      return str.slice(i);
    }
  }
}

const mulbytesToSrcCode = byteToSrc => {
  const mulToSrc = new Map();
  let byteIndex = 0;
  var curKey = "";
  var curValue = "";
  while(byteIndex < byteToSrc.length){
    var curEle = byteToSrc[byteIndex];
    var lastEle;
    if (byteIndex -1 >=0){
      lastEle = byteToSrc[byteIndex -1];
    }
    else{
      lastEle = ["", ""];
    }
    if(curEle[1] === lastEle[1]){
      /// may be the same statement is divided into multiple sections, e.g., function selection
      if (curValue === "")
        if(curEle[1] != undefined && curEle[1].indexOf("undefined") === -1)
          curValue += curEle[1];
    }
    else{
      if(curValue === ""){
        if(curEle[1] != undefined && curEle[1].indexOf("undefined") === -1)
          curValue += curEle[1];
      }
      else{
        if(curEle[1] != undefined && curEle[1].indexOf("undefined") === -1)
          curValue = curValue + "#" + curEle[1];
      }
    }
    curKey += curEle[0];
    var filt_curEle = filtString(curEle[0]);

    if (separator_set.has(filt_curEle)){
      if(mulToSrc.has(curKey)){
        var curValue_set = mulToSrc.get(curKey);
        curValue_set.add(curValue); 
      }
      else{
        var curValue_set = new Set();
        curValue_set.add(curValue);
        mulToSrc.set(curKey, curValue_set);
      }
      /// for next key
      curKey = "";
      curValue = ""; 
    }
    byteIndex += 1;
  }
  return mulToSrc;
}

const mulToTrace = (ins_list, mulToSrc_attack, mulToSrc_victim) => {
  var trace_list = [];
  var insStr = "";
  for (var ins_ele of ins_list){
    insStr += ins_ele;
    var filt_insEle = filtString(ins_ele);
    if(separator_set.has(filt_insEle)){
      if(mulToSrc_attack.has(insStr)){
        var traceEle = mulToSrc_attack.get(insStr);  
        for(var step_list of traceEle){
          var step_item = step_list.split("#");
          for(var step of step_item){
            trace_list.push(step);
          }
        }
        
      }
      else if(mulToSrc_victim.has(insStr)){
        var traceEle = mulToSrc_victim.get(insStr);
        for(var step_list of traceEle){
          var step_item = step_list.split("#");
          for(var step of step_item){
            trace_list.push(step);
          }
        }
      }
      else{
        console.log("evm to code error!\n");
      }
      insStr = "";
    }
  }
  return trace_list;
}


const buildDynamicDep = (trace, staticDep) => {
  var dynamicDep = [];
  var dyn_varLine_map = map();
  var sta_write_map = staticDep.get("Write");
  var sta_read_map = staticDep.get("Read");
  var sta_cd_map = staticDep.get("CDepen");
  var trace_index = 0;
  while (trace_index < trace.length){
    var step = trace[trace_index];
    if(sta_write_map.has(step)){
      var write_var_list = sta_write_map.get(step);
      for(var write_var of write_var_list){
        dyn_varLine_map[write_var] = step
      }
    }

    if(sta_read_map.has(step)){
      var read_var_list = sta_read_map.get(step);
      for(var read_var of read_var_list){
        if(dyn_varLine_map.has(read_var)){
          var write_line = dyn_varLine_map.get(read_var);
          dynamicDep.push([write_line, step])
        }
      }
    }

    if(sta_cd_map.has(step)){
      if((trace_index +1) < trace.length){
        var next_step = trace[trace_index +1];
        dynamicDep.push([step, next_step]);
      }
    }
    trace_index += 1; 
  }
  return dynamicDep;
}


module.exports = {
  buildInsMap: function(fileName, binary, srcmap, srccode) {
    var src_number = json_parse(fileName, srcmap, srccode);
    /// compute each instruction to its line number
    var byteToSrc = byteToInstIndex(src_number, binary);
    /// compute multiple instructions to their line number
    var mulToSrc = mulbytesToSrcCode(byteToSrc);
    return mulToSrc; 
  },

  /// mulToSrc_* is the mapping from multiple instructions to their line number
  buildTraceMap: function(ins_list, mulToSrc_attack, mulToSrc_victim) {
    var trace_list = mulToTrace(ins_list, mulToSrc_attack, mulToSrc_victim);
    // console.log(trace_list);
    return trace_list;
  },
  
  buildStaticDep: function(fileName){
    var exec = require('child_process').exec; 
    var cmdStr = "python3 buildDepen.py " + fileName;
    exec(cmdStr, function(err, stdout, stderr){
      if(err) {
        console.log('get cmd error:' + stderr);
      }
      else {
        var data = JSON.parse(stdout);
        fs.writeFile("./staticDep.json", JSON.stringify(data), (err) => {
          if (err) {
            console.error(err);
            return;
          };
        });
      }
    });  
    // return staticDep;
  },

  buildDynDep: function(trace, staticDep){
    var dynamicDep = buildDynamicDep(trace, staticDep);
    return dynamicDep;
  }
}

