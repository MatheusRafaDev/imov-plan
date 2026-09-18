const { MongoClient } = require('mongodb');

async function run() {
  // Using the URI from backend/.env if we can, or just hardcode if it's standard
  const uri = "mongodb+srv://rafaelsantanna01:132028Z.x@cluster0.zox2r.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('imovplan_db');
    const coll = db.collection('evolucaoMensalSimulacoes');
    
    const count = await coll.countDocuments();
    console.log(`Total EvolucaoMensalSimulacoes: ${count}`);

    const sample = await coll.findOne();
    if (sample) {
      console.log("Sample document:");
      console.log(JSON.stringify(sample, null, 2));
    }
  } finally {
    await client.close();
  }
}

run().catch(console.error);
