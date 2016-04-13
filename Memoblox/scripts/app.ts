const FACTOR:number = 1;

class SimpleGame {

    constructor(gameContainer) {
        let width = 64 * FACTOR;
        let height = 64 * FACTOR;
        let state = { preload: this.preload, create: this.create };
        let transparent = false;
        let antialias = false;
        this.game = new Phaser.Game(width, height, Phaser.AUTO, gameContainer, state, transparent, antialias);
    }

    game: Phaser.Game;

    preload() {
        this.game.load.image('logo', 'assets/phaser_pixel_small_flat.png');
    }

    create() {
        var logo = this.game.add.sprite(this.game.world.centerX, this.game.world.centerY, 'logo');
        logo.anchor.setTo(0.5, 0.5);
    }

}

window.onload = () => {
    var game = new SimpleGame('game-container');
};