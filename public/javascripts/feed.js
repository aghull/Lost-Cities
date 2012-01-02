var game;
var socket;

function updateGame(g, message) {
  game = g;
  me = null;
  $.each(game.players, function(i,p) { if (p.id==sid) me=i; });

  if (me!=null) $('form#addPlayer').remove();
  $('#message').html(message);
  d = $('#players');
  d.empty();
  $.each(game.players, function(i,p) {
      d.append($('<p/>', {text: p.name, style: "font-weight: "+(game.turn==i?'bold':'normal')}));
  });

  if (game.turn!=null) {
    $('#spot0').html(game.spots[0].length+' cards left');

    for (i=1; i<=15; i++) {
      s=i;
      // reverse board for player 2
      if (me==1 && s>10) s-=5;
      else if (me==1 && s<=10 && s>5) s+=5;
      spot = $('#spot'+s);
      spot.empty();
      if (game.spots[i]!=null) {
        $.each(game.spots[i], function(i,h) {
          spot.append($('<div/>', { text:Card.render(h) }));
        });
        if (i>5 && Card.worth(game.spots[i])) spot.append($('<div/>', {class:'worth', text:Card.worth(game.spots[i])}));
      }
    }

    if (me!=null) {
      hand = d.append($('<p/>', {text: 'Your hand:'}));
      _(_(game.players[me].hand).sortBy(function(c) { return c.suit*100+c.number })).each(function(h) {
        d.append($('<span/>', { class:"card", json:escape(JSON.stringify(h)), text:Card.render(h) })).append('<br/>');
      });
    }
  }
}

$(document).ready(function () {
  socket = io.connect();
  socket.on('update', function(data) {
    if (data.game) {
      updateGame(data.game, data.message);
    }
  });

  $('button#addPlayer').click(function() {
    socket.emit('addPlayer', {sid: sid, name: this.form.name.value});
    return false;
  });

  for(i=0;i<=5;i++) {
    $('#spot'+i).mouseover(function() { $(this).css('cursor','pointer') });
    $('#spot'+i).click(function() {
      socket.emit('draw', {sid: sid, spot:this.id.substr(4)});
      return false;
    });
  };

  $('.card').live('mouseover', function() {
    card = unescape($(this).attr('json'));
    $('.playcard').remove();
    $(this).after($('<span/>', {class:'playcard'})
                   .append($('<a/>', { text: 'discard', href:'#', onclick: 'discard('+card+')' }),
                           $('<a/>', { text: 'play', href:'#', onclick: 'play('+card+')' }))
                   );
  });
})

function discard(card) {
  socket.emit('discard', {sid: sid, card: card });
}
function play(card) {
  socket.emit('play', {sid: sid, card: card });
}


