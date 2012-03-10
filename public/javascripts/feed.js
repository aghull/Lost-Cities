var game;
var socket;

function updateGame(g, message) {
  noGame = game!=null && game.id==null;
  if (game!=null && game.id!=g.id) return;
  game = new Game().load(g);
  if (noGame && game.id!=null) document.location='/game/'+game.id;

  me = null;
  $.each(game.players, function(i,p) { if (p.id==sid) me = i; });
  if (me != null) {
    $("table#board").prepend($("tr#p"+(2-me)).remove());
    $('form#addPlayer').remove();
    if (game.players.length==1) message='Player 2 may join at <a href="'+document.location+'">'+document.location+'</a>';
  }
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
      $('#message').append($('<p/>').append($('<a/>',{href:'#',onclick:"socket.emit('restartGame',{gid:\'"+game.id+"\'}, )",text:"Play again"})));
    }
    for (i=1; i<=15; i++) {
      spot = $('#spot'+i);
      spot.empty();
      if (game.spots[i]!=null) {
        $.each(game.spots[i], function(i,h) {
          spot.append(h.toString());
        });
        if (i>5 && Card.worth(game.spots[i])) spot.append($('<div/>', {class:'worth', text:Card.worth(game.spots[i])}));
      }
    }
    if (game.lastSpot) $('#spot'+game.lastSpot+' span:last').css({opacity:0}).animate({opacity:1},2000);

    if (me!=null) {
      hand = d.append($('<p/>', {text: 'Your hand:'}));
      _(_(game.players[me].hand).sortBy(function(c) { return c.suit*100+c.number })).each(function(h) {
        d.append($('<div/>', { class:"card s"+h.suit+" n"+h.number, json:escape(JSON.stringify(h))}).append(h.toString()));
      });

      if ((lc = game.players[me].lastcard) && (game.turn==me ^ game.stage==0))
        $('div.s'+lc.suit+'.n'+lc.number+':first').css({opacity:0}).animate({opacity:1},2000);
    }
  }
}

$(document).ready(function () {
  socket = io.connect();
  socket.emit('addPlayer', {gid:game.id, sid:sid});
  
  socket.on('update', function(data) {
    if (data.game) {
      updateGame(data.game, data.message);
    }
  });

  $('button#addPlayer').click(function() {
    socket.emit('addPlayer', {gid:game.id, sid:sid, name:this.form.name.value});
    $('#message').html('Joining...');
    $('form#addPlayer').remove();
    return false;
  });

  for(i=0;i<=5;i++) {
    $('#spot'+i).mouseover(function() { $(this).css('cursor','pointer') });
    $('#spot'+i).click(function() {
      socket.emit('draw', {gid:game.id, sid:sid, spot:this.id.substr(4)});
      return false;
    });
  };

  $('.card').live('mouseenter', function() {
    card = unescape($(this).attr('json'));
    $('.playcard').remove();
    $(this).append($('<span/>', {class:'playcard'})
                   .append($('<a/>', { text: '⇨discard', href:'#', onclick: 'discard("'+escape(card)+'")' }),
                           $('<a/>', { text: '⇨play', href:'#', onclick: 'play("'+escape(card)+'")' }))
                   );
  });
})

function discard(card) {
  socket.emit('discard', {gid:game.id, sid:sid, card:JSON.parse(unescape(card)) });
}
function play(card) {
  socket.emit('play', {gid:game.id, sid:sid, card:JSON.parse(unescape(card)) });
}


