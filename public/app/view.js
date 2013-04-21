
var play = function(pjs) {

	//style
	var bkg = pjs.color(250);
	var buttons = [];
	var anchors = [];
	var sprites = [];
	var timers = [];
	var taps = [];
	var mouse;

	pjs.viewMode = false;

	var currButton = null;
	var connectButton = null;

	var buttonRad = 50;
	var spritePadding = buttonRad + 15;

	var buttonClasses;

	//toolbox
	var toolboxDimen, toolboxCenter;
	var toolboxButtons;

	pjs.setupScreen = function(){
		pjs.size(pjs.screenWidth, pjs.screenHeight);
		toolboxDimen = new pjs.PVector(pjs.width - 50, buttonRad*2.7 + 10);
		toolboxCenter = new pjs.PVector(pjs.width/2, pjs.height - toolboxDimen.y/2 + 10);

		toolboxButtons = [];
		buttonClasses = [Anchor, Move, Timer, Touch];

		var toolboxStartX = toolboxCenter.x - toolboxDimen.x/2;
		var divX = toolboxDimen.x/buttonClasses.length;

		for(var i=0; i<buttonClasses.length; i++){
			var newButton = new buttonClasses[i](toolboxStartX + divX*i + divX/2,
				pjs.height - toolboxDimen.y/2+5, 50, buttonRad);
			toolboxButtons.push(newButton);
		}

	};

	pjs.setup = function(){
		
		pjs.setupScreen();

		pjs.noStroke();
		pjs.smooth();
		pjs.textAlign(pjs.CENTER);
		pjs.rectMode(pjs.CENTER);
		pjs.imageMode(pjs.CENTER);
		pjs.textSize(30);

		mouse = new pjs.PVector();

		//sprites.push(new Sprite("billy", pjs.width/2, pjs.height/2, 150, 250));

	};

	pjs.draw = function(){
		pjs.background(bkg);

		for(var i=0; i<sprites.length; i++){
			sprites[i].render();
		}

		if(!pjs.viewMode){
			for(var i=0; i<buttons.length; i++){
				buttons[i].drawLinks();
			}

			for(var i=0; i<buttons.length; i++){
				buttons[i].render();
			}

			drawToolbox();	
		}

	};

	//this is a Hammer.js touch event
	pjs.touch = function(event){
		event.gesture.preventDefault();
		var touch = event.gesture.touches[0];
		mouse.x = touch.pageX;
		mouse.y = touch.pageY;

		if(mouse.y >= toolboxCenter.y - toolboxDimen.y/2 &&
			mouse.x >= toolboxCenter.x - toolboxDimen.x/2 &&
			mouse.x <= toolboxCenter.x + toolboxDimen.x/2){
			activateToolbox();
			return;
		}

		if(pjs.viewMode){
			fireTaps();
			return;
		}
		
		var nearest = findNearestVec(buttons, mouse);
		if(nearest && nearest.dist <= nearest.el.connectCircleDist + nearest.el.connectCircleRad){
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

	pjs.drag = function(event){
		event.gesture.preventDefault();
		var touch = event.gesture.touches[0];
		mouse.x = touch.pageX;
		mouse.y = touch.pageY;
		
		if(currButton){
			if(connectButton){
				//...
			}else{
				currButton.move(mouse.x, mouse.y);
			}
		}
	};

	pjs.release = function(event){
		event.gesture.preventDefault();
		var touch = event.gesture.touches[0];
		mouse.x = touch.pageX;
		mouse.y = touch.pageY;
		
		if(currButton){
			if(connectButton){
				var nearest = findNearestVec(buttons, mouse);
				if(nearest.dist <= nearest.el.rad)
					currButton.connect(nearest.el);
					connectButton = null;
			}else{
				if(currButton.pos.y - currButton.rad >= toolboxCenter.y - toolboxDimen.y/2){
					console.log("YES");
					currButton.removeFromCanvas();
					currButton = null;
				}
			}
			
			evalAll();
		}
	};

	var drawToolbox = function(){
		pjs.fill(200,100);
		pjs.rect(toolboxCenter.x, toolboxCenter.y, toolboxDimen.x, toolboxDimen.y, 10);

		for(var i=0; i<toolboxButtons.length; i++){
			toolboxButtons[i].render();
		}
	};

	var activateToolbox = function(){
		var nearest = findNearestVec(toolboxButtons, mouse);
		if(nearest.dist <= nearest.el.connectCircleDist + nearest.el.connectCircleRad){
			var newButton = nearest.el.deepClone();
			newButton.addToCanvas();
			currButton = newButton;
		}
	};

	var evalAll = function(){
		clearAllTimeouts();
		for(var i=0; i<anchors.length; i++){
			anchors[i].eval();
		}
	};

	var clearAllTimeouts = function(){
		for(var i=0; i<timers.length; i++){
			clearTimeout(timers[i]);
		}
		timers = [];
		taps = [];
	};

	pjs.toggleViewMode = function(){
		pjs.viewMode = !pjs.viewMode;
		if(pjs.viewMode){
			evalAll();
			currButton = null;
			connectButton = null;
			$help.innerHTML = '<i class="icon-stop"></i>';
		}else{
			$help.innerHTML = '<i class="icon-play"></i>';	
		}
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
	};

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

		initialize: function(name, x, y, w, h, anchor){
			this.pos = new pjs.PVector(x, y);
			this.dimen = new pjs.PVector(300, 300); //600/2 by default for now
			this.name = name;
			this.image = null;
			//this.anchor = new Anchor(x, y + this.dimen.y/2 + spritePadding, buttonRad, this);
			//buttons.push(this.anchor);
			//anchors.push(this.anchor);
			this.anchor = anchor

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
			if(vec.x >= this.tweens.pos.x - this.tweens.dimen.x/2
				&& vec.x <= this.tweens.pos.x + this.tweens.dimen.x/2
				&& vec.y >= this.tweens.pos.y - this.tweens.dimen.y/2
				&& vec.y <= this.tweens.pos.y + this.tweens.dimen.y/2){
				return true;
			}
			return false;
		},

		createImage: function(){
			var obj = this;
			SketchTool.create({width: 600, height: 600, onComplete: function(sketch){
				console.log(sketch.getPNG());
				console.log(this);
				obj.image = pjs.loadImage(sketch.getPNG());
				console.log(obj.image);
				pjs.loop();
			}});
			pjs.noLoop();
		},

		render: function(){
			this.tween();
			
			if(this.image){
				if(!pjs.viewMode){
					pjs.fill(100,10);
					pjs.rect(this.tweens.pos.x,this.tweens.pos.y,
						this.tweens.dimen.x+10,this.tweens.dimen.y+10, 10);
				}
				pjs.image(this.image, this.tweens.pos.x, this.tweens.pos.y, 
				this.tweens.dimen.x, this.tweens.dimen.y);
			}else{
				pjs.fill(100,20);
				pjs.rect(this.tweens.pos.x,this.tweens.pos.y,this.tweens.dimen.x+10,this.tweens.dimen.y+10, 10);
			}
		}
	});

	var Button = Class.create({
		initialize: function(x, y, rad, color){
			this.pos = new pjs.PVector(x, y);
			this.rad = rad;
			this.outline = rad + 5;
			this.color = color;

			this.connectCircleDist = this.rad + 5;
			this.connectCircle = new pjs.PVector(0, this.connectCircleDist);
			this.connectCircleRad = this.rad*2/3;

			this.connected = []; //connected in circuit
			this.connectsToThis = []; //connected to this

			this.reacted = false;
			this.tweens = {
				outline: this.outline
			};
		},

		deepClone: function(){
			var clone = new Button(this.pos.x, this.pos.y, this.rad, this.color);
			return clone;
		},

		addToCanvas: function(){
			buttons.push(this);
		},


		removeFromCanvas: function(){
			var obj = this;
			buttons = buttons.filter(function(el){
				return el != obj;
			});

			this.disconnectAll();

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

		//draws a 'nib' at endpoints of connections so they can be edited
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

		disconnectAll: function(){
			for(var i=0; i<this.connected.length; i++){
				this.disconnect(this.connected[i]);
			}

			for(var i=0; i<this.connectsToThis.length; i++){
				this.connectsToThis[i].disconnect(this);
			}
		},

		disconnect: function(other){
			console.log(this.connected);
			this.connected = this.connected.filter(function(el){
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
			this.sprite = new Sprite(x, y + this.rad/2 + spritePadding, buttonRad, this);
			$super(x, y, rad, pjs.color(168,202,186));
		},

		addToCanvas: function($super){
			$super();
			sprites.push(this.sprite);
			anchors.push(this);
		},

		removeFromCanvas: function($super){
			$super();
			var obj = this;
			anchors = anchors.filter(function(el){
				return el != obj;
			});
			sprites = sprites.filter(function(el){
				return el != obj.sprite;
			});
		},

		render: function($super){
			$super();
			pjs.fill(70);
			pjs.text("+", this.pos.x, this.pos.y+this.rad/4);
		},

		deepClone: function(){
			var clone = new Anchor(this.pos.x, this.pos.y, this.rad, this.sprite);
			return clone;
		},

		move: function($super, x, y){
			$super(x, y);
			this.sprite.pos.x = x;
			this.sprite.pos.y = y - this.sprite.dimen.y/2 - spritePadding;
		},

		eval: function(sprite){
			console.log("EVAL Anchor @" + this.pos.x);
			if(!this.sprite.image){
				this.sprite.createImage();
			}else{
				this.showReaction();
				this.move(this.pos.x, this.pos.y);
				for(var i=0; i<this.connected.length; i++){
					this.connected[i].eval(this.sprite);
				}	
			}
			
		}

	});

	var Move = Class.create(Button, {
		initialize: function($super, x, y, rad){
			$super(x, y, rad, pjs.color(168,202,186));
			
			//used for animation
			this.spriteOrig = null;
			this.sprite = null;
			this.distToSprite = null;
		},

		render: function($super){
			$super();
			pjs.fill(70);
			pjs.text(": :", this.pos.x, this.pos.y+this.rad/7);
			if(this.sprite){
				var dist = pjs.PVector.sub(this.sprite.tweens.pos, this.spriteOrig).mag();
				//console.log(dist);
				var diff = this.distToSprite - dist
				console.log(diff);

				var len = this.rad*2 - 20;
				var circleDiff = len - (diff / this.distToSprite) * len + 5;
				var x = this.pos.x - this.rad + circleDiff;

				if(diff < 20){
					this.spriteOrig = null;
					this.sprite = null;
					this.distToSprite = null;
				}else{
					//pjs.fill(200,240);
					//pjs.ellipse(x, this.pos.y, 40,40);
				}
			}
		},

		deepClone: function(){
			var clone = new Move(this.pos.x, this.pos.y, this.rad, this.color);
			return clone;
		},

		eval: function(sprite){
			console.log("EVAL Move @" + this.pos.x);
			this.showReaction();
			if(sprite){
				//original pos of sprite
				this.spriteOrig = new pjs.PVector(sprite.tweens.pos.x, sprite.tweens.pos.y);
				sprite.pos.x = this.pos.x;
				sprite.pos.y = this.pos.y - sprite.dimen.y/2 - spritePadding;
				this.sprite = sprite;
				this.distToSprite = pjs.PVector.sub(sprite.pos, this.spriteOrig).mag();
			}
			for(var i=0; i<this.connected.length; i++){
				this.connected[i].eval(sprite);
			}
		}

	});

	var Timer = Class.create(Button, {
		initialize: function($super, x, y, rad){
			this.timeout = 1000;
			this.lastTimeout = 0;
			this.timeoutLeft = 0;
			$super(x, y, rad, pjs.color(236,208,120));
		},

		render: function($super){
			$super();
			pjs.fill(70);
			pjs.text("...", this.pos.x, this.pos.y);
			pjs.fill(200,240);
			if(this.timeoutLeft > 0){
				this.timeoutLeft = 1000 - ((new Date()) - this.lastTimeout);
				var radLeft = 2*Math.PI * (this.timeoutLeft / this.timeout);
				pjs.arc(this.pos.x, this.pos.y, this.rad*2, this.rad*2, 0, radLeft);
			}
		},

		deepClone: function(){
			var clone = new Timer(this.pos.x, this.pos.y, this.rad, this.color);
			return clone;
		},

		eval: function(sprite){
			var obj = this;
			this.showReaction();
			this.lastTimeout = new Date();
			this.timeoutLeft = this.timeout;
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
			$super(x, y, rad, pjs.color(247,175,99));
		},

		render: function($super){
			$super();
			pjs.fill(70);
			pjs.text("^", this.pos.x, this.pos.y+this.rad/4);
		},

		deepClone: function(){
			var clone = new Touch(this.pos.x, this.pos.y, this.rad, this.color);
			return clone;
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

};

var canvas = document.getElementById("pcanvas");
var pjs = new Processing(canvas, play);

window.onresize = function(event) {
   pjs.setupScreen();
}

