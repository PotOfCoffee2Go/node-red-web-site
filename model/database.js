'use strict'

// {{{Modules}}}
const
    fs = require('fs-extra'),
    url = require('url'),
    moment = require('moment'),
    Mustache = require('mustache'),
    showdown = require('showdown'),
    showdownHighlight = require('showdown-highlight'),
    striptags = require('striptags');

// {{{Markup}}}
var
    converter = new showdown.Converter({extensions: [showdownHighlight]});
    converter.setFlavor('github');
    converter.setOption('parseImgDimensions', true); // Allow sizing of images

// {{{Presentation Logic}}}
// Markup text
function markDown(text) {
  return converter.makeHtml(text.replace(/\/\/\s*{{/g, '{{'));
}

// Content substitution
function mustache(text, hash) {
  return Mustache.render(text, hash);
}

// Few seconds ago, a minute ago, etc.
function timeText(post) {
  return moment.utc(post.updated, 'YYYY-MM-DD HH:mm:ss').local().fromNow();
}

// Remove HTML tags
function stripHtmlTags(text) {
  return striptags(text);
}

// {{{Business Logic}}}
// Check if a postId was given in the HTTP request
function idPosted(msg) {
  return msg.req && msg.req.params && msg.req.params.postId;
}

// Sort by id ascending
function byId(a,b) {
  if (a.id < b.id) return -1;
  if (a.id > b.id) return 1;
  return 0;
}

// Sort by update date descending
function byDate(a,b) {
  if (a.updated < b.updated) return 1;
  if (a.updated > b.updated) return -1;
  return 0;
}

// {{{Database storage}}}
// Placeholder for path to JSON file database
var postStore = '';

// Load the blog data
function loadPosts() {
  // A single blog post placeholder in case can't read the data
  var data = [{
    id: 1,
    slug: 'New-post-DB',
    striptitle: 'New post DB',
    title: 'New post DB',
    author: 'First post',
    body: '**' + postStore + '** created',
    updated: moment.utc()
  }];

  try {
    data = fs.readJsonSync(postStore);
  } catch(e){}

  database.posts.sort(byId);
  return data;
}

// Write blog posts data
function storePosts() {
    // Remove unwanted work fields
    database.posts.forEach(post => {
      delete post.marked;
    });

    fs.writeJsonSync(postStore, database.posts, {spaces: 2});
  }

// {{{Database}}}
var database = {
  // Placeholder for array of blog post data
  posts: [], 
  // {{{Get all or single blog post}}}
  getPosts: (msg) => {
    // When a single post requested - return in msg.post
    if (idPosted(msg)) {
        msg.post = database.posts.find(post => post.id === parseInt(msg.req.params.postId));
        if (msg.post) {
          var body = msg.post.body + 
            (msg.post.locallinks ? ('\n' + msg.post.locallinks) : '') + 
            (msg.postFooter ? ('\n' + msg.postFooter) : '');
          msg.post.marked = {
            striptitle: stripHtmlTags(markDown(msg.post.title)),
            title: markDown(msg.post.title),
            author: markDown(msg.post.author),
            lastupdated: timeText(msg.post),
            body: mustache(markDown(body), msg.post.context ? JSON.parse(msg.post.context) : {})
          };
        }
    } // When all posts requested - return list in msg.posts (note the 's')
    else {
        msg.posts = [];
        database.posts.forEach((post) => {
          post.marked = {
            striptitle: stripHtmlTags(markDown(post.title)),
            title: markDown(post.title),
            author: markDown(post.author),
            lastupdated : timeText(post)
          };
          msg.posts.push(post);
        });
        msg.posts.sort(byDate);
    }
    return msg;
  },

  // {{{Add a blog post}}}
  newPost: (msg) => {
    // Get largest id from database (+ 1) and push new post to DB
    var lastId = Math.max.apply(null, database.posts.map(post => post.id));
    msg.payload.id = lastId+1;
    msg.payload.updated = moment().toISOString();
    database.posts.push(msg.payload);
    storePosts();

    // Make this new id the http req paramater
    if (msg.req && msg.req.params) {
      msg.req.params.postId = msg.payload.id.toString();
    }
    return msg;
  },

  // {{{Update a blog post}}}
  updatePost: (msg) => {
    if (idPosted(msg)) {
      var idx = database.posts.findIndex(post => post.id === parseInt(msg.req.params.postId));
      if (idx > -1) {
        msg.payload.id = database.posts[idx].id; // insure id is a number
        msg.payload.updated = moment().toISOString();
        database.posts[idx] = msg.payload;
        storePosts();
      }
    }
    return msg;
  },

  // {{{Delete a blog post}}}
  deletePost: (msg) => {
    if (idPosted(msg)) {
      var idx = database.posts.findIndex(post => post.id === parseInt(msg.req.params.postId));
      if (idx > -1) {
        msg.payload = JSON.parse(JSON.stringify(database.posts[idx]));// copy
        database.posts.splice(idx, 1); // Remove the post
        storePosts();
      }
    }
    return msg;
  },
  
  // {{{Replace slug}}}
  permalink: (req) => {
    var post = database.posts.find(perm => perm.slug === req.params.slug);
    if (post) {
      req.url = req.url.replace('/posts/' + req.params.slug, '/posts/' + post.id);
      req.url = req.url.replace('/edit/' + req.params.slug, '/edit/' + post.id);
    }
  }

};

// {{{Module entry}}}
module.exports = function(postStorePath) {
  // Load blog posts from file
  postStore = postStorePath;
  database.posts = loadPosts();
  return database;
};

