const { MongoClient } = require('mongodb');

const uri = "mongodb://localhost:27017/QAP3"; // Replace with your MongoDB connection string
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    const database = client.db("QAP3");
    const collection = database.collection("books");

    const books = [
      { title: "The Hobbit", author: "J.R.R. Tolkien", genre: "Fantasy", year: 1937 },
      { title: "To Kill a Mockingbird", author: "Harper Lee", genre: "Fiction", year: 1960 },
      { title: "1984", author: "George Orwell", genre: "Dystopian", year: 1949 }
    ];

    await collection.insertMany(books);

    const titles = await collection.find({}, { projection: { title: 1, _id: 0 } }).toArray();
    console.log("Titles of all books:", titles);

    const tolkienBooks = await collection.find({ author: "J.R.R. Tolkien" }).toArray();
    console.log("Books by J.R.R. Tolkien:", tolkienBooks);

    const updateResult = await collection.updateOne({ title: "1984" }, { $set: { genre: "Science Fiction" } });
    console.log("1984 updated:", updateResult);

    const deleteResult = await collection.deleteOne({ title: "The Hobbit" });
    console.log("The Hobbit deleted:", deleteResult);

  } finally {
    await client.close();
  }
}

run().catch(console.dir);