//Logan Marshall
window.activeNormalEnemies = 0;
class Level1 extends Phaser.Scene {
    constructor() {
        super("Level1Scene");
        this.my = {sprite: {}};  // Create an object to hold sprite bindings
        
        this.bulletActive = false;
    }

    // Use preload to load art and sound assets before the scene starts running.
    preload() {
        this.load.setPath("./assets/");
        this.load.spritesheet('townSprites', 'townSpriteSheet.png',{
            frameWidth: 16,
            frameHeight: 16,
            spacing: 1
        });
        this.load.spritesheet('avatarSprites', 'roguelikeChar_transparent.png', {
            frameWidth: 16,
            frameHeight: 16,
            spacing: 1
        });
        this.load.image('heart', 'heart pixel art 16x16.png');
        this.load.audio('hitEnemy','impactTin_medium_004.ogg');
        this.load.audio('characterHit','impactMining_003.ogg');
        this.load.audio('beginningMusic','BossIntro.mp3');
        this.load.audio('mainMusic','BossMain.mp3');
        this.load.audio('gameOverMusic','happy.mp3');
    }

    create() {
        this.sound.volume = 0.3;
        this.tempMusic = this.sound.add('beginningMusic', {volume: 0.1});
        window.backGroundMusic = this.sound.add('mainMusic',{
            volume: 0.1,
            loop: true
        });
        this.tempMusic.once('complete', () =>{
            window.backGroundMusic.play();
        })
        this.tempMusic.play();
        let axe = window.WEAPON_TYPES.normalEnemy;
        let my = this.my;   // create an alias to this.my for readability
        let objectFrames = [5, 17, 28, 29];
        let tileSize = 16;
        let treeCount = 80;
        let margin = 250; 
        this.lives = 3;
        this.playerInvincible = false;
        this.waveNum = 1;

        this.currScore = 0;
        this.highScore = 0;
        let scoreText;
        let highScoreText;
 
        //creating arrays for enemies and heart sprites
        this.my.sprite.enemy = [];
        this.my.lifeIcons = [];

        const cols = Math.ceil(this.scale.height / tileSize);
        const rows = Math.ceil(this.scale.width / tileSize);

        //places grass and flowers all over the screen
        for(let x = 0; x < rows; x++){
            for(let y = 0; y < cols; y++){
                const frame = Phaser.Math.Between(0, 5) === 0 ? 2 : 0 //should simulate 20% chance of flowers
                this.add.sprite(x * tileSize, y*tileSize, 'townSprites', frame).setOrigin(0);
            }
        }
        for(let i = 0; i < treeCount; i++){
            let tempX, tempY;
            let randomFrame = Phaser.Utils.Array.GetRandom(objectFrames);
            if(Phaser.Math.Between(0,1) === 0){
                tempX = Phaser.Math.Between(0, margin);
            }else{
                tempX = Phaser.Math.Between(this.scale.width - margin, this.scale.width);
            }
            tempY = Phaser.Math.Between(0, this.scale.height);
            this.add.sprite(tempX, tempY, 'townSprites', randomFrame);
        }
        for(let i = 0; i < this.lives; i++){
            let heartIcon = this.add.sprite(40 +(i*35), 540, 'heart').setScale(2);
            this.my.lifeIcons.push(heartIcon);
        }
        my.sprite.character = this.add.sprite(this.scale.width/2, 500, 'avatarSprites', 433)
        .setOrigin(0.5, 0.5)
        .setScale(2);

        my.sprite.weapon = this.add.sprite(400, 400, 'avatarSprites', 423).setScale(2.5);
        my.sprite.weapon.visible = false;
        this.playerSpeed = 2;
        this.bulletSpeed = 6;
        this.left = this.input.keyboard.addKey("A");
        this.right = this.input.keyboard.addKey("D");
        this.attack = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        this.my.sprite.enemy = window.backAndForth(this, 'avatarSprites', 540, 90, 8, 300);
        //group for the projectiles
        setupProjectiles(this);
        //creating a timer so enemies attack every 2 seconds
        this.time.addEvent({
            delay: 2000,
            callback: ()=>{
                for(let enemy of this.my.sprite.enemy){
                    if(enemy.active){
                        let proj = window.createProjectile(this, enemy, axe, this.waveNum);
                        this.projectilePool.add(proj);
                    }
                }
            },
            callbackScope: this,
            loop: true
        })

        this.scoreText = this.add.text(20, 20, 'Score: 0', {
            fontSize: '24px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        });

        this.highScoreText = this.add.text(620, 20, 'High Score: 0', {
            fontSize: '24px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        });

        this.startWave(this.waveNum);
    }
    startWave(waveNum){
        let count = 7;
        if(waveNum >= 2) count = 14;
        let speed = 1 + waveNum * 0.2;
        activeNormalEnemies = count;
        this.my.sprite.enemy.forEach(e => e.destroy());
        this.my.sprite.enemy = [];

        this.my.sprite.enemy = window.backAndForth(this , 'avatarSprites', 540, 90, count, 300);
        this.enemiesRemaining = count;
    }
    update() {
        let my = this.my; 
        if(this.left.isDown){
            if(my.sprite.character.x > (my.sprite.character.displayWidth/2)){
                my.sprite.character.x -= this.playerSpeed;
            }
        }
        if(this.right.isDown){
            if(my.sprite.character.x < this.scale.width - my.sprite.character.displayWidth / 2){
                my.sprite.character.x += this.playerSpeed;
            }
        }

        //check for attack button
        if(this.attack.isDown){
            if(!this.bulletActive){
                this.bulletActive = true;
                my.sprite.weapon.x = my.sprite.character.x + 14;
                my.sprite.weapon.y = my.sprite.character.y - my.sprite.character.height/2;
                my.sprite.weapon.visible = true;
            }
        }
        if(this.bulletActive){
            my.sprite.weapon.y -= this.bulletSpeed;
            for(let enemy of this.my.sprite.enemy){
                if(enemy.visible && this.collides(my.sprite.weapon, enemy)){
                    enemy.visible = false;
                    enemy.active = false;
                    activeNormalEnemies -= 1;
                    this.sound.play("hitEnemy");
                    this.currScore += 10;
                    this.registry.set('currScore', this.currScore);
                    this.scoreText.setText('Score: ' + this.currScore);
                    if(this.currScore > this.highScore){
                        this.highScore = this.currScore;
                        this.highScoreText.setText('High Score: ' + this.highScore);
                        localStorage.setItem('highScore', this.highScore);
                    }
                    enemy.x = -100;
                    this.bulletActive = false;
                    my.sprite.weapon.visible = false;
                }
            }
            if(my.sprite.weapon.y < -(my.sprite.weapon.height/2)){
                this.bulletActive = false;
                my.sprite.weapon.visible = false;
            }
        }

        //handle the projectiles from the enemies
        this.projectilePool.children.iterate((projectile) => {
            if(!projectile.active){
                return;
            }
            if(this.playerInvincible) return;
            if(projectile.active && projectile.update) {
                projectile.update();
            }
            if(this.collides(projectile, this.my.sprite.character)){
                projectile.setActive(false);
                projectile.setVisible(false);
                
                //when add lives to player;
                this.handlePlayerHit();
            }
        })
        if(activeNormalEnemies == 0){
            this.startWave(this.waveNum += 1);
        }
    }
    collides(a, b){
            if (Math.abs(a.x - b.x) > (a.displayWidth/2 + b.displayWidth/2)) return false;
            if (Math.abs(a.y - b.y) > (a.displayHeight/2 + b.displayHeight/2)) return false;
            return true;
    }
    handlePlayerHit(){
        if(this.playerInvincible){ 
            console.log("invincible check");
            return;
        }
        console.log("player hit");
        this.playerInvincible = true;
        this.lives -= 1;
        this.sound.play("characterHit");
        this.updateLivesUI();

        if(this.lives <= 0){
            this.scene.start('gameOver');
        }else{
            this.my.sprite.character.setPosition(this.scale.width/2, 500);
            this.tweens.add({
                targets: this.my.sprite.character,
                alpha: 0,
                duration: 100,
                ease: 'Linear',
                repeat: 5,
                yoyo: true,
                onComplete: () => {
                    this.my.sprite.character.alpha = 1;
                    this.playerInvincible = false;
                }
            });
        }
    }

    updateLivesUI(){
        if(this.my.lifeIcons){
            this.my.lifeIcons.forEach(heartIcon => {
                heartIcon.destroy();
                });
        }
        this.my.lifeIcons = [];
        for(let i = 0; i < this.lives; i++){
            console.log("Heart check");
            let heartIcon = this.add.sprite(40 +(i*35), 540, 'heart').setScale(2);
            this.my.lifeIcons.push(heartIcon);
        }
    }
}

class GameOverScene extends Phaser.Scene {
    constructor(){
        super("gameOver");
    }
    create(){
        if(window.backGroundMusic && window.backGroundMusic.isPlaying){
            window.backGroundMusic.stop();
        }
        this.gameOverMusic = this.sound.add('gameOverMusic',{
            loop: true,
            volume: 0.3
        });
        this.gameOverMusic.play();
        let tileSize = 16;
        const cols = Math.ceil(this.scale.height / tileSize);
        const rows = Math.ceil(this.scale.width / tileSize);

        for(let x = 0; x < rows; x++){
            for(let y = 0; y < cols; y++){
                const frame = Phaser.Math.Between(0, 5) === 0 ? 2 : 0 //should simulate 20% chance of flowers
                this.add.sprite(x * tileSize, y*tileSize, 'townSprites', frame).setOrigin(0);
            }
        }
        this.add.text(160, 100, "Thank you for playing my game!!",{
            fontSize: '32px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        });
        this.add.text(280, 200, `Current Score: ${this.registry.get('currScore')}`,{
            fontSize: '24px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        });
        let savedHighScore = localStorage.getItem('highScore') || '0';
        this.add.text(300, 300, `High Score: ${savedHighScore}`,{
            fontSize: '24px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        });
        let playAgainButton = this.add.text(300, 400, "Play Again",{
            fontSize: '32px',
            fill: '#00ff00',
            fontFamily: 'Arial'
        }).setInteractive().on('pointerdown', () => this.playAgain());
        playAgainButton.on('pointerover', () => playAgainButton.setStyle({fill: '#ffcc00'}));
        playAgainButton.on('pointerout', () => playAgainButton.setStyle({ fill: '#00ff00' }));
    }
    update(){

    }

    playAgain(){
        this.registry.set('currScore', 0);
        this.gameOverMusic.stop();
        this.scene.start('Level1Scene');
    }
}
