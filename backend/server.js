const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Importar rotas
const authRoutes = require('./routes/auth');
const characterRoutes = require('./routes/characters');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Conectar ao MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB conectado'))
  .catch(err => console.log(err));

// Usar rotas
app.use('/api/auth', authRoutes);
app.use('/api/characters', characterRoutes);

// Rota teste
app.get('/', (req, res) => {
  res.send('API das Fichas funcionando!');
});

const PORT = process.env.PORT || 7000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));