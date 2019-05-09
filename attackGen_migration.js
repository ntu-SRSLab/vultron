var fs = require('fs');
var path = require('path');
 
var solPath = path.resolve('./contracts');
var jsonPath = path.resolve('./build/contracts');
var migrPath = path.resolve('./migrations');

/// contract name
var target_name;
/// included in the file
var target_file;

var target_genFuns;
var target_payFuns;

var contract_depen;

var migrationFile;
var migration_index = 1;
var nestingLevel;
var deploy_level;

function generateConstructor(target_name, index) {
  let constructorCode = `pragma solidity ^0.4.19;

import "${target_file}";

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
/// this is general function, not payable function
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
  function vultron_${targetFun.name}(${formal_params}) public {
    target_contract.${targetFun.name}(${actual_params});
  } \n`;
  return functionCode;
}


/// this is payable function
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
  let functionCode;
  if(formal_params === ""){
    functionCode = `
  function vultron_${targetFun.name}(uint256 vultron_amount) public payable{
    target_contract.${targetFun.name}.value(vultron_amount)();
  } \n`;
  }
  else{
    functionCode = `
  function vultron_${targetFun.name}(uint256 vultron_amount, ${formal_params}) public payable{
    target_contract.${targetFun.name}.value(vultron_amount)(${actual_params});
  } \n`;    
  }
  return functionCode;
}

/// generate the fallback function
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

/// find the function that should put into the fallback function
function filterForFallback(){
  var fallback_list = [];
  for(var genFun of target_genFuns){
    if(genFun.inputs.length === 0){
      fallback_list.push(genFun);
    }
    else{
      var fallback_found = false;
      for(var input of genFun.inputs){
        /// first , its paramemters only these three types
        /// second, there must a parameter that is "uint" and "int"
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
      /// first , its paramemters only these three types
      /// second, there must a parameter that is "uint" and "int"
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


// function generateMigration (index) {
//     let migrationCode = `const ${target_name} = artifacts.require("${target_name}");\n`;
//     for (let i = 0; i < index; i++)
//     {
//       migrationCode = migrationCode.concat(`const Attack_${target_name}${i} = artifacts.require("Attack_${target_name}${i}");\n`)
//     }
//     if(target_payable){
//       migrationCode = migrationCode.concat(`module.exports = function(deployer) {
//   deployer.deploy(${target_name}, {value: web3.toWei(10, "ether")}).then(function() {\n`);
//     }
//     else{
//       migrationCode = migrationCode.concat(`module.exports = function(deployer) {
//   deployer.deploy(${target_name}).then(function() {\n`);      
//     }
//     for (let i = 0; i < index; i++){
//         if(i !== index -1){
//           migrationCode = migrationCode.concat(`\t\treturn deployer.deploy(Attack_${target_name}${i}, ${target_name}.address, {value: web3.toWei(15, "ether")});
//     }).then(function() {\n`)
//         }
//         else{
//           migrationCode = migrationCode.concat(`\t\treturn deployer.deploy(Attack_${target_name}${i}, ${target_name}.address, {value: web3.toWei(15, "ether")});
//     });\n`)
//         }
//     }
//     migrationCode = migrationCode.concat(`}\n`);
//     return migrationCode;
// }

/// generate migration configure for "Migration.sol"
function generateInitialMigration(){
  migrationFile = `${migrPath}/1_initial_migration.js`;
  let migrationCode = '';
  migrationCode = migrationCode.concat(`var Migrations = artifacts.require("Migrations"); \n`);
  migrationCode = migrationCode.concat(`\nmodule.exports = function(deployer) { \n`);
  migrationCode = migrationCode.concat(`\tdeployer.deploy(Migrations);\n`); 
  migrationCode = migrationCode.concat(`}\n`); 
  try{
    fs.appendFileSync(migrationFile, migrationCode);
  }
  catch(err){
    console.log(err);
  }
}

function getArgsFromConf(contract_name){
  if (fs.existsSync("./build/contracts/"+contract_name+".json")){
    let len = 0;
    let config = require("./build/contracts/"+contract_name+".json");
    for (let f of config.abi){
      if (f.type=="constructor"){
          console.log(f.inputs);
          len = f.inputs.length;
      }
    }
      // console.log("getArgsFromConf...");
    if (fs.existsSync("./configs/"+contract_name+".json")){
      let config = require("./configs/"+contract_name+".json");
      // console.log(config.contracts[0].values);
      // let ret =  config.contracts[0].values==undefined?(plist.length?plist:[]):(config.contracts[0].values.length==plist.length?config.contracts[0].values:plist);
      // console.log(ret);
      // return ret;
      if (len>0 && config.contracts[0].values && config.contracts[0].values.length==len)
        return config.contracts[0].values;
      else if (len==0)
              return  [];
           else
              return  undefined;
    }
    if (len==0)
            return  [];
    else
            return  undefined;
  }
  return undefined
}

function deploy(contracts, item) {
  if (fs.existsSync("./build/contracts/"+item.name+".json")&&require("./build/contracts/"+item.name+".json").bytecode=="0x"){
      item.deployed = true;
      deploy_level -= 1;
      return;
  }
  console.log(item);
  for(var lib of item.libs){
    let cntr_list = contracts.filter(obj => obj.name === lib);
    // console.log(cntr_list);
    for(var cntr of cntr_list){
      if (!cntr.deployed) {
          deploy(contracts, cntr);
      }
    }
  }

  let libArgsValues = '';
  let libArgs = item.libs.map(lib => {
    libArgsValues = libArgsValues.concat(`, ${lib}.address`);
    return libArgsValues;
  });
  if (nestingLevel == 0){
    let args = getArgsFromConf(item.name);
    if(args)
        libArgs = args.length==0?``: `,...`+JSON.stringify(args);
    else{
        console.log("Error:undefined constructor");
        return "Error:undefined constructor";
    }
  }
  /// the zero level, no return
  let putReturn = nestingLevel == 0 ? '\t' : '\t\treturn ';
  let putValue = item.name.indexOf('Attack_') !== -1 ? ', {value: web3.toWei(10000000000000, "ether")}' : '';
  let putCommon = nestingLevel == 0 ? '' : ';';
  let putThen = nestingLevel == 0 ? '\t.then(function() {\n' : (nestingLevel !== deploy_level -1? '\t}).then(function() {\n' : '\t});\n');

  let deployCmd = `${putReturn}deployer.deploy(${item.name}${libArgs}${putValue})${putCommon} \n`
      .concat(putThen);

  try{
    fs.appendFileSync(migrationFile, deployCmd);
  }
  catch(err){
    console.log(err);
  }
  nestingLevel++;
  item.deployed = true;
}

/// generate the deploy configure
function generateMigration(attackersNum) {
    let contracts = contract_depen.map(cntr => {
      return {name : cntr.name, libs : cntr.libs, deployed : false};
    });
    /// all relevant contract names
    var cntr_name_list = [];
    var cntr_name_set = new Set()
    cntr_name_list.push(target_name);
    cntr_name_set.add(target_name);
    while(cntr_name_list.length !== 0){
      var cntr_name = cntr_name_list.pop();
      var cntr_list = contracts.filter(cntr => cntr.name === cntr_name);
      for(var cntr of cntr_list){
        var cntr_libs = cntr.libs;
        for(var cntr_lib of cntr_libs){
          if(!cntr_name_set.has(cntr_lib)){
            cntr_name_list.push(cntr_lib);
            cntr_name_set.add(cntr_lib);
          }
        }
      }
    }

    /// add to the contracts for deploying
    contracts = contracts.filter(contract => cntr_name_set.has(contract.name));
    for(var cntrname of cntr_name_set){
      if (!contracts.some(contract => contract.name === cntrname)){
        contracts.push({name: `${cntrname}`, libs: [], deployed: false});
      }
    }

    for (i = 0; i < attackersNum; i++) {
      contracts.push({name: `Attack_${target_name}${i}`, libs: [1].fill(target_name), deployed: false});
      cntr_name_set.add(`Attack_${target_name}${i}`);
    }
    migration_index += 1;
    migrationFile = `${migrPath}/${migration_index}_deploy_${target_name}.js`;
    nestingLevel = 0;
    deploy_level = cntr_name_set.size;

    let migrationCode = '';
    for(var cntrname of cntr_name_set){
      migrationCode = migrationCode.concat(`const ${cntrname} = artifacts.require("${cntrname}"); \n`);
    }

    migrationCode = migrationCode.concat(`\nmodule.exports = function(deployer) { \n`);
    // fs.truncateSync(migrationFile, 0, function(){});
    fs.writeFileSync(migrationFile, '');
    try{
      fs.appendFileSync(migrationFile, migrationCode);
    }
    catch(err){
      console.log(err);
    }
    contracts.forEach(function(item){
      if(!item.deployed)
        deploy(contracts, item);
    });

    try{
      fs.appendFileSync(migrationFile, '}');
    }
    catch(err){
      console.log(err);
    }
}

/// generate the attack contract, and its deploy configure
function compileContracts (target_name) {
  let genFuns = target_genFuns.map(objFun => generateGenFuns(objFun)).join('');
  let payFuns = target_payFuns.map(objFun => generatePayFuns(objFun)).join('');
  let fallback_list = filterForFallback();

  fallback_list.map(objFun => generateFallbackFuns(objFun)).reduce(function (acc, objFun, index) {
    fs.writeFileSync(`${solPath}/Attack_${target_name}${index}.sol`, generateConstructor(target_name, index) + genFuns + payFuns + objFun);
    // console.log(`Attack contract ${target_name}${index} is saved!`);
  }, {});

  /// generate its deploy configure
  generateMigration(fallback_list.length);
}


function fileDisplay(filePath){
  // console.log(g_tokens);
  try{
    // var files = fs.readdirSync(filePath);
    var files = g_tokens;
    var file_index = 0;
    var file_len = files.length;
    while(file_index < file_len){
      var filename = files[file_index];
      /**
       * filename ADCToken.sol -> ADCToken.json
       */
      filename = filename.split(".")[0]+".json"
      var filedir = path.join(filePath, filename);
      // console.log(filedir);
      if( !fs.existsSync(filedir) ){
        file_index += 1;
        continue;
      }
      var stats = fs.statSync(filedir);
      var isFile = stats.isFile();
      var isDir = stats.isDirectory();
      if(isFile){
        if(filedir.indexOf('/Migrations.json') === -1){
          var ext_index = filedir.lastIndexOf('.');
          if(ext_index !== -1){
            var file_ext = filedir.slice(ext_index +1);
            if(file_ext === 'json'){
              attackGen(filedir);
            }
          }
        }
        else{
          /// only genrate the migration configure for "Migration.sol"
          generateInitialMigration()
        }
      }
      else if(isDir){
        fileDisplay(filedir);
      }
      file_index += 1;
    }
  }
  catch(err){
    console.log(err);
  }
}

function getDependencies (filePath) {
  var json_list = fs.readdirSync(filePath);
  let compiledContracts = json_list.map(filename => {
    var filedir = path.join(filePath, filename);
    var parsedFile = JSON.parse(fs.readFileSync(filedir));
    var ast = parsedFile.ast.nodes.filter(obj => obj.contractKind === 'contract').map(node => {
        var astnode = {name: node.name, nodes: node.nodes};
        return astnode;
    });
    // find the global variable, which is a contract variable
    var filter_ast_global = ast.map(node => {return {name : node.name, libs: node.nodes.filter(obj => obj.nodeType === 'VariableDeclaration'
                      && obj.typeDescriptions.typeString.indexOf('contract') !== -1) }}).filter(obj => obj.libs.length !== 0);
    filter_ast_global = filter_ast_global.map(node => {return {name: node.name, libs: node.libs.map(lib => {return lib.typeName.name})}});
    // find the local variable, which is a contract variable
    var filter_ast_local = ast.map(node => {return {name : node.name, libs: node.nodes.filter(obj => (obj.body !== undefined 
                      && obj.body !== null && obj.body.statements !== undefined && obj.body.statements !== null)).map(obj => {
                        var libName = [];
                        var statements = obj.body.statements.filter(stmt => stmt.declarations !== undefined && stmt.declarations !== null)
                        for(var statement of statements){
                          var declrs = statement.declarations.filter(declr => declr.nodeType === 'VariableDeclaration' && declr.typeDescriptions.typeString.indexOf('contract') !== -1);
                          for(var declr of declrs){
                            var name = declr.typeDescriptions.typeString.slice(9);
                            libName.push(name);
                          }
                        }
                        return libName;
                      }).filter(innernode => innernode.length !== 0)
                    }}).filter(obj => obj.libs.length !== 0);

    filter_ast_local = filter_ast_local.map(node => {return {name : node.name, libs: node.libs.reduce((new_lib, sub_lib) => {
      return new_lib = [...new_lib, ...sub_lib];
      })
    }});

    var new_ast = [];
    for(var astnode of filter_ast_global){
      var astnode_found = false;
      for(var new_astnode of new_ast){
        if(astnode.name === new_astnode.name){
          for(var lib of astnode.libs){
            /// the variable's type is contract itself
            if(astnode.name !== lib){
              var lib_found = false;
              for(var new_lib of new_astnode.libs){
                if(lib === new_lib){
                  lib_found = true;
                  break;
                }
              }
              if(!lib_found){
                new_astnode.libs.push(lib);
              }
            }
          }
          astnode_found = true;
          break;
        }
      }
      if(!astnode_found){
        var index = -1;
        for(var i =0; i < astnode.libs.length; i++){
          if(astnode.name === astnode.libs[i]){
            index = i;
            break;
          }
        }
        if(index !== -1){
          astnode.libs.splice(index);
        }
        new_ast.push(astnode);
      }
    }

    for(var astnode of filter_ast_local){
      var astnode_found = false;
      for(var new_astnode of new_ast){
        if(astnode.name === new_astnode.name){
          for(var lib of astnode.libs){
            /// the variable's type is contract itself
            if(astnode.name !== lib){
              var lib_found = false;
              for(var new_lib of new_astnode.libs){
                if(lib === new_lib){
                  lib_found = true;
                  break;
                }
              }
              if(!lib_found){
                new_astnode.libs.push(lib);
              }
            }
          }
          astnode_found = true;
          break;
        }
      }
      if(!astnode_found){
        var index = -1;
        for(var i =0; i < astnode.libs.length; i++){
          if(astnode.name === astnode.libs[i]){
            index = i;
            break;
          }
        }
        if(index !== -1){
          astnode.libs.splice(index);
        }
        new_ast.push(astnode);
      }
    }
    new_ast = new_ast.filter(obj => obj.libs.length !== 0);
    return new_ast;
    // return filter_ast.map(node =>{return {name: node.name, libs: node.libs.map(lib => {return lib.typeName.name})}});
  }).filter(contract => contract.length !== 0);

  let mergedContracts = {};
  compiledContracts.forEach(contract_list => {
    contract_list.forEach(contract => {
      const previousContractLibs = mergedContracts[contract.name] || [];
      mergedContracts[contract.name] = [...previousContractLibs, ...contract.libs].filter((lib, libIndex, self) => self.indexOf(lib) === libIndex);
    });
  });

  let uniqueDependencies = [];
  compiledContracts.forEach(contract_list => {
    contract_list.forEach((contract, index) => {
      let previousContract = uniqueDependencies.find(mergedContract => mergedContract.name === contract.name);
      if (!previousContract) {
          uniqueDependencies.push({ name: contract.name, libs: contract.libs });
          return;
      }
      previousContract.libs = [...previousContract.libs, ...contract.libs].filter((lib, libIndex, self) => self.indexOf(lib) === libIndex);
    });
  });
  return uniqueDependencies;
}

function attackGen(filedir){
  var target_json = filedir;
  var target_abs = JSON.parse(fs.readFileSync(target_json));

  target_name = target_abs.contractName;
  console.log("Generate the attack contract for: " + target_name);
  target_file = target_abs.sourcePath;
  target_genFuns = target_abs.abi.filter(obj => (!obj.constant && !obj.payable && obj.type === 'function'));
  target_payFuns = target_abs.abi.filter(obj => (!obj.constant && obj.payable && obj.type === 'function'));
  var target_bytecode = target_abs.bytecode;
  if(target_bytecode !== "0x"){
    compileContracts(target_name);   
  }
}

function delDir(dirPath){
  let files = [];
  if(fs.existsSync(dirPath)){
    files = fs.readdirSync(dirPath);
    files.forEach((file, index) => {
      let curPath = dirPath + "/" + file;
      if(fs.statSync(curPath).isDirectory()){
          delDir(curPath); 
      } 
      else {
          fs.unlinkSync(curPath); 
      }
    });
    fs.rmdirSync(dirPath);
  }
  fs.mkdirSync(dirPath);
}

function compileFile(){
  var compile_cmd = `truffle compile`;
  var execSync = require('child_process').execSync;
  execSync(compile_cmd,{stdio: 'inherit'});
}
let g_tokens;
function get_token_names(token_dir){
  g_tokens =  fs.readdirSync(token_dir);
  return g_tokens;
}


get_token_names("./contracts/")
/// clear the directory avoiding 
delDir(jsonPath);
delDir(migrPath);
/// use truffle compile the contracts
compileFile();
/// filePath includesjson files, which is compiled from sol
/// find the contracts, which this contract depends on, for example, use that contract as variable
contract_depen = getDependencies(jsonPath);
console.log("This is the dependence information: ");
console.log(contract_depen);
fileDisplay(jsonPath);

