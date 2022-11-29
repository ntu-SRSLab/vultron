var fs = require('fs');
var readline = require('readline');
var getLineFromPos = require('get-line-from-pos');

var name_attack = "AttackDAO";
var name_victim = "SimpleDAO";
var evmtrace = "./evmtrace.txt";
var codetrace = "./codetrace.txt"

var byteToSrcPath_attack = "./byteToSrc_attack.txt";
var mulToSrcPath_attack = "./mulToSrc_attack.txt";
var funSetPath_attack = "./functionSet_attack.txt";
var byteToSrcPath_victim = "./byteToSrc_victim.txt";
var mulToSrcPath_victim = "./mulToSrc_victim.txt";
var funSetPath_victim = "./functionSet_victim.txt";

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

    SHA3 = 0x20

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

const writeByteIndex_list = (path, con_list) =>{
	var byteToSrc = "";
	let index = 0;
	while(index < con_list.length){
		var buffer = "[" + con_list[index][0] + "    " + con_list[index][1] + "]" + "\n";
		byteToSrc += buffer;
		index += 1;
	}
	fs.writeFileSync(path, byteToSrc);
}

const writeMulIndex_map = (path, con_map) =>{
	var byteToSrc = "";
	con_map.forEach(function(value, key, map){
		var buffer = "[" + key + "    ";
		var first_iter = true;
		for(var srcline of value){
			if(first_iter){
				first_iter = false;
			}
			else{
				buffer += "#";
			}
			buffer += srcline;
		}
		buffer = buffer + "]" + "\n";
		byteToSrc += buffer;
	});
	fs.writeFileSync(path, byteToSrc);
}

const writeCodeTrace_list = (path, con_list) =>{
	var lineStr = "";
	for (var lineEle_set of con_list){
		for (var lineEle of lineEle_set){
			lineEle_list = lineEle.split("#");
			for (lineEle_each of lineEle_list){
				lineStr = lineStr + lineEle_each + "\n";
			}
		}
	}
	fs.writeFileSync(path, lineStr);
}

const json_parse = (name) =>{
	var name_json = name + ".json";
	var name_json_cur = "./" + name_json;
	const srcmaps = JSON.parse(fs.readFileSync(name_json_cur));

	// for the srcmap
	var name_sol = name + ".sol";
	var name_sol_cur = "./" + name_sol;
	var prefix = name_sol + ":" + name;
	var select_srcmap = "srcmap-runtime";
	const srcmap = srcmaps.contracts[prefix][select_srcmap];
	// for the source code
	const srccode = fs.readFileSync(name_sol_cur).toString();

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
	    ({ s, l, f, j }) => `${srcmaps.sourceList[f-2]}:${getLineFromPos(srccode, s)}`
	  );
	console.log(src_number)
	/// for the binary code 
	var select_binmap = "bin-runtime";
	const binmap = Buffer.from(srcmaps.contracts[prefix][select_binmap], "hex");
	return [src_number, binmap];
}

evmToCode_attack = json_parse(name_attack);
evmToCode_victim = json_parse(name_victim);

const isPush = inst => inst >= 0x60 && inst < 0x7f;
const pushDataLength = inst => inst - 0x5f;
const instructionLength = inst => (isPush(inst) ? 1 + pushDataLength(inst) : 1);

/// each byte to the source code
const byteToInstIndex = evmToCode => {
  const byteToSrc = [];
  let byteIndex = 0;
  let instIndex = 0;
  src_number = evmToCode[0];
  binmap = evmToCode[1];
  while (byteIndex < binmap.length) {
    const length = instructionLength(binmap[byteIndex]);
    if(opCodeToString[binmap[byteIndex]] != undefined){
	    var pair = [byteIndex + opCodeToString[binmap[byteIndex]], src_number[instIndex]];
	    byteToSrc.push(pair);
	}
    byteIndex += length;
    instIndex += 1;
  }
  return byteToSrc;
};
const byteToSrc_attack = byteToInstIndex(evmToCode_attack);
const byteToSrc_victim = byteToInstIndex(evmToCode_victim);
writeByteIndex_list(byteToSrcPath_attack, byteToSrc_attack);
writeByteIndex_list(byteToSrcPath_victim, byteToSrc_victim);

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
	const functionSet = new Set();
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
		/// identify the function
		var fun_found = false;
		if(filt_curEle === "RETURN" || filt_curEle === "STOP"){
			if(curEle[1] != undefined && curEle[1].indexOf("undefined") === -1){
				functionSet.add(curEle[1]);
				fun_found = true;
			}
			/// for fallback function, it is encoded in function selection area
			if(fun_found && byteIndex -1 >=0){
				preEle = byteToSrc[byteIndex -1];
				if(preEle[1] != undefined && curEle[1] != undefined && preEle[1] != curEle[1]){
					functionSet.add(preEle[1]);
				}
			}
		}
		byteIndex += 1;
	}
	return [mulToSrc, functionSet];
}
/// for multipe instruction for a source statement
const mulbytesToSrc_attack = mulbytesToSrcCode(byteToSrc_attack);
const mulbytesToSrc_victim = mulbytesToSrcCode(byteToSrc_victim);
writeMulIndex_map(mulToSrcPath_attack, mulbytesToSrc_attack[0]);
writeMulIndex_map(mulToSrcPath_victim, mulbytesToSrc_victim[0]);

function sortNumber(a,b)
{
	return a - b;
}
const stmtToFunc = (mulbytesToSrc) => {
	var stmtFunMap = new Map();
	var functionMap = new Map();
	mulToSrc = mulbytesToSrc[0];
	functionSet = mulbytesToSrc[1];
	for(var func of functionSet){
		var func_sig = func.split(":");
		if(functionMap.has(func_sig[0])){
			lineNum_array = functionMap.get(func_sig[0]);
			lineNum_array.push(Number(func_sig[1]));
			lineNum_array.sort(sortNumber);
		}
		else{
			lineNum_array = new Array();
			lineNum_array.push(Number(func_sig[1]));
			functionMap.set(func_sig[0], lineNum_array);
		}
	}
	for(var mulToSrc_line of mulToSrc){
		var src_line_set = mulToSrc_line[1];
		for(var src_line_list of src_line_set){
			var src_line_ele = src_line_list.split("#");
			for(var src_line of src_line_ele){
				/// redundant
				if(src_line != undefined && src_line.indexOf("undefined") === -1){
					var lineEle = src_line.split(":");
					if(functionMap.has(lineEle[0])){
						lineNum_array = functionMap.get(lineEle[0]);
						var lastNum = -1;
						var last_found = false;
						for(var lineNum of lineNum_array){
							if(Number(lineEle[1]) < lineNum){
								var funStmt = lineEle[0] + ":" + lastNum;
								stmtFunMap.set(src_line, funStmt);
								last_found = true;
								break;
							}
							lastNum = lineNum;
						}
						/// for the statement of the greatest value
						if(last_found == false){
							var funStmt = lineEle[0] + ":" + lastNum;
							stmtFunMap.set(src_line, funStmt);
						}
					}
				}
			}
		}
	}	
	return stmtFunMap;
}
const stmtFunMap_attack = stmtToFunc(mulbytesToSrc_attack);
const stmtFunMap_victim = stmtToFunc(mulbytesToSrc_victim);

const mulToTrace = (tracePath, mulbytesToSrc_attack, mulbytesToSrc_victim) => {
	var mulToSrc_attack = mulbytesToSrc_attack[0];
	var mulToSrc_victim = mulbytesToSrc_victim[0];

	var ins_list = [];
	var trace_list = [];
	var fRead = fs.createReadStream(tracePath);
    var objReadline = readline.createInterface({
    	input:fRead
    });

    objReadline.on('line', (line) => {
    	ins_list.push(line);
    });

	objReadline.on('close', () => {
	    var insStr = "";
	    for (var ins_ele of ins_list){
	        insStr += ins_ele;
	        var filt_insEle = filtString(ins_ele);
	    	if(separator_set.has(filt_insEle)){
	    		if(mulToSrc_attack.has(insStr)){
	    			var traceEle = mulToSrc_attack.get(insStr);	 
	    			trace_list.push(traceEle);
	    		}
	    		else if(mulToSrc_victim.has(insStr)){
	    			var traceEle = mulToSrc_victim.get(insStr);
	    			trace_list.push(traceEle);
	    		}
	    		else{
	    			console.log("evm to code error!\n");
	    		}
	    		insStr = "";
	    	}
	    }
	    writeCodeTrace_list(codetrace, trace_list);
	});
}

mulToTrace(evmtrace, mulbytesToSrc_attack, mulbytesToSrc_victim);
