$(function(){
var W = 900;
var DIM;
var canvas = $('#ctx').attr({
	'width':W,
	'height':W
});
var c = $(canvas)[0].getContext('2d');
var FPS = 50;
var getDist = function(x1,y1,x2,y2){
	var xx = x1-x2;
	var yy = y1-y2;
	return Math.sqrt(xx*xx+yy*yy);
}
var createVector = function(vx,vy){
	return {
		x:vx,
		y:vy,
		add:function(ov){
			this.x += ov.x;
			this.y += ov.y;
			return this;
		},
		heading:function(){
			return Math.atan2(this.y,this.x);
		},
		setMag:function(nlen){
			let clen = getDist(0,0,this.x,this.y);
			this.x *= nlen/clen;
			this.y *= nlen/clen;
			return this;
		}
	};
}
var vectRan2D = function(){
	let angle = Math.PI*2*Math.random();
	var vect = createVector(Math.cos(angle),Math.sin(angle));
	return vect.setMag(magnitude);
}
function Population(){
	this.rockets = [];
	this.popsize = populationSize;
	this.matingPool;
	for(let i = 0; i < this.popsize; i++){
		this.rockets[i] = new Rocket();
	}
	this.evaluate = function(){
		var maxFit = 0;
		for(let i = 0; i < this.popsize; i++){
			this.rockets[i].calcFitness();
			if(this.rockets[i].fitness > maxFit){
				maxFit = this.rockets[i].fitness;
			}
		}
		for(let i = 0; i < this.popsize; i++){
			this.rockets[i].fitness /= maxFit;
		}
		this.matingPool = [];
		for(let i = 0; i < this.popsize; i++){
			let n = this.rockets[i].fitness*10;
			for(let j = 0; j < n; j++){
				this.matingPool.push(this.rockets[i]);
			}
		}
	}
	this.selection = function(){
		var newRockets = [];
		for(let i in this.rockets){
			var parent = this.matingPool[Math.floor(this.matingPool.length*Math.random())].dna;
			var child = new DNA(parent.genes.slice());
			child.mutation();
			newRockets[i] = new Rocket(child);
		}
		this.rockets = newRockets;
	}
	this.run = function(){
		for(let i = 0; i < this.popsize; i++){
			this.rockets[i].update();
			this.rockets[i].show();
		}
	}
}
function DNA(genes){
	if(genes){
		this.genes = genes;
	}else{
		this.genes = [];
		for(let i = 0; i < lifespan; i++){
			this.genes.push(vectRan2D());
		}
	}
	this.mutation = function(){
		for(let i in this.genes){
			if(Math.random() < mutation/100){
				this.genes[i] = vectRan2D(0.1);
			}
		}
	}
}
function Rocket(dna){
	this.pos = createVector(start.x,start.y);
	this.spd = createVector(0,0);
	this.acc = createVector(0,0);
	this.completed = false;
	this.crash = false;
	if(dna){
		this.dna = dna;
	}else{
		this.dna = new DNA();
	}
	this.applyForce = function(force){
		this.acc.add(force);
	}
	this.calcFitness = function(){
		let d = getDist(this.pos.x,this.pos.y,target.x,target.y);
		this.fitness = 1/d;
		if(this.completed){
			this.fitness *= 10;
		}
		if(this.crash){
			this.fitness /= 10;
		}
	}
	this.update = function(){
		if(getDist(this.pos.x,this.pos.y,target.x,target.y) < target.size){
			this.completed = true;
		}
		for(let o in obstacles){
			if(obstacles[o].isOverPos(this.pos)){
				this.crash = true;
			}
		}
		this.applyForce(this.dna.genes[count]);
		if(!this.completed && !this.crash){
			this.spd.add(this.acc);
			this.pos.add(this.spd);
			this.acc.x = 0;
			this.acc.y = 0;
		}
	}
	this.show = function(){
		c.save();
		c.translate(this.pos.x,this.pos.y);
		c.rotate(this.spd.heading());
		c.fillStyle = '#0AF';
		c.globalAlpha = 0.5;
		c.beginPath();
		c.moveTo(15,0);
		c.lineTo(-10,-5);
		c.lineTo(-5,0);
		c.lineTo(-10,5);
		c.lineTo(15,0);
		c.fill();
		c.restore();
	}
}
var drawCircle = function(pos){
	c.fillStyle = pos.col;
	c.beginPath();
	c.arc(pos.x,pos.y,pos.size,0,Math.PI*2);
	c.fill();
}
var newObstacle = function(x,y,w,h){
	var obs = {
		x:x,
		y:y,
		w:w,
		h:h
	};
	obs.draw = function(){
		c.fillStyle = '#AA8';
		c.fillRect(x,y,w,h);
	}
	obs.isOverPos = function(pos){
		if(pos.x > obs.x
		&& pos.x < obs.x+obs.w
		&& pos.y > obs.y
		&& pos.y < obs.y+obs.h){
			return true;
		}
		return false;
	}
	obs.remove = function(){
		obstacles.splice(obstacles.indexOf(obs),1);
	}
	obstacles.push(obs);
}
var start = {
	x:W/5,
	y:W/2,
	size:15,
	col:'#C3A'
};
var target = {
	x:4*W/5,
	y:W/2,
	size:15,
	col:'#0F5'
};
var lifespan = $('#l').val();
var prelifespan = lifespan;
var magnitude = 0.4;
var populationSize = $('#gps').val();
var prePopulationSize = populationSize;
var generation = 1;
var mutation = $('#m').val();
var count = 0;
var obstacles = [];
var mouseStart = {x:0,y:0};
var mouseEnd = {x:0,y:0};
var isPressed = false;
$(canvas)[0].addEventListener('contextmenu',function(e){
	e.preventDefault();
});
$(canvas).mousedown(function(e){
	if(e.which == 1){
		mouseStart.x = e.pageX*W/DIM;
		mouseStart.y = e.pageY*W/DIM;
		isPressed = true;
	}
});
canvas.mouseup(function(e){
	if(e.which == 1){
		isPressed = false;
		newObstacle((mouseStart.x < mouseEnd.x) ? mouseStart.x : mouseEnd.x,(mouseStart.y < mouseEnd.y) ? mouseStart.y : mouseEnd.y,Math.abs(mouseEnd.x-mouseStart.x),Math.abs(mouseEnd.y-mouseStart.y));
	}else if(e.which == 3){
		for(let o in obstacles){
			if(obstacles[o].isOverPos(mouseEnd)){
				obstacles[o].remove();
			}
		}
	}
});
$(canvas).mousemove(function(e){
	mouseEnd.x = e.pageX*W/DIM;
	mouseEnd.y = e.pageY*W/DIM;
});
var resetEvolution = function(){
	count = 0;
	pop = new Population();
	generation = 1;
}
$('#r').click(function(){
	resetEvolution();
});
$('#ro').click(function(){
	obstacles = [];
});
var pop = new Population();
setInterval(function(){
	mutation = $('#m').val();
	magnitude = $('#maxspd').val();
	populationSize = $('#gps').val();
	lifespan = $('#l').val();
	if(prelifespan != lifespan || prePopulationSize != populationSize){
		resetEvolution();
	}
	prePopulationSize = populationSize;
	prelifespan = lifespan;
	DIM = window.innerHeight;
	$(canvas).css({
		'width':DIM,
		'height':DIM
	});
	c.fillStyle = '#333';
	c.fillRect(0,0,W,W);
	drawCircle(start);
	drawCircle(target);
	for(let i in obstacles){
		obstacles[i].draw();
	}
	pop.run();
	if(++count == lifespan){
		count = 0;
		pop.evaluate();
		pop.selection();
		++generation;
	}
	if(isPressed){
		c.globalAlpha = 0.5;
		c.fillStyle = '#AA8';
		c.fillRect(mouseStart.x,mouseStart.y,mouseEnd.x-mouseStart.x,mouseEnd.y-mouseStart.y);
		c.globalAlpha = 1;
	}
	$('#g').text(generation);
	$('#mv').text(mutation);
	$('#ps').text(populationSize);
	$('#spd').text(Math.floor(magnitude*100));
},1000/FPS);
});