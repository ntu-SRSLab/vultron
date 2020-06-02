var app = require('express')()
var http = require('http').Server(app)
var io = require('socket.io')(http)
var assert = require("assert")
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

class EventHandler{
    constructor() {
      
    }
    Upload_client(data){
        console.log(data);
    }
    Compile_client(data){
      console.log(data);
    }
    Deploy_client(data){
      console.log(data);
    }
    Call_client(data){
      console.log(data);
    }
}
io.on('connection', socket => {
  console.log(`A user connected with socket id ${socket.id}`)
  socket.on('pingServer', data => {
      console.log(`pingServer A user connected with socket id`, socket.id, data);
      socket.emit('customEmit', "hello world");
    })
    let handler = new EventHandler();
    socket.on("client",function(event){
      assert( handler[event.type], "invalid event type");
      console.log("event:", event.type);
      handler[event.type](event.data);
    });

    // Make an instance of SocketIOFileUpload and listen on this socket:
    var uploader = new SocketIOFileUpload();
    uploader.dir = "./uploads";
    uploader.listen(socket);

    // Do something when a file is saved:
    uploader.on("saved", function(event){
        console.log(event.file);
    });

    // Error handler:
    uploader.on("error", function(event){
        console.log("Error from uploader", event);
    });
})


http.listen(3000, () => {
  console.log('Listening on *:3000')
})