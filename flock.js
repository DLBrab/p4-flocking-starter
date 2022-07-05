let flock;

function setup() {
  createCanvas(640, 360);
  createP("Drag the mouse to generate new feesh. Up arrow to add food, and Down arrow to add a shork");

  flock = new Flock();
  // Add an initial set of boids into the system
  for (let i = 0; i < 10; i++) {
    let b = new Boid(width / 2,height / 2);
    flock.addBoid(b);
  }
}

function draw() {
  background(0, 65, 75);
  flock.run();
}

// Add a new boid into the System
function mouseDragged() {
  flock.addBoid(new Boid(mouseX, mouseY));
}

function keyPressed () {
  if (keyCode === UP_ARROW) {
    flock.addFood(new Food(mouseX, mouseY))
  }
  if (keyCode === DOWN_ARROW) {
    flock.addPredator(new Shark(mouseX, mouseY));
  }
}

// The Nature of Code
// Daniel Shiffman
// http://natureofcode.com



// Flock object
// Does very little, simply manages the array of all the boids
function Flock() {
  // An array for all the boids
  this.boids = []; // Initialize the array
  this.foods = [];
  this.predators = [];
}

Flock.prototype.run = function() {
  for (let i = 0; i < this.boids.length; i++) {
    this.boids[i].run(this.boids, this.foods, this.predators);  // Passing the entire list of boids, food, and predators to each boid individually
  }
  for (let i = 0; i < this.foods.length; ++i) {
    this.foods[i].run()
  }
  for (let i = 0; i < this.predators.length; ++i) {
    this.predators[i].run()
  }
}

Flock.prototype.addFood = function(b) {
  if (this.foods.length > 0) {
    this.foods.pop();
  }
  this.foods.push(b);
}

function Food(x, y) {
  this.position = createVector(x, y);
}

Food.prototype.run = function() {
  // this.update();
  // this.borders();
  this.render();
}

Food.prototype.render = function() {
  fill(160,82,45);
  stroke(200);
  circle(this.position.x, this.position.y, 10);
}

Flock.prototype.addPredator = function(b) {
  if (this.predators.length > 0) {
    this.predators.pop();
  }
  this.predators.push(b);
}

function Shark(x, y) {
  this.acceleration = createVector(0, 0);
  this.velocity = createVector(random(-4, 4), random(-4, 4));
  this.position = createVector(x, y);
  this.r = 9.0;
  this.maxspeed = 10;    // Maximum speed
  this.maxforce = 0.5; // Maximum steering force
}

Shark.prototype.run = function() {
  this.update();
  // this.borders();
  this.render();
}

Shark.prototype.update = function() {
  // Update velocity
  this.velocity.add(this.acceleration);
  // Limit speed
  this.velocity.limit(this.maxspeed);
  this.position.add(this.velocity);
  // Reset accelertion to 0 each cycle
  this.acceleration.mult(0);
}

Shark.prototype.render = function() {
  // Draw a triangle rotated in the direction of velocity
  let theta = this.velocity.heading() + radians(270);
  fill(97);
  stroke(200);
  push();
  translate(this.position.x, this.position.y);
  rotate(theta);
  beginShape();
  vertex(this.r * .5, -this.r * .5)//7
  vertex(this.r, this.r * 2);//6
  vertex(0, this.r * 2.5);//5
  vertex(-this.r, this.r * 2);//4
  vertex(-this.r * .5, -this.r * .5)//3
  vertex(-this.r, -this.r * 2);//2
  vertex(this.r, -this.r * 2);//1
  endShape(CLOSE);
  pop();
} 

Flock.prototype.addBoid = function(b) {
  this.boids.push(b);
}

// The Nature of Code
// Daniel Shiffman
// http://natureofcode.com

// Boid class
// Methods for Separation, Cohesion, Alignment added

function Boid(x, y) {
  this.acceleration = createVector(0, 0);
  this.velocity = createVector(random(-1, 1), random(-1, 1));
  this.position = createVector(x, y);
  this.r = 3.0;
  this.maxspeed = 5;    // Maximum speed
  this.maxforce = 0.08; // Maximum steering force
}

Boid.prototype.run = function(boids, food, predators) {
  this.flock(boids, food, predators);
  this.update();
  // this.borders();
  this.render();
}

Boid.prototype.applyForce = function(force) {
  // We could add mass here if we want A = F / M
  this.acceleration.add(force);
}

// We accumulate a new acceleration each time based on three rules
Boid.prototype.flock = function(boids, food, predators) {
  let sepa = this.separate(boids);        // Separation
  let algn = this.align(boids);           // Alignment
  let cohe = this.cohesion(boids);        // Cohesion
  let avoi = this.avoid();                // Avoid walls
  let swrl = this.swirl();                // Swirls around a point
  let feed = this.feed(boids, food);      // Pursues food
  let flee = this.flee(predators)         // Run from sharks

  // Arbitrarily weight these forces
  sepa.mult(4.0);
  algn.mult(6.0);
  cohe.mult(6.0);
  avoi.mult(1.0);
  swrl.mult(1.0);
  feed.mult(40.0);
  flee.mult(40.0);

  // Add the force vectors to acceleration
  this.applyForce(sepa);
  this.applyForce(algn);
  this.applyForce(cohe);
  this.applyForce(avoi);
  this.applyForce(swrl);
  this.applyForce(feed);
  this.applyForce(flee);
}

// Method to update location
Boid.prototype.update = function() {
  // Update velocity
  this.velocity.add(this.acceleration);
  // Limit speed
  this.velocity.limit(this.maxspeed);
  this.position.add(this.velocity);
  // Reset accelertion to 0 each cycle
  this.acceleration.mult(0);
}

// A method that calculates and applies a steering force towards a target
// STEER = DESIRED MINUS VELOCITY
Boid.prototype.seek = function(target) {
  let desired = p5.Vector.sub(target,this.position);  // A vector pointing from the location to the target
  if (desired > 0.05) {
    return createVector(0, 0);
  }
  // Normalize desired and scale to maximum speed
  desired.normalize();
  desired.mult(this.maxspeed / 10);
  // Steering = Desired minus Velocity
  let steer = p5.Vector.sub(desired,this.velocity);
  steer.limit(this.maxforce);  // Limit to maximum steering force
  return steer;
}

Boid.prototype.render = function() {
  // Draw a triangle rotated in the direction of velocity
  let theta = this.velocity.heading() + radians(270);
  fill(127);
  stroke(200);
  push();
  translate(this.position.x, this.position.y);
  rotate(theta);
  beginShape();
  vertex(this.r * .5, -this.r * .5)//7
  vertex(this.r, this.r * 2);//6
  vertex(0, this.r * 2.5);//5
  vertex(-this.r, this.r * 2);//4
  vertex(-this.r * .5, -this.r * .5)//3
  vertex(-this.r, -this.r * 2);//2
  vertex(this.r, -this.r * 2);//1
  endShape(CLOSE);
  pop();
} 

// Wraparound
Boid.prototype.borders = function() {
  if (this.position.x < -this.r)  this.position.x = width + this.r;
  if (this.position.y < -this.r)  this.position.y = height + this.r;
  if (this.position.x > width + this.r) this.position.x = -this.r;
  if (this.position.y > height + this.r) this.position.y = -this.r;
}

// Separation
// Method checks for nearby boids and steers away
Boid.prototype.separate = function(boids) {
  let desiredseparation = 5.0;
  let steer = createVector(0, 0);
  let count = 0;
  // For every boid in the system, check if it's too close
  for (let i = 0; i < boids.length; i++) {
    let d = p5.Vector.dist(this.position,boids[i].position);
    // If the distance is greater than 0 and less than an arbitrary amount (0 when you are yourself)
    if ((d > 0) && (d < desiredseparation)) {
      // Calculate vector pointing away from neighbor
      let diff = p5.Vector.sub(this.position, boids[i].position);
      diff.normalize();
      diff.div(d);        // Weight by distance
      steer.add(diff);
      count++;            // Keep track of how many
    }
  }
  // Average -- divide by how many
  if (count > 0) {
    steer.div(count);
  }

  // As long as the vector is greater than 0
  if (steer.mag() > 0) {
    // Implement Reynolds: Steering = Desired - Velocity
    steer.normalize();
    steer.mult(this.maxspeed);
    steer.sub(this.velocity);
    steer.limit(this.maxforce);
  }
  return steer;
}

// Alignment
// For every nearby boid in the system, calculate the average velocity
Boid.prototype.align = function(boids) {
  let neighbordist = 80;
  let sum = createVector(0,0);
  let count = 0;
  for (let i = 0; i < boids.length; i++) {
    let d = p5.Vector.dist(this.position,boids[i].position);
    if ((d > 0) && (d < neighbordist)) {
      sum.add(boids[i].velocity);
      count++;
    }
  }
  if (count > 0) {
    sum.div(count);
    sum.normalize();
    sum.mult(this.maxspeed);
    let steer = p5.Vector.sub(sum, this.velocity);
    steer.limit(this.maxforce);
    return steer;
  } else {
    return createVector(0, 0);
  }
}

// Cohesion
// For the average location (i.e. center) of all nearby boids, calculate steering vector towards that location
Boid.prototype.cohesion = function(boids) {
  let neighbordist = 50;
  let sum = createVector(0, 0);   // Start with empty vector to accumulate all locations
  let count = 0;
  for (let i = 0; i < boids.length; i++) {
    let d = p5.Vector.dist(this.position,boids[i].position);
    if ((d > 0) && (d < neighbordist)) {
      sum.add(boids[i].position); // Add location
      count++;
    }
  }
  if (count > 0) {
    sum.div(count);
    return this.seek(sum);  // Steer towards the location
  } else {
    return createVector(0, 0);
  }
}

Boid.prototype.avoid = function() {
  let steer = createVector(0, 0);
  if (this.position.x <= 0) {
    steer.add(createVector(1, 0));
  }
  if (this.position.x > 640) { // width of canvas
    steer.add(createVector(-1, 0));
  }
  if (this.position.y <= 0) {
    steer.add(createVector(0, 1));
  }
  if (this.position.y > 360) { // height of canvas
    steer.add(createVector(0, -1));
  }
  return steer;
}

Boid.prototype.swirl = function() {
  let nexusY = abs(this.position.y - mouseY);
  let nexusX = abs(this.position.x - mouseX);
  let nexus = createVector(nexusX, nexusY);
  

  let anglebetween = nexus.angleBetween(this.velocity);
  anglebetween += radians(90);
  let newvec = p5.Vector.fromAngle(anglebetween);


  newvec.normalize()
  newvec.mult(this.maxspeed);
  newvec.sub(this.velocity);
  newvec.limit(this.maxforce);
  return newvec
}

Boid.prototype.feed = function(boids, food) {
  let foodSightDist = 100.0;

  for (let i = 0; i < food.length; ++i) {
    let pos = food[i].position
    let distance = p5.Vector.dist(this.position, pos);
    if (distance < foodSightDist && distance > 10.0) {
      return this.seek(food[i].position)
    }
  }
  return createVector(0, 0);
}

Boid.prototype.flee = function(predators) {
  let predatorMinDist = 100.0;
  let count = 0;
  let steer = createVector(0, 0);

  for (let i = 0; i < predators.length; i++) {
    let d = p5.Vector.dist(this.position,predators[i].position);
    // If the distance is greater than 0 and less than an arbitrary amount (0 when you are yourself)
    if ((d > 0) && (d < predatorMinDist)) {
      // Calculate vector pointing away from neighbor
      let diff = p5.Vector.sub(this.position, predators[i].position);
      diff.normalize();
      diff.div(d);        // Weight by distance
      steer.add(diff);
      count++;            // Keep track of how many
    }
  }
  // Average -- divide by how many
  if (count > 0) {
    steer.div(count);
  }

  // As long as the vector is greater than 0
  if (steer.mag() > 0) {
    // Implement Reynolds: Steering = Desired - Velocity
    steer.normalize();
    steer.mult(this.maxspeed);
    steer.sub(this.velocity);
    steer.limit(this.maxforce);
  }
  return steer;
}