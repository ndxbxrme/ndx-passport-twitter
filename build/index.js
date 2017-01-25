(function() {
  'use strict';
  module.exports = function(ndx) {
    var ObjectID, TwitterStrategy;
    TwitterStrategy = require('passport-twitter').Strategy;
    ObjectID = require('bson-objectid');
    ndx.settings.TWITTER_KEY = process.env.TWITTER_KEY || ndx.settings.TWITTER_KEY;
    ndx.settings.TWITTER_SECRET = process.env.TWITTER_SECRET || ndx.settings.TWITTER_SECRET;
    ndx.settings.TWITTER_CALLBACK = process.env.TWITTER_CALLBACK || ndx.settings.TWITTER_CALLBACK;
    if (ndx.settings.TWITTER_KEY) {
      ndx.passport.use(new TwitterStrategy({
        consumerKey: ndx.settings.TWITTER_KEY,
        consumerSecret: ndx.settings.TWITTER_SECRET,
        callbackURL: ndx.settings.TWITTER_CALLBACK,
        passReqToCallback: true,
        includeEmail: true
      }, function(req, token, tokenSecret, profile, done) {
        return process.nextTick(function() {
          var newUser, users;
          if (!req.user) {
            users = ndx.database.exec('SELECT * FROM ' + ndx.settings.USER_TABLE + ' WHERE twitter->id=?', [profile.id]);
            if (users && users.length) {
              if (!users[0].twitter.token) {
                ndx.database.exec('UPDATE ' + ndx.settings.USER_TABLE + ' SET twitter=? WHERE _id=?', [
                  {
                    id: profile.id,
                    token: token,
                    username: profile.username,
                    displayName: profile.displayName
                  }, users[0]._id
                ]);
                return done(null, users[0]);
              }
              return done(null, users[0]);
            } else {
              newUser = {
                _id: ObjectID.generate(),
                twitter: {
                  id: profile.id,
                  token: token,
                  username: profile.username,
                  displayName: profile.displayName
                }
              };
              ndx.database.exec('INSERT INTO ' + ndx.settings.USER_TABLE + ' VALUES ?', [newUser]);
              return done(null, newUser);
            }
          } else {
            ndx.database.exec('UPDATE ' + ndx.settings.USER_TABLE + ' SET twitter=? WHERE _id=?', [
              {
                id: profile.id,
                token: token,
                username: profile.username,
                displayName: profile.displayName
              }, req.user._id
            ]);
            return done(null, req.user);
          }
        });
      }));
      ndx.app.get('/api/twitter', ndx.passport.authenticate('twitter', {
        scope: 'email'
      }), ndx.postAuthenticate);
      ndx.app.get('/api/twitter/callback', ndx.passport.authenticate('twitter'), ndx.postAuthenticate);
      ndx.app.get('/api/connect/twitter', ndx.passport.authorize('twitter', {
        scope: 'email'
      }));
      return ndx.app.get('/api/unlink/twitter', function(req, res) {
        var user;
        user = req.user;
        user.twitter.token = void 0;
        user.save(function(err) {
          res.redirect('/profile');
        });
      });
    }
  };

}).call(this);

//# sourceMappingURL=index.js.map
