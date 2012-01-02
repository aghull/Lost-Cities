
/**
 * Module dependencies.
 */

var
  express = require('express'),
  _ = require('underscore'),
  models = require('./models'),
  RedisStore = require('connect-redis')(express);

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
  app.use(express.session({ secret: "luvchild", store: new RedisStore }));
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
app.get('/underscore', function(req, res) { res.sendfile('../node_modules/underscore/underscore-min.js') });
app.get('/*.(js|css)', function(req, res) { res.sendfile("./public"+req.url) });

io.sockets.on('connection', function (socket) {

  function updateGame(player) {
    socket.emit('update', {game:game, message:player.message}); 
    socket.broadcast.emit('update', {game:game}); 
  }

  // socket messages
  socket.on('addPlayer', function(data){ 
    me = (_(game.players).find(function(p) { return p.name == data.name }));
    if (!me && game.players.length<2) {
      me = game.addPlayer(new Player(data.sid, data.name));
    } else {
      // game is full
    }
    if (game.players.length==2) game.setup();
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

app.listen(80);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
