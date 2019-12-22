/* eslint-disable global-require */
/* eslint-disable no-return-assign */
const express = require('express');

const app = new express();
const bodyParser = require('body-parser');
const morgan = require('morgan');
const cors = require('cors');
const databasePool = require('./repositories');
const requestMiddlewares = require('./middlewares/request.middleware');

let expressServer;
process.on('SIGINT', async () => {
  if (databasePool.pool) await databasePool.pool.end();
  expressServer.close(() => process.exit());
});
process.on('SIGTERM', async () => {
  if (databasePool.pool) await databasePool.pool.end();
  expressServer.close(() => process.exit());
});
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
if (process.env.NODE_ENV !== 'production') app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));
/**
 * Подключение к бд
 */
databasePool.initDatabase();

app.use(requestMiddlewares);
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false, limit: '50Mb' }));
app.use(bodyParser.json({ limit: '50Mb' }));
app.use('/images', express.static('images'));
app.use('/api', require('./routes'));

expressServer = app.listen(process.env.PORT || 3002, () => {
  console.log('STARTED');
});
