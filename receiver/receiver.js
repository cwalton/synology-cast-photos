function Receiver(config, content, keyboard) {
  var self = Object.assign(this, config);

  if (navigator.userAgent.indexOf('CrKey') >= 0)
    initAsReceiver(); // running under Chromecast - receive commands from Chromecast senders
  else
    initAsStandalone(); // running as standalone web page - take commands from location hash

  function initAsReceiver() {
    var receiverManager = cast.receiver.CastReceiverManager.getInstance();

    self.messageBus = receiverManager.getCastMessageBus(self.namespace);
    self.messageBus.onMessage = function(e) {
      onCommand(e.data);
    };

    var config = new cast.receiver.CastReceiverManager.Config();
    config.maxInactivity = 60000;
    receiverManager.start(config);
  }

  self.broadcast = function(message) {
    if (self.messageBus) self.messageBus.broadcast(message);
  };

  function initAsStandalone() {
    window.onhashchange = function() {
      if (location.hash) onCommand(location.hash.substring(1));
    };
    setTimeout(onhashchange, 0);

    function commandPrompt() {
      var command = prompt('Photo dir/command', location.hash ? location.hash.substring(1) : '');
      if (command) location.hash = '#' + command;
    }

    window.onkeydown = function (e) {
      if (e.which == 27) {
        commandPrompt();
        return;
      }

      var command = keyboard.toCommand(e.which);
      if (command) {
        e.preventDefault();
        onCommand(command);
      }
    };

    window.onHammerLoaded = function () {
      var hammer = new Hammer(document.body);
      hammer.on('swiperight', function () {
        onCommand('prev');
      });
      hammer.on('swipeleft', function () {
        onCommand('next');
      });
      hammer.on('press', function () {
        commandPrompt();
      });
    };

    document.write('<script src="//cdnjs.cloudflare.com/ajax/libs/hammer.js/2.0.4/hammer.min.js" onload="onHammerLoaded()"></script>');
  }

  function onCommand(command) {
    var separatorPos = command.indexOf(':');
    if (separatorPos == -1) separatorPos = command.length;
    var cmd = command.substring(0, separatorPos);
    var arg = command.substring(separatorPos + 1);
    var title = command;

    if (cmd == 'rnd') {
      if (arg) content.loadUrls(arg, true);
      else content.random();
    }
    else if (cmd == 'seq') {
      if (arg) content.loadUrls(arg, false);
      else content.sequential();
    }
    else if (cmd == 'interval') {
      content.interval = parseInt(arg) * 1000;
      title = 'Interval: ' + arg + 's';
    }
    else if (cmd == 'style') {
      content.style(arg);
    }
    else if (cmd == 'prev') {
      content.prev(arg);
    }
    else if (cmd == 'next') {
      content.next(arg);
    }
    else if (cmd == 'pause') {
      content.pause();
    }
    else if (cmd == 'mark') {
      content.mark(arg);
    }
    else if (cmd == 'video') {
      location.href += 'video.html#' + arg;
    }
    else if (cmd == 'audio') {
      if (arg == 'prev') audio.prev();
      else if (arg == 'next') audio.next();
      else if (arg == 'stop') audio.stop();
      else {
        arg = arg.split('#');
        audio.addToPlaylist(arg[0], arg[1]);
      }
      title = null;
    }
    else {
      content.loadUrls(cmd, true);
    }

    if (title) {
      content.title(title);
      self.broadcast(title);
    }
  }
}
