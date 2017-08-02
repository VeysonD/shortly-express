var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');



var User = db.Model.extend({
  tableName: 'users',
  hasTimeStamps: true,
  initialize: function () {
    this.on('creating', function (model, attrs, options) {
      this.createHash(model.attributes.password);
    });
  },

  createHash: function (password) {
    var cypher = Promise.promisify(bcrypt.hash);
    cypher(password, null, null)
    .bind(this)
    .then(function(hash) {
      this.set('password', hash);
    });
  },

  compare: function (password, hash, callback) {
    bcrypt.compare(password, hash, function (err, res) {
      if (err) {
        return console.log(err);
      }
      callback(res);
    });
  }

});

module.exports = User;
