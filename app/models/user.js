var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');



var User = db.Model.extend({
  tableName: 'users',
  hasTimeStamps: true,
  initialize: function () {
    this.on('creating', function (model, attrs, options) {

      var hash = bcrypt.hashSync(model.attributes.password);
      //console.log('Hashpassword', hash);

      //sets the password to the plain text
      model.set('password', model.attributes.password);

      //sets the password to hash in the users table
      //model.set('password', hash);

      //hash.update(model.get('password'));
    });
  }
});

module.exports = User;
