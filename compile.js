const fs=require("fs");
const solc=require("solc");

var input = {
    'Credit.sol': fs.readFileSync('./Vultron-Fisco/fisco/wecredit/Credit.sol', 'utf8'),
    'CreditMap.sol': fs.readFileSync('./Vultron-Fisco/fisco/wecredit/CreditMap.sol', 'utf8'),
    'Account.sol': fs.readFileSync('./Vultron-Fisco/fisco/wecredit/Account.sol', 'utf8'),
    'AccountMap.sol': fs.readFileSync('./Vultron-Fisco/fisco/wecredit/AccountMap.sol', 'utf8'),
    'AccountController.sol': fs.readFileSync('./Vultron-Fisco/fisco/wecredit/AccountController.sol', 'utf8'),
	    'CommonLib.sol': fs.readFileSync('./Vultron-Fisco/fisco/wecredit/CommonLib.sol', 'utf8'),
};
let compiledContract = solc.compile({sources: input}, 1);
//console.log(compiledContract);
//console.log(typeof compiledContract.contracts);
//console.log( Object.keys(compiledContract.contracts));
for(let contract of Object.keys(compiledContract.contracts))
{
     let name = contract;
     let file_name = name.split(":")[0].split(".")[0];
     let contract_name = name.split(":")[1];
     if (file_name == contract_name)    
	{
	     console.log(file_name, " to compile");
	     let content = compiledContract.contracts[name];
	     if (!fs.existsSync("./deployed_contract/wecredit/")){
		     fs.mkdirSync("./deployed_contract/wecredit/");
	     }
	     let path ="./deployed_contract/wecredit/bin";
	     if (!fs.existsSync(path)){
		     fs.mkdirSync(path);
	     }
	     path ="./deployed_contract/wecredit/abi";
	     if (!fs.existsSync(path)){
		     fs.mkdirSync(path);
	     }
	     path ="./deployed_contract/wecredit/artifact";
	     if (!fs.existsSync(path)){
		     fs.mkdirSync(path);
	     }
	     console.log("./deployed_contract/wecredit/artifact/"+file_name +".artifact");
	     console.log("./deployed_contract/wecredit/bin/"+file_name +".bin");
	     console.log("./deployed_contract/wecredit/abi/"+file_name +".abi");
	     fs.writeFileSync("./deployed_contract/wecredit/artifact/"+ file_name+".artifact", JSON.stringify(content));
	     fs.writeFileSync("./deployed_contract/wecredit/bin/"+ file_name+".bin", content.bytecode);
	     fs.writeFileSync("./deployed_contract/wecredit/abi/"+ file_name+".abi", JSON.stringify(JSON.parse(content.interface)));
	     console.log("compiled");
	}
}
