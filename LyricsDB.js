const mongo = require('mongodb');
const MongoClient = mongo.MongoClient;
const url = 'mongodb://localhost:27017/';
const Db_Name = 'test';
const Lyrics_Collection_Name = 'lyrics';

const GetCollection = (dbName, collName) => {
    return MongoClient.connect(url, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }).then((client) => {
        const db = client.db(dbName);
        const collection = db.collection(collName);
        return collection;
    }).catch((err) => {
        return err;
    });
};

const LyricsCollection = () => {
    return GetCollection(Db_Name, Lyrics_Collection_Name);
};

const clear = () => {
    return LyricsCollection().then((collection) => {
        collection.drop();
    });
};

const listAll = async () => {
    return LyricsCollection().then((collection) => {
        return collection.find().toArray();
    }).catch((err) => {
        return [];
    });
};

const insertOne = (one) => {
    return MongoClient.connect(url, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }, (err, client) => {
        if (err) throw err;
        const db = client.db(Db_Name);
        const collection = db.collection(Lyrics_Collection_Name);
        collection.insertOne(one, (err, result) => {
            if (err) throw err;
            client.close()
        });
    });
};

module.exports = { insertOne, listAll, clear };