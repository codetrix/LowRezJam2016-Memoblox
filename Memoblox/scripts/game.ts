const GAME_WIDTH = 64;
const GAME_HEIGHT = 64;

const GAME_TO_CANVAS_SCALE = 10;

const MIN_CANVAS_WIDTH = GAME_WIDTH;
const MIN_CANVAS_HEIGHT = GAME_HEIGHT;

const MAX_CANVAS_WIDTH = GAME_WIDTH * GAME_TO_CANVAS_SCALE;
const MAX_CANVAS_HEIGHT = GAME_HEIGHT * GAME_TO_CANVAS_SCALE;

const BOARD_SHIFT = 2;
const GAME_INNER_WIDTH = GAME_HEIGHT - 2 * BOARD_SHIFT;
const GAME_INNER_HEIGHT = GAME_HEIGHT - 2 * BOARD_SHIFT;

//const TILE_SIZE = 15;
//const TILE_SIZE = 20;
//const BORDER_SIZE = 1;
//const BOARD_ROWS = Math.floor(GAME_INNER_WIDTH / TILE_SIZE);
//const BOARD_COLS = Math.floor(GAME_INNER_HEIGHT / TILE_SIZE);

const COLOR_POOL_5x2 = ['5A8EB6', '225073', 'F06F8B', 'A42943', 'FFE176', 'B2952D', 'AF57B8', '6C1E74', 'A9EA6B', '63A127'];

const COLOR_POOL = [
    ['041929', '0D314C', '225073', '386A90', '5A8EB6'],
    ['3A020E', '6B0C20', 'A42943', 'CE4865', 'F06F8B'],
    ['3F3203', '735D0C', 'B2952D', 'DFBF4E', 'FFE176'],
    ['260229', '45094B', '6C1E74', '893592', 'AF57B8'],
    ['1D3902', '396A0B', '63A127', '86C946', 'A9EA6B']
];

enum ColorMode {
    PLENTY,
    LIMITED,
    DOUBLE
}

const LEVELS = [
    { level: 1, pathLength: 3, gridSize: 3, colorMode: ColorMode.PLENTY },
    { level: 2, pathLength: 3, gridSize: 4, colorMode: ColorMode.PLENTY },
    { level: 3, pathLength: 4, gridSize: 4, colorMode: ColorMode.PLENTY },
    { level: 4, pathLength: 4, gridSize: 5, colorMode: ColorMode.PLENTY },

    { level: 5, pathLength: 3, gridSize: 3, colorMode: ColorMode.LIMITED },
    { level: 6, pathLength: 4, gridSize: 4, colorMode: ColorMode.LIMITED },
    { level: 7, pathLength: 5, gridSize: 5, colorMode: ColorMode.LIMITED }

    //{ level: 8, pathLength: 3, gridSize: 3, colorMode: ColorMode.DOUBLE },
    //{ level: 9, pathLength: 4, gridSize: 4, colorMode: ColorMode.DOUBLE },
    //{ level:10, pathLength: 5, gridSize: 4, colorMode: ColorMode.DOUBLE }
];

enum GameState
{
    Intro,
    Menu,
    NextLevel,
    InitLevel,
    ChoosePath,
    ShowPath,
    ShowPathLoop,
    ShowBoard
}

class SimpleGame {

    private rootGroup: Phaser.Group;
    private boardGroup: Phaser.Group;
    private tileFactory: Tiles.TileFactory;

    private board: Board;

    constructor(gameContainer)
    {
        let state = this;
        let transparent = false;
        let antialias = false;

        this.game = new Phaser.Game(MAX_CANVAS_WIDTH, MAX_CANVAS_HEIGHT, Phaser.AUTO, gameContainer, state, transparent, antialias);
    }

    game: Phaser.Game;

    overlay: Tiles.TileWithBorder;

    gameState: GameState = GameState.Intro;

    level: number;

    path: Path;

    pathTileIndex: number;

    pathLastUpdate: number;

    preload()
    {
        this.game.load.image('logo', 'assets/phaser_pixel_small_flat.png');
        this.game.load.image('tile', 'assets/white-1x1.png');

        this.tileFactory = new Tiles.TileFactory(this.game, 'tile');
    }

    create()
    {
        // Create a root group that will contain all game entities  
        this.rootGroup = this.game.add.group();

        this.initScalingLogic();

        /*
        this.rootGroup.removeAll(true, true);

        this.board = this.createBoard();

        this.overlay = this.tileFactory.createTileWithBorder(BOARD_SHIFT, BOARD_SHIFT, 60/5 << 0, 15/5 << 0);
        this.overlay.visible = false;
        this.rootGroup.addChild(this.overlay);

        //let colors = this.getColors2x5();
        let colors = this.getColors5x2();
        this.shuffle(colors);
        let startTile = this.colorBoard(this.board, colors);

        let path: Path = this.generatePath(this.board, startTile, 3);

        //this.displayPath(path);

        let red = Phaser.Color.hexToColor("#ff0000");
        let green = Phaser.Color.hexToColor("#00ff00");

        //this.overlay.borderTint = startTile.tile.tileTint;
        //this.overlay.tileTint = startTile.tile.tileTint;
        //this.overlay.visible = true;
        */

        //let logo = this.game.add.sprite(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'logo', 0, this.rootGroup);
        //logo.anchor.setTo(0.5, 0.5);
    }

    update(game)
    {
        switch (this.gameState)
        {
            case GameState.Intro:
                this.introUpdate(game);
                break;
            case GameState.Menu:
                this.menuUpdate(game);
                break;
            default:
                this.gameUpdate(game);
                break;
        }
    }

    private introUpdate(game: Phaser.Game) {
        this.gameState = GameState.Menu;
    }

    private menuUpdate(game: Phaser.Game) {
        this.gameState = GameState.NextLevel;
    }

    private gameUpdate(game: Phaser.Game)
    {

        let levelData = LEVELS[this.level];

        switch (this.gameState)
        {
            case GameState.NextLevel:
                if (this.overlay) this.overlay.visible = false;
                if (this.boardGroup) this.boardGroup.visible = false;

                if (this.level === undefined)
                {
                    this.level = 0;
                }
                else
                {
                    this.level = (this.level + 1) % LEVELS.length;
                }

                this.gameState = GameState.InitLevel;
                break;

            case GameState.InitLevel:
                this.rootGroup.removeAll(true, true);

                this.boardGroup = this.game.add.group(this.rootGroup);
                this.boardGroup.visible = false;

                this.board = this.createBoard(levelData.gridSize);

                this.overlay = this.tileFactory.createTileWithBorder(BOARD_SHIFT, BOARD_SHIFT, 60, 15);
                this.overlay.visible = false;
                this.rootGroup.addChild(this.overlay);

                this.gameState = GameState.ChoosePath;
                break;

            case GameState.ChoosePath:

                let colors;
                switch (levelData.colorMode)
                {
                    case ColorMode.DOUBLE:
                        // TODO
                        break;

                    case ColorMode.LIMITED:
                        colors = this.getColors2x5();
                        break;

                    case ColorMode.PLENTY:
                    default:
                        colors = this.getColors5x2();
                        break;
                    
                }

                this.shuffle(colors);
                let startTile = this.colorBoard(this.board, colors);

                this.path = this.generatePath(this.board, startTile, levelData.pathLength);

                this.gameState = GameState.ShowPath;
                break;

            case GameState.ShowPath:
                this.overlay.visible = true;
                this.boardGroup.visible = false;

                this.pathTileIndex = 0;
                this.pathLastUpdate = 0;

                // drop-through
                this.gameState = GameState.ShowPathLoop;

            case GameState.ShowPathLoop:
                let now = this.game.time.now;
                if (this.pathLastUpdate == 0 || (now - this.pathLastUpdate) > 1000)
                {
                    if (this.pathTileIndex >= this.path.length)
                    {
                        this.gameState = GameState.ShowBoard;
                    }
                    else
                    {
                        let tile = this.path[this.pathTileIndex++];

                        this.overlay.borderTint = tile.tile.tileTint;
                        this.overlay.tileTint = tile.tile.tileTint;
                        this.overlay.visible = true;

                        this.pathLastUpdate = now;
                    }
                }
                break;

            case GameState.ShowBoard:
                this.overlay.visible = false;
                this.boardGroup.visible = true;

                if (this.game.input.enabled && this.game.input.mousePointer.isDown)
                {
                    this.gameState = GameState.NextLevel;
                }
                break;
        }
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

        let len = COLOR_POOL_5x2.length;

        for (let i = 0; i < len; i++)
        {
            colors.push(COLOR_POOL_5x2[i]);
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

    private roundToOdd(value: number): number
    {
        return value << 0;
    }

    private createBoard(gridSize: number): Board
    {
        let board: Board = new Array2D<BoardTile>(gridSize, gridSize);
        let tile: Tiles.Tile;

        let tileSize = Math.floor(GAME_INNER_WIDTH / gridSize);
        this.tileFactory.size = tileSize;
        this.tileFactory.borderSize = this.roundToOdd(tileSize / 2);

        for (let row = 0; row < board.rows; row++)
        {
            for (let col = 0; col < board.cols; col++)
            {
                tile = this.tileFactory.createTile(BOARD_SHIFT + row * tileSize, BOARD_SHIFT + col * tileSize);
                this.boardGroup.addChild(tile);

                board[row][col] = new BoardTile(row, col);
                board[row][col].tile = tile;
            }
        }

        return board;
    }

    private colorBoard(board: Board, colorPool: Array<string>): BoardTile
    {
        let colors = this.convertHexesToColors(colorPool);
        let color: number;

        let startColor = colors.pop();
        let startRow;
        let startCol;

        if (this.randomInt(3) > 0) {
            startRow = this.randomInt(board.rows);
            startCol = this.randomInt(board.cols);
        }
        else {
            let halfPoint = (board.rows - 1) * 0.5 << 0;
            let halfWidth = board.rows * 0.5 << 0;
            startRow = halfPoint + this.randomInt(halfWidth);
            startCol = halfPoint + this.randomInt(halfWidth);
        }

        for (let row = 0; row < board.rows; row++)
        {
            for (let col = 0; col < board.cols; col++)
            {
                color = this.pickValidColor(row, col, board, colors);

                board[row][col].color = color;
            }
        }

        board[startRow][startCol].tile.tileTint = startColor;

        return board[startRow][startCol];
    }

    private pickValidColor(row: number, col: number, board: Board, colors: Array<number>): number
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
                if (col < board.cols - 1 && board[row - 1][col + 1].color == c) continue;
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

    private generatePath(board: Board, startTile: BoardTile, length: number): Path
    {
        let path: Path;
        let restart = false;

        do
        {
            restart = false;

            path = new Path();
            path.push(startTile);

            let tile: BoardTile = startTile;
            let row, col;

            while (path.length < length)
            {
                let dir = this.randomInt(4);
                let counter = 0;

                do {
                    dir = (dir + 1) % 4;
                    counter++;

                    if (counter > 5) {
                        restart = true;
                        break;
                    }

                    switch (dir) {
                        case 0:
                            row = tile.row - 1;
                            col = tile.col;
                            break;
                        case 1:
                            row = tile.row;
                            col = tile.col + 1;
                            break;
                        case 2:
                            row = tile.row + 1;
                            col = tile.col;
                            break;
                        case 3:
                            row = tile.row;
                            col = tile.col - 1;
                            break;
                    }
                } while (row < 0 || row >= board.rows || col < 0 || col >= board.cols || path.contains(board[row][col]));

                if (restart) break;

                tile = board[row][col];
                path.push(tile);
            }

        } while (restart);

        return path;
    }

    private displayPath(path: Path)
    {
        path.forEach((val, idx) => {
            console.log(idx + ": ", val);
        });
    }
}

class Array2D<T> extends Array<Array<T>>
{
    constructor(rows: number, cols: number) {
        super(rows);

        this._rows = rows;
        this._cols = cols;

        for (let row = 0; row < rows; row++) {
            this[row] = new Array<T>(cols);
        }
    }

    private _rows: number;
    public get rows(): number
    {
        return this._rows;
    }

    private _cols: number;
    public get cols(): number
    {
        return this._cols;
    }
}

type Board = Array2D<BoardTile>

class Path extends Array<BoardTile>
{
    constructor()
    {
        super(6);
    }

    get first(): BoardTile
    {
        return this[0];
    }

    contains(tile: BoardTile)
    {
        for (let i = 0; i < this.length; i++)
        {
            if (tile.equals(this[i]))
            {
                return true;
            }
        }

        return false;
    }
}

class BoardTile
{
    constructor(row, col)
    {
        this.row = row;
        this.col = col;
    }

    row: number;
    col: number;
    tile: Tiles.Tile;

    get color()
    {
        return this.tile.tileTint;
    }
    set color(color: number)
    {
        this.tile.tileTint = color;
    }

    equals(other: BoardTile)
    {
        return this.row == other.row && this.col == other.col;
    }
}

window.onload = () =>
{
    let game = new SimpleGame('game-container');
};