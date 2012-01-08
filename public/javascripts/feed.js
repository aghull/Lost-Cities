var game;
var socket;

function updateGame(g, message) {
  game = g;
  me = null;
  $.each(game.players, function(i,p) { if (p.id==sid) me = i; });
  if (me != null) $('body').addClass('player'+(me+1));

  if (me!=null) $('form#addPlayer').remove();
  $('#message').empty();
  $('#message').html(message);
  d = $('#players');
  d.empty();
  $.each(game.players, function(i,p) {
    d.append($('<p/>', {text: p.name, style: "font-weight: "+(game.turn==i?'bold':'normal')}));
  });

  if (game.turn!=null) {
    $('#spot0').html(game.spots[0].length+' cards left');

    if (game.isover) {
      $('#message').html('Game is over.<br/>');
      $('#message').append('<strong>'+game.players[0].name+'</strong>: '+game.players[0].score+' (total '+game.players[0].totalscore+')');
      $('#message').append(' <strong>'+game.players[1].name+'</strong>: '+game.players[1].score+' (total '+game.players[1].totalscore+')');
      $('#message').append($('<p/>').append($('<a/>',{href:'#',onclick:"socket.emit('restartGame')",text:"Play again"})));
    }
    console.log(game.suits);
    for (i=1; i<=15; i++) {
      spot = $('#spot'+i);
      spot.empty();
      if (game.spots[i]!=null) {
        $.each(game.spots[i], function(i,h) {
          spot.append(new Card().load(h).toString());
        });
        if (i>5 && Card.worth(game.spots[i])) spot.append($('<div/>', {class:'worth', text:Card.worth(game.spots[i])}));
      }
    }
    if (game.lastSpot) $('#spot'+game.lastSpot+' span:last').css({opacity:0}).animate({opacity:1},2000);

    if (me!=null) {
      hand = d.append($('<p/>', {text: 'Your hand:'}));
      _(_(game.players[me].hand).sortBy(function(c) { return c.suit*100+c.number })).each(function(h) {
        d.append($('<div/>', { class:"card s"+h.suit+" n"+h.number, json:escape(JSON.stringify(h))}).append(new Card().load(h).toString())).append('<br/>');
      });

      if ((lc = game.players[me].lastcard) && (game.turn==me ^ game.stage==0))
        $('div.s'+lc.suit+'.n'+lc.number+':first').css({opacity:0}).animate({opacity:1},2000);
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


