'use strict'

// {{{Modules}}}
const fs = require('fs-extra');

// {{{Database}}}
var database = {
  // Placeholders for JSON file path and array of db records
  dbStorePath: '',  // Path to JSON file database
  types: [],        // Types of records in database
  records: [],      // Records in the database 
  
  // Check if a record Id was given in the HTTP request
  idRequested: (msg => msg.req && msg.req.params && msg.req.params.recordId),
  
  // Remove any arrays which have a name same as record 'type' in the database
  //   as those arrays are reconstucted from the records in the database
  //   see addRecordTypeArrays() below
  removeRecordTypeArrays: record => {
    for (var property in record) {
      if (record.hasOwnProperty(property)           // Is OwnProperty?
        && Array.isArray(record[property])          // Is an array?
        && database.types.indexOf(property) > -1) { // Is named same as record type in database?
          delete record[property];
      }
    }
  },
  
  // Add arrays (named same as record 'type') of records in database
  //   which have a 'z' field value matching this record Id
  addRecordTypeArrays: record => {
    var subrecords = database.records.filter(subrecord => subrecord.z === record.id);
    subrecords.forEach(subrecord => {
      record[subrecord.type] = record[subrecord.type] || [];
      record[subrecord.type].push(subrecord);
    });
  },

  // {{{Get all or single blog record}}}
  getRecords: (msg, types) => {
    // When a single record requested - make a copy of db record in msg.record
    if (database.idRequested(msg)) {
        msg.record = Object.assign({}, database.records.find(record => record.id === msg.req.params.recordId));
        // When got a single record - embed array(s) of it's subrecords
        if (Object.keys(msg.record).length !== 0) {
          database.removeRecordTypeArrays(msg.record);
          database.addRecordTypeArrays(msg.record);
        }
    } // When ALL records requested - return array in msg.records (note the 's')
    else {
      types = types || ['post','page'];
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
    database.removeRecordTypeArrays(msg.payload);
    // Generate a new id Node-RED style
    msg.payload.id = (1+Math.random()*4294967295).toString(16);
    msg.payload.type = msg.payload.type || 'unknown';
    msg.payload.updated = new Date().toISOString();
    database.records.push(msg.payload);
    database.storeRecords();
    msg.record = msg.payload;
    return msg;
  },

  // {{{Update a record}}}
  updateRecord: (msg) => {
    if (database.idRequested(msg)) {
      var idx = database.records.findIndex(record => record.id === msg.req.params.recordId);
      if (idx > -1) {
        database.removeRecordTypeArrays(msg.payload);
        msg.payload.id = database.records[idx].id; // insure id is set
        msg.payload.updated = new Date().toISOString();
        database.records[idx] = msg.payload;
        database.storeRecords();
        msg.record = msg.payload;
      }
    }
    return msg;
  },

  // {{{Delete a record}}}
  deleteRecord: (msg) => {
    if (database.idRequested(msg)) {
      var idx = database.records.findIndex(record => record.id === msg.req.params.recordId);
      if (idx > -1) {
        msg.payload = Object.assign({}, database.records[idx]);
        database.records.splice(idx, 1); // Remove the record
        database.storeRecords();
      }
    }
    return msg;
  },

  // {{{Replace slug with record Id}}}
  permalink: (req) => {
    var record = database.records.find(perm => perm.slug === req.params.slug);
    if (record) {
      req.url = req.url.replace('/records/' + req.params.slug, '/records/' + record.id);
      req.url = req.url.replace('/posts/' + req.params.slug, '/posts/' + record.id);
      req.url = req.url.replace('/comments/' + req.params.slug, '/posts/' + record.id);
      req.url = req.url.replace('/edit/' + req.params.slug, '/edit/' + record.id);
    }
  },

  // {{{Read records into memory}}}
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

    // Get array of record types in database
    database.records.forEach((record) => {
      if (database.types.indexOf(record.type) === -1) {
        if (record.type) database.types.push(record.type);
      }
    });
  },
  
  // {{{Write records from memory}}}
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
