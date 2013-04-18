
var play = function(pjs) {

	//style
	var bkg = pjs.color(250);
	var buttons = [];
	var anchors = [];
	var sprites = [];
	var timers = [];
	var taps = [];
	var mouse;

	var currButton = null;
	var connectButton = null;

	var buttonRad = 50;
	var spritePadding = buttonRad + 15;

	pjs.setupScreen = function(){
		pjs.size(pjs.screenWidth, pjs.screenHeight);
	};

	pjs.setup = function(){
		
		pjs.setupScreen();

		pjs.noStroke();
		pjs.smooth();
		pjs.textAlign(pjs.CENTER);
		pjs.rectMode(pjs.CENTER);
		pjs.textSize(30);

		mouse = new pjs.PVector();

		/*for(var i=0; i<7; i++){
			buttons.push(new Button(pjs.random(0, pjs.width), pjs.random(0, pjs.height), 50));
		}*/

		//buttons.push(new Button(pjs.random(0, pjs.width), pjs.random(0, pjs.height), buttonRad));

		sprites.push(new Sprite("billy", pjs.width/2, pjs.height/2, 150, 250));

		for(var i=0; i<2; i++){
			buttons.push(new Move(pjs.random(0, pjs.width), pjs.random(0, pjs.height), buttonRad, sprites[0]));
			buttons.push(new Timer(pjs.random(0, pjs.width), pjs.random(0, pjs.height), buttonRad));
			buttons.push(new Touch(pjs.random(0, pjs.width), pjs.random(0, pjs.height), buttonRad));
			//buttons.push(new Tilt(pjs.random(0, pjs.width), pjs.random(0, pjs.height), buttonRad));
		}

	};

	pjs.draw = function(){
		pjs.background(bkg);

		mouse.x = pjs.mouseX;
		mouse.y = pjs.mouseY;

		for(var i=0; i<sprites.length; i++){
			sprites[i].render();
		}

		for(var i=0; i<buttons.length; i++){
			buttons[i].drawLinks();
		}

		for(var i=0; i<buttons.length; i++){
			buttons[i].render();
		}
	};

	pjs.touch = function(){
		var nearest = findNearestVec(buttons, mouse);
		if(nearest.dist <= nearest.el.connectCircleDist + nearest.el.connectCircleRad){
			currButton = nearest.el;
			clearAllTimeouts();
			
			if(nearest.dist > nearest.el.rad){
				var nearestConn = currButton.getNearestConnectionTip();
				if(nearestConn){
					connectButton = currButton;
				}
			}
		}else{
			currButton = null;
			connectButton = null;
			fireTaps();
		}
		
		

	};

	pjs.drag = function(){
		if(currButton){
			if(connectButton){

			}else{
				currButton.move(mouse.x, mouse.y);
			}
		}
	};

	pjs.release = function(){
		if(currButton){
			if(connectButton){
				var nearest = findNearestVec(buttons, mouse);
				if(nearest.dist <= nearest.el.rad)
					currButton.connect(nearest.el);
					connectButton = null;
			}
			//currButton = null;
			//connectButton = null;
			evalAll();
		}
	};

	var evalAll = function(){
		for(var i=0; i<anchors.length; i++){
			anchors[i].eval();
		}
	}

	var clearAllTimeouts = function(){
		for(var i=0; i<timers.length; i++){
			clearTimeout(timers[i]);
		}
		timers = [];
		taps = [];
	};

	var fireTaps = function(){
		var toRemove = [];
		for(var i=0; i<taps.length; i++){
			var curr = taps[i];
			if(curr.sprite.collides(mouse)){
				curr.button.doneEval(curr.sprite, true);
				toRemove.push(curr);
				break;
			}
		}

		taps = taps.filter(function(el){
			return toRemove.indexOf(el) == -1;
		})

		console.log(taps.length);
	}

	/*
	* arr: an array of objects with a pos vector
	* vec: a vector
	*/
	var findNearestVec = function(arr, vec){
		if(arr.length == 0){
			return null;
		}

		var minT = arr[0];
		var minDist = pjs.PVector.dist(vec, arr[0].pos);

		if(arr.length > 1){
			for(var i=1; i<arr.length; i++){		
				var currDist = pjs.PVector.dist(vec,arr[i].pos);
				if(currDist < minDist){
					minDist = currDist;
					minT = arr[i];
				}
			}
		}

		return {
			el: minT,
			dist: minDist
		};
	};

	var Sprite = Class.create({

		initialize: function(name, x, y, w, h){
			this.pos = new pjs.PVector(x, y);
			this.dimen = new pjs.PVector(w,h);
			this.name = name;
			this.anchor = new Anchor(x, y + h/2 + spritePadding, buttonRad, this);
			buttons.push(this.anchor);
			anchors.push(this.anchor);

			this.tweens = {
				pos: new pjs.PVector(x, y),
				dimen: new pjs.PVector(0,0)
			};
		},

		tween: function(){
			this.tweens.pos.x += (this.pos.x-this.tweens.pos.x)*.1;
			this.tweens.pos.y += (this.pos.y-this.tweens.pos.y)*.1;
			this.tweens.dimen.x += (this.dimen.x-this.tweens.dimen.x)*.1;
			this.tweens.dimen.y += (this.dimen.y-this.tweens.dimen.y)*.1;
		},

		collides: function(vec){
			if(vec.x >= this.pos.x - this.dimen.x/2
				&& vec.x <= this.pos.x + this.dimen.x/2
				&& vec.y >= this.pos.y - this.dimen.y/2
				&& vec.y <= this.pos.y + this.dimen.y/2){
				return true;
			}
			return false;
		},

		render: function(){
			this.tween();
			pjs.fill(100,60);
			pjs.rect(this.tweens.pos.x,this.tweens.pos.y,this.tweens.dimen.x+10,this.tweens.dimen.y+10, 10);
			pjs.fill(236,208,120);
			pjs.rect(this.tweens.pos.x,this.tweens.pos.y,this.tweens.dimen.x,this.tweens.dimen.y, 10);
			
		}
	});

	var Button = Class.create({
		initialize: function(x, y, rad, color){
			this.pos = new pjs.PVector(x, y);
			//this.v = new pjs.PVector();
			//this.a = new pjs.PVector();
			this.rad = rad;
			this.outline = rad + 5;
			this.color = color;

			this.connectCircleDist = this.rad + 5;
			this.connectCircle = new pjs.PVector(0, this.connectCircleDist);
			this.connectCircleRad = this.rad/2;

			this.connected = []; //connected in circuit
			this.connectsToThis = []; //connected to this

			this.reacted = false;
			this.tweens = {
				outline: this.outline
			};
		},

		tween: function(){
			this.tweens.outline += (this.outline-this.tweens.outline)*.1;
		},

		render: function(){

			this.tween();

			if(this == currButton){
				this.drawConnectionTips();
				if(this == connectButton){
					this.drawPossibleLink();
				}else{
					pjs.fill(this.color, 200);
					pjs.ellipse(this.pos.x+this.connectCircle.x, this.pos.y+this.connectCircle.y,
				 		this.connectCircleRad*2, this.connectCircleRad*2);	
				}			
			}

			pjs.fill(100,60);
			pjs.ellipse(this.pos.x, this.pos.y, this.tweens.outline*2, this.tweens.outline*2);
			pjs.fill(this.color);
			pjs.ellipse(this.pos.x, this.pos.y, this.rad*2, this.rad*2);

		},

		move: function(x, y){
			this.pos.x = x;
			this.pos.y = y;
		},

		getNearestConnectionTip: function(){
			
			//default is new connection
			var minEl = this;
			var conn = new pjs.PVector(currButton.pos.x + currButton.connectCircle.x,
				currButton.pos.y + currButton.connectCircle.y);
			var minDist = pjs.PVector.dist(mouse, conn);

			var minIsConnectedTo = false;

			for(var i=0; i<this.connected.length; i++){
				var curr = this.connected[i];
				var diff = pjs.PVector.sub(curr.pos, this.pos);
				diff.normalize();
				diff.mult(this.connectCircleDist);
				diff.add(this.pos);
				var dist = pjs.PVector.dist(mouse, diff);
				if(dist < minDist){
					minEl = curr;
					minDist = dist;
				}
			}

			for(var i=0; i<this.connectsToThis.length; i++){
				var curr = this.connectsToThis[i];
				var diff = pjs.PVector.sub(curr.pos, this.pos);
				diff.normalize();
				diff.mult(this.connectCircleDist);
				diff.add(this.pos);
				var dist = pjs.PVector.dist(mouse, diff);
				if(dist < minDist){
					minEl = curr;
					minDist = dist;
					minIsConnectedTo = true;
				}
			}
			
			if(minDist < this.connectCircleRad){
				if(minIsConnectedTo){
					minEl.disconnect(this);
					currButton = minEl;
					connectButton = minEl;
				}else if(minEl != this){
					this.disconnect(minEl); //must disconnect
				}
				return minEl;
			}

			return null;
		},

		//draws a 'nub' at endpoints of connections so they can be edited
		drawConnectionTips: function(){
			pjs.fill(this.color, 200);
			for(var i=0; i<this.connected.length; i++){
				var curr = this.connected[i];
				var diff = pjs.PVector.sub(curr.pos, this.pos);
				diff.normalize();
				diff.mult(this.connectCircleDist);
				pjs.ellipse(this.pos.x + diff.x, this.pos.y + diff.y, 
					this.connectCircleRad*2, this.connectCircleRad*2);
			}
			for(var i=0; i<this.connectsToThis.length; i++){
				var curr = this.connectsToThis[i];
				var diff = pjs.PVector.sub(curr.pos, this.pos);
				diff.normalize();
				diff.mult(this.connectCircleDist);
				pjs.fill(curr.color, 200);
				pjs.ellipse(this.pos.x + diff.x, this.pos.y + diff.y, 
					this.connectCircleRad*2, this.connectCircleRad*2);
			}
		},

		drawLink: function(from, to){
			var diff = pjs.PVector.sub(from, to);
			diff.normalize();
			diff.mult(this.connectCircleRad);
			pjs.triangle(from.x - diff.y, from.y + diff.x, 
				from.x + diff.y, from.y - diff.x,
				to.x, to.y);
		},

		drawLinks: function(){
			pjs.fill(150,100);
			for(var i=0; i<this.connected.length; i++){
				this.drawLink(this.pos, this.connected[i].pos);
			}
		},

		drawPossibleLink: function(){
			var diff = pjs.PVector.sub(mouse, this.pos);
			diff.normalize();
			diff.mult(this.connectCircleDist);
			diff.add(this.pos);

			pjs.fill(150, 100);
			this.drawLink(diff, mouse);
			pjs.fill(this.color,200);
			pjs.ellipse(mouse.x, mouse.y,
				 this.connectCircleRad*2, this.connectCircleRad*2);	
			pjs.fill(this.color);
			pjs.ellipse(diff.x, diff.y, 
				this.connectCircleRad*2, this.connectCircleRad*2);
		},

		updateConnectCircle: function(){
			var diff = pjs.PVector.sub(mouse, this.pos);
			diff.normalize();
			diff.mult(this.rad);
			this.connectCircle = diff;
		},

		showReaction: function(){
			this.tweens.outline += 10;
		},

		connect: function(other){
			console.log(other);
			//only directionally connect parent
			if(other != this && this.connected.indexOf(other) == -1){
				this.connected.push(other);
				other.connectsToThis.push(this);
			}
		},

		disconnect: function(other){
			console.log(this.connected);
			this.connected = this.connected.filter(function(el){
				console.log(el != other);
				return el != other;
			});
			console.log(this.connected);
			var obj = this;
			other.connectsToThis = other.connectsToThis.filter(function(el){
				return el != obj;
			});
		}
	});

	var Anchor = Class.create(Button, {
		initialize: function($super, x, y, rad, sprite){
			this.sprite = sprite;
			$super(x, y, rad, pjs.color(200));
		},

		render: function($super){
			$super();
			pjs.fill(70);
			pjs.text("o", this.pos.x, this.pos.y+this.rad/7);
		},

		move: function($super, x, y){
			$super(x, y);
			this.sprite.pos.x = x;
			this.sprite.pos.y = y - this.sprite.dimen.y/2 - spritePadding;
		},

		eval: function(sprite){
			console.log("EVAL Anchor @" + this.pos.x);
			this.showReaction();
			this.move(this.pos.x, this.pos.y);
			for(var i=0; i<this.connected.length; i++){
				this.connected[i].eval(this.sprite);
			}
		}

	});

	var Move = Class.create(Button, {
		initialize: function($super, x, y, rad){
			$super(x, y, rad, pjs.color(200));
		},

		render: function($super){
			$super();
			pjs.fill(70);
			pjs.text(": :", this.pos.x, this.pos.y+this.rad/7);
		},

		eval: function(sprite){
			console.log("EVAL Anchor @" + this.pos.x);
			this.showReaction();
			if(sprite){
				sprite.pos.x = this.pos.x;
				sprite.pos.y = this.pos.y - sprite.dimen.y/2 - spritePadding;
			}
			for(var i=0; i<this.connected.length; i++){
				this.connected[i].eval(sprite);
			}
		}

	});

	var Timer = Class.create(Button, {
		initialize: function($super, x, y, rad){
			this.timeout = 1000;
			$super(x, y, rad, pjs.color(121,189,154));
		},

		render: function($super){
			$super();
			pjs.fill(70);
			pjs.text("...", this.pos.x, this.pos.y);
		},

		eval: function(sprite){
			var obj = this;
			var timer = setTimeout(function(){
				obj.showReaction();
				for(var i=0; i<obj.connected.length; i++){
					obj.connected[i].eval(sprite);
				}
			}, obj.timeout);
			timers.push(timer);
		}

	});

	var Touch = Class.create(Button, {
		initialize: function($super, x, y, rad){
			this.timeout = 1000;
			$super(x, y, rad, pjs.color(255,159,128));
		},

		render: function($super){
			$super();
			pjs.fill(70);
			pjs.text("^", this.pos.x, this.pos.y+this.rad/4);
		},

		doneEval: function(sprite){
			this.showReaction();
			console.log(this.pos.x + " FIRED");
			for(var i=0; i<this.connected.length; i++){
				this.connected[i].eval(sprite);
			}
		},

		eval: function(sprite){
			console.log("EVAL Touch @" + this.pos.x);
			if(sprite){
				taps.push({
					button: this,
					sprite: sprite
				});
			}
		}

	});

	var Tilt = Class.create(Button, {
		initialize: function($super, x, y, rad){
			this.timeout = 1000;
			$super(x, y, rad, pjs.color(193,133,143));
			FIRED = 0;
		},

		render: function($super){
			$super();
			pjs.fill(70);
			pjs.text("/", this.pos.x, this.pos.y+this.rad/4);
		},

		doneEval: function(sprite){
			FIRED++;
			if(FIRED > 1000){
				return;
			}
			console.log(this.pos.x + " FIRED");
			for(var i=0; i<this.connected.length; i++){
				this.connected[i].eval(sprite);
			}
		},

		eval: function(sprite){
			console.log("EVAL Touch @" + this.pos.x);
			if(sprite){
				taps.push({
					button: this,
					sprite: sprite
				});
			}
		}

	});

};

var canvas = document.getElementById("pcanvas");
var pjs = new Processing(canvas, play);

window.onresize = function(event) {
   pjs.setupScreen();
}

