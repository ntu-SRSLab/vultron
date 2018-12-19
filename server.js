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

app.get('/contract', (req, res) => {
  console.log("**** GET /contract ****");
  truffle_connect.start('../build/contracts/SimpleDAO.json',
                        '../build/contracts/AttackDAO.json',
                        function (answer) {
                          res.send(answer);
                        })
});

app.listen(port, () => {
  truffle_connect.web3 =
    new Web3(new Web3.providers.HttpProvider("http://localhost:7545"));
  
  console.log("Express Listening at http://localhost:" + port);
});
