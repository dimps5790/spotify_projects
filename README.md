# My Spotify Playlist Comparison App

The intent of this project is to compare two Spotify playlists.
The user will select one of their own playlists first.
Then they will enter a user ID of another user. The playlists of this user will then be returned.
They can then select one of these playliosts.
Once a playlist is selected, the track names and artists will be loaded in a table below.
After both playlists have been selected, this will display and enable a Comparison button.
Clicking this will run a comparison on the two selected playlists.
The comparison results will show the total number of different tracks, and then list in two separate tables the unique tracks from each playlist.

Also of note, this project uses an existing Spotify API and was forked from an example project that guided on how to properly authenticate against the Spotify Web API.
The authentication example and instructions from this are found below.

# Spotify Accounts Authentication Examples

This project contains basic demos showing the different OAuth 2.0 flows for [authenticating against the Spotify Web API](https://developer.spotify.com/web-api/authorization-guide/).

These examples cover:

* Authorization Code flow
* Client Credentials flow
* Implicit Grant flow

## Installation

These examples run on Node.js. On [its website](http://www.nodejs.org/download/) you can find instructions on how to install it. You can also follow [this gist](https://gist.github.com/isaacs/579814) for a quick and easy way to install Node.js and npm.

Once installed, clone the repository and install its dependencies running:

    $ npm install

### Using your own credentials
You will need to register your app and get your own credentials from the Spotify for Developers Dashboard.

To do so, go to [your Spotify for Developers Dashboard](https://beta.developer.spotify.com/dashboard) and create your application. For the examples, we registered these Redirect URIs:

* http://localhost:8888 (needed for the implicit grant flow)
* http://localhost:8888/callback

Once you have created your app, replace the `client_id`, `redirect_uri` and `client_secret` in the examples with the ones you get from My Applications.

## Running the examples
In order to run the different examples, open the folder with the name of the flow you want to try out, and run its `app.js` file. For instance, to run the Authorization Code example do:

    $ cd authorization_code
    $ node app.js

Then, open `http://localhost:8888` in a browser.
