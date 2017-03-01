'use strict'

module.exports = (ndx) ->
  TwitterStrategy = require('passport-twitter').Strategy
  ObjectID = require 'bson-objectid'
  ndx.settings.TWITTER_KEY = process.env.TWITTER_KEY or ndx.settings.TWITTER_KEY
  ndx.settings.TWITTER_SECRET = process.env.TWITTER_SECRET or ndx.settings.TWITTER_SECRET
  ndx.settings.TWITTER_CALLBACK = process.env.TWITTER_CALLBACK or ndx.settings.TWITTER_CALLBACK
  ndx.settings.TWITTER_SCOPE = process.env.TWITTER_SCOPE or ndx.settings.TWITTER_SCOPE or 'email'
  if ndx.settings.TWITTER_KEY
    scopes = ndx.passport.splitScopes ndx.settings.TWITTER_SCOPE
    ndx.passport.use new TwitterStrategy
      consumerKey: ndx.settings.TWITTER_KEY
      consumerSecret: ndx.settings.TWITTER_SECRET
      callbackURL: ndx.settings.TWITTER_CALLBACK
      passReqToCallback: true
      includeEmail: true
    , (req, token, tokenSecret, profile, done) ->
      process.nextTick ->
        if not req.user
          users = ndx.database.select ndx.settings.USER_TABLE,
            twitter:
              id: profile.id
          if users and users.length
            if not users[0].twitter.token
              ndx.database.update ndx.settings.USER_TABLE,
                twitter:
                  id: profile.id
                  token: token
                  username: profile.username
                  displayName: profile.displayName
              , _id:users[0]._id
              return done null, users[0]
            return done null, users[0]
          else
            newUser =
              _id: ObjectID.generate()
              twitter:
                id: profile.id
                token: token
                username: profile.username
                displayName: profile.displayName
            ndx.database.insert ndx.settings.USER_TABLE, newUser
            return done null, newUser
        else
          ndx.database.update ndx.settings.USER_TABLE,
            twitter:
              id: profile.id
              token: token
              username: profile.username
              displayName: profile.displayName
          , _id:req.user._id
          return done null, req.user
    ndx.app.get '/api/twitter', ndx.passport.authenticate('twitter', scope: scopes)
    , ndx.postAuthenticate
    ndx.app.get '/api/twitter/callback', ndx.passport.authenticate('twitter')
    , ndx.postAuthenticate
    ndx.app.get '/api/connect/twitter', ndx.passport.authorize('twitter', scope: scopes)
    ndx.app.get '/api/unlink/twitter', (req, res) ->
      user = req.user
      user.twitter.token = undefined
      user.save (err) ->
        res.redirect '/profile'
        return
      return