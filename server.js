require('dotenv').config();

const client = require('./lib/client');

// Initiate database connection
client.connect();

const app = require('./lib/app');

const PORT = process.env.PORT || 7890;
const ensureAuth = require('./lib/auth/ensure-auth');
const createAuthRoutes = require('./lib/auth/create-auth-routes');

// take in an object with two methods (selectUser and inserUser), and will create two routes on our app: /signin and /signup

const authRoutes = createAuthRoutes({
  selectUser(email) {
    return client.query(`
            SELECT id, email, hash
            FROM users
            WHERE email = $1;
        `,
    [email]
    ).then(result => result.rows[0]);
  },
  insertUser(user, hash) {
    console.log(user);
    return client.query(`
            INSERT into users (email, hash)
            VALUES ($1, $2)
            RETURNING id, email;
        `,
    [user.email, hash]
    ).then(result => result.rows[0]);
  }
});


// setup authentication routes to give user an auth token
// creates a /signin and a /signup route. 
// each requires a POST body with a .email and a .password
// localhost:3000/auth/signin
// localhost:3000/auth/signup
app.use('/auth', authRoutes);

// everything that starts with "/api" below here requires an auth token!
app.use('/api', ensureAuth);

app.get('/api/animals', async(req, res) => {
  // who happens to be logged in, go get THEIR animals
  const data = await client.query('SELECT * from animals where owner_id=$1', [req.userId]);

  res.json(data.rows);
});


app.post('/api/animals', async(req, res) => {
  // who happens to be logged in, go get THEIR animals
  const data = await client.query(`
    insert into animals (name, cool_factor, owner_id)
    values ($1, $2, $3)
    returning *
  `, [req.body.name, req.body.cool_factor, req.userId]);
  // name comes from user input, req.body
  // cool factor comes from user input, req.body
  // ownerId comes from req.userId

  res.json(data.rows);
});

app.put('/api/animals/:id', async(req, res) => {
  const data = await client.query(`
    UPDATE animals
    SET is_vaccinated=true
    WHERE id=$1 AND owner_id=$2
    returning *;
  `, [req.params.id, req.userId]);

  res.json(data.rows);
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Started on ${PORT}`);
});

module.exports = app;
