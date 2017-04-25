var ProgressBar = require('node-progress-bars');

var bar0 = new ProgressBar({
  current: 0
});

var bar1 = new ProgressBar({
  current: 10
});

var bar2 = new ProgressBar({
  current: 20
});

var bar3 = new ProgressBar({
  current: 30
});

var bar4 = new ProgressBar({
  current: 40
});

var bar5 = new ProgressBar({
  current: 50
});

var bar6 = null;

var timer = setInterval(function () {

  bar0.tick();
  bar1.tick();
  bar2.tick();
  bar3.tick();
  bar4.tick();
  bar5.tick();
  bar6 && bar6.tick();
  if (bar0.completed
    && bar1.completed
    && bar2.completed
    && bar3.completed
    && bar4.completed
    && bar5.completed) {
    clearInterval(timer);
  }


}, 100);


setTimeout(function() {
  bar6 = new ProgressBar({
    current: 50
  });
}, 1500)
