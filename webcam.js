const  PORT = process.env.PORT || 3000;
const  express = require('express');
var path = require('path');
var router = express.Router();
const  http = require('http');
var app = express();
const  server = http.createServer(app);
const  io  = require('socket.io').listen(server);
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://nwhacks:nwhacks123@ds050869.mlab.com:50869/andysdatingdb"
var students;
var dbo;
var bodyParser = require('body-parser')
var incall_hashes = new Array();
var waiting_hashes = new Array();
var hashes = new Array();
var dict = {};

//io.set('log level', 1);

app.use(express.static(__dirname));
server.listen(PORT, null, function() {
    console.log("Listening on port " + PORT);
});
//Default page
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

app.use('/', function(req,res,next){
  console.log(req.method, 'request:', req.url, JSON.stringify(req.body));
  next();
});

app.get(/webcam*/, function(req, res) {
    res.sendfile(path.join(__dirname + "/webcam.html"));
});

//Default page
app.get("/", function(req, res) {
    res.sendfile(path.join(__dirname + "/landing_page.html"));
});

//annoymous.html accessed through /annoymous
app.get("/annoymous", function(req, res) {
    res.sendfile(path.join(__dirname + "/annoymous.html"));
});

//annoymous.html accessed through /annoymous
app.get("/waiting", function(req, res) {
    res.sendfile(path.join(__dirname + "/waiting.html"));
});

//annoymous.html accessed through /annoymous
app.get("/webcam", function(req, res) {
    res.sendfile(path.join(__dirname + "/webcam.html"));
});

app.get("/1", function(req, res) {
    res.sendfile(path.join(__dirname + "/create_profile.html"));
});

var i = 0;
/**
 * Users will connect to the signaling server, after which they'll issue a "join"
 * to join a particular channel. The signaling server keeps track of all sockets
 * who are in a channel, and on join will send out 'addPeer' events to each pair
 * of users in a channel. When clients receive the 'addPeer' even they'll begin
 * setting up an RTCPeerConnection with one another. During this process they'll
 * need to relay ICECandidate information to one another, as well as SessionDescription
 * information. After all of that happens, they'll finally be able to complete
 * the peer connection and will be streaming audio/video between eachother.
 */
const channels = {};
const sockets = {};

MongoClient.connect(url, {useNewUrlParser: true}, function(err, db) {
  useNewUrlParser: true;
  if (err) throw err;
  console.log("HuMONGOus database created!");

  dbo = db.db("andysdatingdb");
  students = dbo.collection("people");
  console.log("Collection connected!");
});

io.sockets.on('connection', (socket) => {
    socket.channels = {};
    sockets[socket.id] = socket;
    console.log("["+ socket.id + "] connection accepted");
      dict[socket.id] = hashes[hashes.length - 1];
      for (var key in dict) {
            var value = dict[key];

      }
        i++;

    socket.on('disconnect', () => {
        for (const channel in socket.channels) {
            part(channel);
        }

      console.log("["+ socket.id + "] disconnected");
      console.log("length of hashes = " + hashes.length);
      console.log(hashes);
      for (var key in dict) {
        if (key === socket.id) {
            var hash = dict[key];
            console.log("single hash: " + hash)
          for(var i = 0 ; i < hashes.length ; i++){
              if (hash === hashes[i]) {
                   console.log('fuck');
                    hashes.splice(i, 1);
                    console.log(hashes)
         }
            };
            }
      }
    });

    socket.on('join', (config) => {
        //console.log("["+ socket.id + "] join ", config);
        const channel = config.channel;
        const userdata = config.userdata;

        if (channel in socket.channels) {
            //console.log("["+ socket.id + "] ERROR: already joined ", channel);
            return;
        }

        if (!(channel in channels)) {
            channels[channel] = {};
        }

        for (id in channels[channel]) {
            channels[channel][id].emit('addPeer', {'peer_id': socket.id, 'should_create_offer': false});
            socket.emit('addPeer', {'peer_id': id, 'should_create_offer': true});
        }

        channels[channel][socket.id] = socket;
        socket.channels[channel] = channel;
    });

    const part = (channel) => {
        //console.log("["+ socket.id + "] part ");

        if (!(channel in socket.channels)) {
            //console.log("["+ socket.id + "] ERROR: not in ", channel);
            return;
        }

        delete socket.channels[channel];
        delete channels[channel][socket.id];

        for (id in channels[channel]) {
            channels[channel][id].emit('removePeer', {'peer_id': socket.id});
            socket.emit('removePeer', {'peer_id': id});
        }
    }
    socket.on('part', part);

    socket.on('relayICECandidate', (config) => {
        let peer_id = config.peer_id;
        let ice_candidate = config.ice_candidate;
        //console.log("["+ socket.id + "] relaying ICE candidate to [" + peer_id + "] ", ice_candidate);

        if (peer_id in sockets) {
            sockets[peer_id].emit('iceCandidate', {'peer_id': socket.id, 'ice_candidate': ice_candidate});
        }
    });

    socket.on('relaySessionDescription', (config) => {
        let peer_id = config.peer_id;
        let session_description = config.session_description;
        //console.log("["+ socket.id + "] relaying session description to [" + peer_id + "] ", session_description);

        if (peer_id in sockets) {
            sockets[peer_id].emit('sessionDescription', {'peer_id': socket.id, 'session_description': session_description});
        }
    });
});


app.post('/register', function(req,res){
    console.log("register!");
    var newUser = {
      name : req.body.name,
      age : req.body.age,
      email : req.body.email,
      password : req.body.password,
      hash : Math.random().toString(36).substr(2, 6),
    };

    // bcrypt.genSalt(10, function(err, salt) {
    //   bcrypt.hash(newUser.password, salt, function(err, hash) {
    //       if(err) throw err;
    //       newUser.password = hash;
    dbo.collection("people").insertOne(newUser, function(err, res) {
      if (err) throw err;
      console.log("Inserted user: " + req.body.name + " with password "+ newUser.password);
     // db.close();
    });
             res.redirect('/login.html');
        // });
    // });

});
app.get('/find',function(req,res){
  //0 people case
 console.log("FUCK YES");
 var user_check = dbo.collection("people").find({}).toArray(function(err, result){
   if(result === undefined){
     Bigres.redirect('/');
   }
 if (waiting_hashes.length === 1) {
      res.redirect("/webcam/" + waiting_hashes[0]);
      incall_hashes.push(waiting_hashes.pop());
      incall_hashes.push(result[i].hash);
     // break;
  }
  else {
     res.redirect("/webcam/" + result[i].hash);
      waiting_hashes.push(result[i].hash);
      // break;
  }
  // else if (hashes.length % 2 == 0) {
  //    res.redirect("/webcam/" + result[i].hash);
  //     hashes.push(result[i].hash);
  //     break;
  // }
  // else {
  //     res.redirect("/webcam/" + hashes[hashes.length - 1]);
  //     hashes.push(result[i].hash);
  //     break;
  // }
  hashes.push(result[i].hash);
  console.log("length of hashes = " + waiting_hashes.length);
  console.log("length of incall " + incall_hashes.length);
})
});



app.post('/login',function(req,res){
      console.log("checking username and pass")
      console.log("current email ", req.body.email)
      var user_exist = false;
      var user_check = dbo.collection("people").find({}).toArray(function(err, result){
        if(result === undefined){
          Bigres.redirect('/');
        }
          if (err) throw err;
          for(var i = 0 ; i < result.length ; i++){
            if(result[i].email === req.body.email){
              console.log("found my mans" , result[i].name);
              console.log("ok checking pass now...");
              user_exist=true;
              // bcrypt.compare(req.body.password, result[i].password, function(err, res) {
              //   user_exist = res;
              //   console.log(user_exist + "you entered ");
              //   res? Bigres.redirect('/annoymous.html') : Bigres.redirect('/');
              // });
              if(result[i].password === req.body.password){

                //0 people case
               if (waiting_hashes.length === 1) {
                    res.redirect("/webcam/" + waiting_hashes[0]);
                    incall_hashes.push(waiting_hashes.pop());
                    incall_hashes.push(result[i].hash);
                   break;
                }
                else if (waiting_hashes.length === 0) {
                   res.redirect("/webcam/" + result[i].hash);
                    waiting_hashes.push(result[i].hash);
                    break;
                }
                // else if (hashes.length % 2 == 0) {
                //    res.redirect("/webcam/" + result[i].hash);
                //     hashes.push(result[i].hash);
                //     break;
                // }
                // else {
                //     res.redirect("/webcam/" + hashes[hashes.length - 1]);
                //     hashes.push(result[i].hash);
                //     break;
                // }
                // //hashes.push(result[i].hash);
                console.log("length of hashes = " + waiting_hashes.length);
                console.log("length of incall " + incall_hashes.length);
               res.redirect('/waiting.html');

              }
              else{
                res.redirect('/login.html');
              }
            }
          }
          if(user_exist === false){
            res.redirect('/create_profile.html');
          }
      });
  });
