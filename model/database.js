'use strict'

// {{{Modules}}}
const fs = require('fs-extra');

// {{{Database}}}
var database = {
  // Placeholders for JSON file path and array of db records
  dbStorePath: '',
  records: [], 
  
  // Check if a recordId was given in the HTTP request
  idRequested: (msg => msg.req && msg.req.params && msg.req.params.recordId),

  // {{{Get all or single blog record}}}
  getRecords: (msg, types) => {
    // When a single record requested - return in msg.record
    if (database.idRequested(msg)) {
        msg.record = database.records.find(record => record.id === parseInt(msg.req.params.recordId, 10));
    } // When ALL records requested - return list in msg.records (note the 's')
    else {
      types = types || ['post'];
      msg.records = [];
      database.records.forEach((record) => {
        if (types.indexOf(record.type) > -1)
          msg.records.push(record);
      });
    }
    return msg;
  },

  // {{{Add a blog record}}}
  newRecord: (msg) => {
    // Get largest id from database (+ 1) and push new record to DB
    var lastId = Math.max.apply(null, database.records.map(record => record.id));
    msg.payload.id = lastId+1;
    msg.payload.updated = new Date().toISOString();
    database.records.push(msg.payload);
    database.storeRecords();
    return msg;
  },

  // {{{Update a blog record}}}
  updateRecord: (msg) => {
    if (database.idRequested(msg)) {
      var idx = database.records.findIndex(record => record.id === parseInt(msg.req.params.recordId, 10));
      if (idx > -1) {
        msg.payload.id = database.records[idx].id; // insure id is a number
        msg.payload.updated = new Date().toISOString();
        msg.payload.comments = database.records[idx].comments || [] ;
        database.records[idx] = msg.payload;
        database.storeRecords();
      }
    }
    return msg;
  },

  // {{{Delete a blog record}}}
  deleteRecord: (msg) => {
    if (database.idRequested(msg)) {
      var idx = database.records.findIndex(record => record.id === parseInt(msg.req.params.recordId, 10));
      if (idx > -1) {
        msg.payload = JSON.parse(JSON.stringify(database.records[idx]));// copy
        database.records.splice(idx, 1); // Remove the record
        database.storeRecords();
      }
    }
    return msg;
  },
  
  // {{{Add a comment}}}
  newComment: (msg) => {
    var lastId = 0;
    if (database.idRequested(msg)) {
      var idx = database.records.findIndex(record => record.id === parseInt(msg.req.params.recordId, 10));
      if (idx > -1) {
        if (!database.records[idx].comments || database.records[idx].comments.length === 0) {
          database.records[idx].comments = [];
        }
        else {
          lastId = Math.max.apply(null, database.records[idx].comments.map(comment => comment.id));
        }
        msg.payload.id = lastId + 1;
        msg.payload.updated = new Date().toISOString();
        msg.payload.approved = false;
        database.records[idx].comments.unshift(msg.payload);
        database.storeRecords();
        msg.payload = database.records[idx]; // return complete blog record
      }
    }
    return msg;
  },

  // {{{Replace slug with record Id}}}
  permalink: (req) => {
    var record = database.records.find(perm => perm.slug === req.params.slug);
    if (record) {
      req.url = req.url.replace('/posts/' + req.params.slug, '/posts/' + record.id);
      req.url = req.url.replace('/edit/' + req.params.slug, '/edit/' + record.id);
    }
  },

  // Read records into memory
  loadRecords: (dbStorePath) => {
    database.dbStorePath = dbStorePath;
    // A single blog record placeholder in case can't read the data
    var data = [{
      id: 1,
      type: 'record',
      slug: 'New-record-DB',
      striptitle: 'New record DB',
      title: 'New record DB',
      author: 'First record',
      body: '**' + dbStorePath + '** created',
      updated: new Date().toISOString()
    }];
  
    try {
      data = fs.readJsonSync(dbStorePath);
    } catch(e){}
  
    database.records = data;
    // Storage of records will be by id ascending
    database.records.sort((a,b) => {return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;});
  },
  
  // Write records from memory
  storeRecords: () => {
    fs.writeJsonSync(database.dbStorePath, database.records, {spaces: 2});
  }

};

// {{{Module entry}}}
module.exports = (dbStorePath) => {
  // Load records from JSON file
  database.loadRecords(dbStorePath);
  return database;
};
