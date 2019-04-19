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

// // parse application/x-www-form-urlencoded
// app.use(bodyParser.urlencoded({extended: false}));

// // parse application/json
// app.use(bodyParser.json());

// set the view engine to ejs
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
  console.log("**** GET / ****");
  res.render('index.ejs');
});

app.get('/load', (req, res) => {
  console.log("**** GET /load ****");
  truffle_connect.load('../build/contracts/SimpleDAO.json',
                       '../build/contracts/AttackDAO.json',
                       './contracts/SimpleDAO.sol',
                       './contracts/Attack.sol')
    .then((answer) => {
      if (typeof answer.accounts === 'undefined')
        throw "Error loading contracts";
      
      res.render('contracts.ejs', {
        accounts: answer.accounts,
        target_adds: answer.target_adds,
        attack_adds: answer.attack_adds,
        target_abi: JSON.stringify(answer.target_abi),
        attack_abi: JSON.stringify(answer.attack_abi)
      });
    }).catch((e) => {
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

app.listen(port, () => {
  truffle_connect.web3 =
    new Web3(new Web3.providers.HttpProvider("http://localhost:8546"));
  
  console.log("Express Listening at http://localhost:" + port);
});
