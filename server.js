const express = require('express');
const app = express();
const port = 3000 || process.env.PORT;
const Web3 = require('web3');
const truffle_connect = require('./connection/fuzzer.js');
const bodyParser = require('body-parser');

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

// set the view engine to ejs
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
  console.log("**** GET / ****");
  res.render('index.ejs');
});
  
app.get('/load', (req, res) => {
  console.log("**** GET /load ****");
  truffle_connect.load('../build/contracts/SimpleDAO.json',
                       '../build/contracts/AttackDAO.json')
    .then((answer) => {
      if (typeof answer.accs === 'undefined')
        throw "Error loading contracts";
      
      res.render('contracts.ejs', {
        accounts: answer.accs,
        target: answer.target,
        attack: answer.attack,
        tarabi: JSON.stringify(answer.target_abi),
        attabi: JSON.stringify(answer.attack_abi)
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
      if (typeof answer.calls === 'undefined')
        throw "Error running seed";
      
      res.render('seeds.ejs', {
        calls : answer.calls,
        status: answer.status
      });
    }).catch((e) => {
      res.render('error.ejs', {
        message: e
      });
    });
});

app.post('/fuzz', bodyParser.json(), (req, res) => {
  console.log("**** POST /fuzz ****");
  var trace = req.body.trace;
  
  truffle_connect.fuzz(trace)
    .then((answer) => {
      console.log(answer);
      res.send(answer);
    }).catch((e) => {
      res.send(e);
    });
});

app.listen(port, () => {
  truffle_connect.web3 =
    new Web3(new Web3.providers.HttpProvider("http://localhost:8546"));
  
  console.log("Express Listening at http://localhost:" + port);
});
