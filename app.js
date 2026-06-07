require('dotenv').config();
require('./utils/rabbitMQ');

const express = require('express');
const cors = require('cors');
const communityRoutes = require('./routes/communityRoutes');

const app = express();

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    service: 'community-service',
  });
});

app.use('/api/v1/community', communityRoutes);

const PORT = process.env.PORT || 3006;

app.listen(PORT, () => {
  console.log(`community-service running on port ${PORT}`);
});