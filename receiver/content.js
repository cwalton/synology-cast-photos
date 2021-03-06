function BaseContent(self) {
  self.urls = [];
  self.index = 0;
  self.status = document.getElementById('status');

  self.currentUrl = function() {
    return self.urls[self.index - 1];
  };

  self.nextUrl = function() {
    return self.urls[self.index];
  };

  self.random = function() {
    updateIndex(self.currentUrl(), self.urlsRandom || (self.urlsRandom = shuffle(self.urls.slice())));
  };

  self.sequential = function() {
    updateIndex(self.currentUrl(), self.urlsSequential || (self.urlsSequential = self.urls.slice().sort()));
  };

  function updateIndex(currentUrl, newUrls) {
    if (currentUrl) self.index = newUrls.indexOf(currentUrl) + 1;
    self.urls = newUrls;
    if (self.status)
      self.status.textContent = self.index + '/' + self.urls.length;
  }

  self.prev = function(by) {
    self.index -= parseInt(by || 1);
    if (self.index <= 0) self.index = self.urls.length;
    setTimeout(self.loadCurrent, 0);
  };

  self.next = function(by) {
    self.index += parseInt(by || 1);
    if (self.index > self.urls.length) self.index = 1;
    setTimeout(self.loadCurrent, 0);
  };
}