/**
 * @author Brian Linden
 */

var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var cors = require('cors');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');

var client_id = ''; // Your client id
var client_secret = ''; // Your secret
var redirect_uri = 'http://localhost:8888/callback'; // Your redirect uri

var SpotifyWebApi = require('spotify-web-api-node');
// credentials are optional
var spotifyApi = new SpotifyWebApi({
});

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var stateKey = 'spotify_auth_state';

var app = express();

app.use(express.static(__dirname + '/public'))
   .use(cors())
   .use(cookieParser());

app.get('/login', function(req, res) {

  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  var scope = 'user-read-private user-read-email playlist-read-private';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});

app.get('/callback', function(req, res) {

  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {

        var access_token = body.access_token,
            refresh_token = body.refresh_token;

        var options = {
          url: 'https://api.spotify.com/v1/me',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        };

        // use the access token to access the Spotify Web API
        request.get(options, function(error, response, body) {

        });

        // we can also pass the token to the browser to make requests from there
        res.redirect('/#' +
          querystring.stringify({
            access_token: access_token,
            refresh_token: refresh_token
          }));
      } else {
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    });
  }
});

app.get('/refresh_token', function(req, res) {

  console.log("Refreshing the token!");
  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      console.log("New Access Token");
      var access_token = body.access_token;
      res.send({
        'access_token': access_token
      });
    }
  });
});

app.get('/get_playlists', function(req, res) {

  let userPlaylists = null;
  let playlistObj = null;
  let playlistArr = [];
  let userId = false;

  spotifyApi.setAccessToken(req.query.access_token);
  
  // This will be set if retrieving playlists of another user (i.e. not yourself)
  console.log("Getting user's playlists for User ID = ", req.query.userId);
  if (req.query.userId) {
    userId = req.query.userId;
  }

  // Get a user's playlists
  spotifyApi.getUserPlaylists(userId, { limit: 50 })
  .then(function(data) {
    userPlaylists = data.body.items;
    console.log('Retrieved playlists COUNT: ', userPlaylists.length);

    // Get ID and Name from each playlist
    for (var i = 0; i < userPlaylists.length; i++) {
      playlistObj = 
        {
          id: userPlaylists[i].id,
          name: userPlaylists[i].name
        };
        playlistArr.push(playlistObj);
    }

    // return new data to html
    res.send({
      'playlists': playlistArr
    })

  },function(err) {
    console.log('Something went wrong!', err);
  });
});

// Returns all track names and the track artist within the probided playlist
app.get('/get_playlist_tracks', async function(req, res) {

  var songs = await getAllSongs(req.query);
  res.send({
    'tracks': songs
  });
})

/**
 * Gets all the songs and artists from the playlist.
 * If there are over 100 songs in a playlist, it will execute the GET in multiple batches.
 * @param {*} req 
 * @returns promise containing trackName and artist
 */
async function getAllSongs(req) {

  let trackObj = null;
  let songs = [];

  console.log("Getting playlist tracks for ID ", req.id);
  spotifyApi.setAccessToken(req.access_token);

  // TODO error handling if user ID invalid
  var data = await spotifyApi.getPlaylistTracks(req.id);

  // Spotify API limits to 100 max tracks per request, so if there are more than 100 will need to do batches.
  var numBatches = Math.floor(data.body.total/100) + 1;
  console.log('Retrieved tracks COUNT: ', data.body.total);
  var promises = [];

  if(numBatches > 1) {
    console.log("Over 100 tracks found! Getting in batches.");
    for (let batchNum = 0; batchNum < numBatches ; batchNum++) {
      var promise = getSongs(req.id, batchNum * 100);
      promises.push(promise);
    }
    var rawSongData = await Promise.all(promises);
    let songData = [];
    for (let i = 0; i < rawSongData.length; i++) {
      songData = songData.concat(rawSongData[i].body.items);
    }
    // Set all track names
    for (var i = 0; i < songData.length; i++) {
      trackObj = 
        {
          trackName: songData[i].track.name,
          artist: songData[i].track.artists[0].name //TODO can be more than 1 artist
        };
        songs.push(trackObj);
    }

  } else {
    let trackTotal = data.body;

    // Set all track names
    for (var i = 0; i < trackTotal.items.length; i++) {
      trackObj = 
        {
          trackName: trackTotal.items[i].track.name,
          artist: trackTotal.items[i].track.artists[0].name //TODO can be more than 1 artist
        };
        songs.push(trackObj);
    }
  }

  return songs;
}

async function getSongs(id, offset) {
  var songs = await spotifyApi.getPlaylistTracks(id, {offset: offset});
  return songs;
}

console.log('Listening on 8888');
app.listen(8888);
