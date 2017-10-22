var Datastore = require('nedb')
var db = new Datastore({filename: './dbs/atd.db', autoload: true});

var localDB = {

    store: function (json, callback) {
        db.insert(json, function (err, newDoc) {
            if (err)
                return callback(err)
            callback(null, newDoc);


        })
    },

    find: function (json, callback) {
        db.find(json, function (err, docs) {
            if (err)
                return callback(err)
            callback(null, docs);
        });

    }
}


/*localDB.store([{ a: 5 }, { a: 42 }], function (err, newDocs) {
    // Two documents were inserted in the database
    // newDocs is an array with these documents, augmented with their _id
});*/

module.exports = localDB;