const keys = require('./keys');

// Express App Setup
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Postgres Client Setup
const { Pool } = require('pg');

const pgClient = new Pool({
  user: keys.pgUser,
  host: keys.pgHost,
  database: keys.pgDatabase,
  password: keys.pgPassword,
  port: keys.pgPort,
});

pgClient.on('connect', (err) => {
  
  pgClient
    .query('CREATE TABLE IF NOT EXISTS values (number INT)');
});


// Redis Client Setup
const redis = require('redis');

const redisClient = redis.createClient({
  host: keys.redisHost,
  port: keys.redisPort,
  retry_strategy: () => 1000,
});

const redisPublisher = redisClient.duplicate();

// Express route handlers

app.get('/', (req, res) => {

  res.send('Hi there');
});

app.get('/values/all', async (req, res) => {

  try {
    const values = await pgClient.query('SELECT * from values');
    res.send(values.rows);
  } 
  catch ($err) {
    res.status(500).send({state: "No Indexes"});
  }

});

app.get('/values/current', async (req, res) => {

  const response = redisClient.hgetall('values', (err, values) => {
    res.send(values);  
  });

  if(!response)
    res.status(400).send({state: "no values"});

});

app.post('/values', async (req, res) => {

  const index = req.body.index;

  if (isNaN(parseInt(index)) || parseInt(index) > 40) {
    return res.status(422).send({state: "Index too high"});
  }

  if(redisClient.ready) {
    redisClient.hset('values', index, 'Nothing yet!');
    redisPublisher.publish('insert', index);
  }
  else 
    return res.status(500).send({state: "Redis Connexion failed"});

  try {
    
    await pgClient.query('INSERT INTO values(number) VALUES($1)', [index]);
    res.send({state: "Process Completed"});
  }
  catch ($err) {
    res.status(500).send({state: "Index saving failed !"});
  }

});

app.listen(5000, (err) => {
  console.log('Listening');
});
