var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');



var User = db.Model.extend({
  tableName: 'users',
  hasTimeStamps: true,
  initialize: function () {
    // console.log('this is line 11 user.js');
    // console.log('what is this', this.on);
    this.on('creating', function (model, attrs, options) {
      console.log('this is this', this);
      console.log('this is attrs of login ', attrs);
      var hash = bcrypt.hash('');
      //hash.update(model.get('users'));
      //set 'password' to whatever hash is
    });
  }
});

module.exports = User;
