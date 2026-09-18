using System;
using System.IO;
using Microsoft.Extensions.Configuration;
using MongoDB.Driver;
using MongoDB.Bson;

class Program
{
    static void Main()
    {
        var config = new ConfigurationBuilder()
            .SetBasePath(Path.GetFullPath("../../backend/Presentation/ImovPlan.API"))
            .AddJsonFile("appsettings.json", optional: true)
            .AddJsonFile("appsettings.Development.json", optional: true)
            .AddEnvironmentVariables()
            .Build();

        // Hardcode the connection string from .env if needed, but let's try to get it
        var connStr = Environment.GetEnvironmentVariable("MongoDbSettings__ConnectionString") ?? 
                      "mongodb+srv://rafaelsantanna01:132028Z.x@cluster0.zox2r.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
                      
        var dbName = "imovplan_db";

        Console.WriteLine($"Conn: {connStr}");
        
        var client = new MongoClient(connStr);
        var db = client.GetDatabase(dbName);
        var coll = db.GetCollection<BsonDocument>("evolucaoMensalSimulacoes");
        
        var count = coll.CountDocuments(new BsonDocument());
        Console.WriteLine($"Total EvolucaoMensalSimulacoes: {count}");

        var sample = coll.Find(new BsonDocument()).FirstOrDefault();
        if (sample != null)
        {
            Console.WriteLine("Sample document:");
            Console.WriteLine(sample.ToJson(new MongoDB.Bson.IO.JsonWriterSettings { Indent = true }));
        }
    }
}
