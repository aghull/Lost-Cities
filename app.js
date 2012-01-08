
/**
 * Module dependencies.
 */

var
  express = require('express'),
  _ = require('underscore'),
  models = require('./models')

var app = module.exports = express.createServer();
var io = require('socket.io').listen(app);

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.set('view options', { pretty: true });
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({ secret: "luvchild" }));
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

var game = new models.Game;

// Routes
app.get('/', function(req, res) { res.render('index', {req:req, game:game, title:'Lost Cities'}) });
app.get('/models', function(req, res) { res.sendfile('models.js') });
app.get('/*.(js|css)', function(req, res) { res.sendfile("./public"+req.url) });

io.sockets.on('connection', function (socket) {

  function updateGame(player) {
    // create JSON states showing only player-known info
    gameStates = [];
    gameStates[0] = JSON.parse(JSON.stringify(game));
    gameStates[1] = JSON.parse(JSON.stringify(game));
    // deck only can see number of cards
    if (game.spots[0] != null) gameStates[0].spots[0] = gameStates[1].spots[0] = new Array(game.spots[0].length);
    // cannot see each others hands
    if (game.players.length==2) {
      gameStates[0].players[1].hand = [];
      gameStates[1].players[0].hand = [];
    }
    socket.emit('update', {game:gameStates[player.number], message:player.message}); 
    socket.broadcast.emit('update', {game:gameStates[1-player.number], message:game.players.length==2?game.players[1-player.number].message:null}); 
  }

  // socket messages
  socket.on('addPlayer', function(data){ 
    me = (_(game.players).find(function(p) { return p.name == data.name }));
    if (me) me.id = data.sid;
    if (!me && game.players.length<2) {
      me = game.addPlayer(new Player(data.sid, data.name));
      if (game.players.length==2) game.setup();
    } else {
      // game is full
    }
    updateGame(me);
  });

  socket.on('restartGame', function(data){ 
    game.setup();
    updateGame(me);
  });

  socket.on('play', function(data){ 
    me = (_(game.players).find(function(p) { return p.id == data.sid }));
    if (!me) return; 
    game.play(me, new Card(data.card.suit,data.card.number));
    updateGame(me);
  });

  socket.on('discard', function(data){ 
    me = (_(game.players).find(function(p) { return p.id == data.sid }));
    if (!me) return; 
    game.discard(me, new Card(data.card.suit,data.card.number));
    updateGame(me);
  });

  socket.on('draw', function(data){ 
    me = (_(game.players).find(function(p) { return p.id == data.sid }));
    if (!me) return; 
    game.draw(me, data.spot);
    updateGame(me);
  });
});

var port = process.env.PORT || 8080;
app.listen(port);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
