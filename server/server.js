var app = require('express')()
var http = require('http').Server(app)
var io = require('socket.io')(http)

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

io.on('connection', socket => {
  console.log(`A user connected with socket id ${socket.id}`)


  // socket.on('disconnect', () => {
  //   socket.broadcast.emit('user-disconnected', socket.id)
  // })

  // socket.on('nudge-client', data => {
  //   socket.broadcast.to(data.to).emit('client-nudged', data)
  // })
    socket.on('pingServer', data => {
      console.log(`pingServer A user connected with socket id`, socket.id, data);
      socket.emit('customEmit', "hello world");
    })
})


http.listen(3000, () => {
  console.log('Listening on *:3000')
})