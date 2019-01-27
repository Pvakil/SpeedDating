var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://nwhacks:nwhacks123@ds050869.mlab.com:50869/andysdatingdb"
var hashes = new Array();

//DB CONNECTION
MongoClient.connect(url, function(err, db) {
  if (err) throw err;
  console.log("HuMONGOus database created!");

  dbo = db.db("andysdatingdb");
  students = dbo.collection("users");
  console.log("Collection connected!");

//QUERY
var user_check = dbo.collection("people").find({}).toArray(function(err, result){

  if (err) throw err;
  for(var i = 0 ; i < result.length ; i++){
      hashes.push(result[i].hash);
      console.log(hashes);

  }
});
});

