const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const controllers = require('./controllers/asset-controller');

const PORT = process.env.PORT || 3000;
const app = express();
app.use(morgan('tiny'));
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.post('/asset', controllers.newAssetHandler);
app.put('/asset/:id?', controllers.completeAssetUpload);
app.get('/asset/:id?', controllers.getCompletedAsset);

app.use((err, req, res, next) => {
  console.log(err);
  res.sendStatus(500);
});

app.use((req, res, next) => {
  console.log('Route not defined.');
  res.sendStatus(404);
});

app.listen(PORT, () => {
  console.log('server initialized.');
});

module.exports = app;
