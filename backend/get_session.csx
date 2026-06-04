using MongoDB.Driver;
using MongoDB.Bson;
using System;

var client = new MongoClient(""mongodb://localhost:27017"");
var db = client.GetDatabase(""ImovPlanDb"");
var collection = db.GetCollection<BsonDocument>(""objetivos"");
var filter = Builders<BsonDocument>.Filter.Eq(""_id"", new ObjectId(""6a21b039241157b0e2e3743a""));
var doc = collection.Find(filter).FirstOrDefault();
if (doc != null) {
    Console.WriteLine(doc[""sessionId""].AsString);
}
