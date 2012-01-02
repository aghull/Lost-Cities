if (typeof(exports)!=='undefined') {
  var _ = require('underscore');
}

Game = function() {
  this.players = [];
  //this.addPlayer(new Player('x','placeholder'));
  this.spots = new Array(16); // 0 - deck, 1-5 discards, 6-10 p1, 11-15 p2
  this.turn = null; // 0 or 1
  this.stage = null; // 0 or 1
  this.lastDiscard = null;
  this.isover = false;
}

Game.prototype.addPlayer = function(player) {
  player.number = this.players.length;
  this.players.push(player);
  return player;
}

Game.prototype.setup = function() {
  this.isover = false;
  deck = [];
  for (s=0;s!=5;s++) {
    deck.push(new Card(s,0), new Card(s,0), new Card(s,0));
    for (n=1;n<=10;n++) deck.push(new Card(s,n));
  }
  this.spots = new Array(16);
  this.spots[0] = _.shuffle(deck);
  for (i=1;i<=15;i++) this.spots[i] = [];

  if (this.players[0].score>this.players[1].score) this.turn = 0;
  else if (this.players[0].score<this.players[1].score) this.turn = 1;
  else this.turn = parseInt(Math.random()*2);

  this.stage = 0;
  this.players[0].hand = [];
  this.players[1].hand = [];
  // give 8 cards to each player
  for (i=0;i!=8;i++) {
    this.giveCard(0, 0);
    this.giveCard(1, 0);
  }
  this.players[0].lastcard = null;
  this.players[1].lastcard = null;
}

Game.prototype.giveCard = function(player, spot) {
  if (spot>5 || !this.spots[spot] || !this.spots[spot].length) return;
  this.players[player].hand.push(this.players[player].lastcard = this.spots[spot].pop());
}

Game.prototype.play = function(player, card) {
  if (this.turn!=player.number) return this.message(player, 'Not your turn');
  if (this.stage!=0) return this.message(player, 'Cannot play another card');
  this.message(player, null);
  if (!player.remove(card)) return this.message(player, 'Illegal move');
  spot = this.spots[card.suit + 6 + player.number*5];
  if (spot.length && spot[spot.length-1].number>card.number)
    return this.message(player, 'Cannot play that');
  spot.push(card);
  this.lastDiscard = null;
  this.stage = 1;
}

Game.prototype.discard = function(player, card) {
  if (this.turn!=player.number) return this.message(player, 'Not your turn');
  if (this.stage!=0) return this.message(player, 'Cannot play another card');
  this.message(player, null);
  if (!player.remove(card)) return this.message(player, 'Illegal move');
  spot = this.spots[card.suit + 1];
  spot.push(card);
  this.lastDiscard = spot;
  this.stage = 1;
}

Game.prototype.draw = function(player, spot) {
  if (this.turn!=player.number) return this.message(player, 'Not your turn');
  if (this.stage!=1) return this.message(player, 'Must play a card first');
  if (this.lastDiscard == spot) return this.message(player, 'May not draw your own discard on same turn');
  this.message(player, null);
  this.giveCard(player.number, spot);
  this.stage = 0;
  this.turn = 1-this.turn;
  if (this.spots[0].length<=47) {
    this.endGame();
  }
}

Game.prototype.endGame = function() {
  this.isover = true;
  this.players[0].totalscore += (this.players[0].score = Card.worth(this.spots[6])+Card.worth(this.spots[7])+Card.worth(this.spots[8])+Card.worth(this.spots[9])+Card.worth(this.spots[10]));
  this.players[1].totalscore += (this.players[1].score = Card.worth(this.spots[11])+Card.worth(this.spots[12])+Card.worth(this.spots[13])+Card.worth(this.spots[14])+Card.worth(this.spots[15]));
}

Game.prototype.message = function(player, message) {
  player.message = message;
}

Player = function(id,name) {
  this.id = id;
  this.name = name;
  this.number = null;
  this.message = null;
  this.score = 0;
  this.totalscore = 0;
  this.hand = [];
}

Player.prototype.remove = function(card) {
  removed = _(this.hand).reject(function(c) { return c.suit==card.suit && c.number==card.number });
  if (removed.length==this.hand.length) {
    console.log("could not find card "+card+" in "+this.hand);
    return false;
  }
  this.hand = removed;
  return true;
}

Card = function(suit,number) {
  this.suit = suit;
  this.number = number; // 0 for coop
}

Card.render = function(card) { return ['red','white','green','yellow','blue'][card.suit]+' '+(card.number?card.number:'COOP') }
Card.worth = function(cards) {
  if (cards.length==0) return 0;
  multiplier = _(cards).filter(function(c) {return c.number==0}).length+1;
  value = _(cards).reduce(function(sum, c) {return sum + c.number}, 0);
  return multiplier*(value-20);
}
Card.prototype.toString = function() { return Card.render(this); }

if (typeof(exports)!=='undefined') {
  exports.Game = Game;
  exports.Player = Player;
  exports.Card = Card;
}