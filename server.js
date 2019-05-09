const contract = require('truffle-contract');

const express = require('express');
const app = express();
const port = 3000 || process.env.PORT;
const Web3 = require('web3');
const truffle_connect = require('./connection/fuzzer.js');
const bodyParser = require('body-parser');

const locks = require('locks');
// mutex
const mutex = locks.createMutex();

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
 
  truffle_connect.load('../build/contracts/SimpleDAO.json',
                       '../build/contracts/Attack_SimpleDAO0.json',
                       './contracts/SimpleDAO.sol',
                       './contracts/Attack_SimpleDAO0.sol')
    .then((answer) => {
      if (typeof answer.accounts === 'undefined')
        throw "Error loading contracts";
      console.log(JSON.stringify(answer));
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
<<<<<<< HEAD
    });  
=======
    });

>>>>>>> fd3a399e5f3126a72bb77e986ffdb00ef041b102
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

parse_cmd();
app.listen(port, () => {
  console.log("Express Listening at http://localhost:" + port);
});
