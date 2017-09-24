// database.js
const
    fs = require('fs-extra'),
    moment = require('moment');

/* Database */
module.exports = database = {
  // Read blog posts
  posts: fs.readJsonSync('./db/posts.json'),

  // Get all or single post
  getPosts: (msg) => {
    var local;

    if (msg.req && msg.req.params && msg.req.params.postId) {
        msg.post = database.posts.find(post => post.id === msg.req.params.postId);
        local = moment.utc(msg.post.updated, 'YYYY-MM-DD HH:mm:ss').local();
        msg.post.lastupdated = local.fromNow(); // a minute ago, etc.
    }
    else {
        msg.posts = database.posts;
        msg.posts.forEach((post) => {
            local = moment.utc(post.updated, 'YYYY-MM-DD HH:mm:ss').local();
            post.lastupdated = local.fromNow(); // a minute ago, etc.
        });
        // Sort by date desending
        msg.posts.sort(function(a, b) {
          return a.updated < b.updated;
        });
    }
    return msg;
  },

  // Add a post
  newPost: (msg) => {
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

  updatePost: (msg) => {
    if (msg.req && msg.req.params && msg.req.params.postId) {
      msg.post = database.posts.find(post => post.id === msg.req.params.postId);
      msg.post.updated = moment().toISOString();
      msg.post.author = msg.payload.author;
      msg.post.title = msg.payload.title;
      msg.post.body = msg.payload.body;
      database.storePosts();
    }
    return msg;
  },

  // Write blog posts data
  storePosts: () => {
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

