import Phaser from "phaser";
import mapPNG from "./assets/assetsmap.png";
import mapJSON from "./map.json";
import water from "./assets/water.png";
import playerPNG from "./assets/player5.png";
import enemyPNG from "./assets/slime.png";
import Enemies from "./Enemies";
import axePNG from "./assets/axe1.png";
import bigAxePNG from "./assets/bigAxe.png";


const config = {
  type: Phaser.AUTO,
  parent: "phaser-example",
  width: 1550,
  height: 1550,
  physics:{
    default: "arcade",
    arcade: {
      gravity: {y: 0}
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update,
  }
};

const game = new Phaser.Game(config);
let player ;
var cursors ;
var enemies; 
const velocity = 250;
var extraVelocity =0;

var initialTime = 12;
var time = -1;
var timeText;
var timedEvent;

var playerAndAxe = false;
var bigAxe;

const totalEnemies=10;
var aliveEnemies = totalEnemies;
var scoreText;

function preload() {
  this.load.image("background", water);
  this.load.image("tiles", mapPNG);
  this.load.tilemapTiledJSON("map", mapJSON);
  this.load.spritesheet("player", playerPNG, {frameWidth:32, frameHeight:60});
  this.load.image("slime", enemyPNG);
  this.load.image("axe", axePNG);
  this.load.image("bigAxe", bigAxePNG);
}

function create() {
  const map = this.make.tilemap({key : "map"});
  const tileset = map.addTilesetImage("assets", "tiles");
  this.add.image(1000, 1000, "background");
  
  const ground = map.createStaticLayer("ground", tileset, 0, 0);
  const boundsCollider = map.createStaticLayer("bounds",tileset,0,0);
  const objectCollider = map.createStaticLayer("objectCollider", tileset, 0, 0);
  const aboveCollider = map.createStaticLayer("aboveObject", tileset, 0, 0);

  boundsCollider.setCollisionByProperty({"collider" : true});
  objectCollider.setCollisionByProperty({"collider" : true});
  aboveCollider.setDepth(10);

  //PLAYER
  const spawnPoint = map.findObject(
    'player',
    objects => objects.name === 'spawing point'
  )
  player = this.physics.add.sprite(spawnPoint.x,spawnPoint.y, "player");

  this.physics.add.collider(player, objectCollider);
  this.physics.add.collider(player, boundsCollider);

  //ENEMIES
  this.enemies = map.createFromObjects('enemies', 'enemy', {})
  this.enemiesGroup = new Enemies(this.physics.world, this, [], this.enemies)

  this.physics.add.collider(this.enemiesGroup, player, hitEnemy, null, this)
  this.physics.add.collider(this.enemiesGroup, objectCollider);
  this.physics.add.collider(this.enemiesGroup, boundsCollider);

  //SCORE
  scoreText = this.add.text(16, 16, '10/10', { fontSize: '60px', fill: '#0ff' });

  //TIMER
  //this.add.image(300,50,"bigAxe");
  timeText = this.add.text(350, 16, '0', { fontSize: '60px', fill: '#0ff' });
  timedEvent = this.time.addEvent({ delay: 1000, callback: ()=>{updateCounter(this)}, callbackScope: this, loop: true });
  bigAxe = this.physics.add.sprite(300,16,"bigAxe");


  const anims = this.anims;
  anims.create({
    key: "left",
    frames: anims.generateFrameNames("player", {start: 20, end: 21}),
    frameRate: 10,
    repeat: -1
  });
  anims.create({
    key: "right",
    frames: anims.generateFrameNames("player", {start: 20, end: 21}),
    frameRate: 10,
    repeat: -1
  });
  anims.create({
    key: "front",
    frames: anims.generateFrameNames("player", {start: 0, end: 9}),
    frameRate: 10,
    repeat: -1
  });
  anims.create({
    key: "back",
    frames: anims.generateFrameNames("player", {start: 11, end: 19}),
    frameRate: 10,
    repeat: -1
  });

  //CAMERA
  const camera = this.cameras.main
  camera.startFollow(player)
  camera.setBounds(0 , 0 , map.widthInPixels, map.heightInPixels)
}

function update(){
  //put here  before your velocity is 0
  const prevVelocity = player.body.velocity.clone()
  //stop player when stop press the key
  player.body.setVelocity(0);
  cursors = this.input.keyboard.createCursorKeys()

  //TIMER
  if(playerAndAxe==true){
   timeText.setText(time);
  }

  

//keyboard press to move
  if(cursors.left.isDown){
    player.body.setVelocityX(-velocity - extraVelocity)
  }else if (cursors.right.isDown){
    player.body.setVelocityX(velocity  + extraVelocity)
  }else if(cursors.up.isDown){
    player.body.setVelocityY(-velocity - extraVelocity)
  }else if(cursors.down.isDown){
    player.body.setVelocityY(velocity  + extraVelocity)
  }

  followPlayer(this);

  //set animations per key pressed
  if(cursors.left.isDown){
    player.anims.play("left", true)
  }else if (cursors.right.isDown){
    player.anims.play("right", true)
  }else if(cursors.up.isDown){
    //its because when you go, you need see the back of your character
    player.anims.play("back", true)
  }else if(cursors.down.isDown){
    player.anims.play("front", true)
  }else{
    player.anims.stop()

  //front animation
  if(prevVelocity.x < 0) player.setTexture("player", "left")
  else if (prevVelocity.x > 0) player.setTexture("player", "right")
  else if (prevVelocity.y < 0) player.setTexture("player", "back")
  else if (prevVelocity.y > 0) player.setTexture("player", "front")
  }
  
}

function getAxe(player,axe){
  playerAndAxe=true;
  axe.disableBody(true, true);
  time = initialTime;
}

function updateCounter(t) {
  console.log(time);

  if(time == -1){
    createAxe(t);
    time= -2;
  }

  if(playerAndAxe==false)
    return;

  if(time == 0){
    playerAndAxe = false;
    createAxe(t);
  }
  else 
    time--;
}

function hitEnemy(player, enemy){
  if(playerAndAxe == true){
    enemy.disableBody(true, true);
    aliveEnemies -= 1;
    scoreText.setText(aliveEnemies + '/' + totalEnemies);
  }else
    this.scene.restart();

}

function createAxe(t,x,y){
  var x = Phaser.Math.Between(50, 1500);
  var y = Phaser.Math.Between(50, 1500);

  const axe = t.physics.add.group({
    key: 'axe',
    repeat: 0,
    setXY: { x: x, y: y, stepX: 70 }
  });
  axe.children.iterate(function (child) {
    child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
  });
  t.physics.add.overlap(player, axe, getAxe, null, t);
}

function followPlayer(t){

  var x =player.x -500;
  var y =player.y -150;

  if(x<0)
    x = 20;

  if(y<0)
    y = 20;

  scoreText.x=x;
  scoreText.y=y;

  timeText.x = x + 370;
  timeText.y = y;

  bigAxe.x = x + 300;
  bigAxe.y = y + 30;

  timeText.setDepth(15);
  bigAxe.setDepth(15);
  scoreText.setDepth(15);
}