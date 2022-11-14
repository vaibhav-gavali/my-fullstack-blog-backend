import express from 'express';
import { db, connectToDb } from './db.js';

// localhost:3000/articles/learn-node
// PUT /articles/learn-react/upvote

const app = express();

app.use(express.json()); // If we want req.body to work in express js

app.get('/api/articles/:name', async (req, res) => {
  const { name } = req.params;

  const article = await db.collection('articles').findOne({ name });

  if (article) {
    res.json(article);
  } else {
    res.sendStatus(404).send('Article Not Found');
  }
});

app.put('/api/articles/:name/upvote', async (req, res) => {
  const { name } = req.params;

  await db.collection('articles').updateOne(
    { name },
    {
      $inc: { upvotes: 1 },
    }
  );

  const article = await db.collection('articles').findOne({ name });

  if (article) {
    res.json(article);
  } else {
    res.send("That article doesn't exist");
  }
});

app.post('/api/articles/:name/comments', async (req, res) => {
  const { postedBy, text } = req.body;
  const { name } = req.params;

  await db.collection('articles').updateOne(
    { name },
    {
      $push: { comments: { postedBy, text } },
    }
  );

  const article = await db.collection('articles').findOne({ name });

  if (article) {
    res.json(article);
  } else {
    res.send("That article doesn't exist");
  }
});

connectToDb(() => {
  console.log('Successfully connected to database');
  app.listen(8000, () => {
    console.log('server is listening on port 8000');
  });
});
