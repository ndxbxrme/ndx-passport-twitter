(function() {
  'use strict';
  var ObjectID, TwitterStrategy, objtrans;

  TwitterStrategy = require('passport-twitter').Strategy;

  ObjectID = require('bson-objectid');

  objtrans = require('objtrans');

  module.exports = function(ndx) {
    var scopes;
    ndx.settings.TWITTER_KEY = process.env.TWITTER_KEY || ndx.settings.TWITTER_KEY;
    ndx.settings.TWITTER_SECRET = process.env.TWITTER_SECRET || ndx.settings.TWITTER_SECRET;
    ndx.settings.TWITTER_CALLBACK = process.env.TWITTER_CALLBACK || ndx.settings.TWITTER_CALLBACK;
    ndx.settings.TWITTER_SCOPE = process.env.TWITTER_SCOPE || ndx.settings.TWITTER_SCOPE || 'email';
    if (ndx.settings.TWITTER_KEY) {
      if (!ndx.transforms.twitter) {
        ndx.transforms.twitter = {
          twitter: {
            id: 'profile.id',
            token: 'token',
            username: 'profile.username',
            displayName: 'profile.displayName'
          }
        };
      }
      scopes = ndx.passport.splitScopes(ndx.settings.TWITTER_SCOPE);
      ndx.passport.use(new TwitterStrategy({
        consumerKey: ndx.settings.TWITTER_KEY,
        consumerSecret: ndx.settings.TWITTER_SECRET,
        callbackURL: ndx.settings.TWITTER_CALLBACK,
        passReqToCallback: true,
        includeEmail: true
      }, function(req, token, tokenSecret, profile, done) {
        return process.nextTick(function() {
          var updateUser, where;
          if (!ndx.user) {
            return ndx.database.select(ndx.settings.USER_TABLE, {
              where: {
                twitter: {
                  id: profile.id
                }
              }
            }, function(users) {
              var newUser, updateUser, where;
              if (users && users.length) {
                if (!users[0].twitter.token) {
                  updateUser = objtrans({
                    token: token,
                    profile: profile
                  }, ndx.transforms.twitter);
                  where = {};
                  where[ndx.settings.AUTO_ID] = users[0][ndx.settings.AUTO_ID];
                  ndx.database.update(ndx.settings.USER_TABLE, updateUser, where, null, true);
                  ndx.user = users[0];
                  return done(null, users[0]);
                }
                ndx.user = users[0];
                return done(null, users[0]);
              } else {
                newUser = objtrans({
                  token: token,
                  profile: profile
                }, ndx.transforms.twitter);
                newUser[ndx.settings.AUTO_ID] = ObjectID.generate();
                ndx.database.insert(ndx.settings.USER_TABLE, newUser, null, true);
                ndx.user = newUser;
                return done(null, newUser);
              }
            }, true);
          } else {
            updateUser = objtrans({
              token: token,
              profile: profile
            }, ndx.transforms.twitter);
            where = {};
            where[ndx.settings.AUTO_ID] = ndx.user[ndx.settings.AUTO_ID];
            ndx.database.update(ndx.settings.USER_TABLE, updateUser, where, null, true);
            return done(null, ndx.user);
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
        user = ndx.user;
        user.twitter.token = void 0;
        user.save(function(err) {
          res.redirect('/profile');
        });
      });
    }
  };

}).call(this);

//# sourceMappingURL=index.js.map
