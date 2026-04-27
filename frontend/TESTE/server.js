const express = require('express');
const app = express();

app.use(express.json({ limit: '10mb' }));
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, ngrok-skip-browser-warning');
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

let lastFrame = null;

// Página do iPhone (câmera)
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Recebe os frames
app.post('/frame', (req, res) => {
  lastFrame = req.body.image;
  console.log('frame recebido');

  // debug opcional (pode apagar depois)
  if (lastFrame) {
    console.log(lastFrame.substring(0, 30));
  }

  res.json({ status: 'ok' });
});

// Retorna a imagem pura (IMPORTANTE)
app.get('/latest', (req, res) => {
  if (!lastFrame) {
    res.status(404).send('Sem imagem ainda');
    return;
  }

  const matches = lastFrame.match(/^data:image\/jpeg;base64,(.+)$/);

  if (!matches) {
    res.status(500).send('Formato inválido');
    return;
  }

  const img = Buffer.from(matches[1], 'base64');

  res.setHeader('Content-Type', 'image/jpeg');
  res.setHeader('Content-Length', img.length);
  res.end(img);
});

// Página de visualização no PC
app.get('/view', (req, res) => {
  res.send(`
    <html>
      <body>
        <h2>Espelhamento da Camera</h2>
        <img id="img" width="500"/>

        <script>
          const img = document.getElementById('img');

          setInterval(() => {
            img.src = '/latest?t=' + new Date().getTime();
          }, 300);
        </script>
      </body>
    </html>
  `);
});

app.listen(3000, () => {
  console.log('Servidor rodando em http://localhost:3000');
});