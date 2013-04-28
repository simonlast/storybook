
var SketchTool = {};

SketchTool.template = jQuery("#sketch-template").html();

SketchTool.play = function(pjs) {

	var bkg, strokes, defaultCol, currColor, currRadius;

	pjs.setup = function(){
		pjs.size(SketchTool.options.width,SketchTool.options.height);
		pjs.noStroke();
		pjs.smooth();
		pjs.noLoop();
		pjs.resetVars();
		
	};

	pjs.resetVars = function(){
		bkg = pjs.color(255);
		strokes = [];
		defaultCol = SketchTool.options.color;
		currColor = pjs.color(defaultCol.r, defaultCol.g, defaultCol.b);
		currRadius = SketchTool.options.radius;
		pjs.redraw();
	}

	pjs.draw = function(){
		pjs.background(0,0);
		for(var i=0; i<strokes.length; i++){
			strokes[i].render();
		}
	};

	pjs.mousePressed = function(){
	   	var stroke = new pjs.Stroke(
	  		[new pjs.PVector(pjs.mouseX,pjs.mouseY)],
	    	currColor,
	    	currRadius);
	    strokes.push(stroke);
	    pjs.loop();
	};

	pjs.mouseDragged = function(){
		var currStroke = strokes[strokes.length-1];
  		currStroke.addPoint(new pjs.PVector(pjs.mouseX,pjs.mouseY));
	};

	pjs.mouseReleased = function(){
  		pjs.noLoop();
	};

	pjs.changeColor = function(r,g,b){
		currColor = pjs.color(r,g,b);
	};

	pjs.undoStroke = function(){
		if(strokes.length > 0){
			strokes.splice(strokes.length-1,1);
			pjs.redraw();
		}
	};

	pjs.changeRadius = function(radius){
		currRadius = radius;
	};

	pjs.incRadius = function(radius){
		currRadius += radius;
	};

	pjs.getData = function(){
		var data = [];
		for(var i=0; i<strokes.length; i++){
			var curr = strokes[i];
			var currPoints = [];
			for(var x=0; x<curr.points.length; x++){
				currPoints.push({
					x: curr.points[x].x,
					y: curr.points[x].y
				});
			}
			data.push({
				points: currPoints,
				color: {
					r: pjs.red(curr.color),
					g: pjs.green(curr.color),
					b: pjs.blue(curr.color)
				},
				radius: curr.radius
			});
		}
		return data;
	};

	pjs.Stroke = function(points, color, radius){
		this.points = points;
		this.color = color;
		this.radius = radius;

		this.render = function(){
			pjs.beginShape();

  			pjs.stroke(this.color);
  			pjs.strokeWeight(this.radius);
  			pjs.noFill();
  			for(var i=0; i<this.points.length; i++){
  				var curr = this.points[i];
    			pjs.curveVertex(curr.x, curr.y);
  			}
  			pjs.endShape();
		};

		this.addPoint = function(point){
			this.points.push(point);
		};
	};

};

SketchTool.defaults = {
	width: 800,
	height: 600,
	radius: 20,
	color: {
		r: 60,
		g: 60,
		b: 60
	},
	onComplete: null
};

SketchTool.color = function(sketch,r,g,b){

	this.r = r;
	this.g = g;
	this.b = b;
	this.sketch = sketch;
	this.className = '' + r + g + b;
	this.domEl;

	//parent is jquery selector
	this.createDOM = function(parent){
		parent.append('<div class="color_option ' + this.className + '"></div>');
		this.domEl = jQuery('.' + this.className);
		this.domEl.css({
			'background-color': 'rgb(' + r + ',' + g + ',' + b + ')'
		});
		
		var currObj = this;
		this.domEl.on("touchend", function(ev){
			//ev.gesture.preventDefault();
			currObj.domEl.css({
				'border-width': '10px'
			});
			currObj.sketch.changeColor(currObj.r, currObj.g, currObj.b);
		});
	}

};

SketchTool.createColors = function(parent, sketch, colors){
	for(var i=0; i<colors.length; i++){
		var curr = colors[i];
		var newCol = new SketchTool.color(sketch, curr.r, curr.g, curr.b);
		newCol.createDOM(parent);
	}
};

SketchTool.options = {};

SketchTool.setOptions = function(userOptions){
	if(!userOptions){
		SketchTool.options = SketchTool.defaults;
	}else{
		for(var key in SketchTool.defaults){
			if(userOptions[key] != undefined){
				SketchTool.options[key] = userOptions[key];
			}else{
				SketchTool.options[key] = SketchTool.defaults[key];
			}
		}
	}
};

/* Call this function on sketch (sketch.getPNG) */
SketchTool.getPNG = function(){
	return this.canvas.toDataURL("image/png");
}

SketchTool.create = function(options){
	var canvasId = "sketchcanvas";
	
	jQuery('body').append(SketchTool.template);

	var sketch = {};
	SketchTool.setOptions(options);
	sketch.canvas = document.getElementById(canvasId);
	sketch.processingInstance = new Processing(sketch.canvas, SketchTool.play);
	sketch.reset = sketch.processingInstance.resetVars;
	sketch.changeColor = sketch.processingInstance.changeColor;
	sketch.changeRadius = sketch.processingInstance.changeRadius;
	sketch.incRadius = sketch.processingInstance.incRadius;
	sketch.getData = sketch.processingInstance.getData;
	sketch.getPNG = SketchTool.getPNG;
	sketch.undoStroke = sketch.processingInstance.undoStroke;

	SketchTool.createColors(jQuery('#color-holder'), sketch, colorArr);

	document.getElementById('cmd_incsize').on("touchend", function(ev){
        sketch.incRadius(5);
    });

    document.getElementById('cmd_decsize').on("touchend", function(ev){
        sketch.incRadius(-5);
    });

    document.getElementById('cmd_undo').on("touchend", function(ev){
        sketch.undoStroke();
    });

    //runs after sketch is finished
    document.getElementById('cmd_finish_sketch').on("touchend", function(ev){
    	console.log(SketchTool.options);
		if(SketchTool.options.onComplete){
			SketchTool.options.onComplete(sketch);
		}
		jQuery('#sketch-holder').css({'top': Math.floor(pjs.height) + 1 + 'px'});

		setTimeout(function(){
			jQuery('#sketch-holder').remove();
		}, 200);


    });

	return sketch;
};
