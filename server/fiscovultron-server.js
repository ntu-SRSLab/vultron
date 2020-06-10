const contract = require('truffle-contract');
const request = require("request");
const fs = require("fs");

const express = require('express');
const app = express();
const port = 3001 || process.env.FISCOPORT;
const bodyParser = require('body-parser');
const multer = require('multer');
const shell = require("shelljs");
const compiler = require("./scripts/compile.js");
const FiscoStateMachineFuzzer = require('./connection/wecredit/creditControllerState.js').FiscoStateMachineFuzzer;
const FiscoDeployer = require("./connection/fisco/fuzzer").FiscoDeployer;

// start  fisco-bcos network
shell.exec("cd ../Vultron-FISCO-BCOS && ./quickstart.sh ");


var storage = multer.diskStorage({
    filename: function(req, file, cb) {
        cb(null, Date.now() + '_' + file.originalname)
    }
})
var upload = multer({
    storage: storage
});
const locks = require('locks');
// mutex
const mutex = locks.createMutex();


// parse application/json
app.use(bodyParser.json({
    limit: '50mb'
}));

// set the view engine to ejs
app.set('view engine', 'ejs');

let hello_contract_path = "./Vultron-Fisco/fisco/HelloWorld.sol"
let contract_path = "./Vultron-Fisco/fisco/wecredit/Account.sol"
let compiled_dir = "./deployed_contract/wecredit";
let accountcontroller = "./Vultron-Fisco/fisco/wecredit/AccountController.sol";
let creditcontroller = "./Vultron-Fisco/fisco/wecredit/CreditController.sol"
app.get('/', (req, res) => {
    console.log("**** GET / ****");
    res.render('index.ejs');
});
let deployer = FiscoDeployer.getInstance("./deployed_contract");
let fuzzer = FiscoStateMachineFuzzer.getInstance(1, "CreditController", __dirname);
app.get('/fisco', (req, res) => {
    console.log("**** GET", req.originalUrl, " ****");
    fuzzer.test().then((success) => {
        res.send("connection success");
    });
});
app.get('/fisco/compile/wecredit', (req, res) => {
   let compiled = compiler.compileWecredit();
    res.send(compiled);
});
app.get('/fisco/deploy/wecredit', (req, res) => {
    shell.rm("./deployed_contract/*/0x*")
    console.log("**** GET", req.originalUrl, " ****");
    // fuzzer.deploy_contract_precompiled(accountcontroller, compiled_dir)
    deployer.deploy_contract_precompiled("AccountController")
        .then((AccountCtr) => {
            console.log(accountcontroller, AccountCtr.address);
            fuzzer._send_tx({
                to: AccountCtr.address,
                fun: "registeAccount(bytes32,bytes32,bytes32,string)",
                param: ["0x0", "0x0", "0x0", "0xcaffee"]
            }, JSON.parse(fs.readFileSync("./deployed_contract/AccountController/AccountController.abi", "utf8"))).then((receipt) => {
                console.log(receipt);
              deployer.deploy_contract_precompiled_params("CreditController","CreditController(address)", [AccountCtr.address] )
                // fuzzer.deploy_contract_precompiled_params(creditcontroller, compiled_dir, "CreditController(address)", [AccountCtr.address])
                    .then((CreditCtr) => {
                        console.log(creditcontroller, CreditCtr.address);
                        res.render("deploy.ejs", {
                            contracts: [AccountCtr, CreditCtr],
                            status: "success"
                        });
                    })
            }).catch(e => {
                console.log(e);
                console.trace();
                res.render('error.ejs', {
                    message: e
                });
            });
        }).catch(e => {
            console.log(e);
            console.trace();
            res.render('error.ejs', {
                message: e
            });
        });

});
app.get('/fisco/load/wecredit', (req, res) => {
    async function test() {
        await fuzzer.test();
        let ret = await fuzzer.load("./deployed_contract/CreditController/CreditController.artifact",
            "./deployed_contract/CreditController",
            "./Vultron-Fisco-State/fisco/wecredit/CreditController.sol");
        return ret;
    }

    test().then((answer) => {
            if (typeof answer.accounts === 'undefined')
                throw "Error loading contracts";
            // console.log(JSON.stringify(answer));
            res.render('contracts.ejs', {
                accounts: answer.accounts,
                target_adds: answer.target_adds,
                target_abi: JSON.stringify(answer.target_abi),
                attack_adds: "NULL",
                attack_abi: "[]"
            });
            console.log("success");
        })
        .catch((e) => {
            res.render('error.ejs', {
                message: e
            });

            console.log(e);
            console.trace();
        });
});

app.get('/fisco/bootstrap/wecredit', (req, res) => {
    async function test() {
        await fuzzer.test();
        await fuzzer.load();
        let ret = await fuzzer.bootstrap();
        return ret;
    }

    test().then((answer) => {
            res.render('seeds.ejs', {
                callFuns: answer.callFuns,
                status: answer.execResults
            });
            console.log("success");
        })
        .catch((e) => {
            res.render('error.ejs', {
                message: e
            });

            console.log(e);
            console.trace();
        });
});
app.get('/fisco/deploy/precompiled', (req, res) => {
    console.log("**** GET", req.originalUrl, " ****");
    fuzzer.deploy_contract_precompiled_params(contract_path, compiled_dir,
        'Account(bytes32,bytes32,bytes32,string)', ["0x12", "0x2", "0x1", "0x43424efe34"]).
    then((answer) => {
        console.log(answer);
        res.send(contract_path + " was deployed with address " + answer);
    }).catch(e => {
        console.log(e);
        console.trace();
        res.render('error.ejs', {
            message: e
        });
    });
});

app.get('/fisco/call', (req, res) => {
    console.log("**** GET", req.originalUrl, " ****");
    fuzzer.call_contract(contract_path, "get()", null).then((answer) => {
        console.log(answer);
        res.send(contract_path + " was called with address " + JSON.stringify(answer));
    }).catch(e => {
        console.log(e);
        console.trace();
        res.render('error.ejs', {
            message: e
        });
    });
});
app.get('/fisco/get', (req, res) => {
    console.log("**** GET", req.originalUrl, " ****");
    fuzzer.get_instance(contract_path).then((instances) => {
        res.send(contract_path + " was instantialized with " + instances.length + " entities:" + JSON.stringify(instances));
    }).catch(e => {
        console.log(e);
        res.render('error.ejs', {
            message: e
        });
    });
});

app.listen(port, () => {
    console.log("Express Listening at http://localhost:" + port);
});
