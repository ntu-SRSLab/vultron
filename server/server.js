var app = require('express')()
var http = require('http').Server(app)
var path = require('path');
const shell = require("shelljs");
const fs = require("fs");
var io = require('socket.io')(http)
var assert = require("assert")
var compiler = require("./scripts/compile");
var Deployer = require("./connection/fisco/fuzzer").FiscoDeployer;
// var Fuzzer = require("./model_testing/statemachine");


var SocketIOFileUpload = require('socketio-file-upload');
app.use(SocketIOFileUpload.router);
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  res.setHeader('Access-Control-Allow-Credentials', true);

  next();
})
app.get('/clients', (req, res) => {
  res.send(Object.keys(io.sockets.clients().connected))
})
// start  fisco-bcos network
shell.exec("cd ../Vultron-FISCO-BCOS && ./quickstart.sh ");

const deployer = Deployer.getInstance("./deployed_contract");
const event_Upload = "Upload";
const event_Compile = "Compile";
const event_Deploy = "Deploy";
const event_Transaction = "Transaction";

class FSMTestUtil {
  constructor(socket) {
    this.socket = socket;
  }
  upload_fsmjson(fsm) {
    //State Machine cat
    assert(fsm.states);
    assert(fsm.transitions);
    // Customized actions
    assert(fsm.actions);
    //  Related contracts
    assert(fsm.contracts);
  }
}
class EventHandler {
  constructor(socket) {
    this.socket = socket;
  }
  Upload_client(data) {
    // console.log(data);
  }
  Compile_client(data) {
    console.log(data);
    let ret = compiler.compile("./uploads", data);
    this.socket.emit(event_Compile, ret);
  }
  Deploy_client(data) {
    console.log(data);
    var socket = this.socket;
    deployer.deploy_contract_precompiled_params(data.contract, data.func, data.params).then(function (data) {
      console.log(event_Deploy, data);
      socket.emit(event_Deploy, data);
    }).catch(function (err) {
      console.log(err);
      console.log("deploy error: for data ", data)
    });
  }
  Call_client(data) {
    console.log(data);
  }
  Transaction_client(data) {
    console.log(data);
    var socket = this.socket;
    deployer.transcation_send(data.contract, data.address, data.func, data.params).then(function (data) {

      socket.emit(event_Transaction, data);
    }).catch(function (err) {
      console.log(err);
      console.log("transaction error: for data ", data)
    });
  }
  Test_client(data) {
    console.log(data)
    let file_name = data.file_name;
    let target_contract = data.target_contract;
    let model_script = data.model_script;
    shell.mkdir("-p", `./model_testing`);
    let date = new Date();
    fs.writeFileSync(`./model_testing/${file_name+"."+date.toISOString()}`, model_script, "utf-8");
    try{
        let Fuzzer=  require(`./model_testing/${file_name+"."+date.toISOString()}`).FiscoStateMachineFuzzer;
        let fuzzer = Fuzzer.getInstance(1, target_contract);
        fuzzer.load();
        fuzzer.bootstrap(this.socket).then(data => {
          console.log(data);
        }).catch(err => {
          console.error("bootstrap error");
          console.error(err);
        });
    }catch( err){
         console.error(err);
    };
  }
}
io.on('connection', socket => {
  console.log(`A user connected with socket id ${socket.id}`)
  socket.on('pingServer', data => {
    console.log(`pingServer A user connected with socket id`, socket.id, data);
    socket.emit('customEmit', "hello world");
  })
  let handler = new EventHandler(socket);
  socket.on("client", function (event) {
    assert(handler[event.type], "invalid event type");
    console.log("event:", event.type);
    handler[event.type](event.data);
  });

  // Make an instance of SocketIOFileUpload and listen on this socket:
  var uploader = new SocketIOFileUpload();
  uploader.dir = "./uploads";
  uploader.listen(socket);

  // Do something when a file is saved:
  uploader.on("saved", function (event) {
    // console.log(event.file);
    console.log("saved");
  });

  // Error handler:
  uploader.on("error", function (event) {
    console.log("Error from uploader", event);
  });

  //  Do remove old file when same name file exists
  uploader.on("start", function (event) {
    console.log(path.join(uploader.dir, event.file.name));
    if (fs.existsSync(path.join(uploader.dir, event.file.name))) {
      console.log("overwrite existing file:", path.join(uploader.dir, event.file.name));
      shell.rm("-f", path.join(uploader.dir, event.file.name));
    }
  });
})
http.listen(3000, () => {
  console.log('Listening on *:3000')
})