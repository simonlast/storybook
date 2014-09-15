
var handleMotionEvent = function(event){

    event.preventDefault();

    var x = event.accelerationIncludingGravity.x;
    var y = event.accelerationIncludingGravity.y;
    var z = event.accelerationIncludingGravity.z;

    shake.tick(x, y, z);
}

window.addEventListener("devicemotion", handleMotionEvent, true);

/*
window.addEventListener('deviceorientation', function(event){
  event.preventDefault();
}, false);
*/

var ShakeController = Class.create({
  initialize: function(){
    this.last = {
      x: 0,
      y: 0,
      z: 0
    };
    this.lastFired = 0;
    this.grad = 0;
    this.friction = .5;
    this.thresh = 20;
    this.fired = false;
  },

  tick: function(x, y, z){

    this.grad += Math.abs(x - this.last.x);
    this.grad += Math.abs(y - this.last.y);
    this.grad += Math.abs(z - this.last.z);

    this.grad *= this.friction;

    this.last.x = x;
    this.last.y = y;
    this.last.z = z;

    var currTime = new Date();
    if(this.grad > this.thresh && currTime - this.lastFired > 700){
      this.fired = true;
      this.grad = 0;
      this.lastFired = currTime;
      pjs.fireShake();
    }
  }
});

var shake = new ShakeController();


