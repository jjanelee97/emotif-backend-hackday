// Routing and configuration to different api endpoints

import { Router } from 'express';

require('dotenv').config();
const ToneAnalyzerV3 = require('watson-developer-cloud/tone-analyzer/v3');
const NaturalLanguageUnderstandingV1 = require('watson-developer-cloud/natural-language-understanding/v1.js');
const SpotifyWebApi = require('spotify-web-api-node');

// Watson Tone Analyzer API information]
const toneAnalyzer = new ToneAnalyzerV3({
  version_date: '2017-09-21',
  url: 'https://gateway.watsonplatform.net/tone-analyzer/api/',
});

// Watson Natural Language Understanding API information
const nlu = new NaturalLanguageUnderstandingV1({
  version_date: '2017-02-27',
  url: 'https://gateway.watsonplatform.net/natural-language-understanding/api/',
});

// Spotify Music API information
// credentials are optional
const spotifyApi = new SpotifyWebApi({
  clientId: '6bc7e41b7b4d48dbb5f3b1c032433207',
  clientSecret: '54df2c7d6a0f48588c7f6230c47f2fcd',
  redirectUri: 'http://localhost:8080/spotify_callback',
});


const router = Router();

router.get('/', (req, res) => {
  res.json({ message: 'welcome to the API for EMOTIF!' });
});

// heroku service route for tone analyzer endpoint
router.post('/watson_tone', (req, res) => {
  toneAnalyzer.tone(
    {
      tone_input: req.body.lookup_text,
      content_type: 'text/plain',
    },
    (err, tone) => {
      if (err) {
        console.log(err);
      } else {
        res.json(tone);
      }
    },
  );
  // res.json({ message: 'you have reached NLU endpoint' });
});

// heroku service route for nlu endpoint
router.post('/watson_nlu', (req, res) => {
  const options = {
    text: req.body.lookup_text,
    features: {
      concepts: {},
      keywords: { sentiment: true },
    },
  };
  nlu.analyze(options, (err, nluData) => {
    if (err) {
      console.log(err);
      return;
    }
    res.json(nluData);
  });
});

// heroku service route for both nlu and tone
// used to return two json objects inside one object for a single action
router.post('/nlu_and_tone', (req, res) => {
  console.log(req);
  const options = {
    text: req.body.lookup_text,
    features: {
      concepts: {},
      keywords: { sentiment: true },
    },
  };
  nlu.analyze(options, (err, nluData) => {
    if (err) {
      console.log('ksldjlkdsjlksdj');
      console.log(err);
      return;
    }
    // res.json(nluData);

    toneAnalyzer.tone(
      {
        tone_input: req.body.lookup_text,
        content_type: 'text/plain',
      },
      (err, tone) => {
        if (err) {
          // console.log(err);
          console.log(req);
        } else {
          console.log('not an error');
          console.log(req);
          console.log({ tone, nluData });
          res.json({ tone, nluData });
        }
      },
    );
  });
});

// const buffer = new Buffer(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64');

// heroku service route for spotify web refresh (after 1 hour)
router.post('/spotify_refresh_access_token', (req, res) => {
  spotifyApi.authorizationCodeGrant(req.body.code)
  .then((data) => {
    console.log(`The token expires in ${data.body.expires_in}`);
    console.log(`The access token is ${data.body.access_token}`);
    console.log(`The refresh token is ${data.body.refresh_token}`);
  }, (err) => {
    console.log('Something went wrong!', err);
  });

  res.json({ done: 'check console' });
});

// heroku service route for spotify web endpoint
// top 10 songs in user's playlist
router.post('/spotify_get_top', (req, res) => {
  console.log(req.body.access_token);
  console.log(req.body.refresh_token);
  spotifyApi.setAccessToken(req.body.access_token);
  spotifyApi.setRefreshToken(req.body.refresh_token);
  spotifyApi.getMyRecentlyPlayedTracks({ limit: 10 }).then((data) => {
    res.json(data);
  });
});


export default router;
