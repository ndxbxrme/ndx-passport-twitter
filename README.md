# ndx-passport-twitter 
### twitter login for [ndx-framework](https://github.com/ndxbxrme/ndx-framework) apps
install with   
`npm install --save ndx-passport-twitter`  
## example
`src/server/app.coffee`  
```coffeescript
require 'ndx-server'
.config
  database: 'db'
.use ndx-passport
.use ndx-passport-twitter
.start()
```
`src/client/../login.jade`  
```jade
a(href='/api/twitter', target='_self') Twitter
```
## environment/config variables  
|environment|config|description|
|-----------|------|-----------|
|TWITTER_KEY|twitterKey|your twitter key|
|TWITTER_SECRET|twitterSecret|your twitter secret|
|TWITTER_CALLBACK|twitterCallback|set this to `http(s)://yourservername.com/api/twitter/callback`|
|TWITTER_SCOPE|twitterScope|a list of scopes you want access to|