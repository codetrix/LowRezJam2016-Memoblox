const GAME_WIDTH = 64;
const GAME_HEIGHT = 64;

const GAME_TO_CANVAS_SCALE = 10;

const MIN_CANVAS_WIDTH = GAME_WIDTH;
const MIN_CANVAS_HEIGHT = GAME_HEIGHT;

const MAX_CANVAS_WIDTH = GAME_WIDTH * GAME_TO_CANVAS_SCALE;
const MAX_CANVAS_HEIGHT = GAME_HEIGHT * GAME_TO_CANVAS_SCALE;

//const TILE_SIZE = 16;
const TILE_SIZE = 22;
const BORDER_SIZE = 1;
//const BOARD_SHIFT = GAME_WIDTH % TILE_SIZE;
const BOARD_WIDTH = Math.ceil(GAME_WIDTH / TILE_SIZE);
const BOARD_HEIGHT = Math.ceil(GAME_HEIGHT / TILE_SIZE);

const COLOR_POOL = [
    ['041929', '0D314C', '225073', '386A90', '5A8EB6'],
    ['3A020E', '6B0C20', 'A42943', 'CE4865', 'F06F8B'],
    ['3F3203', '735D0C', 'B2952D', 'DFBF4E', 'FFE176'],
    ['260229', '45094B', '6C1E74', '893592', 'AF57B8'],
    ['1D3902', '396A0B', '63A127', '86C946', 'A9EA6B']
];

class SimpleGame {

    private rootGroup: Phaser.Group;
    private tileFactory: Tiles.TileFactory;

    private board: Array<Array<BoardTile>>;

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
        this.tileFactory.size = TILE_SIZE;
        this.tileFactory.borderSize = BORDER_SIZE;
    }

    create()
    {
        // Create a root group that will contain all game entities  
        this.rootGroup = this.game.add.group();

        this.initScalingLogic();

        this.board = this.createBoard();

        let colors = this.getColors5x2();
        this.shuffle(colors);
        this.colorBoard(this.board, colors);

        let red = Phaser.Color.hexToColor("#ff0000");
        let green = Phaser.Color.hexToColor("#00ff00");

        /*
        let tile = this.tileFactory.createTile(0, 0);
        tile.tileTint = red.color;
        this.rootGroup.addChild(tile);

        let tile2 = this.tileFactory.createTileWithBorder(8, 0);
        tile2.borderTint = green.color;
        tile2.tileTint = red.color;
        this.rootGroup.addChild(tile2);        
        */

        //let logo = this.game.add.sprite(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'logo', 0, this.rootGroup);
        //logo.anchor.setTo(0.5, 0.5);
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

    private randomInt(min: number, max: number = 0): number
    {
        if (max == 0)
        {
            max = min;
            min = 0;
        }
        return (min + Math.random() * (max - min)) << 0;
    }

    private getColors5x2(): Array<string>
    {
        let colors: Array<string> = [];

        let len = COLOR_POOL.length;
        let idx = 0;

        for (let i = 0; i < len; i++)
        {
            idx = this.randomInt(len);
            colors.push(COLOR_POOL[i][idx]);
            colors.push(COLOR_POOL[i][(idx + 2) % len]);
        }

        //console.log("Colors:", colors);

        return colors;
    }

    private getColors2x5(): Array<string>
    {
        let pool1 = this.randomInt(COLOR_POOL.length);
        let pool2 = 0;
        do {
            pool2 = this.randomInt(COLOR_POOL.length);
        } while (pool2 == pool1);

        //let colors1: Array<string> = [];
        //let colors2: Array<string> = [];
        let colors: Array<string> = [];

        let len = COLOR_POOL[pool1].length;
        for (let i = 0; i < len; i++)
        {
            //colors1.push(COLOR_POOL[pool1][i]);
            colors.push(COLOR_POOL[pool1][i]);
        }

        len = COLOR_POOL[pool2].length;
        for (let i = 0; i < len; i++)
        {
            //colors2.push(COLOR_POOL[pool2][i]);
            colors.push(COLOR_POOL[pool2][i]);
        }

        //console.log("Colors:", colors);

        return colors;
    }

    private convertHexesToColors(source: Array<string>): Array<number> {
        let result = [];

        for (let i = 0; i < source.length; i++) {
            result.push(Phaser.Color.hexToColor(source[i]).color);
        }

        return result;
    }    

    private shuffle(array: Array<any>)
    {        
        let tmp: any;
        let j: number;

        for (let i = array.length - 1; i >= 1; i--)
        {
            j = this.randomInt(i+1);
            tmp = array[j];
            array[j] = array[i];
            array[i] = tmp;
        }
    }

    private createBoard(): Array<Array<BoardTile>>
    {
        let board: Array<Array<BoardTile>> = new Array(BOARD_HEIGHT);
        let tile: Tiles.Tile;

        for (let row = 0; row < BOARD_HEIGHT; row++)
        {
            board[row] = new Array(BOARD_WIDTH);
        }

        for (let row = 0; row < BOARD_HEIGHT; row++)
        {
            for (let col = 0; col < BOARD_WIDTH; col++)
            {
                tile = this.tileFactory.createTile(row * TILE_SIZE, col * TILE_SIZE);
                this.rootGroup.addChild(tile);

                board[row][col] = new BoardTile();
                board[row][col].tile = tile;
            }
        }

        return board;
    }

    private colorBoard(board: Array<Array<BoardTile>>, colorPool: Array<string>)
    {
        let colors = this.convertHexesToColors(colorPool);
        let color: number;

        for (let row = 0; row < BOARD_HEIGHT; row++)
        {
            for (let col = 0; col < BOARD_WIDTH; col++)
            {
                color = this.pickValidColor(row, col, board, colors);

                board[row][col].color = color;
            }
        }

        console.log(board);
    }

    private pickValidColor(row: number, col: number, board: Array<Array<BoardTile>>, colors: Array<number>): number
    {
        this.shuffle(colors);
        for (let c, i = 0; i < colors.length; i++)
        {
            c = colors[i];

            if (row >= 1 && col >= 1 && board[row - 1][col - 1].color == c) continue;

            if(row >= 1) {
                if (board[row - 1][col].color == c) continue;
                if (row >= 2 && board[row - 2][col].color == c) continue;
                if (col >= 1 && board[row - 1][col - 1].color == c) continue;
                if (col < BOARD_WIDTH - 1 && board[row - 1][col + 1].color == c) continue;
            }

            if (col >= 1) {
                if (board[row][col - 1].color == c) continue;
                if (col >= 2 && board[row][col - 2].color == c) continue;
            }

            return c;
        }

        return 0;
        //return colors[this.randomInt(colors.length)];
    }
}

class BoardTile
{
    tile: Tiles.Tile;
    get color()
    {
        return this.tile.tileTint;
    }
    set color(color: number)
    {
        this.tile.tileTint = color;
    }
}

window.onload = () =>
{
    let game = new SimpleGame('game-container');
};