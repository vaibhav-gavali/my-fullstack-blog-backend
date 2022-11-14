import express from 'express';
import fs from 'fs';
import path from 'path';
import admin from 'firebase-admin';
import 'dotenv/config';
import { db, connectToDb } from './db.js';

// Due to usage of type module
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// localhost:3000/articles/learn-node
// PUT /articles/learn-react/upvote

const credentials = JSON.parse(fs.readFileSync('./credentials.json'));
admin.initializeApp({
  credential: admin.credential.cert(credentials),
});

const app = express();
app.use(express.json()); // If we want req.body to work in express js
// For deployment
app.use(express.static(path.join(__dirname, '../build')));

//For routes that don't start with "api"
app.get(/^(?!\/api).+/, (req, res) => {
  // whenever browser send the request that is not for APIs we are going to send the
  // index.html that will load our react script
  res.sendFile(path.join(__dirname, '../build/index.html'));
});

app.use(async (req, res, next) => {
  const { authtoken } = req.headers;

  if (authtoken) {
    try {
      req.user = await admin.auth().verifyIdToken(authtoken);
    } catch (e) {
      return res.sendStatus(400); // Bad Request
    }
  }

  req.user = req.user || {};
  next();
});

app.get('/api/articles/:name', async (req, res) => {
  const { name } = req.params;
  const { uid } = req.user;

  const article = await db.collection('articles').findOne({ name });

  if (article) {
    const upvoteIds = article.upvoteIds || [];
    article.canUpvote = uid && !upvoteIds.includes(uid);
    res.json(article);
  } else {
    res.sendStatus(404).send('Article Not Found');
  }
});

// Middleware for Upvote and Comments
app.use((req, res, next) => {
  if (req.user) {
    next();
  } else {
    res.sendStatus(401); //User not allowed
  }
});

app.put('/api/articles/:name/upvote', async (req, res) => {
  const { name } = req.params;
  const { uid } = req.user;

  const article = await db.collection('articles').findOne({ name });

  if (article) {
    const upvoteIds = article.upvoteIds || [];
    const canUpvote = uid && !upvoteIds.includes(uid);

    if (canUpvote) {
      await db.collection('articles').updateOne(
        { name },
        {
          $inc: { upvotes: 1 },
          $push: { upvoteIds: uid },
        }
      );
    }
    const updatedArticle = await db.collection('articles').findOne({ name });
    res.json(updatedArticle);
  } else {
    res.send("That article doesn't exist");
  }
});

app.post('/api/articles/:name/comments', async (req, res) => {
  const { text } = req.body;
  const { name } = req.params;
  const { email } = req.user;

  await db.collection('articles').updateOne(
    { name },
    {
      $push: { comments: { postedBy: email, text } },
    }
  );

  const article = await db.collection('articles').findOne({ name });

  if (article) {
    res.json(article);
  } else {
    res.send("That article doesn't exist");
  }
});

const PORT = process.env.PORT || 8000;

connectToDb(() => {
  console.log('Successfully connected to database');
  app.listen(PORT, () => {
    console.log('server is listening on port ' + PORT);
  });
});
