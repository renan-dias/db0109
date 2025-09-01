// Importa dependências
const express = require('express');
const { customAlphabet } = require('nanoid');
const path = require('path');
const app = express();
app.use(express.json());

// Array in-memory para armazenar os jogos (stateless)
let games = [];

// Gera um código de sessão de 4 caracteres (letras/números)
const sessionId = customAlphabet('1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ', 4);

// Serve o front-end
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Cria um novo jogo (POST, não idempotente)
app.post('/games', (req, res) => {
  // Estado inicial do jogo
  const game = {
    id: sessionId(), // ID de sessão com 4 caracteres
    secret: Math.floor(Math.random() * 100) + 1,
    attempts: 0,
    max: 10,
    status: 'active'
  };
  games.push(game);
  res.status(201).json({ id: game.id });
});

// Consulta o estado do jogo (GET, idempotente)
app.get('/games/:id', (req, res) => {
  const game = games.find(g => g.id === req.params.id);
  if (!game) return res.status(404).json({ error: 'Jogo não encontrado' });
  res.json(game);
});

// Envia um palpite (PUT, idempotente)
app.put('/games/:id/guess', (req, res) => {
  const game = games.find(g => g.id === req.params.id);
  const guess = Number(req.body.guess);
  if (!game) return res.status(404).json({ error: 'Jogo não encontrado' });
  if (game.status !== 'active') return res.status(400).json({ error: 'Jogo finalizado' });
  if (!guess || guess < 1 || guess > 100) return res.status(400).json({ error: 'Palpite inválido' });
  game.attempts++;
  if (guess === game.secret) {
    game.status = 'won';
    return res.json({ message: 'Você ganhou!' });
  }
  if (game.attempts >= game.max) {
    game.status = 'lost';
    return res.json({ message: `Você perdeu! O número era ${game.secret}` });
  }
  res.json({ message: guess < game.secret ? 'Maior!' : 'Menor!' });
});

// Exclui um jogo (DELETE, idempotente)
app.delete('/games/:id', (req, res) => {
  games = games.filter(g => g.id !== req.params.id);
  res.json({ message: 'Jogo excluído' });
});

// Exemplo de endpoint extra: retorna todos os jogos ativos
app.get('/games', (req, res) => {
  res.json(games.filter(g => g.status === 'active'));
});



// Inicializa o servidor
app.listen(3000, () => console.log('API rodando em <http://localhost:3000>'));
