var fs = require('fs');
var getLineFromPos = require('get-line-from-pos');

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

const writeSrcIndex_list = (con_list) => {
  var srcIndex = "";
  let index = 0;
  while(index < con_list.length){
    var buffer = con_list[index] + "\n";
    srcIndex += buffer;
    index += 1;
  }
  fs.writeFileSync("./srcIndex.txt", srcIndex);
}


const writeByteIndex_list = (con_list) => {
  var byteToSrc = "";
  let index = 0;
  while(index < con_list.length){
    var buffer = "[" + con_list[index][0] + "    " + con_list[index][1] + "]" + "\n";
    byteToSrc += buffer;
    index += 1;
  }
  fs.writeFileSync("./byteToSrc.txt", byteToSrc);
}

const json_parse = (fileName, srcmap, srccode) =>{
  /// the window system may use '\r\n' as newline, but getLineFromPos would take them as two lines
  srccode = srccode.split('\r\n').join('\n');
  srccode = srccode.split('\n\r').join('\n');
  /// truncate the prefix of the path
  fileName = fileName.slice(fileName.lastIndexOf('/') +1);
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
  // writeSrcIndex_list(src_number);
  return src_number;
}


const isPush = inst => inst >= 0x60 && inst < 0x7f;
const pushDataLength = inst => inst - 0x5f;
const instructionLength = inst => (isPush(inst) ? 1 + pushDataLength(inst) : 1);

/// each byte to the source code
const byteToInstIndex = (src_number, binary) => {
  const byteToSrc = new Map();
  /// "0x" is removed from binary
  let byteIndex = 0;
  let instIndex = 0;
  /// for the binary code
  const binmap = Buffer.from(binary.substring(2), "hex");
  while (byteIndex < binmap.length) {
    const length = instructionLength(binmap[byteIndex]);
    if(opCodeToString[binmap[byteIndex]] != undefined && src_number[instIndex] != undefined){
      var key = byteIndex + opCodeToString[binmap[byteIndex]];
      var value = src_number[instIndex];
      byteToSrc[key] = value;
    }
    byteIndex += length;
    instIndex += 1;
  }
  // writeByteIndex_list(byteToSrc);
  return byteToSrc;
};


const stmtCollection = (src_number) =>{
  var stmt_set = new Set();
	src_number.forEach(function(value, key, map){
		stmt_set.add(value);
	});
	return stmt_set;
}

const byteToTrace = (ins_list, byteToSrc_attack, byteToSrc_target, attack_target) => {
  var trace_list = [];
  /// get the trace list
  var ins_index = 0;
  var ins_len = ins_list.length;
  while (ins_index < ins_len){
  	var ins = ins_list[ins_index];
    var attack_match = false;
    var target_match = false;
    /// it may be matched with both attack and target contract
    if(byteToSrc_attack.hasOwnProperty(ins)){
      var trace_attack = byteToSrc_attack[ins];
      attack_match = true;
    }
    if(byteToSrc_target.hasOwnProperty(ins)){
      var trace_target = byteToSrc_target[ins];
      target_match = true;
    }

    /// we consider the same file with previous step
    var last_trace = "0:0";
    if(trace_list.length > 0){ 
      last_trace = trace_list[trace_list.length -1];
      if(attack_match && target_match){
        var lastFile = last_trace.split(":")[0];
        var attackFile = trace_attack.split(":")[0];
        if(lastFile == attackFile){
          /// it is attack file, we falsify target_match
          target_match = false;
        }
        else{
          /// it is target file, we falsify attack_match
          attack_match = false;
        }
      }
    }
    else{
      if(attack_match && target_match){
        /// attack_target == 0, it is on attack contract
        /// attack_target == 1, it is on target contract
        if(attack_target == 0){
          target_match = false;
        }
        else{
          attack_match = false;
        }
      }
    }

    if(attack_match){
      /// we did not add the repetive trace
      if(trace_attack != undefined){
        if(last_trace != trace_attack){
          trace_list.push(trace_attack);
        }
      }
    }
    else{
      /// we did not add the repetive trace
      if(trace_target != undefined){
        if(last_trace != trace_target){
          trace_list.push(trace_target);
        }
      }
    }
    ins_index += 1;
  }
  return trace_list;
}

const trace_WR = (stmt_trace, staticDep_attack, staticDep_target) => {
  var stmt_write_set = new Set();
  var stmt_read_set = new Set();
  var readMap_attack = staticDep_attack["Read"];
  var writeMap_attack = staticDep_attack["Write"];
  var readMap_target = staticDep_target["Read"];
  var writeMap_target = staticDep_target["Write"];
  for(var stmt of stmt_trace){
    /// the stmt_tract write variable
    if(writeMap_attack.hasOwnProperty(stmt) ){
      write_var_list = writeMap_attack[stmt];
      for(var write_var of write_var_list){
        stmt_write_set.add(write_var);
      }
    }
    else if (writeMap_target.hasOwnProperty(stmt)) {
      write_var_list = writeMap_target[stmt];
      for(var write_var of write_var_list){
        stmt_write_set.add(write_var);
      }
    }

    /// the stmt_tract read variable
    if(readMap_attack.hasOwnProperty(stmt) ){
      read_var_list = readMap_attack[stmt];
      for(var read_var of read_var_list){
        stmt_read_set.add(read_var);
      }
    }
    else if (readMap_target.hasOwnProperty(stmt)) {
      read_var_list = readMap_target[stmt];
      for(var read_var of read_var_list){
        stmt_read_set.add(read_var);
      }
    }
  }

  return [stmt_write_set, stmt_read_set];
}


const buildDynamicDep = (trace, staticDep_attack, staticDep_target) => {
  var dynamicDep = new Set();
  var var_attack_map = new Map();
  var var_target_map = new Map();
  var con_attack_set = new Set();
  var con_target_set = new Set();
  /// it is the format of json, not use get() function
  var write_attack_map = staticDep_attack["Write"];
  var write_target_map = staticDep_target["Write"];
  var read_attack_map = staticDep_attack["Read"];
  var read_target_map = staticDep_target["Read"];
  var cd_attack_map = staticDep_attack["CDepen"];
  var cd_target_map = staticDep_target["CDepen"];

  /// it is reverse, first is the following statement, second is the conditional statement
  var cd_attack_reverse_map = new Map();
  var cd_target_reverse_map = new Map();
  for(var attack_key in cd_attack_map){
    var attack_value_list = cd_attack_map[attack_key];
    for(var attack_value of attack_value_list){
      if(cd_attack_reverse_map.has(attack_value)){
        attack_key_list = cd_attack_reverse_map.get(attack_value);
        attack_key_list.push(attack_key);
      }
      else{
        var attack_key_list = [];
        attack_key_list.push(attack_key);
        cd_attack_reverse_map.set(attack_value, attack_key_list);
      }
    }
  }
  for(var target_key in cd_target_map){
    var target_value_list = cd_target_map[target_key];
    for(var target_value of target_value_list){
      if(cd_target_reverse_map.has(target_value)){
        target_key_list = cd_target_reverse_map.get(target_value);
        target_key_list.push(target_key);
      }
      else{
        var target_key_list = [];
        target_key_list.push(target_key);
        cd_target_reverse_map.set(target_value, target_key_list);
      }
    }
  }

  var trace_index = 0;
  while (trace_index < trace.length){
    var step = trace[trace_index];
    /// we first consider the variable read, then write
    /// to aviod the statement depends on itself, e.g., credit[to] += msg.value;
    if(read_attack_map.hasOwnProperty(step)){
      var read_var_attack_list = read_attack_map[step];
      for(var read_var_attack of read_var_attack_list){
        if(var_attack_map.has(read_var_attack)){
          var write_line = var_attack_map.get(read_var_attack);
          dynamicDep.add(write_line + "#" + step)
        }
      }
    }
    else if(read_target_map.hasOwnProperty(step)){
      var read_var_target_list = read_tareget_map[step];
      for(var read_var_target of read_var_target_list){
        if(var_target_map.has(read_var_target)){
          var write_line = var_target_map.get(read_var_target);
          dynamicDep.add(write_line + "#" + step)
        }
      }
    }

    if(write_attack_map.hasOwnProperty(step)){
      var write_var_attack_list = write_attack_map[step];
      for(var write_var_attack of write_var_attack_list){
        var_attack_map.set(write_var_attack, step);
      }
    }
    else if(write_target_map.hasOwnProperty(step)){
      var write_var_target_list = write_target_map[step];
      for(var write_var_target of write_var_target_list){
        var_target_map.set(write_var_target, step);
      }
    }

    if(cd_attack_map.hasOwnProperty(step)){
      con_attack_set.add(step);
    }
    else if(cd_target_map.hasOwnProperty(step)){
      con_target_set.add(step);
    }

    if(cd_attack_reverse_map.has(step)){
      attack_con_list = cd_attack_reverse_map.get(step);
      for(var attack_con of attack_con_list){
        if(con_attack_set.has(attack_con)){
          dynamicDep.add(attack_con + "#" + step);
          /// the conditional statement has found its following statement
          con_attack_set.delete(attack_con);
          break;
        }
      }
    }
    else if(cd_target_reverse_map.has(step)){
      target_con_list = cd_target_reverse_map.get(step);
      for(var target_con of target_con_list){
        if(con_target_set.has(target_con)){
          dynamicDep.add(target_con + "#" + step);
          /// the conditional statement has found its following statement
          con_target_set.delete(target_con);
          break;
        }
      }
    }
    trace_index += 1; 
  }
  return dynamicDep;
}

module.exports = {
  buildStmtSet: function(fileName, srcmap, srccode) {
    var src_number = json_parse(fileName, srcmap, srccode);
    var stmt_set = stmtCollection(src_number);
    return stmt_set; 
  },

  buildInsMap: function(fileName, binary, srcmap, srccode) {
    var src_number = json_parse(fileName, srcmap, srccode);
    /// compute each instruction to its line number
    var byteToSrc = byteToInstIndex(src_number, binary);
    /// compute multiple instructions to their line number
    /// we do not use multiple instructions to the line number again, 
    /// because it is difficult to recognize the seperator instruction, specially not executed completely due to gas limit
    // var mulToSrc = mulbytesToSrcCode(byteToSrc);
    // return mulToSrc; 
    return byteToSrc
  },

  buildTraceMap: function(ins_list, byteToSrc_attack, byteToSrc_target, attack_target) {
    var trace_list = byteToTrace(ins_list, byteToSrc_attack, byteToSrc_target, attack_target);
    return trace_list;
  },
  
  buildWRSet: function(stmt_trace, staticDep_attack, staticDep_target){
    var WR_set = trace_WR(stmt_trace, staticDep_attack, staticDep_target);
    return WR_set;
  },

  buildStaticDep: function(fileName){
    var execSync = require('child_process').execSync;
    var cmdStr = "python3 ./connection/buildDepen.py " + fileName;
    var output = execSync(cmdStr);
    var staticDep = JSON.parse(output);
    return staticDep;
  },

  buildDynDep: function(trace, staticDep_attack, staticDep_target){
    var dynamicDep = buildDynamicDep(trace, staticDep_attack, staticDep_target);
    return dynamicDep;
  }
}

