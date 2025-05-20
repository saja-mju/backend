const express = require('express');
const app = express();
const cors = require('cors');

const idiomRoutes = require('./routes/idioms');
const resultRoutes = require('./routes/results');
const userRoutes = require('./routes/users');

app.use(cors());
app.use(express.json());

app.use('/idioms', idiomRoutes);
app.use('/results', resultRoutes);
app.use('/users', userRoutes);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
