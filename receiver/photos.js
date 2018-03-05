var photos = (function(self) {
  BaseContent(self);

  var nextImg = new Image();
  var $title = $('#title');
  var $status = $('#status');
  var $meta = $('#meta');
  var timer, meta, loading, displayedUrl;
  var photo = $('#photo')[0];
  var backgroundSize = 'contain';

  self.loadUrls = function(dir, random) {
    self.title('Loading photos from ' + dir);

    $.get(self.photoListUrl, {dir: dir}).then(
      function (data) {
        self.urls = data.trim().split('\n');
        self.urlsRandom = self.urlsSequential = null;
        if (random) self.random(); else self.sequential();
        self.title((random ? 'Random: ' : 'Sequential: ') + dir);
        self.index = 1;
        self.loadCurrent();
      },
      function (xhr, status, text) {
        self.title('Error: ' + text);
      }
    );
  };

  self.style = function(style) {
    backgroundSize = style;
    renderPhoto(nextImg, meta);
  };

  self.pause = function() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    else loadNextPhotoAfter(0);
  };

  self.mark = function(how) {
    $.post(self.markPhotoUrl, {file: displayedUrl, how: how}).then(
      function(text) {
        self.title(text);
      },
      function() {
        self.title('Failed to mark: ' + text);
      }
    );
  };

  self.title = function(title) {
    $title.text(title);
  };

  self.loadCurrent = function() {
    var url = self.currentUrl();

    var nextImgPromise = $.Deferred();
    nextImg.onload = function() {nextImgPromise.resolve(this)};
    nextImg.onerror = nextImgPromise.reject;
    nextImg.src = self.photoUrlPrefix + url;
    meta = null;

    var metaPromise = $.get(self.metaUrlPrefix + url).then(function(data) {
      return meta = data;
    });
    loading = true;
    $status.text('Loading ' + self.index + '/' + self.urls.length);

    $.when(nextImgPromise, metaPromise).then(photoLoaded, photoLoadingFailed);
  };

  function photoLoaded(img, meta) {
    $status.text('Rendering ' + self.index + '/' + self.urls.length);

    setTimeout(function() {
      renderPhoto(img, meta);
      updateStatus(img, meta);
      loadNextPhotoAfter(self.interval);
    }, 0);
  }

  function renderPhoto(img, meta) {
    var imgRatio = img.width / img.height;
    handleOrientation(photo, meta && meta.orientation, imgRatio);
    photo.style.backgroundImage = 'url(' + img.src + ')';
  }

  function handleOrientation(photo, orientation, imgRatio) {
    var horizontal = imgRatio >= 1.33; // 4:3

    switch (orientation) {
      case '3':
        photo.style.transform = 'rotate(180deg)';
        break;
      case '6':
        photo.style.transform = 'scale(' + 1/imgRatio + ') rotate(90deg)';
        horizontal = false;
        break;
      case '8':
        photo.style.transform = 'scale(' + 1/imgRatio + ') rotate(-90deg)';
        horizontal = false;
        break;
      default:
        photo.style.transform = 'none';
    }

    var screenRatio = innerWidth/innerHeight;
    if (backgroundSize == 'cover' && horizontal) {
      var verticalScale = 100 * screenRatio / imgRatio * 0.9;
      photo.style.backgroundSize = verticalScale > 100 ? '100% ' + verticalScale + '%' : 'cover';
    }
    else photo.style.backgroundSize = 'contain';
  }

  function updateStatus(img, meta) {
    displayedUrl = meta.file;
    var title = displayedUrl.substring(0, displayedUrl.lastIndexOf('/')).replace(/\//g, ' / ');
    self.title(title);
    receiver.broadcast(self.index + ': ' + title + '|' + img.src);
    $status.text(self.index + '/' + self.urls.length);
    $meta.html((meta.datetime || '') + '<br>' + (meta.focal ? meta.focal.replace('.0', '') : '') +
               (meta.exposure ? ', ' + meta.exposure : '') + (meta.fnumber ? ', ' + meta.fnumber : ''));
  }

  function photoLoadingFailed() {
    $status.text(self.index + '/' + self.urls.length + ': failed');
    loadNextPhotoAfter(self.interval / 4);
  }

  function loadNextPhotoAfter(timeout) {
    loading = false;
    clearTimeout(timer);
    timer = setTimeout(self.next, timeout);
  }

  return self;
}(photos || {}));