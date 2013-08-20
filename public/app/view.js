
var play = function(pjs) {

	//style
	var bkg = pjs.color(250);
	$canvas = jQuery(canvas);

	var tabs = [];
	currTabIndex = 0;

	var MAX_EVALS = 5000; //prevent infinite loops
	var CURR_EVALS = 0;

	//global vars
	var buttons = [];
	var anchors = [];
	var sprites = [];
	var mouse;
	var narrator;

	var images;

	//events
	var timers = [];
	var taps = [];
	var shakes = [];

	//modes
	pjs.viewMode = false;
	var currButton = null;
	var connectButton = null;
	var draggingToolbox = false;
	var pinch = false; //currently pinching
	
	//const
	var buttonRad = 50;
	var spritePadding = buttonRad + 15;
	var sayDist = new pjs.PVector(450, 1000);

	var buttonClasses;

	//spring physics for shake button
	var K = -0.1;
	var friction = 0.9;
	var addV = 0.2;

	//toolbox
	var toolboxDimen, toolboxCenter, toolboxCenterTween;
	var toolboxButtons;

	/*
		This function is called on screen resize events. It will
		update the size of the canvas and toolbox
	*/
	pjs.setupScreen = function(){
		pjs.size(pjs.screenWidth, pjs.screenHeight);
		toolboxDimen = new pjs.PVector(pjs.width - 50, buttonRad*2.7 + 20);
		toolboxCenter = new pjs.PVector(pjs.width/2, pjs.height - toolboxDimen.y/2 + 10);
		toolboxCenterTween = new pjs.PVector(toolboxCenter.x, toolboxCenter.y);
		
		if('ontouchstart' in window)
			buttonClasses = [Anchor, Move, Rotate, Say, Timer, Touch, Shake];
		else
			buttonClasses = [Anchor, Move, Rotate, Say, Timer, Touch];
		calculateToolbox();
	};

	/*
		Recalculates toolbox dimensions and internal button
		positions.
	*/
	var calculateToolbox = function(){

		toolboxButtons = [];
		var toolboxStartX = toolboxCenter.x - toolboxDimen.x/2;
		var outerPadding = 20;
		var divX = (toolboxDimen.x-outerPadding*2)/buttonClasses.length;

		for(var i=0; i<buttonClasses.length; i++){
			var newButton = new buttonClasses[i](toolboxStartX + divX*i + divX/2 + outerPadding,
				toolboxCenterTween.y -3, 50, buttonRad);
			toolboxButtons.push(newButton);
		}
	};

	var loadImages = function(){
		images = {};
		var base = '/images/';
		images['Anchor'] = pjs.loadImage(base + 'anchor.png');
		images['Move'] = pjs.loadImage(base + 'move.png');
		images['Timer'] = pjs.loadImage(base + 'timer.png');
		images['Say'] = pjs.loadImage(base + 'say.png');
		images['Touch'] = pjs.loadImage(base + 'touch.png');
		images['Shake'] = pjs.loadImage(base + 'shake.png');
		images['Rotate'] = pjs.loadImage(base + 'rotate.png');
	};

	pjs.setup = function(){
		
		pjs.setupScreen();
		loadImages();

		pjs.noStroke();
		pjs.smooth();
		pjs.textAlign(pjs.CENTER);
		pjs.rectMode(pjs.CENTER);
		pjs.imageMode(pjs.CENTER);
		pjs.textSize(30);

		mouse = new pjs.PVector();
		narrator = new Narrator();

		tabs.push({
			buttons: buttons,
			sprites: sprites
		});
		
	};

	pjs.draw = function(){
		pjs.background(bkg);

		for(var i=0; i<sprites.length; i++){
			sprites[i].render();
		}

		narrator.render();

		if(!pjs.viewMode){
			for(i=0; i<buttons.length; i++){
				buttons[i].drawLinks();
			}

			for(i=0; i<buttons.length; i++){
				buttons[i].render();
			}

			drawToolbox();
			//drawTabMenu();	
		}

	};

	var touchStart = function(event){
		event.preventDefault();
		if(event.originalEvent){
			event = event.originalEvent;
		}
		var touch = new pjs.PVector();

		//calculate average
		for(var i=0; i<event.targetTouches.length; i++){
			var curr = event.targetTouches[i];
			touch.add(new pjs.PVector(curr.pageX, curr.pageY));
		}
		touch.div(event.targetTouches.length);

		mouse.x = touch.x;
		mouse.y = touch.y;

		pinch = false;

		//only fire taps in viewMode
		if(pjs.viewMode){
			fireTap();
			return;
		}

		//check for toolbox hit
		if(mouse.y >= toolboxCenter.y - toolboxDimen.y/2 -15 &&
			mouse.x >= toolboxCenter.x - toolboxDimen.x/2 &&
			mouse.x <= toolboxCenter.x + toolboxDimen.x/2){
			activateToolbox();
			return;
		}

		/*if(activateTabMenu()){
			return;
		}*/

		//check for button hit
		var nearest = findNearestVec(buttons, mouse);
		if(nearest && nearest.dist <= nearest.el.connectCircleDist + nearest.el.connectCircleRad){
			currButton = nearest.el;
			clearAllTimeouts();

			//button connection hit
			if(nearest.dist > nearest.el.rad){
				var nearestConn = currButton.getNearestConnectionTip();
				if(nearestConn){
					connectButton = currButton;
				}
			}
		}else{ //otherwise, deselect button & fire taps
			currButton = null;
			connectButton = null;
			fireTap();
		}
		
	};


	var touchMove = function(event){
		event.preventDefault();
		if(event.originalEvent){
			event = event.originalEvent;
		}
		var touches = event.targetTouches;

		if(touches.length == 1 && !pinch){
			var touch = new pjs.PVector();

			//calculate average
			for(var i=0; i<event.targetTouches.length; i++){
				var curr = event.targetTouches[i];
				touch.add(new pjs.PVector(curr.pageX, curr.pageY));
			}
			touch.div(event.targetTouches.length);

			mouse.x = touch.x;
			mouse.y = touch.y;
			
			//toolbox drag
			if(draggingToolbox){
				toolboxCenter.y = mouse.y + toolboxDimen.y/2;
				if(toolboxCenter.y < pjs.height - toolboxDimen.y*2/3){
					toolboxCenter.y = pjs.height - toolboxDimen.y*2/3;
				}
				calculateToolbox();
			}else if(currButton){
				if(!connectButton){ //if not connecting, move
					currButton.move(mouse.x, mouse.y);
				}
			}
		}else if(touches.length == 2){
			if(currButton && currButton.pinchable){
				pinch = true;
				var touch1 = new pjs.PVector(touches[0].pageX, touches[0].pageY);
				var touch2 = new pjs.PVector(touches[1].pageX, touches[1].pageY);
				currButton.pinch(touch1, touch2);
			}
		}

		
	};


	var touchEnd = function(event){
		event.preventDefault();
		if(event.originalEvent){
			event = event.originalEvent;
		}
		var touch = new pjs.PVector();

		//calculate average
		for(var i=0; i<event.changedTouches.length; i++){
			var curr = event.changedTouches[i];
			touch.add(new pjs.PVector(curr.pageX, curr.pageY));
		}
		touch.div(event.changedTouches.length);

		mouse.x = touch.x;
		mouse.y = touch.y;

		//toolbox drag
		if(draggingToolbox){
			if(toolboxCenter.y >= pjs.height){
				toolboxCenter.y = pjs.height + toolboxDimen.y/2 -15;
			}else{
				toolboxCenter.y = pjs.height - toolboxDimen.y/2 + 5;
			}
			calculateToolbox();
			draggingToolbox = false;
		}
		else if(currButton){
			// debugger;
			var wasNew = currButton.isNew;
			currButton.isNew = false;
			if(!pinch){
				//connect curr to another button
				if(connectButton){
					var nearest = findNearestVec(buttons, mouse);
					if(nearest.dist <= nearest.el.rad)
						currButton.connect(nearest.el);
					connectButton = null;
				}else{
					//remove from canvas if over toolbox
					if(currButton.pos.y - currButton.rad >= toolboxCenter.y - toolboxDimen.y/2){
						currButton.removeFromCanvas();
						currButton = null;
					}else if(wasNew){
						var nearest = currButton.nearestButton();
						if(nearest.el && nearest.dist < currButton.snapConnectDist){
							nearest.el.connect(currButton);
						}
					}
					// currButton = null
				}

				//set narration on touch release
				if(currButton && currButton instanceof Say){
					currButton.setText();
				}

			}else{
				currButton.springOrig = currButton.rad; //reset spring after pinch gesture
			}

			
			//re-evaluate entire program
			evalAll();
		}
	};

	/* 
		tweens and draws the toolbox onto the screen
	*/
	var drawToolbox = function(){
		pjs.fill(200,100);

		//tween
		toolboxCenterTween.y += (toolboxCenter.y-toolboxCenterTween.y)*0.2;
		
		if(Math.abs(toolboxCenter.y - toolboxCenterTween.y) > 0.1){
			calculateToolbox();
		}
		pjs.rect(toolboxCenter.x, toolboxCenterTween.y+50, toolboxDimen.x, toolboxDimen.y+100, 10);
		for(var i=0; i<toolboxButtons.length; i++){
			toolboxButtons[i].render();
		}
	};

	/* 
		activates toolbox functionality, either creating a
		new button or dragging the toolbox
	 */
	var activateToolbox = function(){
		var nearest = findNearestVec(toolboxButtons, mouse);
		if(nearest.dist <= nearest.el.rad + 10){
			var newButton = nearest.el.deepClone();
			newButton.addToCanvas();
			currButton = newButton;
		}else{
			draggingToolbox = true;
		}
	};

	var drawTabMenu = function(){
		pjs.fill(100,100);

		var tabArray = getTabArray();

		for(var i=0; i<tabs.length; i++){
			if(i == currTabIndex){
				pjs.ellipse(tabArray[i], 0, buttonRad*2 + 20, buttonRad*2 + 20);
				pjs.ellipse(tabArray[i], 0, buttonRad*2, buttonRad*2);
			}else{
				pjs.ellipse(tabArray[i], 0, buttonRad*2, buttonRad*2);
			}
		}

		//add new tab button
		pjs.fill(200,100);
		pjs.ellipse(tabs.length*150 + 100, 0, buttonRad*2, buttonRad*2);
	};

	var getTabArray = function(){
		var tabArray = [];
		for(var i=0; i<tabs.length+1; i++){
			tabArray.push(i*150 + 100);
		}
		return tabArray;
	};

	var activateTabMenu = function(){

		var tabArray = getTabArray();
		console.log(tabArray);
		var nearestTab = findNearestVec(tabArray, mouse);

		if(nearestTab && nearestTab.el && nearestTab.dist < buttonRad){
			console.log("tab");
			return true;
		}

		return false;
	};

	/*
		Re-evaluates the entire program, starting at
		the anchors
	*/
	var evalAll = function(){
		clearAllTimeouts();
		for(var i=0; i<anchors.length; i++){
			anchors[i].eval();
		}
	};

	/*
		Clears the state of a previous eval
	*/
	var clearAllTimeouts = function(){
		for(var i=0; i<timers.length; i++){
			clearTimeout(timers[i]);
		}
		for(var i=0; i<buttons.length; i++){
			buttons[i].clearState();
		}
		timers = [];
		taps = [];
		shakes = [];
		narrator.narrate('',0,0);

		CURR_EVALS = 0;
	};

	/*
		Toggles view of program structure for viewing.
		Called externally by a div
	*/
	pjs.toggleViewMode = function(){
		pjs.viewMode = !pjs.viewMode;
		if(pjs.viewMode){
			evalAll();
			currButton = null;
			connectButton = null;
			$play.html('<i class="icon-stop"></i>');
		}else{
			$play.html('<i class="icon-play"></i>');
		}
	};

	/*
		Attempts to consume a shake from the singleton
		'shake' object, and fires the first waiting
		button.
	*/
	pjs.fireShake  = function(){
		if(shakes.length > 0){
			var first = shakes[0];
			shakes.splice(0,1);
			first.button.doneEval(first.sprite, true);
		}
	};

	/*
		fires a valid tap event waiting in taps queue
	*/
	var fireTap = function(){
		var toRemove = -1;
		for(var i=0; i<taps.length; i++){
			var curr = taps[i];
			if(curr.sprite.collides(mouse)){
				curr.button.doneEval(curr.sprite, true);
				toRemove = i;
				break;
			}
		}
		if(toRemove >= 0){
			taps.splice(toRemove, 1);
		}
	};


	/*
		arr: an array of objects with a pos vector
		vec: a vector
		finds the nearest vector in arr to vec, returns
		{
			el: the closest vector in arr,
			dist: the corresponding distance to vec
		}
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

	/*
		This class defines the behavior of a narrator,
		who is able to display text on the screen.
		It is used as a singleton.
	*/
	var Narrator = Class.create({
		initialize: function(){
			this.text = '';
			this.pos = new pjs.PVector();
			this.opacity = 100;
			this.tweens = {
				opacity: 0
			}
			this.fontSize = 60;
			this.last = {
				text: '',
				pos: new pjs.PVector(),
				fontSize: this.fontSize
			}
		},

		tween: function(){
			this.tweens.opacity += (this.opacity-this.tweens.opacity)*.1;
		},

		render: function(){
			this.tween();
			
			if(this.text){
				pjs.textSize(this.fontSize);
				pjs.fill(60,this.tweens.opacity);
				pjs.text(this.text, this.pos.x, this.pos.y, sayDist.x, sayDist.y);
				pjs.textSize(this.last.fontSize);
				pjs.fill(60,100 - this.tweens.opacity);
				pjs.text(this.last.text, this.last.pos.x, this.last.pos.y, sayDist.x, sayDist.y);
				pjs.textSize(30);
			}
		},

		narrate: function(text, x, y, fontSize){
			this.last.pos.x = this.pos.x;
			this.last.fontSize = this.fontSize;
			this.last.pos.y = this.pos.y;
			this.last.text = this.text;
			this.pos.x = x - sayDist.x/2;
			this.pos.y = y - 150;
			this.text = text;
			this.opacity = 100;
			this.fontSize = fontSize;
			this.tweens.opacity = 0;
		}
	});

	/*
		This class defines the behavior of a sprite,
		a static image that can be manipulated by a 
		program.
	*/
	var Sprite = Class.create({

		//initialized by corresponding anchor
		initialize: function(name, x, y, w, h, anchor){
			this.pos = new pjs.PVector(x, y);
			this.dimen = new pjs.PVector(300, 300); //600/2 by default for now
			this.name = name;
			this.image = null;
			this.rot = 0;

			this.anchor = anchor;
			this.tweens = {
				pos: new pjs.PVector(x, y),
				dimen: new pjs.PVector(0,0),
				rot: 0
			};
		},

		tween: function(){
			this.tweens.rot += (this.rot-this.tweens.rot)*.1;
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
			if(jQuery('.popup').length > 0){
				return;
			}
			var obj = this;
			pjs.noLoop();
			SketchTool.create({width: 600, height: 600, onComplete: function(sketch){
				obj.image = pjs.loadImage(sketch.getPNG());
				pjs.loop();
			}});
			
		},

		render: function(){
			this.tween();
			pjs.pushMatrix();
			pjs.translate(this.tweens.pos.x, this.tweens.pos.y);
			pjs.rotate(this.tweens.rot);
			if(this.image){
				if(!pjs.viewMode){
					pjs.fill(100,10);
					pjs.rect(0,0,this.tweens.dimen.x+10,this.tweens.dimen.y+10, 10);
				}
				pjs.image(this.image, 0,0, this.tweens.dimen.x, this.tweens.dimen.y);
			}else{
				pjs.fill(100,20);
				pjs.rect(0,0,this.tweens.dimen.x+10,this.tweens.dimen.y+10, 10);
			}
			pjs.popMatrix();
		}
	});

	/*
		This class defines the interface and basic
		behavior of all buttons. Any new buttons should
		extend this class.
	*/
	var Button = Class.create({
		initialize: function(x, y, rad, color){
			this.pos = new pjs.PVector(x, y);
			this.rad = rad;
			this.outline = rad + 5;
			this.popOutline = this.outline + 10;
			this.color = color;
			this.linkGray = 150;

			//protruding "nib" used to make a new connection
			this.connectCircleDist = this.rad + 5;
			this.connectCircle = new pjs.PVector(0, this.connectCircleDist);
			this.connectCircleRad = this.rad*3/4;

			this.snapConnectDist = this.rad*4;
			this.isNew = true; //button has not been dropped yet

			this.connected = []; //connected in circuit
			this.connectsToThis = []; //connected to this

			this.reacted = false;
			this.tweens = {
				outline: this.outline,
				linkGray: this.linkGray
			};

			this.spring = this.rad;
			this.springOrig = this.rad;
			this.springV = 0;
			this.springA = 0;
		},

		//used to create new buttons
		deepClone: function(){
			var clone = new Button(this.pos.x, this.pos.y, this.rad, this.color);
			return clone;
		},

		addToCanvas: function(){
			buttons.push(this);
		},

		clearState: function(){

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
			this.tweens.linkGray += (this.linkGray-this.tweens.linkGray)*.1;
			this.springA = -.2*(this.spring - this.springOrig);
			this.springV += this.springA;
			this.springV *= .75;
			this.spring += this.springV;
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
			pjs.ellipse(this.pos.x, this.pos.y, (this.spring + 5)*2, (this.spring + 5)*2);

		},

		move: function(x, y){
			this.pos.x = x;
			this.pos.y = y;
		},

		nearestButton: function(){

			var nearest = null,
				nearestDist = 1e9;

			for(var i=0; i<buttons.length; i++){
				var curr = buttons[i];
				if(curr != this){
					var dist = pjs.PVector.dist(curr.pos, this.pos);
					if(dist < nearestDist){
						nearest = curr;
						nearestDist = dist;
					}
				}
			}

			return {el: nearest,
				dist: nearestDist};
		},

		drawPossibleConnectionToThis: function(){
			if(!this.isNew)
				return;
			var nearest = this.nearestButton();
			if(nearest.el && nearest.dist < this.snapConnectDist){
				nearest.el.drawLink(nearest.el.pos, this.pos);
				return;
			}
		},

		//used during connection selection
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
			pjs.fill(this.tweens.linkGray,100);
			if(this == currButton){
				this.drawPossibleConnectionToThis();
			}
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
			//expands outline for 'popping' effect
			//this.tweens.outline = this.popOutline;
			this.spring = this.popOutline;
			this.tweens.linkGray = 20;
		},

		connect: function(other){
			//only directionally connect parent
			if(other != this && this.connected.indexOf(other) == -1){
				this.connected.push(other);
				other.connectsToThis.push(this);
			}
		},

		disconnectAll: function(){
			var obj = this;
			for(var i=0; i<this.connected.length; i++){
				var curr = this.connected[i];
				curr.connectsToThis = curr.connectsToThis.filter(function(el){
					return el != obj;
				});
			}
			this.connected = [];

			for(var i=0; i<this.connectsToThis.length; i++){
				var curr = this.connectsToThis[i];
				curr.connected = curr.connected.filter(function(el){
					return el != obj;
				});
			}
			this.connectsToThis = [];
		},

		disconnect: function(other){
			this.connected = this.connected.filter(function(el){
				return el != other;
			});
			
			var obj = this;
			other.connectsToThis = other.connectsToThis.filter(function(el){
				return el != obj;
			});
		},

		propagate: function(sprite){
			CURR_EVALS++;
			if(CURR_EVALS >= MAX_EVALS){
				if(CURR_EVALS == MAX_EVALS){
					window.alert("Oh dear, there seems to be a lot of looping...");
					currButton = null;
					connectButton = null;
				}
				return;
			}

			for(var i=0; i<this.connected.length; i++){
				this.connected[i].eval(sprite);
			}
		}
	});

	var Anchor = Class.create(Button, {
		initialize: function($super, x, y, rad, sprite){
			this.sprite = new Sprite("default_name", pjs.width/2, pjs.height+ 150, buttonRad, this);
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
			pjs.image(images['Anchor'], this.pos.x, this.pos.y, this.spring*2, this.spring*2);
		},

		deepClone: function(){
			var clone = new Anchor(this.pos.x, this.pos.y, this.rad, this.sprite);
			return clone;
		},

		move: function($super, x, y){
			$super(x, y);
			this.sprite.pos.x = x;
			this.sprite.pos.y = y - this.sprite.dimen.y/2 - spritePadding;
			this.sprite.rot = 0;
		},

		eval: function(sprite){
			if(!this.sprite.image){
				this.sprite.createImage();
			}else{
				this.showReaction();
				this.move(this.pos.x, this.pos.y);
				this.propagate(this.sprite);
			}
			
		}

	});

	var Start = Class.create(Button, {
		initialize: function($super, x, y, rad){
			$super(x, y, rad, pjs.color(168,202,186));
		},

		render: function($super){
			$super();
			pjs.image(images['Anchor'], this.pos.x, this.pos.y, this.spring*2, this.spring*2);
		},

		move: function($super, x, y){

		},

		deepClone: function(){
			var clone = new Start(this.pos.x, this.pos.y, this.rad, this.color);
			return clone;
		},

		eval: function(sprite){
			this.showReaction();
			this.propagate(sprite);
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
			pjs.image(images['Move'], this.pos.x, this.pos.y, this.spring*2, this.spring*2);
			if(this.sprite){
				var dist = pjs.PVector.sub(this.sprite.tweens.pos, this.spriteOrig).mag();
				var diff = this.distToSprite - dist

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
			this.showReaction();
			if(sprite){
				//original pos of sprite
				this.spriteOrig = new pjs.PVector(sprite.tweens.pos.x, sprite.tweens.pos.y);
				sprite.pos.x = this.pos.x;
				sprite.pos.y = this.pos.y - sprite.dimen.y/2 - spritePadding;
				this.sprite = sprite;
				this.distToSprite = pjs.PVector.sub(sprite.pos, this.spriteOrig).mag();
			}
			this.propagate(sprite);
		}

	});

	var Rotate = Class.create(Button, {
		initialize: function($super, x, y, rad){
			$super(x, y, rad, pjs.color(168,202,186));
			this.rotateAmount = Math.PI/6;
			this.pinchable = true;
			//used for animation
			this.spriteOrig = null;
			this.sprite = null;
			this.distToSprite = null;

			this.tweens.rot = 0;
			this.rot = 0;
		},

		tween: function($super){
			$super();
			this.tweens.rot += (this.rot-this.tweens.rot)*.1;
		},

		showReaction: function($super){
			$super();
			this.tweens.rot = -1*Math.PI*2;
		},

		render: function($super){
			$super();
			pjs.pushMatrix();
			pjs.translate(this.pos.x, this.pos.y);
			pjs.rotate(this.tweens.rot);
			pjs.image(images['Rotate'], 0,0, this.spring*2, this.spring*2);
			pjs.popMatrix();
			if(currButton == this && pinch){
				if(this.rotateAmount > 0){
					pjs.arc(this.pos.x, this.pos.y, this.spring*2, this.spring*2, 
						3*Math.PI/2, 3*Math.PI/2+this.rotateAmount);
				}else{
					pjs.arc(this.pos.x, this.pos.y, this.spring*2, this.spring*2, 
						3*Math.PI/2+this.rotateAmount, 3*Math.PI/2);
				}

			}
		},

		deepClone: function(){
			var clone = new Rotate(this.pos.x, this.pos.y, this.rad, this.color);
			return clone;
		},

		eval: function(sprite){
			this.showReaction();
			if(sprite)
				sprite.rot += this.rotateAmount;
			this.propagate(sprite);
		},

		//user can change timeout
		pinch: function(touch1, touch2){
			this.springOrig = this.rad + 30;

			var higher, lower;
			if(touch1.y < touch2.y){
				higher = touch1;
				lower = touch2;
			}else{
				higher = touch2;
				lower = touch1;
			}

			var diff = pjs.PVector.sub(lower, higher);
			var angle = pjs.PVector.angleBetween(new pjs.PVector(0,1), diff);

			if(higher.x < lower.x){
				angle *= -1;
			}
			this.rotateAmount = angle;
		}

	});

	var Say = Class.create(Button, {
		initialize: function($super, x, y, rad){
			$super(x, y, rad, pjs.color(168,219,168));
			
			//used for animation
			this.spriteOrig = null;
			this.sprite = null;
			this.distToSprite = null;

			this.fontSize = 60;
		},

		render: function($super){
			$super();
			pjs.image(images['Say'], this.pos.x, this.pos.y, this.spring*2, this.spring*2);
		},

		deepClone: function(){
			var clone = new Say(this.pos.x, this.pos.y, this.rad, this.color);
			return clone;
		},

		move: function($super, x, y){
			$super(x, y);
			if(this.text){
				narrator.narrate(this.text, this.pos.x, this.pos.y, this.fontSize);
				narrator.tweens.opacity = narrator.opacity;
			}
		},

		setText: function(){
			if(!this.text){
				this.text = window.prompt('Tell me what to say:');
				/*var obj = this;
				Dialog.dialog(function(text){
					obj.text = text;
				});*/
			}
		},

		eval: function(sprite){
			if(this.text)
				narrator.narrate(this.text, this.pos.x, this.pos.y, this.fontSize);
			this.showReaction();
			this.propagate(sprite);
		}

	});

	/*
		Defines state of a conditional button
		uses spring visualization to show 'waiting' state
	*/
	var Conditional = Class.create(Button, {
		initialize: function($super, x, y, rad, color){
			$super(x, y, rad, color);
			this.numWaiting = 0;
		},

		doneEval: function(sprite){
			this.numWaiting--;
			if(this.numWaiting <= 0){
				this.showReaction();
				this.springOrig = this.rad;
			}else{
				this.spring += 10;
			}
			this.propagate(sprite);
		},

		eval: function(sprite){
			this.springOrig = this.rad + 10;
			this.numWaiting++;
		},

		clearState: function(){
			this.springOrig = this.rad;
			this.numWaiting = 0;
		}
	});

	var Timer = Class.create(Conditional, {
		initialize: function($super, x, y, rad){
			this.timeout = 1000;
			this.pinchable = true; //able to change timeout amount with pinch
			this.lastTimeout = 0;
			this.timeoutLeft = 0;
			$super(x, y, rad, pjs.color(236,208,120));
		},

		render: function($super){
			$super();
			pjs.image(images['Timer'], this.pos.x, this.pos.y, this.spring*2, this.spring*2);
			if(this.timeoutLeft > 0){
				this.timeoutLeft = this.timeout - ((new Date()) - this.lastTimeout);
				var radLeft = 2*Math.PI * (this.timeoutLeft / this.timeout);
				pjs.arc(this.pos.x, this.pos.y, this.spring*2, this.spring*2, 0, radLeft);
			}
		},

		deepClone: function(){
			var clone = new Timer(this.pos.x, this.pos.y, this.rad, this.color);
			return clone;
		},

		testEval: function(){
			this.timeoutLeft = this.timeout;
			this.lastTimeout = new Date();
		},

		eval: function($super, sprite){
			$super(sprite);
			var obj = this;
			this.lastTimeout = new Date();
			this.timeoutLeft = this.timeout;
			var timer = setTimeout(function(){
				obj.doneEval(sprite);
			}, obj.timeout);
			timers.push(timer);
		},

		//user can change timeout
		pinch: function(touch1, touch2){
			this.springOrig = this.rad + 30;
			var dist = pjs.PVector.dist(touch1, touch2)*2;
			if(Math.abs(dist - this.timeout) > 100){
				this.timeout = dist;
				this.testEval();
			}
		}

	});

	var Touch = Class.create(Conditional, {
		initialize: function($super, x, y, rad){
			$super(x, y, rad, pjs.color(247,175,99));
			this.timeout = 1000;
			this.rot = 0;
			this.rotOrig = 0;
			this.rotV = 0;
			this.rotA = 0;
		},

		render: function($super){
			$super();
			pjs.image(images['Touch'], this.pos.x, this.pos.y, this.spring*2, this.spring*2);
		},

		deepClone: function(){
			var clone = new Touch(this.pos.x, this.pos.y, this.rad, this.color);
			return clone;
		},

		eval: function($super, sprite){
			$super(sprite);
			if(sprite){
				taps.push({
					button: this,
					sprite: sprite
				});
			}
		}

	});

	var Shake = Class.create(Conditional, {
		initialize: function($super, x, y, rad){
			this.timeout = 1000;
			$super(x, y, rad, pjs.color(255,156,151));
			this.rot = 0;
			this.rotOrig = 0;
			this.rotV = 0;
			this.rotA = 0;
		},

		tween: function($super){
			$super();
			this.rotA = K*(this.rot - this.rotOrig);
			this.rotV += this.rotA;
			this.rotV *= friction;
			this.rot += this.rotV;
		},

		render: function($super){
			$super();
			pjs.pushMatrix();
			pjs.translate(this.pos.x, this.pos.y);
			pjs.rotate(this.rot);
			pjs.image(images['Shake'], 0, 0, this.spring*2, this.spring*2);
			pjs.popMatrix();
		},

		deepClone: function(){
			var clone = new Shake(this.pos.x, this.pos.y, buttonRad, this.color);
			return clone;
		},

		eval: function($super, sprite){
			$super(sprite);
			this.rotV = addV;
			if(sprite){
				shakes.push({
					button: this,
					sprite: sprite
				});
			}
		}

	});

	$canvas.on("touchstart", touchStart);
	$canvas.on("touchmove", touchMove);
	$canvas.on("touchend", touchEnd);

};

var canvas = document.getElementById("pcanvas");
var pjs = new Processing(canvas, play);

//set up resize event
window.onresize = function(event) {
   pjs.setupScreen();
}

