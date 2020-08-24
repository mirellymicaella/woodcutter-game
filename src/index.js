import Phaser from "phaser";
import mapPNG from "./assets/assetsmap.png";
import mapJSON from "./map.json";
import water from "./assets/water.png";
import playerPNG from "./assets/player5.png";
import enemyPNG from "./assets/slime.png";
import enemyIconPNG from "./assets/slimeicon.png";
import Enemies from "./Enemies";
import axePNG from "./assets/axe1.png";
import bigAxePNG from "./assets/bigAxe.png";
import minimapPNG from "./assets/minimap.png";
import playerpointPNG from "./assets/playerpoint.png";
import axepointPNG from "./assets/axepoint.png";
import enemypointPNG from "./assets/enemypoint.png";

const worldSize = 700;

const config = {
  type: Phaser.AUTO,
  parent: "phaser-example",
  width: worldSize,
  height: worldSize,
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
var enemies=[]; 
const velocity = 250;
var extraVelocity =0;
var camera;
var minimap;
var playerpoint;
var axepoint;
var enemiesposition=[];
var enemiespoint=[];
var axe;

var initialTime = 12;
var time = -1;
var timeText;
var timedEvent;

var playerAndAxe = false;
var bigAxe;

var enemyIcon;

const totalEnemies=20;
var aliveEnemies = totalEnemies;
var scoreText;

function preload() {
  this.load.image("background", water);
  this.load.image("tiles", mapPNG);
  this.load.tilemapTiledJSON("map", mapJSON);
  this.load.spritesheet("player", playerPNG, {frameWidth:32, frameHeight:60});
  this.load.image("slime", enemyPNG);
  this.load.image("slimeicon", enemyIconPNG);
  this.load.image("axe", axePNG);
  this.load.image("bigAxe", bigAxePNG);
  this.load.image("minimap",minimapPNG);
  this.load.image("playerpoint",playerpointPNG);
  this.load.image("axepoint",axepointPNG);
  this.load.image("enemypoint",enemypointPNG);
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
  scoreText = this.add.text(16, 16, totalEnemies+"/"+totalEnemies, { fontSize: '60px', fill: '#0ff' });
  //TIMER
  timeText = this.add.text(350, 16, '0', { fontSize: '60px', fill: '#0ff' });
  timedEvent = this.time.addEvent({ delay: 1000, callback: ()=>{updateCounter(this)}, callbackScope: this, loop: true });
  bigAxe = this.physics.add.sprite(300,16,"bigAxe");
  enemyIcon = this.physics.add.sprite(280,16,"slimeicon");
  minimap = this.physics.add.sprite(900, 40,"minimap");
  playerpoint = this.physics.add.sprite(0, 0,"playerpoint");
  axepoint = this.physics.add.sprite(0, 0,"axepoint");

  enemies =this.enemiesGroup.children.entries;
  var i;
  for (i=0 ; i<enemies.length;i++)
    enemiespoint[i]=this.physics.add.sprite(0, 0,"enemypoint");


  createAxe(this);

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
  camera = this.cameras.main
  camera.startFollow(player)
  camera.setBounds(0 , 0 , map.widthInPixels, map.heightInPixels)
}

function update(){
  const prevVelocity = player.body.velocity.clone()
  player.body.setVelocity(0);
  cursors = this.input.keyboard.createCursorKeys()

  //TIMER
  if(playerAndAxe==true){
   timeText.setText(time);
  }

  followPlayer(this);
  //timeTextAxes.setText(timeAxes);

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
  axepoint.disableBody(true,true);
  time = initialTime;
}

function updateCounter(t) {

  if(playerAndAxe==false)
    return;

  if(time == 0){
    playerAndAxe = false;
  }else if(time == 2){
    createAxe(t);
    axepoint.enableBody(false, 400,400,true,true);
    time--;
  }else 
    time--;

}

function hitEnemy(player, enemy){
  if(playerAndAxe == true){
    enemy.disableBody(true, true);
    enemiespoint[enemy.id].disableBody(true, true);
    aliveEnemies -= 1;
    scoreText.setText(aliveEnemies + '/' + totalEnemies);
  }else{
    this.scene.restart();
    time= -1;
    playerAndAxe=false;
  }

  if(aliveEnemies==0){
    this.scene.restart();
    aliveEnemies = totalEnemies;
    time= 0;
  }

}

function createAxe(t){
  var x = Phaser.Math.Between(50, 1500);
  var y = Phaser.Math.Between(50, 1450);

  axe = t.physics.add.sprite(x,y,"axe");
  t.physics.add.overlap(player, axe, getAxe, null, t);
  console.log(axe.x);

}

function followPlayer(t){

  var x =player.x -worldSize/2;
  var y =player.y -worldSize/2 + 20;

  if(x<0)
    x = 20;

  if(x>900)
    x =900;

  if(y<0)
    y = 20;

  scoreText.x=x;
  scoreText.y=y;

  enemyIcon.x=x + 220;
  enemyIcon.y=y + 10;

  timeText.x = x + 320;
  timeText.y = y ;

  bigAxe.x = x + 440;
  bigAxe.y = y + 25;

  minimap.x = x + 600;
  minimap.y = y + 30;

  var z = 20;

  playerpoint.x = (minimap.x - 40) + (player.x/z);
  playerpoint.y = (minimap.y -40 ) + (player.y/z);

  axepoint.x = (minimap.x - 40) +(axe.x/z);
  axepoint.y = (minimap.y - 40) +(axe.y/z);

  var i;
  for (i=0 ; i<enemies.length;i++){  
    enemiespoint[i].x =(minimap.x - 40) + (enemies[i].x/z);
    enemiespoint[i].y =(minimap.y - 40) + (enemies[i].y/z);
    enemiespoint[i].setDepth(15);
  }

  timeText.setDepth(15);
  bigAxe.setDepth(15);
  scoreText.setDepth(15);
  playerpoint.setDepth(15);
  axepoint.setDepth(15);
  enemyIcon.setDepth(15);
  minimap.setDepth(15);

}