/* Notes/Tips:

- Use absolute paths to make sure they are agnostic to where your code is running from!
  Use the `path` module for that.
*/

const { getID } = require("../util/id");
const {writeFile, readFile, unlink} = require('fs');
const {serialize, deserialize} = require('../util/serialization.js');

function put(state, configuration, callback) {
  const key = configuration ? configuration.key || configuration || getID(state): getID(state);
  const gid = configuration ? configuration.gid || 'all' : 'all';

  const filepath = `${gid}${key}`;
  writeFile(filepath, serialize(state), 'utf-8', (err) => {
    if (err) {
      if (callback) {
        callback(err, null);
        return
      }
    }
    if (callback) {
      callback(null, state);
    }
  });
}

function get(configuration, callback) {
  const key = configuration ? configuration.key || configuration : configuration;
  const gid = configuration ? configuration.gid || 'all' : 'all';
  const filepath = `${gid}${key}`;

  if (key) {
    readFile(filepath, 'utf-8', (err, data) => {
      if (err) {
        if (callback) {
          callback(new Error('File Failed to read'), null);
          return
        }
      }
      const ret = deserialize(data);
      if (ret) {
        if (callback) {
          callback(null, ret);
          return
        }
      } else {
        if (callback) {
          callback(new Error("No data found"), null);
        }
      }
    });
  } else {
    if (callback) {
      callback(new Error("Filepath not provided"), null);
    }
  }
  
}

function del(configuration, callback) {
  const key = configuration ? configuration.key || configuration : configuration;
  const gid = configuration ? configuration.gid || 'all' : 'all';
  const filepath = `${gid}${key}`;

  if (key) {
    readFile(filepath, 'utf-8', (err, data) => {
      if (err) {
        if (callback) {
          callback(new Error('Failed to read file:', filepath), null);
          return
        }
      }
      const ret = deserialize(data);
      unlink(filepath, (err) => {
        if (err) {
          if (callback) {
            callback(err, null);
            return
          }
        }
        if (callback) {
          callback(null, ret);
          return
        }
      });
    });
  } else {
    if (callback) {
      callback(new Error("Filepath not provided"), null);
    }
  }
}

module.exports = {put, get, del};
