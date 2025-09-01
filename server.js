const express = require('express');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json()); // Para parsear JSON no body

// Servir index.html na rota raiz
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Banco in-memory (array de jogos)
let games = [];

// POST /games: Criar um novo jogo (não idempotente: cria novo cada vez)
app.post('/games', (req, res) => {
  const secretNumber = Math.floor(Math.random() * 100) + 1;
  const newGame = {
    id: uuidv4(),
    secretNumber,
    attempts: 0,
    maxAttempts: 10,
    status: 'active', // active, won, lost
    lastGuess: null
  };
  games.push(newGame);
  res.status(201).json({ id: newGame.id, message: 'Jogo criado!' });
});

// GET /games/:id: Obter estado do jogo (idempotente)
app.get('/games/:id', (req, res) => {
  const game = games.find(g => g.id === req.params.id);
  if (!game) return res.status(404).json({ error: 'Jogo não encontrado' });
  res.json({
    id: game.id,
    attempts: game.attempts,
    maxAttempts: game.maxAttempts,
    status: game.status,
    lastGuess: game.lastGuess
  });
});

// PUT /games/:id/guess: Atualizar com palpite (idempotente: repetir o mesmo palpite não muda após processado)
app.put('/games/:id/guess', (req, res) => {
  const { guess } = req.body;
  if (!guess || typeof guess !== 'number' || guess < 1 || guess > 100) {
    return res.status(400).json({ error: 'Palpite inválido (1-100)' });
  }
  const game = games.find(g => g.id === req.params.id);
  if (!game) return res.status(404).json({ error: 'Jogo não encontrado' });
  if (game.status !== 'active') return res.status(400).json({ error: 'Jogo finalizado' });

  game.attempts++;
  game.lastGuess = guess;

  if (guess === game.secretNumber) {
    game.status = 'won';
    return res.json({ message: 'Você ganhou!', status: game.status });
  } else if (game.attempts >= game.maxAttempts) {
    game.status = 'lost';
    return res.json({ message: 'Você perdeu! Número era ' + game.secretNumber, status: game.status });
  } else {
    const hint = guess < game.secretNumber ? 'Maior' : 'Menor';
    return res.json({ message: `Errado! Dica: ${hint}. Tentativas restantes: ${game.maxAttempts - game.attempts}` });
  }
});

// DELETE /games/:id: Excluir jogo (idempotente: deletar repetidamente não muda)
app.delete('/games/:id', (req, res) => {
  const index = games.findIndex(g => g.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Jogo não encontrado' });
  games.splice(index, 1);
  res.json({ message: 'Jogo excluído' });
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
