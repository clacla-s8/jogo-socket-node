const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const randomColor = require('randomcolor');
const createBoard = require('./create-board');
const createCooldown = require('./create-cooldown');

const app = express();
const clientPath = `${__dirname}/../cliente`;

console.log(`serving static from ${clientPath}`);

app.use(express.static(clientPath));

const server = http.createServer(app);
const io = socketio(server);
const { makeTurn, getBoard, clear } = createBoard(20);

io.on('connection', (sock) => {
  const color = randomColor();

  // aumenta o numero para ter um intervalo entre jogadas
  const cooldown = createCooldown(10);

  const onTurn = ({ x, y }) => {
    if (cooldown()) {
      io.emit('turn', { x, y, color });
      const playerWin = makeTurn(x, y, color);

      if (playerWin) {        
        sock.emit('message', 'Parabéns, você ganhou!');
        io.emit('message', 'novo jogo iniciado.');
        clear();
        io.emit('board');
      }
    }
  };


  sock.on('message', (text) => io.emit('message', text));
  sock.on('turn', onTurn);

  sock.emit('board', getBoard());
});

server.on('error', (err) => {
  console.error('Erro no servidor:', err);
});

server.listen(8080, () => {
  console.log('servidor iniciado na porta 8080 :)');
});
