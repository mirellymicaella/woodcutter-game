import Enemy from "./Enemy"

class Enemies extends Phaser.Physics.Arcade.Group{
    constructor(world, scene, children, spriteArray){
        super(world, scene, children, {})
        this.scene = scene

        this.createEnemies(scene, spriteArray)
    }

createEnemies(scene, spriteArray) {
  var id=0;
  var velocity;
    spriteArray.forEach(sprite => {

      velocity = Phaser.Math.Between(6, 9)*100;
      //create an enemy
      const enemy = new Enemy(scene, sprite.x, sprite.y,id, velocity)
      //add it to the group
      this.add(enemy)
      //destroy the sprite
      sprite.destroy()

      id++
    })
  }
    
}

export default Enemies