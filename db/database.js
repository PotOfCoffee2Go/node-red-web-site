// database.js
'use strict'
var database;

const
    fs = require('fs-extra'),
    moment = require('moment');

/* Database */
module.exports = database = {
  // Read blog posts - will error on startup if issues getting data
  posts: fs.readJsonSync('./db/posts.json'),

  // Get all or single post
  getPosts: (msg) => {
    var local;
    // When a single post requested - return in msg.post
    if (msg.req && msg.req.params && msg.req.params.postId) {
        msg.post = database.posts.find(post => post.id === msg.req.params.postId);
        if (msg.post) {
          msg.post.lastupdated = moment.utc(msg.post.updated, 'YYYY-MM-DD HH:mm:ss')
            .local().fromNow(); // a minute ago, etc.
        }
    }
    // When all posts requested - return in msg.posts (note the 's')
    else {
        msg.posts = database.posts;
        // Set the last updated text
        msg.posts.forEach((post) => {
            post.lastupdated = moment.utc(post.updated, 'YYYY-MM-DD HH:mm:ss')
              .local().fromNow();
        });
        // Sort by update date desending
        msg.posts.sort((a, b) => a.updated < b.updated);
    }
    return msg;
  },

  // Add a post
  newPost: (msg) => {
    // Sort by id assending
    database.posts.sort((a, b) => a.id > b.id);
    var lastId = database.posts.slice(-1)[0].id;
    var newId = (parseInt(lastId)+1).toString();

    database.posts.push( {
        id: newId,
        updated: moment().toISOString(),
        author: msg.payload.author,
        title: msg.payload.title,
        body: msg.payload.body
    });

    database.storePosts();

    if (msg.req && msg.req.params) {
      msg.req.params.postId = newId;
    }
    return msg;
  },

  // Update a post
  updatePost: (msg) => {
    if (msg.req && msg.req.params && msg.req.params.postId) {
      msg.post = database.posts.find(post => post.id === msg.req.params.postId);
      if (msg.post) {
        msg.post.updated = moment().toISOString();
        msg.post.author = msg.payload.author;
        msg.post.title = msg.payload.title;
        msg.post.body = msg.payload.body;
        database.storePosts();
      }
    }
    return msg;
  },

  // Delete a post
  deletePost: (msg) => {
    if (msg.req && msg.req.params && msg.req.params.postId) {
      var index;
      msg.post = database.posts.find((post, idx) => {
        index = idx;
        return post.id === msg.req.params.postId;
        });
      if (msg.post) {
        msg.payload = {};
        msg.payload.updated = moment().toISOString();
        msg.payload.author = msg.post.author;
        msg.payload.title = msg.post.title;
        msg.payload.body = msg.post.body;

        database.posts.splice(index, 1); // Remove the post
        database.storePosts();
      }
    }
    return msg;
  },

  // Write blog posts data
  storePosts: () => {
    // Sort by id assending
    database.posts.sort((a, b) => a.id > b.id);
    // Remove unwanted work fields
    database.posts.forEach(post => {
      delete post.markedbody;
      delete post.lastupdated;
    });
    fs.writeJson('./db/posts.json', database.posts, {spaces: 2}, err => {
      if (err) return console.error(err);
    });
  }
};

