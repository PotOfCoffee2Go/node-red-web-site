// javascript object database
'use strict'
const postStore = './db/posts.json';

const
    fs = require('fs-extra'),
    moment = require('moment'),
    marked = require('marked');

// Set markup options
marked.setOptions({
  sanitize: false, // allow HTML
  highlight: (code) => {
    return require('highlight.js').highlightAuto(code).value;
  }
});

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

// Load the posts
function loadPosts() {
  // A single post in case can't read the data
  var data = [{
    id: 1,
    title: 'New post DB',
    author: 'First post',
    body: '**' + postStore + '** created',
    updated: moment.utc()
  }];

  try {
    data = fs.readJsonSync(postStore);
  } catch(e){}

  data.sort(byDate);
  return data;
}

function idPosted(msg) {
  return msg.req && msg.req.params && msg.req.params.postId;
}

// Few seconds ago, a minute ago, etc.
function timeText(post) {
  return moment.utc(post.updated, 'YYYY-MM-DD HH:mm:ss').local().fromNow();
}

// Markup the MarkDown
function markDown(body) {
  var markup = marked(body);
  markup = markup.replace(/class="lang/g, 'class="hljs lang');
  return markup;
}

/* Database */
var database = {
  // Read blog posts
  posts: loadPosts(),

  // Get all or single post
  getPosts: (msg) => {
    // When a single post requested - return in msg.post
    if (idPosted(msg)) {
        msg.post = database.posts.find(post => post.id === parseInt(msg.req.params.postId));
        if (msg.post) {
          msg.post.marked = {
            lastupdated: timeText(msg.post),
            body: markDown(msg.post.body) 
          };
        }
    } // When all posts requested - return list in msg.posts (note the 's')
    else {
        database.posts.forEach((post) => {
          post.marked = {
            lastupdated : timeText(post)
          };
        });
        msg.posts = database.posts;
    }
    return msg;
  },

  // Add a post
  newPost: (msg) => {
    var lastId = Math.max.apply(null, database.posts.map(post => post.id));
    msg.payload.id = lastId+1;
    msg.payload.updated = moment().toISOString();
    database.posts.push(msg.payload);
    database.storePosts();

    // Make this new id the http req paramater
    if (msg.req && msg.req.params) {
      msg.req.params.postId = msg.payload.id.toString();
    }
    database.getPosts(msg);
    return msg;
  },

  // Update a post
  updatePost: (msg) => {
    if (idPosted(msg)) {
      var idx = database.posts.findIndex(post => post.id === parseInt(msg.req.params.postId));
      if (idx > -1) {
        msg.payload.id = database.posts[idx].id; // insure id is a number
        msg.payload.updated = moment().toISOString();
        database.posts[idx] = msg.payload;
        database.storePosts();
        database.getPosts(msg);
      }
    }
    return msg;
  },

  // Delete a post
  deletePost: (msg) => {
    if (idPosted(msg)) {
      var idx = database.posts.findIndex(post => post.id === parseInt(msg.req.params.postId));
      if (idx > -1) {
        msg.payload = JSON.parse(JSON.stringify(database.posts[idx]));// copy
        database.posts.splice(idx, 1); // Remove the post
        database.storePosts();
      }
    }
    return msg;
  },

  // Write blog posts data
  storePosts: () => {
    // Remove unwanted work fields
    database.posts.forEach(post => {
      delete post.marked;
    });

    database.posts.sort(byId);
    fs.writeJsonSync(postStore, database.posts, {spaces: 2});
    database.posts.sort(byDate);
  }
};

module.exports = database;
