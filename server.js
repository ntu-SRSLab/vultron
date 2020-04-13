const contract = require('truffle-contract');
const request = require("request");
const fs = require("fs");

const express = require('express');
const app = express();
const port = 3000 || process.env.PORT;
const Web3 = require('web3');
const ethereum_fuzzer = require('./connection/ethereum/fuzzer.js');

const FiscoFuzzer = require('./connection/fisco/fuzzer.js').FiscoFuzzer;
let fiscoFuzzer = new FiscoFuzzer(0);

const bodyParser = require('body-parser');
const multer = require('multer');
var storage = multer.diskStorage({
    // destination: function (req, file, cb) {
    //   cb(null, './uploads')
    // },
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

let g_path_map = new Map();
let g_keys_iterator;
let g_key_cur;
let g_value_cur;
let g_value_cur_cursor;
let g_bootstrap_build_target = './build/contracts/SimpleDAO.json';
let g_bootstrap_build_attack = './build/contracts/AttackDAO.json';
let g_bootstrap_source_attack = './contracts/SimpleDAO.sol';
let g_bootstrap_source_target = './contracts/AttackDAO.sol';

let default_option = {
    fuzzer: fiscoFuzzer,
    server: "",
    port: "",
    directory: "",
    file: "",
    configuration: null
};

function init_g_path_map() {
    let contracts = fs.readdirSync("./build/contracts");
    let tokens = new Array();
    for (let item of contracts) {
        if (item.indexOf("Attack_") == -1) {
            if (fuzzer.test_deployed("./build/contracts/" + item))
                tokens.push(item);
        }
    }
    // console.log(tokens);
    for (let token of tokens) {
        let value = new Array();
        for (let item of contracts) {
            if (item.indexOf("Attack_") != -1) {
                if (item.indexOf("Attack_" + token.split(".json")[0]) != -1) {
                    value.push(item);
                    //  console.log(token,item);
                }
            }
        }
        if (value.length > 0)
            g_path_map.set(token, value);
    }
    g_keys_iterator = g_path_map.keys();
    let cur = g_keys_iterator.next();
    if (cur != undefined) {
        g_key_cur = cur.value;
        g_value_cur = g_path_map.get(g_key_cur);
        g_value_cur_cursor = 0;
        // console.log(g_key_cur);
    }
    //  console.log(g_path_map);
    getBlockNumber
}

function bootstrap() {
    console.log(g_value_cur);
    if (g_value_cur.length > g_value_cur_cursor) {
        g_bootstrap_build_target = "./build/contracts/" + g_key_cur;
        g_bootstrap_build_attack = "./build/contracts/" + g_value_cur[g_value_cur_cursor];
        g_bootstrap_source_target = "./contracts/" + g_key_cur.split(".json")[0] + ".sol";
        g_bootstrap_source_attack = "./contracts/" + g_value_cur[g_value_cur_cursor].split(".json")[0] + ".sol";
        g_value_cur_cursor += 1;
    } else {
        let cur = g_keys_iterator.next();
        if (cur) {
            g_key_cur = cur.value;
            g_value_cur = g_path_map.get(g_key_cur);
            g_value_cur_cursor = 0;
            g_bootstrap_build_target = "./build/contracts/" + g_key_cur;
            g_bootstrap_build_attack = "./build/contracts/" + g_value_cur[g_value_cur_cursor];
            g_bootstrap_source_target = "./contracts/" + g_key_cur.split(".json")[0] + ".sol";
            g_bootstrap_source_attack = "./contracts/" + g_value_cur[g_value_cur_cursor].split(".json")[0] + ".sol";
            g_value_cur_cursor += 1;
        }
    }
}

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({
    limit: '50mb',
    extended: false
}));

// parse application/json
app.use(bodyParser.json({
    limit: '50mb'
}));

// set the view engine to ejs
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    console.log("**** GET / ****");
    res.render('index.ejs');
});

app.get('/fisco', (req, res) => {
    console.log("**** GET /fisco ****");
    fiscoFuzzer.test().then((success) => {
        res.send("connection success");
    });
});
let hello_contract_path = "./Vultron-Fisco/fisco/HelloWorld.sol"
let contract_path = "./Vultron-Fisco/fisco/wecredit/Account.sol"
let compiled_dir = "./deployed_contract/wecredit";
let accountcontroller = "./Vultron-Fisco/fisco/wecredit/AccountController.sol";
let creditcontroller = "./Vultron-Fisco/fisco/wecredit/CreditController.sol"
app.get('/fisco-deploy', (req, res) => {
    console.log("**** GET /fisco-deploy ****");
    fiscoFuzzer.deploy_contract(hello_contract_path).then((answer) => {
        console.log(answer);
        res.send(hello_contract_path + " was deployed with address " + answer);
    }).catch(e => {
        console.log(e);
        res.render('error.ejs', {
            message: e
        });
    });
});
app.get('/fisco-deploy-wecredit', (req, res) => {
    console.log("**** GET /fisco-deploy-wecredit ****");
    fiscoFuzzer.deploy_contract_precompiled(accountcontroller, compiled_dir)
        .then((address) => {
            console.log(accountcontroller, address);
            let info = accountcontroller + " was deployed with address " + address;
            fiscoFuzzer.deploy_contract_precompiled_params(creditcontroller, compiled_dir, "CreditController(address)", [address])
                .then((address) => {
                    console.log(creditcontroller, address);
                    res.send(info + "</br>" + creditcontroller + " was deployed with address " + address);
                })
        }).catch(e => {
            console.log(e);
            console.trace();
            res.render('error.ejs', {
                message: e
            });
        });
});
app.get('/fisco-deploy-precompiled', (req, res) => {
    console.log("**** GET /fisco-deploy-precompiled ****");
    fiscoFuzzer.deploy_contract_precompiled_params(contract_path, compiled_dir,
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

app.get('/fisco-call', (req, res) => {
    console.log("**** GET /fisco-call ****");
    fiscoFuzzer.call_contract(contract_path, "get()", null).then((answer) => {
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
app.get('/fisco-get', (req, res) => {
    console.log("**** GET /fisco-get ****");
    fiscoFuzzer.get_instance(contract_path).then((instances) => {
        res.send(contract_path + " was instantialized with " + instances.length + " entities:" + JSON.stringify(instances));
    }).catch(e => {
        console.log(e);
        res.render('error.ejs', {
            message: e
        });
    });
});

app.get('/load-default', (req, res) => {
    console.log("**** GET /load-default ****");

    fuzzer.load(g_bootstrap_build_target,
            g_bootstrap_build_attack,
            g_bootstrap_source_target,
            g_bootstrap_source_attack)
        .then((answer) => {
            if (typeof answer.accounts === 'undefined')
                throw "Error loading contracts";
            // console.log(JSON.stringify(answer));
            res.render('contracts.ejs', {
                accounts: answer.accounts,
                target_adds: answer.target_adds,
                attack_adds: answer.attack_adds,
                target_abi: JSON.stringify(answer.target_abi),
                attack_abi: JSON.stringify(answer.attack_abi)
            });
        }).catch(e => {
            res.render('error.ejs', {
                message: e
            });
        });
});

app.get('/find', (req, res) => {
    console.log("**** GET /find ****");
    fuzzer.find('./build/contracts/SimpleDAO.json',
            './contracts/SimpleDAO.sol')
        .then((answer) => {
            if (typeof answer.callFun === 'undefined')
                throw "Error finding the bookkeeping variables";

            res.render('bookvar.ejs', {
                callFun: answer.callFun,
                status: answer.execResults,
                bookkeepingVar: answer.bookkeepingVar
            });
        }).catch((e) => {
            res.render('error.ejs', {
                message: e
            });
        });
});

app.get('/seed', (req, res) => {
    console.log("**** GET /seed ****");
    fuzzer.seed()
        .then((answer) => {
            if (typeof answer.callFuns === 'undefined')
                throw "Error running seed.";

            res.render('seeds.ejs', {
                callFuns: answer.callFuns,
                status: answer.execResults
            });
        }).catch((e) => {
            res.render('error.ejs', {
                message: e
            });
        });
});

app.get('/reset', (req, res) => {
    console.log("**** GET /reset ****");
    fuzzer.reset()
        .then((answer) => {
            res.send(answer);
        }).catch((e) => {
            res.render('error.ejs', {
                message: e
            });
        });
});

app.post('/load', upload.array('contract', 4), (req, res) => {
    console.log("**** POST /load ****");
    // console.log(req.files);

    var source_target = req.files[0].path;
    var source_attack = req.files[1].path;
    var build_target = req.files[2].path;
    var build_attack = req.files[3].path;

    fuzzer.load(build_target,
            build_attack,
            source_target,
            source_attack)
        .then((answer) => {
            if (typeof answer.accounts === 'undefined')
                throw "Error loading contracts";
            // console.log(JSON.stringify(answer));
            res.render('contracts.ejs', {
                accounts: answer.accounts,
                target_adds: answer.target_adds,
                attack_adds: answer.attack_adds,
                target_abi: JSON.stringify(answer.target_abi),
                attack_abi: JSON.stringify(answer.attack_abi)
            });
        }).catch(e => {
            res.render('error.ejs', {
                message: e
            });
        });
});

app.post('/fuzz', bodyParser.json(), (req, res) => {
    // mutex.lock(async function() {
    console.log("**** POST /fuzz ****");
    var txHash = req.body.hash;
    var trace = req.body.trace;
    /// cannot filter the hash here,
    /// we must call fuzzer.fuzz, otherwise will be blocked
    fuzzer.fuzz(txHash, trace)
        .then((answer) => {
            res.send(answer);
        }).catch((e) => {
            res.send(e);
        });
    // });
});

app.get('/bootstrap', (req, RES) => {
    // mutex.lock(async function() {
    console.log("**** GET /bootstrap ****");
    fuzzer.setStart_time(Date.now());
    bootstrap();
    // console.log(g_bootstrap_build_target);
    // console.log(g_bootstrap_build_attack);

    request(`http://localhost:${port}/load-default`, (error, res, body) => {
        if (error) {
            console.error(error);
            return;
        }
        // RES.send(g_bootstrap_build_target);
        request(`http://localhost:${port}/seed`, (error, res, body) => {
            if (error) {
                console.error(error);
                return;
            }
            console.log("Fuzzing...:",
                g_bootstrap_build_target,
                g_bootstrap_build_attack);
            RES.send(g_bootstrap_build_target + "\n" + g_bootstrap_build_attack);
        });
        // request(`http://localhost:${port}/find`, (error, res, body) => {
        //     if (error) {
        //       console.error(error);
        //       return;
        //     }
        // });
    });
});

// default RPC address
let httpRpcAddr = "http://127.0.0.1:8546";

function parse_cmd() {
    let args = process.argv.slice(2, process.argv.length);

    if (args.length == 2) {
        let i = 0;
        while (i < 2) {
            if (args[i].indexOf("--gethrpcport") == 0) {
                httpRpcAddr = args[i + 1];
                console.log(httpRpcAddr);
            }
            i += 2;
        }

        init_g_path_map();
        fuzzer.setStart_time(Date.now());
        fuzzer.single_timeout(port);
    }
}

parse_cmd();
//fuzzer.setProvider(httpRpcAddr);
//fuzzer.unlockAccount();

app.listen(port, () => {
    console.log("Express Listening at http://localhost:" + port);
});
