const DEBUG = 1;

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

//const BORDER_COLOR_INACTIVE = Phaser.Color.hexToColor('3E3E3E').color;
const BORDER_COLOR_INACTIVE = Phaser.Color.hexToColor('2B2B2B').color;
const BORDER_COLORS_ACTIVE = [
    Phaser.Color.hexToColor('009292').color,
    Phaser.Color.hexToColor('0D7373').color,
    Phaser.Color.hexToColor('155F5F').color,
    Phaser.Color.hexToColor('1E4A4A').color,
    Phaser.Color.hexToColor('273636').color
];
 

const DOUBLE_COLOR_POOL = ['B31B27', 'F58500', 'F4E511', '008BB8', '0D314C', '31AA1F', 'F06F8B', '621E69', 'FFFFFF', '1A1A1A'];

const COLOR_POOL_5x2 = ['b31b27', 'f58500', 'f6c141', '008bb8', '31aa1f', 'bbd709', 'ff362a', 'ffffff', '621e69', '1a1a1a'];

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

const MENU_SOUND_REPEAT_MIN_DELAY = 300;
const MENU_SOUND_REPEAT_MAX_DELAY = 9000;

const MENU_SOUND_VOLUME = 1;
const PATH_SOUND_VOLUME = 0.4;
const INGAME_SOUND_VOLUME = 0.4;
const INGAME_WRONG_SOUND_VOLUME = 0.2;
const ENDSCREEN_STATIC_VOLUME = 0.3;

const LEVELS = [
    { level: 1, pathLength: 3, gridSize: 3, colorMode: ColorMode.PLENTY },
    { level: 2, pathLength: 4, gridSize: 4, colorMode: ColorMode.PLENTY },
    { level: 3, pathLength: 4, gridSize: 5, colorMode: ColorMode.PLENTY },
    { level: 4, pathLength: 5, gridSize: 5, colorMode: ColorMode.PLENTY },

    { level: 5, pathLength: 3, gridSize: 3, colorMode: ColorMode.LIMITED },
    { level: 6, pathLength: 4, gridSize: 4, colorMode: ColorMode.LIMITED },
    { level: 7, pathLength: 5, gridSize: 5, colorMode: ColorMode.LIMITED },

    { level: 8, pathLength: 3, gridSize: 3, colorMode: ColorMode.DOUBLE },
    { level: 9, pathLength: 4, gridSize: 4, colorMode: ColorMode.DOUBLE },
    { level: 10, pathLength: 5, gridSize: 5, colorMode: ColorMode.DOUBLE }
];

enum GameState
{
    Intro,
    ShowMenu,
    UpdateMenu,
    ShowEndScreen,
    UpdateEndScreen,
    NextLevel,
    InitLevel,
    ChoosePath,
    ShowPath,
    ShowPathLoop,
    ShowBoard,
    UpdateBoard
}

class SimpleGame {

    private rootGroup: Phaser.Group;
    private boardGroup: Phaser.Group;
    private menuGroup: Phaser.Group;
    private tileFactory: Tiles.TileFactory;

    private menuSprite: Phaser.Sprite;
    private menuSprite1: Phaser.Sprite;
    private menuSprite2: Phaser.Sprite;

    private endScreenBackgroundSprite: Phaser.Sprite;
    private endScreenSprite: Phaser.Sprite;

    private soundReady: boolean = false;
    private static: Phaser.Sound;
    private wrong: Phaser.Sound;

    private notes: Array<Phaser.Sound>;
    private lastNoteIdx: number = -1;
    private nextNoteTime: number = 0;
    private lastAnimatonPlayTime: number = 0;

    private snakes: Array<Phaser.Animation>;
    private lastSnakeIndex: number = -1;

    private nextLevelTime: number;

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

    pathLastUpdate: number;

    pathUpdateTimeout: number;

    preload()
    {
        this.game.load.audio('wrong', ['assets/audio/wrong.m4a']);
        this.game.load.audio('static', ['assets/audio/static.m4a']);
        this.game.load.audio('note-1', 'assets/audio/background01.m4a');
        this.game.load.audio('note-2', 'assets/audio/background02.m4a');
        this.game.load.audio('note-3', 'assets/audio/background03.m4a');
        this.game.load.audio('note-4', 'assets/audio/background04.m4a');
        this.game.load.audio('note-5', 'assets/audio/background05.m4a');

        this.game.load.image('logo', 'assets/phaser_pixel_small_flat.png');
        this.game.load.image('tile', 'assets/white-1x1.png');

        this.game.load.spritesheet('tile-icons-12', 'assets/tile-icons-12x12.png', 12, 12);
        this.game.load.spritesheet('tile-icons-15', 'assets/tile-icons-15x15.png', 15, 15);
        this.game.load.spritesheet('tile-icons-20', 'assets/tile-icons-20x20.png', 20, 20);

        this.game.load.spritesheet('main-menu', 'assets/main-menu-spritesheet.png', 60, 60);
        this.game.load.spritesheet('end-screen', 'assets/end-spritesheet.png', 60, 60);

        this.tileFactory = new Tiles.TileFactory(this.game, 'tile');
    }

    create()
    {
        this.game.input.maxPointers = 1;

        // Create a root group that will contain all game entities  
        this.rootGroup = this.game.add.group();

        this.initScalingLogic();

        this.boardGroup = this.game.add.group(this.rootGroup);

        this.menuGroup = this.game.add.group(this.rootGroup);

        this.endScreenBackgroundSprite = this.game.add.sprite(BOARD_SHIFT, BOARD_SHIFT, 'end-screen', 0, this.menuGroup);
        this.endScreenBackgroundSprite.animations.add('static', [0, 1], 10, true);

        this.endScreenSprite = this.game.add.sprite(BOARD_SHIFT, BOARD_SHIFT, 'end-screen', 2, this.menuGroup);
        this.endScreenSprite.animations.add('loop', [2, 3, 4, 5, 6, 7, 8, 9], 15, true);

        this.menuSprite = this.game.add.sprite(BOARD_SHIFT, BOARD_SHIFT, 'main-menu', 0, this.menuGroup);
        this.menuSprite.visible = false;

        let fps = 10;
        let a;

        a = 0;
        let a1 = this.menuSprite.animations.add('snake-1', [a + 0, a + 1, a + 2, a + 3, a + 4, a + 5, a + 6, a + 7, a + 8, a + 9, a + 10, a + 11, a], fps, false);

        a = 12;
        let a2 = this.menuSprite.animations.add('snake-2', [a + 0, a + 1, a + 2, a + 3, a + 4, a + 5, a + 6, a + 7, a + 8, a + 9, a + 10, a + 11, a], fps, false);

        a = 24;
        let a3 = this.menuSprite.animations.add('snake-3', [a + 0, a + 1, a + 2, a + 3, a + 4, a + 5, a + 6, a + 7, a + 8, a + 9, a + 10, a + 11, a], fps, false);

        a = 36;
        let a4 = this.menuSprite.animations.add('snake-4', [a + 0, a + 1, a + 2, a + 3, a + 4, a + 5, a + 6, a + 7, a + 8, a + 9, a + 10, a + 11, a], fps, false);

        this.snakes = [a1, a2, a3, a4];

        this.static = this.game.add.audio('static', ENDSCREEN_STATIC_VOLUME, true);

        this.wrong = this.game.add.audio('wrong');

        this.notes = [
            this.game.add.audio('note-4'),
            this.game.add.audio('note-1'),
            this.game.add.audio('note-5'),
            this.game.add.audio('note-2'),
            this.game.add.audio('note-3')
        ];

        let allSounds = this.notes.slice();
        allSounds.push(this.static);
        allSounds.push(this.wrong);

        //  Using setDecodedCallback we can be notified when ALL sounds are ready for use.
        //  The audio files could decode in ANY order, we can never be sure which it'll be.
        this.game.sound.setDecodedCallback(allSounds, this.onSoundDecoded, this);
    }

    private onSoundDecoded()
    {
        this.soundReady = true;
        console.log("All Sounds Decoded");
    }

    update(game)
    {
        switch (this.gameState)
        {
            case GameState.Intro:
                this.introUpdate(game);
                break;
            case GameState.ShowMenu:
            case GameState.UpdateMenu:
                this.menuUpdate(game);
                break;
            case GameState.ShowEndScreen:
            case GameState.UpdateEndScreen:
                this.endScreenUpdate(game);
                break;
            default:
                this.gameUpdate(game);
                break;
        }
    }

    render()
    {
        //this.game.debug.pointer(this.game.input.activePointer, false);
    }

    private introUpdate(game: Phaser.Game)
    {
        this.resetInput();
        this.gameState = GameState.ShowMenu;
    }

    private menuUpdate(game: Phaser.Game)
    {
        let now = this.game.time.now;

        if (this.gameState == GameState.ShowMenu)
        {
            this.level = -1;

            this.game.sound.stopAll();
            this.lastNoteIdx = -1;
            this.nextNoteTime = 0;

            this.boardGroup.visible = false;
            this.menuGroup.visible = true;

            this.menuSprite.visible = true;
            this.endScreenSprite.visible = false;
            this.endScreenBackgroundSprite.visible = false;

            this.resetInput();

            this.menuSprite.animations.stop();
            this.menuSprite.animations.frame = 0;

            this.gameState = GameState.UpdateMenu;
        }

        if (this.nextNoteTime == 0)
        {
            this.nextNoteTime = now + 500;
        }

        if (this.nextNoteTime > 0 && now > this.nextNoteTime) {
            this.playRandomNote(MENU_SOUND_VOLUME);
            this.nextNoteTime = now + this.randomInt(MENU_SOUND_REPEAT_MIN_DELAY, MENU_SOUND_REPEAT_MAX_DELAY);

            if (this.lastAnimatonPlayTime == 0 || now - this.lastAnimatonPlayTime > 1300) {
                this.menuSprite.animations.stop();
                this.menuSprite.animations.frame = 0;

                let newSnakeIdx = this.randomInt(this.snakes.length);
                if (newSnakeIdx == this.lastSnakeIndex)
                {
                    newSnakeIdx = (newSnakeIdx + 1) & this.snakes.length;
                }

                this.lastSnakeIndex = newSnakeIdx;
                this.snakes[newSnakeIdx].play();

                this.lastAnimatonPlayTime = now;
            }
        }

        let point = this.getTapPoint();
        if (point != null)
        {
            this.gameState = GameState.NextLevel;
        }
    }

    private endScreenUpdate(game: Phaser.Game)
    {
        if (this.gameState == GameState.ShowEndScreen)
        {
            this.boardGroup.visible = false;
            this.menuGroup.visible = true;

            this.menuSprite.visible = false;
            this.endScreenSprite.visible = true;
            this.endScreenBackgroundSprite.visible = true;

            this.game.sound.stopAll();
            this.static.play();

            this.endScreenSprite.animations.stop();
            this.endScreenSprite.animations.frame = 0;
            this.endScreenSprite.animations.play('loop');

            this.endScreenBackgroundSprite.animations.stop();
            this.endScreenBackgroundSprite.animations.frame = 0;
            this.endScreenBackgroundSprite.animations.play('static');

            this.gameState = GameState.UpdateEndScreen;
        }

        let point = this.getTapPoint();
        if (point != null)
        {
            this.gameState = GameState.ShowMenu;
        }
    }

    private gameUpdate(game: Phaser.Game)
    {
        let levelData;

        switch (this.gameState)
        {
            case GameState.NextLevel:
                this.game.input.enabled = true;

                this.menuGroup.visible = false;
                if (this.overlay) this.overlay.visible = false;

                this.boardGroup.visible = false;

                this.level = this.level + 1;

                if (this.level > LEVELS.length - 1)
                {
                    this.level = 0;

                    this.gameState = GameState.ShowEndScreen;
                    break;
                }

                // drop-through
                this.gameState = GameState.InitLevel;

            case GameState.InitLevel:
                this.boardGroup.removeAll(true, true);

                this.boardGroup.visible = false;

                levelData = LEVELS[this.level];
                this.board = this.createBoard(levelData.gridSize, levelData.colorMode);

                this.overlay = this.tileFactory.createTileWithBorder(BOARD_SHIFT, BOARD_SHIFT, 60, 1, levelData.colorMode == ColorMode.DOUBLE ? 15 : 0);
                this.overlay.visible = false;
                this.boardGroup.addChild(this.overlay);

                // drop-through
                this.gameState = GameState.ChoosePath;

            case GameState.ChoosePath:

                let colors;

                this.board.reset();

                levelData = LEVELS[this.level];
                switch (levelData.colorMode)
                {
                    case ColorMode.DOUBLE:
                        colors = this.getDoubleColors();
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

                // drop-through
                this.gameState = GameState.ShowPath;

            case GameState.ShowPath:
                this.boardGroup.visible = true;
                this.overlay.visible = true;

                this.lastNoteIdx = -1;
                this.game.sound.stopAll();

                this.board.softReset();
                this.path.restart();
                this.pathLastUpdate = 0;
                this.pathUpdateTimeout = 1500;

                // drop-through
                this.gameState = GameState.ShowPathLoop;

            case GameState.ShowPathLoop:
                let now = this.game.time.now;
                if (this.pathLastUpdate == 0 || (now - this.pathLastUpdate) > this.pathUpdateTimeout)
                {
                    if (this.path.current == null)
                    {
                        this.gameState = GameState.ShowBoard;
                    }
                    else
                    {
                        let tile = this.path.current;
                        this.path.next();

                        this.playNextNote(PATH_SOUND_VOLUME);

                        this.overlay.borderTint = tile.tile.borderTint;
                        this.overlay.backgroundTint = tile.tile.backgroundTint;
                        this.overlay.tileTint = tile.tile.tileTint;
                        this.overlay.visible = true;

                        //console.log(tile);

                        if (this.pathLastUpdate > 0)
                        {
                            this.pathUpdateTimeout = 1000;
                        }

                        this.pathLastUpdate = now;
                    }
                }
                break;

            case GameState.ShowBoard:
                this.overlay.visible = false;
                this.boardGroup.visible = true;

                this.lastNoteIdx = -1;

                this.game.input.enabled = true;
                this.resetInput();

                this.path.restart();

                // drop-through
                this.gameState = GameState.UpdateBoard;

            case GameState.UpdateBoard:

                let point = this.getTapPoint();
                if (point != null)
                {
                    let tile: BoardTile = this.getTileAtPoint(point);

                    if (tile == null) return;

                    //console.log(tile);
                    //console.log(this.path);

                    if (this.path.seen(tile)) {
                        // same

                    } else if (this.path.current == tile) {
                        // new

                        this.board.fade();

                        tile.tile.correct();

                        this.playNextNote(INGAME_SOUND_VOLUME);

                        if (this.board.restartTile != null)
                        {
                            this.board.restartTile.tile.stop();
                            this.board.restartTile = null;
                        }

                        if (this.path.next() == null) {
                            this.game.input.enabled = false;

                            this.nextLevelTime = this.game.time.now + 2000;
                        }
                    }
                    else
                    {
                        // wrong
                        this.board.perfect = false;

                        if (this.board.restartTile == null) {
                            this.board.restartTile = tile;
                            tile.tile.restart();

                            this.wrong.play(null, null, INGAME_WRONG_SOUND_VOLUME);
                        }
                        else if (tile == this.board.restartTile)
                        {
                            this.gameState = GameState.ShowPath;
                        }
                        else {
                            tile.tile.stop();
                            tile.tile.frame = 0;
                            tile.tile.wrong();
                            this.wrong.play(null, null, INGAME_WRONG_SOUND_VOLUME);
                        }
                    }
                }

                if (DEBUG)
                {
                    if (this.game.input.keyboard.isDown(Phaser.KeyCode.S))
                    {
                        this.game.input.keyboard.reset(false);

                        if (this.level <= 3) {
                            this.level = 3;
                        }
                        else if (this.level <= 6) {
                            this.level = 6;
                        }
                        else {
                            this.level = LEVELS.length - 1;
                        }

                        this.nextLevelTime = 0;
                        this.gameState = GameState.NextLevel;
                        break;
                    }
                    else if (this.game.input.keyboard.isDown(Phaser.KeyCode.E))
                    {
                        this.game.input.keyboard.reset(false);

                        this.level = LEVELS.length - 1;

                        this.nextLevelTime = 0;
                        this.gameState = GameState.NextLevel;

                        break;
                    }
                }

                if (this.nextLevelTime > 0 && this.game.time.now > this.nextLevelTime)
                {
                    this.nextLevelTime = 0;

                    if (this.board.perfect)
                    {
                        this.gameState = GameState.NextLevel;
                    }
                    else
                    {
                        this.gameState = GameState.ChoosePath;
                    }
                }
                break;
        }
    }

    private playRandomNote(volume: number)
    {
        let nextNoteIndex = this.randomInt(this.notes.length);
        if (nextNoteIndex == this.lastNoteIdx) {
            nextNoteIndex = (nextNoteIndex + 1) % this.notes.length;
        }

        this.lastNoteIdx = nextNoteIndex;
        this.notes[nextNoteIndex].play(null, null, volume);
    }

    private playNextNote(volume: number)
    {
        this.lastNoteIdx = (this.lastNoteIdx + 1) % this.notes.length;
        this.notes[this.lastNoteIdx].play(null, null, volume);
    }

    private resetInput(buttons: boolean = true, movement: boolean = true)
    {
        if (buttons && movement) {
            this.game.input.activePointer.reset();
        }
        else if (buttons) {
            this.game.input.activePointer.resetButtons();
        }
        else if (movement) {
            this.game.input.activePointer.resetMovement();
        }
    }

    private getTapPoint(): WorldPoint
    {
        let point: WorldPoint = null;

        let activePointer = this.game.input.activePointer;

        if (this.game.input.enabled && activePointer.active)
        {
            if (activePointer.withinGame)
            {
                if (activePointer.justPressed(1000))
                {
                    point = new WorldPoint(this.game.world, activePointer.worldX, activePointer.worldY);
                }
            }
        }

        activePointer.reset();

        return point;
    }

    private getTileAtPoint(point: WorldPoint): BoardTile
    {
        let x = point.pixel.x;
        let y = point.pixel.y;

        let tile: BoardTile = null;
        let tileSize = GAME_INNER_WIDTH / this.board.cols;

        if (x >= BOARD_SHIFT && y >= BOARD_SHIFT && x < GAME_WIDTH - BOARD_SHIFT && y <= GAME_WIDTH - BOARD_SHIFT)
        {
            let col = (x - BOARD_SHIFT) / tileSize << 0;
            let row = (y - BOARD_SHIFT) / tileSize << 0;

            return this.board[row][col];
        }

        return null;
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

    private getDoubleColors(): Array<TileColor>
    {
        const REDUCED_POOL_LENGTH = 4;

        let indices = [];
        for (let i = 0; i < REDUCED_POOL_LENGTH; i++)
        {
            indices.push(i);
        }

        let shuffledColors = DOUBLE_COLOR_POOL.slice();
        this.shuffle(shuffledColors);

        let colors: Array<TileColor> = new Array<TileColor>();

        for (let i = 0; i < REDUCED_POOL_LENGTH; i++)
        {
            for (let j = 0; j < REDUCED_POOL_LENGTH; j++)
            {
                if (i != j)
                {
                    colors.push(new Tiles.TileColor(shuffledColors[indices[i]], shuffledColors[indices[j]]));
                }
            }
        }

        return colors;
    }

    private getColors5x2(): Array<TileColor>
    {
        let colors: Array<TileColor> = [];

        let len = COLOR_POOL_5x2.length;

        for (let i = 0; i < len; i++)
        {
            colors.push(new Tiles.TileColor(COLOR_POOL_5x2[i]));
        }

        return colors;
    }

    private getColors2x5(): Array<TileColor>
    {
        let pool1 = this.randomInt(COLOR_POOL.length);
        let pool2 = 0;
        do {
            pool2 = this.randomInt(COLOR_POOL.length);
        } while (pool2 == pool1);

        //let colors1: Array<string> = [];
        //let colors2: Array<string> = [];
        let colors: Array<TileColor> = [];

        let len = COLOR_POOL[pool1].length;
        for (let i = 0; i < len; i++)
        {
            //colors1.push(COLOR_POOL[pool1][i]);
            colors.push(new Tiles.TileColor(COLOR_POOL[pool1][i]));
        }

        len = COLOR_POOL[pool2].length;
        for (let i = 0; i < len; i++)
        {
            //colors2.push(COLOR_POOL[pool2][i]);
            colors.push(new Tiles.TileColor(COLOR_POOL[pool2][i]));
        }

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

    private createBoard(gridSize: number, colorMode: ColorMode): Board
    {
        let board: Board = new Board(gridSize, gridSize, colorMode);

        let tile: Tiles.TileWithBorder;

        let tileSize = Math.floor(GAME_INNER_WIDTH / gridSize);
        let borderSize = 1;

        this.tileFactory.size = tileSize;
        this.tileFactory.borderSize = borderSize;
        this.tileFactory.innerBorderSize = 0;
        if (colorMode == ColorMode.DOUBLE)
        {
            this.tileFactory.innerBorderSize = (tileSize * 0.25) << 0;
        }

        for (let row = 0; row < board.rows; row++)
        {
            for (let col = 0; col < board.cols; col++)
            {
                tile = this.tileFactory.createTileWithBorder(BOARD_SHIFT + col * tileSize, BOARD_SHIFT + row * tileSize);
                tile.setInactiveBorderColor(BORDER_COLOR_INACTIVE);
                tile.setActiveBorderColors(BORDER_COLORS_ACTIVE);

                this.boardGroup.addChild(tile);

                tile.setOverlay(this.createOverlay(tileSize));

                board[row][col] = new BoardTile(row, col);
                board[row][col].tile = tile;
            }
        }

        return board;
    }

    private createOverlay(size: number): Phaser.Sprite
    {
        let safeSize = size << 0;

        if (safeSize >= 20) safeSize = 20;
        else if (safeSize >= 15) safeSize = 15;
        else safeSize = 12;

        let button = this.game.add.sprite(0, 0, 'tile-icons-' + safeSize);

        button.animations.add('correct', [1, 2, 1, 2, 1, 0], 2, false);
        button.animations.add('wrong', [4, 3, 3, 4, 4, 3, 3, 3, 3, 3, 3, 4, 4, 4, 0], 10, false);
        button.animations.add('restart', [4, 3, 3, 4, 4, 3, 3, 3, 3, 3, 3, 4, 4, 4, 5], 10, false);

        return button;
    }

    private colorBoard(board: Board, colorPool: Array<TileColor>): BoardTile
    {
        let color: TileColor;

        let startColor = colorPool.pop();
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
                color = this.pickValidColor(row, col, board, colorPool);

                if (color != null) {
                    board[row][col].tile.tileTint = color.tileColor;
                    board[row][col].tile.backgroundTint = color.backgroundColor;
                }
                else {
                    console.log("Not enough colors!");
                }
            }
        }

        board[startRow][startCol].tile.tileTint = startColor.tileColor;
        board[startRow][startCol].tile.backgroundTint = startColor.backgroundColor;

        return board[startRow][startCol];
    }

    private pickValidColor(row: number, col: number, board: Board, colors: Array<TileColor>): TileColor
    {
        this.shuffle(colors);
        for (let c: TileColor, i = 0; i < colors.length; i++)
        {
            c = colors[i];

            if (row >= 1 && col >= 1 && board[row - 1][col - 1].equalColor(c)) continue;

            if (row >= 1) {
                if (board[row - 1][col].equalColor(c)) continue;
                if (row >= 2 && board[row - 2][col].equalColor(c)) continue;
                if (col >= 1 && board[row - 1][col - 1].equalColor(c)) continue;
                if (col < board.cols - 1 && board[row - 1][col + 1].equalColor(c)) continue;
            }

            if (col >= 1) {
                if (board[row][col - 1].equalColor(c)) continue;
                if (col >= 2 && board[row][col - 2].equalColor(c)) continue;
            }

            return c;
        }

        return null;
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

class Board extends Array2D<BoardTile>
{
    constructor(rows: number, cols: number, colorMode: ColorMode)
    {
        super(rows, cols);

        this.colorMode = colorMode;
    }

    colorMode: ColorMode;

    restartTile: BoardTile;

    perfect: boolean;

    fade()
    {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                this[row][col].tile.fade();
            }
        }
    }

    reset()
    {
        this.perfect = true;

        this.softReset();
    }

    softReset()
    {
        this.restartTile = null;

        for (let row = 0; row < this.rows; row++)
        {
            for (let col = 0; col < this.cols; col++)
            {
                this[row][col].tile.stop();
            }
        }
    }
}

class Path extends Array<BoardTile>
{
    private iter = 0;

    constructor()
    {
        super(6);
    }

    get first(): BoardTile
    {
        return this[0];
    }

    get current(): BoardTile
    {
        if (this.iter < this.length) {
            return this[this.iter];
        }
        else
        {
            return null;
        }
    }

    next(): BoardTile
    {
        this.iter++;
        return this.current;
    }

    restart()
    {
        this.iter = 0;
    }

    seen(tile: BoardTile): boolean
    {
        return this.containsBefore(tile, this.iter);
    }

    contains(tile: BoardTile)
    {
        return this.containsBefore(tile, this.length);
    }

    private containsBefore(tile: BoardTile, length: number)
    {
        for (let i = 0; i < length; i++)
        {
            if (tile.equals(this[i]))
            {
                return true;
            }
        }

        return false;
    }
}

type TileColor = Tiles.TileColor;

class BoardTile
{
    constructor(row, col)
    {
        this.row = row;
        this.col = col;
    }

    row: number;
    col: number;

    tile: Tiles.TileWithBorder;

    get color()
    {
        return this.tile.tileTint;
    }

    set color(color: number)
    {
        this.tile.tileTint = color;
    }

    equalColor(color: TileColor): boolean
    {
        return this.tile.equalColor(color);
    }

    equals(other: BoardTile)
    {
        return this.row == other.row && this.col == other.col;
    }
}

class WorldPoint
{
    constructor(world: Phaser.World, x: number, y: number)
    {
        this.position = new Phaser.Point(x, y);
        this.pixel = new Phaser.Point((this.position.x * GAME_WIDTH / world.width) << 0, (this.position.y * GAME_HEIGHT / world.height) << 0);
    }

    position: Phaser.Point;
    pixel: Phaser.Point;
}

window.onload = () =>
{
    let game = new SimpleGame('game-container');
};