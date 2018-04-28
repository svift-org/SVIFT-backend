#svift-backend

##heroku

First downgrade heroku stack to cedar-14

´´
brew install heroku/brew/heroku
heroku login
heroku stack -a svift-backend
heroku stack:set cedar-14 -a svift-backend
´´

Add buildpacks (they need to be in correct order):

- https://github.com/heroku/heroku-buildpack-apt
- https://github.com/captain401/heroku-buildpack-xvfb
- https://github.com/jonathanong/heroku-buildpack-ffmpeg-latest.git
- https://github.com/mcollina/heroku-buildpack-graphicsmagick.git
- heroku/nodejs

via:

´´
heroku buildpacks:add --index 2 -a svift-backend https://github.com/captain401/heroku-buildpack-xvfb
´´

Add postgres add-on:

- Heroku Postgres

Add environmental vars:

- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY
- COOKIE_SECRET
- DATABASE_URL
- EXPRESS_SECRET
- DEBUG
- S3_BUCKET
- S3_BUCKET_NAME
- S3_FOLDER
- HEROKU_URL

If there are problems with dependencies, sometimes turning off the npm cache helps:

´´
heroku config:set NODE_MODULES_CACHE=false -a svift-backend-dev
´´

## Fonts

Goto http/template/vis.html and update the google font string. 
Then run install/postinstall
Copy the output of http/assets/style/CURRENT_FONT_SET into the frontend fonts.scss file.