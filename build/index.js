(function() {
  'use strict';
  module.exports = function(ndx) {
    var ObjectID, TwitterStrategy, scopes;
    TwitterStrategy = require('passport-twitter').Strategy;
    ObjectID = require('bson-objectid');
    ndx.settings.TWITTER_KEY = process.env.TWITTER_KEY || ndx.settings.TWITTER_KEY;
    ndx.settings.TWITTER_SECRET = process.env.TWITTER_SECRET || ndx.settings.TWITTER_SECRET;
    ndx.settings.TWITTER_CALLBACK = process.env.TWITTER_CALLBACK || ndx.settings.TWITTER_CALLBACK;
    ndx.settings.TWITTER_SCOPE = process.env.TWITTER_SCOPE || ndx.settings.TWITTER_SCOPE || 'email';
    if (ndx.settings.TWITTER_KEY) {
      scopes = ndx.passport.splitScopes(ndx.settings.TWITTER_SCOPE);
      ndx.passport.use(new TwitterStrategy({
        consumerKey: ndx.settings.TWITTER_KEY,
        consumerSecret: ndx.settings.TWITTER_SECRET,
        callbackURL: ndx.settings.TWITTER_CALLBACK,
        passReqToCallback: true,
        includeEmail: true
      }, function(req, token, tokenSecret, profile, done) {
        return process.nextTick(function() {
          if (!req.user) {
            return ndx.database.select(ndx.settings.USER_TABLE, {
              where: {
                twitter: {
                  id: profile.id
                }
              }
            }, function(users) {
              var newUser;
              if (users && users.length) {
                if (!users[0].twitter.token) {
                  ndx.database.update(ndx.settings.USER_TABLE, {
                    twitter: {
                      id: profile.id,
                      token: token,
                      username: profile.username,
                      displayName: profile.displayName
                    }
                  }, {
                    _id: users[0]._id
                  });
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
                ndx.database.insert(ndx.settings.USER_TABLE, newUser);
                return done(null, newUser);
              }
            });
          } else {
            ndx.database.update(ndx.settings.USER_TABLE, {
              twitter: {
                id: profile.id,
                token: token,
                username: profile.username,
                displayName: profile.displayName
              }
            }, {
              _id: req.user._id
            });
            return done(null, req.user);
          }
        });
      }));
      ndx.app.get('/api/twitter', ndx.passport.authenticate('twitter', {
        scope: scopes
      }), ndx.postAuthenticate);
      ndx.app.get('/api/twitter/callback', ndx.passport.authenticate('twitter'), ndx.postAuthenticate);
      ndx.app.get('/api/connect/twitter', ndx.passport.authorize('twitter', {
        scope: scopes
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
