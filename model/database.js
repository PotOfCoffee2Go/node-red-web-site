'use strict'
var util = require('util');

function NotFoundError() {
  this.name = 'NotFoundError'; this.status = 404;
  this.message = 'We could not find what you where looking for';
}
function InvalidTokenError() {
  this.name = 'InvalidTokenError'; this.status = 403;
  this.message = 'Bad csrf-token';
}
util.inherits(NotFoundError, Error);
util.inherits(InvalidTokenError, Error);

// {{{Module entry}}}
module.exports = (dbStorePath) => {
  // Load records from JSON file

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

    // Check if record Type was in the HTTP request querystring
    typeRequested: (msg => msg.req && msg.req.query && msg.req.query.type),
    
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
      // Make copy so not to change the database record itself
      var recordCopy =  Object.assign({}, record);
      var subrecords = database.records.filter(subrecord => subrecord.z === record.id);
      subrecords.forEach(subrecord => {
        recordCopy[subrecord.type] = recordCopy[subrecord.type] || [];
        recordCopy[subrecord.type].push(subrecord);
      });
      return recordCopy;
    },

    // {{{Get all or single blog record}}}
    getRecords: (msg, types) => {
      // When a single record requested - make a copy of db record in msg.record
      if (database.idRequested(msg)) {
          msg.payload = database.records.find(record => record.id === msg.req.params.recordId);
          // When got a single record - embed array(s) of it's subrecords
          if (msg.payload && Object.keys(msg.payload).length !== 0) {
            database.removeRecordTypeArrays(msg.payload);
            msg.payload = database.addRecordTypeArrays(msg.payload);
          }
          else {
            if (msg.next)
              msg.next(new NotFoundError());
            else
              msg.payload = {};
          }
      } // When ALL records requested - return array in msg.records (note the 's')
      else {
        if (database.typeRequested(msg)) {
          types = msg.req.query.type.split(',');
        }
        types = types || ['record','page'];
        msg.payload = [];
        database.records.forEach(record => {
          if (types.indexOf(record.type) > -1)
            msg.payload.push(record);
        });
      }
      return msg;
    },

    // {{{Add a record}}}
    newRecord: (msg) => {
      database.removeRecordTypeArrays(msg.payload);
      // Generate a new id Node-RED style
      msg.payload.id = (1+Math.random()*4294967295).toString(16);
      msg.payload.type = msg.payload.type || 'unknown';
      msg.payload.updated = new Date().toISOString();
      database.records.push(msg.payload);
      database.storeRecords();
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
        }
        else {
          if (msg.next)
            msg.next(new NotFoundError());
          else
            msg.payload = {};
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
        req.url = req.url.replace('/' + record.slug, '/' + record.id);
        req.params.recordId = record.id;
      }
    },
  
    // {{{Read records into memory}}}
    loadRecords: dbStorePath => {
      database.dbStorePath = dbStorePath;
      try {
        var data = fs.readJsonSync(dbStorePath);
      } catch(e){
        // A test records placeholder since can't read the data
        data = [{
          id: '791d7129.21687',
          type: 'record',
          slug: 'New-record-DB',
          striptitle: 'New record DB',
          title: 'New record DB',
          author: 'First record',
          body: '**' + dbStorePath + '** created',
          updated: new Date().toISOString()
        },{
          id: '6f0614c.b2f2eec',
          z: '791d7129.21687',
          type: 'subrec',
          slug: 'New-subrec-DB',
          striptitle: 'New record DB',
          title: 'New record DB',
          author: 'First record',
          body: '**' + dbStorePath + '** created',
          updated: new Date().toISOString()
        },{
          id: (1+Math.random()*4294967295).toString(16),
          z: '6f0614c.b2f2eec',
          type: 'subsubrec',
          slug: 'New-subrec-DB',
          striptitle: 'New record DB',
          title: 'New record DB',
          author: 'First record',
          body: '**' + dbStorePath + '** created',
          updated: new Date().toISOString()
        }];
      }
    
      database.records = data;
  
      // Get array of record types in database
      database.records.forEach(record => {
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

  database.loadRecords(dbStorePath);
  return database;
};
