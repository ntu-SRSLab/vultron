const path = require('path'); 
const express = require('express');
const app = express();
const port = 3000 || process.env.PORT;
const fuzzer = require('./connection/ethereum/fuzzer.js');
const bodyParser = require('body-parser');
const assert = require("assert");
const sleep = require("sleep");
const shell = require("shelljs");
const { exec } = require('child_process');
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



let benchmarks = shell.ls("./benchmark");
const EventEmitter = require('events');
class MyEmitter extends EventEmitter {}
const myEmitter = new MyEmitter();
let  benchmark_index = 0;
let  attack_index = 0;
let source_target;
let source_attacks=[];
let  canStartFuzz = false;
async function test(source_target, source_attack, build_target,build_attack) {
    console.log(source_target, source_attack );
    // sleep.sleep(10);
    let answer = await fuzzer.load(myEmitter, build_target, build_attack, source_target, source_attack);
    if (typeof answer.accounts === 'undefined')
        throw "Error loading contracts";
    // console.log(answer);
    answer = await  fuzzer.seed();
    if (typeof answer.callFuns === 'undefined')
        throw "Error running seed.";
    return `${source_target}  will be tested against  ${source_attack}`;
}
myEmitter.on('eventCopyBenchmark', () => {
    if(benchmark_index >=benchmarks.length)
        return;
    let benchmark = benchmarks[benchmark_index++];
    console.log(benchmark);
    shell.rm("-rf","./contracts");
    shell.rm("-rf","./migrations");
    shell.cp("-r", path.join("./benchmark", benchmark.toString(), "contracts"), "./");
    shell.cp("-r", path.join("./benchmark", benchmark.toString(), "migrations"), "./");
    source_target = undefined;
    source_attacks=[];
    let contracts = shell.ls("./contracts");
    for (let contract of contracts){
        if(contract.toString().indexOf("Attack_")!=-1)
                source_attacks.push(contract.toString().split(".sol")[0]);
        else if(contract.toString().indexOf("Migration")==-1){
                source_target = contract.toString().split(".sol")[0];
        }
    }
    console.log("target: ",source_target);
    console.log("attack: ", source_attacks);
    attack_index = 0;
    myEmitter.emit("eventDeployBenchmark");
});
myEmitter.on('eventDeployBenchmark', ()=>{
    exec("./utils/startTruffle.sh", {timeout:3*60*1000}, function(error, stdout, stderr) {
        if(error)
                console.log('error:', error);
        if(stdout)
                console.log('Program output:', stdout);
        if(stderr)
                console.log('Program stderr:', stderr);
        myEmitter.emit("eventTestBenchmark");
      });
});
myEmitter.on('eventTestBenchmark', ()=>{
   if(attack_index >= source_attacks.length){
        canStartFuzz = false;
//        myEmitter.emit("eventCopyBenchmark");
        return;
   }
   canStartFuzz = true;
   test(path.join("./contracts",source_target+".sol"), path.join("./contracts", source_attacks[attack_index]+".sol"), path.join("./build/contracts", source_target+".json"), path.join("./build/contracts", source_attacks[attack_index]+".json"))
    .then(answer=>{
        console.log(answer)
    }).catch(err=>{
        console.error(err);
        console.trace("show testing error");
    })
    attack_index ++;
});

app.post('/fuzz', bodyParser.json(), (req, res) => {
    if(req.body&&req.body.address =="0x0000000000000000000000000000000000000000" ){
        console.log("catch a contract creation transaction");
        return;
    }
    console.log("**** POST /fuzz ****");
    console.log(req.body);
    var txHash = req.body.hash;
    var trace = req.body.trace;
    fuzzer.fuzz(txHash, trace)
        .then((answer) => {
            res.send(answer);
        }).catch((e) => {
            console.error(e);
            console.trace("show fuzzing error");
        });
});

let ipcprovider = path.join(shell.pwd().toString(), "..", 'AlethWithTraceRecorder/bootstrap-scripts/aleth-ethereum/Ethereum/geth.ipc');
fuzzer.setIPCProvider(ipcprovider);
fuzzer.unlockAccount();
let source="BountyHunt";
let attack = "Attack_BountyHunt0";
function parse_cmd() {
    let args = process.argv.slice(2, process.argv.length);
    assert(args.length ==2, `there must be two arguments like: {target} {attack} --- where target and attack are contract names.`)
    source = args[0].split(".")[0];
    attack = args[1].split(".")[0];
}
parse_cmd();
app.listen(port, () => {
    console.log("Express Listening at http://localhost:" + port);
    // myEmitter.emit("eventCopyBenchmark");
    test(path.join("./contracts",source+".sol"), path.join("./contracts", attack+".sol"), path.join("./build/contracts", source+".json"), path.join("./build/contracts", attack+".json"))
    .then(answer=>{
        console.log(answer)
    }).catch(err=>{
        console.error(err);
        console.trace("show testing error");
   });
});
