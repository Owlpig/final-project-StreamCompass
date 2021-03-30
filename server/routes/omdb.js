const fetch = require('node-fetch');
const express = require('express');

const router = express.Router();

const fetchResult = async id => {
  try {
    const rawData = await fetch(`http://www.omdbapi.com/?apikey=${process.env.OMDB_API_KEY}&i=${id}`);
    const parsedData = rawData.json();
    return parsedData;
  } catch (err) {
    console.error(err);
    return err;
  }
};

router.get('/:id', async (req, res) => {
  const result = await fetchResult(req.params.id);
  res
    .status(200)
    .send(result);
});

module.exports = router;
