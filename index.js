const express = require('express');
const path = require('path');
const ejs = require('ejs');

const app = express();
const server = require('http').Server(app);
const socketServer = require('socket.io')(server);

app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'public'));
app.engine('html', ejs.renderFile);
app.set('view engine', 'html');

app.use("/", (req, res) => {
  res.render("index.html");
});

var chatUsers = {}
var tabuleiro = createMatrix()
var coresDisponiveis = ["branco", "preto"]

socketServer.on('connect', (socket) => {
  console.log(`socket on connect`)
  const socketId = socket.id
  
  socket.on('login', usern => {
    chatUsers[socketId] = usern
    console.log(`lista de usuarios do chat: ${chatUsers}`)
    console.log(`[CONNECTION]: O usuário ${chatUsers[socketId]} se conectou: ${socketId}`)
    socketServer.emit('chat message', `${chatUsers[socketId]} entrou na sala...`)
    socket.emit("tabuleiro", tabuleiro);
    socket.emit("cores disponiveis", {coresDisponiveis: coresDisponiveis, cor: ""})
    console.log(`verficando cores disponiveis: ${coresDisponiveis}`)
  })
  
  socket.on('disconnect', () => {
    console.log(`[DISCONNECT]: O usuário ${chatUsers[socketId]} se desconectou: ${socketId}`);
    socketServer.emit('chat message', `${chatUsers[socketId]} saiu da sala...`)
    delete chatUsers[socketId]
  });

  socket.on('chat message', msg => {
    console.log(`[MESSAGE]: ${chatUsers[socketId]}: ${msg}`);
    socketServer.emit('chat message', `${chatUsers[socketId]}: ${msg}`);
  });

  socket.on("cor", cor => {
    console.log(`recebeu demanda de cor: ${cor}`)
    var status = coresDisponiveis.indexOf(cor);
    if (status != -1){
      socket.emit("cor", cor)
      socketServer.emit("cores disponiveis", {coresDisponiveis: coresDisponiveis, cor: cor})
      coresDisponiveis.splice(status, 1);
      console.log(`cores disponiveis: ${coresDisponiveis}`)
    }
  })

  socket.on("turno", turno => {
    console.log(`recebeu demanda de turno: ${turno}`)
    if (turno == "preto"){
      turno = "branco"
    }else{
      turno = "preto"
    }
    socketServer.emit("turno", turno)
    console.log(`enviou resposta de turno: ${turno}`)
  })

  socket.on("tabuleiro", novoTabuleiro => {
    console.log(`recebeu novo tabuleiro`)
    tabuleiro = novoTabuleiro
    socketServer.emit("tabuleiro", tabuleiro)
  })

  socket.on("desistir", desistente => {
    console.log(`recebeu desistencia`)
    msg = ""
    if (desistente == "preto"){
      msg = 'Game Over\n# O jogador Branco é o vencedor #'
    }else{
      msg = 'Game Over\n# O jogador Preto é o vencedor #'
    }
    socketServer.emit("desistir", msg)
    tabuleiro = createMatrix()
    chatUsers = {}
    socketServer.emit("tabuleiro", tabuleiro)
    coresDisponiveis = ["branco", "preto"]
  })
});

server.listen(3000, () => {
  console.log(`Socket.IO server running at http://localhost:3000/`);
});

function createMatrix(){
  var tabuleiro = []
  for(i = 1; i <= 8; i++){
    tabuleiro[i] = new Array();
    for(j = 1; j <= 8; j++){
      tabuleiro[i][j] = new Array();
      tabuleiro[i][j] = 'semBolinha';
    }
  }
  tabuleiro[4][4] = 'branco';
  tabuleiro[4][5] = 'preto';
  tabuleiro[5][4] = 'preto';
  tabuleiro[5][5] = 'branco';

  console.log(`O tabuleiro foi criado com sucesso!`)
  return tabuleiro;
}
