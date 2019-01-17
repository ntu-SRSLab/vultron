var fs = require('fs');
var path = require('path');
 
var filePath = path.resolve('./');
var contract_index = 2;

function fileDisplay(filePath){
  var files = fs.readdirSync(filePath);
  var file_index = 0;
  var file_len = files.length;
  while(file_index < file_len){
    var filename = files[file_index];
    var filedir = path.join(filePath, filename);
    var stats = fs.statSync(filedir);
    var isFile = stats.isFile();
    var isDir = stats.isDirectory();
    if(isFile){
      var ext_index = filedir.lastIndexOf('.');
      if(ext_index !== -1){
        var file_ext = filedir.slice(ext_index +1);
        if(file_ext === 'sol'){
          compileFile(filedir);
        }
      }
    }
    else if(isDir){
      fileDisplay(filedir);
    }


    file_index += 1;
  }
}


function generateMigration(target_name) {
  let migrationCode = `const ${target_name} = artifacts.require("${target_name}");\n`;
  migrationCode = migrationCode.concat(`module.exports = function(deployer) {
  deployer.deploy(${target_name}, {value: web3.toWei(10, "ether")});`);
  migrationCode = migrationCode.concat(`\n}`);
  fs.writeFileSync(`../migrations/${contract_index}_deploy_${target_name}.js`, migrationCode);
  contract_index += 1;
}

function compileFile(filedir){
  var compile_cmd = `solc --optimize --combined-json bin ${filedir}`;
  var execSync = require('child_process').execSync;
  var output = execSync(compile_cmd);
  var contracts = JSON.parse(output).contracts;
  for(var con_name in contracts){
    con_name = con_name.slice(con_name.lastIndexOf(':') +1);
    if(con_name !== 'Migrations'){
      generateMigration(con_name); 
    }
  }
}


fileDisplay(filePath)