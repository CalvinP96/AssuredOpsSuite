const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabase } = require('./database');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

async function start() {
  await initDatabase();

  const employeesRouter = require('./routes/employees');
  const equipmentRouter = require('./routes/equipment');
  const kpisRouter = require('./routes/kpis');
  const billingRouter = require('./routes/billing');
  const programsRouter = require('./routes/programs');

  app.use('/api/employees', employeesRouter);
  app.use('/api/equipment', equipmentRouter);
  app.use('/api/kpis', kpisRouter);
  app.use('/api/billing', billingRouter);
  app.use('/api/programs', programsRouter);

  // Serve React build in production
  app.use(express.static(path.join(__dirname, '..', 'client', 'build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'client', 'build', 'index.html'));
  });

  app.listen(PORT, () => {
    console.log(`AssuredOpsSuite server running on port ${PORT}`);
  });
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
