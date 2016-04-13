const GAME_WIDTH = 64;
const GAME_HEIGHT = 64;

const GAME_TO_CANVAS_SCALE = 10;

const MIN_CANVAS_WIDTH = GAME_WIDTH;
const MIN_CANVAS_HEIGHT = GAME_HEIGHT;

const MAX_CANVAS_WIDTH = GAME_WIDTH * GAME_TO_CANVAS_SCALE;
const MAX_CANVAS_HEIGHT = GAME_HEIGHT * GAME_TO_CANVAS_SCALE;

class SimpleGame {

    private rootGroup: Phaser.Group;
    private tileFactory: Tiles.TileFactory;

    constructor(gameContainer)
    {
        let state = this;
        let transparent = false;
        let antialias = false;

        this.game = new Phaser.Game(MAX_CANVAS_WIDTH, MAX_CANVAS_HEIGHT, Phaser.AUTO, gameContainer, state, transparent, antialias);
    }

    game: Phaser.Game;

    preload()
    {
        this.game.load.image('logo', 'assets/phaser_pixel_small_flat.png');
        this.game.load.image('tile', 'assets/white-1x1.png');

        this.tileFactory = new Tiles.TileFactory(this.game, 'tile');
        this.tileFactory.size = 8;
        this.tileFactory.borderSize = 1;
    }

    create()
    {
        // Create a root group that will contain all game entities  
        this.rootGroup = this.game.add.group();

        this.initScalingLogic();

        let red = Phaser.Color.hexToColor("#ff0000");
        let green = Phaser.Color.hexToColor("#00ff00");

        //let tile = this.tileFactory.createTileWithBorder(0, 0);
        let tile = this.tileFactory.createTile(0, 0);
        //tile.borderTint = green;
        tile.tileTint = red.color;
        this.rootGroup.addChild(tile);

        let tile2 = this.tileFactory.createTileWithBorder(8, 0);
        tile2.borderTint = green.color;
        tile2.tileTint = red.color;
        this.rootGroup.addChild(tile2);        

        let logo = this.game.add.sprite(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'logo', 0, this.rootGroup);
        logo.anchor.setTo(0.5, 0.5);
    }

    private initScalingLogic()
    {
        // Set min and max allowed game window size
        this.game.scale.setMinMax(MIN_CANVAS_WIDTH, MIN_CANVAS_HEIGHT, MAX_CANVAS_WIDTH, MAX_CANVAS_HEIGHT);

        // Set the scaling mode to show the whole game window when resizing
        this.game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;

        // Hook resize to update root group layout
        this.game.scale.setResizeCallback(this.updateRootGroupScale, this);

        // Update root group scale
        this.updateRootGroupScale();
    }

    private updateRootGroupScale()
    {
        // Calculate the new zoom. Floor calculations to avoid subpixel positioning.
        let zoom = Math.max(1, Math.floor(this.game.height / GAME_HEIGHT));

        // Floor group position to avoid subpixel placement.
        this.rootGroup.position.x = Math.floor(this.game.width / 2 - zoom * GAME_WIDTH / 2);
        this.rootGroup.scale.set(zoom, zoom);

        console.log("Zoom:", zoom);
    }
}

window.onload = () =>
{
    let game = new SimpleGame('game-container');
};