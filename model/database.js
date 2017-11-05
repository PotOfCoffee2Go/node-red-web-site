'use strict'

// {{{Modules}}}
const fs = require('fs-extra');

// {{{Business Logic}}}
// Check if a postId was given in the HTTP request
function idPosted(msg) {return msg.req && msg.req.params && msg.req.params.postId;}

// {{{Database storage}}}
// Placeholder for path to JSON file database
var dbStore = '';

// Read blog posts data
function loadPosts() {
  // A single blog post placeholder in case can't read the data
  var data = [{
    id: 1,
    slug: 'New-post-DB',
    striptitle: 'New post DB',
    title: 'New post DB',
    author: 'First post',
    body: '**' + dbStore + '** created',
    updated: new Date().toISOString()
  }];

  try {
    data = fs.readJsonSync(dbStore);
  } catch(e){}

  // Storage of records will be by id ascending
  data.sort((a,b) => {return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;});
  return data;
}

// Write blog posts data
function storePosts() {
  fs.writeJsonSync(dbStore, database.posts, {spaces: 2});
}

// {{{Database}}}
var database = {
  // Placeholder for array of blog post data
  posts: [], 
  // {{{Get all or single blog post}}}
  getPosts: (msg) => {
    // When a single post requested - return in msg.post
    if (idPosted(msg)) {
        msg.post = database.posts.find(post => post.id === parseInt(msg.req.params.postId, 10));
    } // When ALL posts requested - return list in msg.posts (note the 's')
    else {
      msg.posts = [];
      database.posts.forEach((post) => {
        msg.posts.push(post);
      });
    }
    return msg;
  },

  // {{{Add a blog post}}}
  newPost: (msg) => {
    // Get largest id from database (+ 1) and push new post to DB
    var lastId = Math.max.apply(null, database.posts.map(post => post.id));
    msg.payload.id = lastId+1;
    msg.payload.updated = new Date().toISOString();
    database.posts.push(msg.payload);
    storePosts();
    return msg;
  },

  // {{{Update a blog post}}}
  updatePost: (msg) => {
    if (idPosted(msg)) {
      var idx = database.posts.findIndex(post => post.id === parseInt(msg.req.params.postId, 10));
      if (idx > -1) {
        msg.payload.id = database.posts[idx].id; // insure id is a number
        msg.payload.updated = new Date().toISOString();
        msg.payload.comments = database.posts[idx].comments || [] ;
        database.posts[idx] = msg.payload;
        storePosts();
      }
    }
    return msg;
  },

  // {{{Delete a blog post}}}
  deletePost: (msg) => {
    if (idPosted(msg)) {
      var idx = database.posts.findIndex(post => post.id === parseInt(msg.req.params.postId, 10));
      if (idx > -1) {
        msg.payload = JSON.parse(JSON.stringify(database.posts[idx]));// copy
        database.posts.splice(idx, 1); // Remove the post
        storePosts();
      }
    }
    return msg;
  },
  
  // {{{Add a comment}}}
  newComment: (msg) => {
    var lastId = 0;
    if (idPosted(msg)) {
      var idx = database.posts.findIndex(post => post.id === parseInt(msg.req.params.postId, 10));
      if (idx > -1) {
        if (!database.posts[idx].comments || database.posts[idx].comments.length === 0) {
          database.posts[idx].comments = [];
        }
        else {
          lastId = Math.max.apply(null, database.posts[idx].comments.map(comment => comment.id));
        }
        msg.payload.id = lastId + 1;
        msg.payload.updated = new Date().toISOString();
        msg.payload.approved = false;
        database.posts[idx].comments.unshift(msg.payload);
        storePosts();
        msg.payload = database.posts[idx]; // return complete blog post
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
module.exports = (dbStorePath) => {
  // Load blog posts from file
  dbStore = dbStorePath;
  database.posts = loadPosts();
  return database;
};
