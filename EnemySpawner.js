window.WEAPON_TYPES = {
    normalEnemy:{
        spriteKey: 'avatarSprites',
        frame: 425,
        speed: 0.5
    }
}

window.setupProjectiles = function(scene){
    scene.projectilePool = scene.add.group({
        classType: Phaser.GameObjects.Sprite,
        maxSize: 50,
        runChildUpdate: true
    });
}

window.createProjectile = function(scene, enemy, weaponType, waveNum){
    let weapon = weaponType;
    let projectile = scene.projectilePool.get();

    if(!projectile){
        return;
    }
    let baseSpeed = weapon.speed + (waveNum * 0.2);
    let maxSpeed = 2;
    let projectileSpeed = Math.min(baseSpeed, maxSpeed);

    projectile.setTexture(weapon.spriteKey, weapon.frame);
    projectile.setPosition(enemy.x, enemy.y);
    projectile.setScale(1.5);
    projectile.setActive(true);
    projectile.setVisible(true);

    projectile.update = function(){
        this.y += projectileSpeed;
        this.angle += 7;

        if(this.y > scene.scale.height + 20){
            this.setActive(false);
            this.setVisible(false);
        }
    }
    return projectile;
}

window.backAndForth = function(scene, spriteKey, frameIndex, startX, count, pathWidth = 400){
    let enemies = [];
    let maxEnemiesPerRow = 7;
    let spacing = (pathWidth + 130) / (maxEnemiesPerRow - 1);
    let enemyY = 100;
    let countX = 0;
    //this will create enemies depending on count
    for (let i = 0; i < count; i++){
        if(i == 7) {
            enemyY = 150;
            countX = 0; 
        }
        let enemyX = startX + (spacing * countX);
        let enemy = scene.add.sprite(enemyX, enemyY, spriteKey, frameIndex).setScale(2);

        scene.tweens.add({
            targets: enemy,
            x: `+=${pathWidth}`,
            duration: 3000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        enemies.push(enemy);
        countX++;
    }
    return enemies;
}
