const contract = require('truffle-contract');
const request = require("request");
const fs = require("fs");

const express = require('express');
const app = express();
const port = 3000 || process.env.PORT;
const Web3 = require('web3');
const truffle_connect = require('./connection/fuzzer.js');
const bodyParser = require('body-parser');

const locks = require('locks');
// mutex
const mutex = locks.createMutex();

let g_path_map = new Map()
let g_keys_iterator;
let g_key_cur;
let g_value_cur;
let g_value_cur_cursor;

let g_bootstrap_build_target = '../build/contracts/AICToken.json';
let g_bootstrap_build_attack = '../build/contracts/Attack_AICToken0.json';
let g_bootstrap_source_attack = './contracts/AICToken.sol';
let g_bootstrap_source_target = './contracts/Attack_AICToken0.sol';


function init_g_path_map(){
  let contracts =  fs.readdirSync("./build/contracts");
  let tokens = new Array();
  for(let item of contracts){
    if (item.indexOf("Attack_")==-1){
        if (truffle_connect.test_deployed("../build/contracts/"+item))
            tokens.push(item);
    }
  }
  // console.log(tokens);
  for (let token of tokens){
      let value = new Array();
      for (let item of contracts){
        if (item.indexOf("Attack_")!=-1){
            if (item.indexOf("Attack_"+token.split(".json")[0])!=-1){
                 value.push(item);
                //  console.log(token,item);
            }
         }   
      }
      if (value.length>0)
        g_path_map.set(token,value);
  }
  g_keys_iterator = g_path_map.keys();
  let cur = g_keys_iterator.next();
  if(cur!=undefined){
    g_key_cur = cur.value;
    g_value_cur = g_path_map.get(g_key_cur);
    g_value_cur_cursor = 0;
    // console.log(g_key_cur);
  }
//  console.log(g_path_map);
}

function bootstrap(){
    // console.log(g_value_cur);
    if(g_value_cur.length>g_value_cur_cursor){
      g_bootstrap_build_target = "../build/contracts/"+g_key_cur;
      g_bootstrap_build_attack = "../build/contracts/"+g_value_cur[g_value_cur_cursor];
      g_bootstrap_source_target = "./contracts/"+g_key_cur.split(".json")[0]+".sol";
      g_bootstrap_source_attack = "./contracts/"+g_value_cur[g_value_cur_cursor].split(".json")[0]+".sol";
      g_value_cur_cursor +=1;
    }else{
      let cur = g_keys_iterator.next();
      if(cur){
        g_key_cur = cur.value;
        g_value_cur = g_path_map.get(g_key_cur);
        g_value_cur_cursor = 0;
        g_bootstrap_build_target = "../build/contracts/"+g_key_cur;
        g_bootstrap_build_attack = "../build/contracts/"+g_value_cur[g_value_cur_cursor];
        g_bootstrap_source_target = "./contracts/"+g_key_cur.split(".json")[0]+".sol";
        g_bootstrap_source_attack = "./contracts/"+g_value_cur[g_value_cur_cursor].split(".json")[0]+".sol";
        g_value_cur_cursor +=1;
      }
  }
  
}




// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({limit: '50mb', extended: false}));

// parse application/json
app.use(bodyParser.json({limit: '50mb'}));

// set the view engine to ejs
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
  console.log("**** GET / ****");
  res.render('index.ejs');
});

app.get('/load', (req, res) => {
  console.log("**** GET /load ****");
 
  truffle_connect.load(g_bootstrap_build_target,
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
  truffle_connect.find('../build/contracts/SimpleDAO.json',
    './contracts/SimpleDAO.sol')
    .then((answer) => {
      if (typeof answer.callFun === 'undefined')
        throw "Error finding the bookkeeping variables";

      res.render('bookvar.ejs', {
        callFun : answer.callFun,
        status : answer.execResults,
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
  truffle_connect.seed()
    .then((answer) => {
      if (typeof answer.callFuns === 'undefined')
        throw "Error running seed";
      
      res.render('seeds.ejs', {
        callFuns : answer.callFuns,
        status : answer.execResults
      });
    }).catch((e) => {
      res.render('error.ejs', {
        message: e
      });
    });
});

app.get('/reset', (req, res) => {
  console.log("**** GET /reset ****");
  truffle_connect.reset()
    .then((answer) => {
      res.send(answer);
    }).catch((e) => {
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
  /// we must call truffle_connect.fuzz, otherwise will be blocked
  truffle_connect.fuzz(txHash, trace)
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
  truffle_connect.setStart_time(Date.now());
  bootstrap();
  // console.log(g_bootstrap_build_target);
  // console.log(g_bootstrap_build_attack);
  
  request(`http://localhost:${port}/load`, (error, res, body) => {
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
                  console.log("Fuzzing...:",g_bootstrap_build_target,g_bootstrap_build_attack);
                  RES.send(g_bootstrap_build_target+"\n"+g_bootstrap_build_attack);
                });
            // request(`http://localhost:${port}/find`, (error, res, body) => {
            //     if (error) {
            //       console.error(error);
            //       return;
            //     }
              
            // });
   });

});

function parse_cmd() {
  let args = process.argv.slice(2,process.argv.length);
  let httpRpcAddr =  "http://127.0.0.1:8546";
  if (args.length==2){
      let i=0;
      while(i<2){
         if (args[i].indexOf("--gethrpcport")==0){
          httpRpcAddr = args[i+1]; 
          console.log(httpRpcAddr);
        }
        i += 2;
      }
  }
  truffle_connect.setProvider(httpRpcAddr);
  truffle_connect.unlockAccount(); 
}
init_g_path_map();
parse_cmd();
truffle_connect.setStart_time(Date.now());
truffle_connect.single_timeout(port);
app.listen(port, () => {
  console.log("Express Listening at http://localhost:" + port);
});
