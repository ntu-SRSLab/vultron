const path = require('path'); 
const express = require('express');
const app = express();
const port = 3000 || process.env.PORT;
const fuzzer = require('./connection/ethereum/fuzzer.js');
const bodyParser = require('body-parser');
const sleep = require("sleep");
const async = require("async");
const shell = require("shelljs");
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


async function test(source_target, source_attack, build_target,build_attack) {
    sleep.sleep(10);
    let answer = await fuzzer.load(build_target, build_attack, source_target, source_attack);
    if (typeof answer.accounts === 'undefined')
        throw "Error loading contracts";
    answer = await  fuzzer.seed();
    if (typeof answer.callFuns === 'undefined')
        throw "Error running seed.";
    return `${source_target}  will be tested against  ${source_attack}`;
}


app.post('/fuzz', bodyParser.json(), (req, res) => {
    // mutex.lock(async function() {
    console.log("**** POST /fuzz ****");
    console.log(req.body);
    var txHash = req.body.hash;
    var trace = req.body.trace;
    /// cannot filter the hash here,
    /// we must call fuzzer.fuzz, otherwise will be blocked
    fuzzer.fuzz(txHash, trace)
        .then((answer) => {
            res.send(answer);
        }).catch((e) => {
            console.error(e);
            console.trace("show fuzzing error");
            // res.send(e);
        });
});

let ipcprovider = path.join(shell.pwd().toString(), "..", 'AlethWithTraceRecorder/bootstrap-scripts/aleth-ethereum/Ethereum/geth.ipc');
fuzzer.setIPCProvider(ipcprovider);
fuzzer.unlockAccount();

app.listen(port, () => {
    console.log("Express Listening at http://localhost:" + port);
});


let source="BountyHunt";
let attack = "Attack_BountyHunt0";
test(path.join("./contracts",source+".sol"), path.join("./contracts", attack+".sol"), path.join("./build/contracts", source+".json"), path.join("./build/contracts", attack+".json"))
    .then(answer=>{
        console.log(answer)
    }).catch(err=>{
        console.error(err);
        console.trace("show testing error");
})
