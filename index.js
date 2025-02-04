const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const db = require('./database/dbConfig.js');
const Users = require('./users/users-model.js');

const server = express();

server.use(helmet());
server.use(express.json());
server.use(cors());

server.get('/', (req, res) => {
  res.send("It's alive!");
});

server.post('/api/register', (req, res) => {
  let user = req.body;
  
  const hash = bcrypt.hashSync(user.password, 12);
  user.password = hash;

  Users.add(user)
    .then(saved => {
      res.status(201).json(saved);
    })
    .catch(error => {
      res.status(500).json(error);
    });
});

server.post('/api/login', (req, res) => {
  let { username, password } = req.body;

  if (username && password) {
    Users.findBy({ username })
      .first()
      .then(user => {
        // check password
        if (user && bcrypt.compareSync(password, user.password)) {
          res.status(200).json({ message: `Welcome ${user.username}!` });
        } else {
          res.status(401).json({ message: 'You can not pass' });
        }
      })
      .catch(error => {
        res.status(500).json(error);
      });
  } else {
    res.status(401).json({message: "you need to pass a username or password"})
  }
});

server.get('/api/users', restricted, (req, res) => {
  Users.find()
    .then(users => {
      res.json(users);
    })
    .catch(err => res.send(err));
});

server.get('/hash', (req, res) => {
  const name = req.query.name;

  const hash = bcrypt.hashSync(name, 12);
  res.send(`The hash for ${name} is ${hash}`)
});

// middleware:
function restricted (req, res, next){
  const {username, password} = req.headers;

  if (username && password) {
    Users.findBy({username})
      .first() 
      .then(user => {
        if(user && bcrypt.compareSync(password, user.password)) {
          next();
        } else {
          res.status(401).json({message: "invalidate login"})
        }
      })
      .catch(error => {
        res.status(500).json(error);
      })
  }
}

const port = process.env.PORT || 5000;
server.listen(port, () => console.log(`\n** Running on port ${port} **\n`));
