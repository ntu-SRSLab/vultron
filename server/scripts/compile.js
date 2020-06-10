#!/usr/local/bin/node

const fs = require("fs");
const solc = require("solc");
const spath = require('path');
const shell = require("shelljs");

function write2File(dir, file_name, content) {
	if (!fs.existsSync(dir)) {
		shell.mkdir("-p", dir);
	}
	if (content)
		fs.writeFileSync(dir + "/" + file_name, content);
	else if (!fs.existsSync(dir + "/" + file_name)) {
		shell.mkdir("-p", dir + "/" + file_name);
	}
}

function compileWecredit() {
	let output = {};

	var input = {
		'Credit.sol': fs.readFileSync('../Vultron-Fisco/fisco/wecredit/Credit.sol', 'utf8'),
		'CreditMap.sol': fs.readFileSync('../Vultron-Fisco/fisco/wecredit/CreditMap.sol', 'utf8'),
		'Account.sol': fs.readFileSync('../Vultron-Fisco/fisco/wecredit/Account.sol', 'utf8'),
		'AccountMap.sol': fs.readFileSync('../Vultron-Fisco/fisco/wecredit/AccountMap.sol', 'utf8'),
		'AccountController.sol': fs.readFileSync('../Vultron-Fisco/fisco/wecredit/AccountController.sol', 'utf8'),
		'CommonLib.sol': fs.readFileSync('../Vultron-Fisco/fisco/wecredit/CommonLib.sol', 'utf8'),
		'CreditController.sol': fs.readFileSync('../Vultron-Fisco/fisco/wecredit/CreditController.sol', 'utf8'),
	};

	let compiledContract = solc.compile({
		sources: input
	}, 1);
	console.log(compiledContract);
	//console.log(compiledContract);
	//console.log(typeof compiledContract.contracts);
	//console.log( Object.keys(compiledContract.contracts));
	for (let contract of Object.keys(compiledContract.contracts)) {
		let name = contract;
		let file_name = name.split(":")[0].split(".")[0];
		let contract_name = name.split(":")[1];
		if (file_name == contract_name) {
			console.log(file_name, " to compile");
			let content = compiledContract.contracts[name];
			if (!fs.existsSync("../deployed_contract/wecredit/")) {
				shell.mkdir("-p", "../deployed_contract/wecredit/");
			}
			let path = "../deployed_contract/wecredit/bin";
			if (!fs.existsSync(path)) {
				shell.mkdir("-p", path);
			}
			path = "../deployed_contract/wecredit/abi";
			if (!fs.existsSync(path)) {
				shell.mkdir("-p", path);
			}
			path = "../deployed_contract/wecredit/artifact";
			if (!fs.existsSync(path)) {
				shell.mkdir("-p", path);
			}
			console.log("../deployed_contract/wecredit/artifact/" + file_name + ".artifact");
			console.log("../deployed_contract/wecredit/bin/" + file_name + ".bin");
			console.log("../deployed_contract/wecredit/abi/" + file_name + ".abi");
			content.source = input[file_name + ".sol"];
			content.sourcePath = spath.join("../Vultron-Fisco/fisco/wecredit/", file_name + ".sol");
			fs.writeFileSync("../deployed_contract/wecredit/artifact/" + file_name + ".artifact", JSON.stringify(content));
			fs.writeFileSync("../deployed_contract/wecredit/bin/" + file_name + ".bin", content.bytecode);
			fs.writeFileSync("../deployed_contract/wecredit/abi/" + file_name + ".abi", JSON.stringify(JSON.parse(content.interface)));
			write2File("../deployed_contract/" + file_name, file_name + ".abi", JSON.stringify(JSON.parse(content.interface)));
			write2File("../deployed_contract/" + file_name, file_name + ".bin", content.bytecode);
			write2File("../deployed_contract/" + file_name, file_name + ".artifact", JSON.stringify(content));
			shell.cp(content.sourcePath, spath.join("../deployed_contract/", file_name));
			console.log("compiled");
			output[contract_name] = JSON.parse(content.interface);
		}
	}
	return output;
}


function compile(folder, contracts) {
	let output = {};
	let input = {};
	for (let contract of contracts) {
		input[contract.contract] = fs.readFileSync(spath.join(folder, contract.contract), 'utf8');
	}
	let compiledContract = solc.compile({
		sources: input
	}, 1);
	console.log(compiledContract);
	for (let contract of Object.keys(compiledContract.contracts)) {
		let name = contract;
		let file_name = name.split(":")[0].split(".")[0];
		let contract_name = name.split(":")[1];
		if (file_name == contract_name) {
			console.log(file_name, " to compile");
			let content = compiledContract.contracts[name];
			content.sourcePath = spath.join(__dirname, "../" + folder, file_name + ".sol");
			console.log(content.sourcePath);
			write2File("./deployed_contract/" + file_name, file_name + ".abi", JSON.stringify(JSON.parse(content.interface)));
			write2File("./deployed_contract/" + file_name, file_name + ".bin", content.bytecode);
			write2File("./deployed_contract/" + file_name, file_name + ".artifact", JSON.stringify(content));
			shell.cp("-f",content.sourcePath, spath.join(__dirname,"../deployed_contract/", file_name));
			 console.log(spath.join(__dirname,"../deployed_contract/", file_name));
			output[contract_name] = JSON.parse(content.interface);
		}
	}
	return output;
}
module.exports.compile = compile;
module.exports.compileWecredit = compileWecredit;