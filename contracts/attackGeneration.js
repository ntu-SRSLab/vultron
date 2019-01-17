var fs = require('fs');

var target_json = '../build/contracts/SimpleDAO.json';
var target_abs = JSON.parse(fs.readFileSync(target_json));

var target_name = target_abs.contractName;
var target_genFuns = target_abs.abi.filter(obj => (!obj.constant && !obj.payable && obj.type === 'function'));
var target_payFuns = target_abs.abi.filter(obj => (!obj.constant && obj.payable && obj.type === 'function'));

function generateConstructor(target_name, index) {
  let constructorCode = `pragma solidity ^0.4.19;

import "./${target_name}.sol";

contract Attack_${target_name}${index} {

  ${target_name} public target_contract;

  function Attack_${target_name}${index}(address _targetContract) public payable {
      target_contract = ${target_name}(_targetContract);
  } \n`;
  return constructorCode;
}

/* Makes sense to put only payable functions here. Or not
 * Fallback function can't take parameters, so there's technically
 * no way to specify the amount to be paid at runtime.
 */

function generateGenFuns(targetFun) {
  let formal_params = "";
  let actual_params = "";
  for(var input of targetFun.inputs){
    if(formal_params === ""){
      formal_params = input.type + " " + input.name;
    }
    else{
      formal_params = formal_params + ", " + input.type + " " + input.name;
    } 
    if(actual_params === ""){
      actual_params = input.name;
    }
    else{
      actual_params = actual_params + ", " + input.name;
    } 
  }
  let functionCode = `
  function ${targetFun.name}(${formal_params}) public {
    target_contract.${targetFun.name}(${actual_params});
  } \n`;
  return functionCode;
}

function generatePayFuns(targetFun) {
  let formal_params = "";
  let actual_params = "";
  for(var input of targetFun.inputs){
    if(formal_params === ""){
      formal_params = input.type + " " + input.name;
    }
    else{
      formal_params = formal_params + ", " + input.type + " " + input.name;
    } 
    if(actual_params === ""){
      actual_params = input.name;
    }
    else{
      actual_params = actual_params + ", " + input.name;
    } 
  }
  let functionCode = `
  function ${targetFun.name}(uint256 vultron_amount, ${formal_params}) public payable{
    target_contract.${targetFun.name}.value(vultron_amount)(${actual_params});
  } \n`;
  return functionCode;
}

function generateFallbackFuns(targetFun) {
  let fallbackCode;
  if(targetFun.name === "revert"){
    fallbackCode = `
  function() public payable {
    revert();
  }
} \n`;     
  }
  else{
    let actual_params = "";
    for(var input of targetFun.inputs){
      if(actual_params === ""){
        if(input.type === "address"){
          actual_params = "this";
        }
        else if(input.type.indexOf("uint") !== -1 || input.type.indexOf("int") !== -1){
          actual_params = "10000";
        }
      }
      else{
        if(input.type === "address"){
          actual_params = actual_params + ", "  + " this";
        }
        else if(input.type.indexOf("uint") !== -1 || input.type.indexOf("int") !== -1){
          actual_params = actual_params + ", "  + " 10000";
        }
      } 
    }
    fallbackCode = `
  function() public payable {
    target_contract.${targetFun.name}(${actual_params});
  }
} \n`;    
}
  return fallbackCode;
}


function filterForFallback(){
  var fallback_list = [];
  for(var genFun of target_genFuns){
    if(genFun.inputs.length === 0){
      fallback_list.push(genFun);
    }
    else{
      var fallback_found = false;
      for(var input of genFun.inputs){
        if(input.type !== "address" && input.type.indexOf("uint") === -1 && input.type.indexOf("int") === -1){
          fallback_found = false;
          break;
        }
        else{
          if(input.type.indexOf("uint") !== -1 || input.type.indexOf("int") !== -1){
            fallback_found = true;
          }
        }
      }
      if(fallback_found){
        fallback_list.push(genFun);
      }      
    }
  }

  for(var payFun of target_payFuns){
    if(payFun.inputs.length === 0){
      fallback_list.push(payFun);
    }
    var fallback_found = false;
    for(var input of payFun.inputs){
      if(input.type !== "address" && input.type.indexOf("uint") === -1 && input.type.indexOf("int") === -1){
        fallback_found = false;
        break;
      }
      else{
        if(input.type.indexOf("uint") !== -1 || input.type.indexOf("int") !== -1){
          fallback_found = true;
        }
      }
    }
    if(fallback_found){
      fallback_list.push(payFun);
    }
  }

  var revertFun = {"name": "revert", "inputs": []};
  fallback_list.push(revertFun);
  return fallback_list;
}


/* function checkConstructors (contract, parsed) {
    let res = parsed.abi.filter(obj => obj.type === 'constructor');
    return null;
} */

// TODO: fix return statements
// function generateMigration (index) {
//     let migrationCode = `const Log = artifacts.require("Log"); \nconst ${target_name} = artifacts.require("${target_name}");\n`;
//     for (let i = 0; i < index; i++)
//     {
//       migrationCode = migrationCode.concat(`const Attack_${target_name}${i} = artifacts.require("Attack_${target_name}${i}");\n\n`)
//     }
//     migrationCode = migrationCode.concat(`module.exports = function(deployer) {
//     deployer.deploy(Log).then(function() {
//         return deployer.deploy(${target_name}, {value: web3.toWei(10, "ether")}).then(function() {\n`);
//     for (let i = 0; i < index; i++)
//     {
//         migrationCode = migrationCode.concat(`\t\t\tdeployer.deploy(Attack_${target_name}${i}, ${target_name}.address, {value: web3.toWei(15, "ether")});\n`)
//     }
//     migrationCode = migrationCode.concat(`\n\t\t});\n\t});\n}; `);
//     return migrationCode;
// }


function generateMigration (index) {
    let migrationCode = `const ${target_name} = artifacts.require("${target_name}");\n`;
    for (let i = 0; i < index; i++)
    {
      migrationCode = migrationCode.concat(`const Attack_${target_name}${i} = artifacts.require("Attack_${target_name}${i}");\n`)
    }
    migrationCode = migrationCode.concat(`module.exports = function(deployer) {
    deployer.deploy(${target_name}, {value: web3.toWei(10, "ether")}).then(function() {
        return (`);
    for (let i = 0; i < index; i++){
        if(i === 0){
          migrationCode = migrationCode.concat(`deployer.deploy(Attack_${target_name}${i}, ${target_name}.address, {value: web3.toWei(15, "ether")})\n`)
        }
        else{
          migrationCode = migrationCode.concat(`\t\t\t&& deployer.deploy(Attack_${target_name}${i}, ${target_name}.address, {value: web3.toWei(15, "ether")})\n`)
        }
    }
    migrationCode = migrationCode.concat(`\t\t\t);\n`)
    migrationCode = migrationCode.concat(`\t});\n}; `);
    return migrationCode;
}

function compileContracts (target_name) {
  let genFuns = target_genFuns.map(objFun => generateGenFuns(objFun)).join('');
  let payFuns = target_payFuns.map(objFun => generatePayFuns(objFun)).join('');
  let fallback_list = filterForFallback();

  fallback_list.map(objFun => generateFallbackFuns(objFun)).reduce(function (acc, objFun, index) {
      fs.writeFile(`./Attack_${target_name}${index}.sol`, generateConstructor(target_name, index) + genFuns + payFuns + objFun, (err) => {
          if (err) throw err;
          console.log(`Attack contract ${index} is saved!`);
      });

  }, {});

  fs.writeFile(`./2_deploy_attackers.js`, generateMigration(fallback_list.length), (err) => {
      if (err) throw err;
      console.log(`Migration script is saved!`);
  });
}

compileContracts(target_name);
