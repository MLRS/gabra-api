// for logging changes to Gabra
module.exports = {

  // Make a logger: a function which asynchronously adds update to log
  // ObjectID can be either object or string
  makeLogger: function (collection_name) {
    return function (req, object_id, new_val) {
      var coll = req.db.get('logs')
      var user = req.user ? req.user.username : ''
      if (typeof object_id !== 'object') {
        object_id = coll.id(object_id)
      }
      var obj = {
        'collection': collection_name,
        'object_id': object_id,
        'date': new Date(),
        'new_value': new_val,
        'username': user
      }
      coll.insert(obj)
    }
  }

}
