module Tiles
{
    export class TileFactory {
        private game: Phaser.Game;
        private key: string | Phaser.RenderTexture | Phaser.BitmapData | PIXI.Texture;

        public size: number = 8;
        public borderSize: number = 1;
        public innerBorderSize: number = 2;

        constructor(game: Phaser.Game, key: string | Phaser.RenderTexture | Phaser.BitmapData | PIXI.Texture) {
            this.game = game;
            this.key = key;
        }

        createTile(x: number = 0, y: number = 0, size: number = this.size): Tile {
            return new Tile(this.game, size, x, y, this.key);
        }

        createTileWithBorder(x: number = 0, y: number = 0, size: number = this.size,
            borderSize: number = this.borderSize, innerBorderSize: number = this.innerBorderSize): TileWithBorder {
            return new TileWithBorder(this.game, size, borderSize, innerBorderSize, x, y, this.key);
        }
    }

    export class Tile extends Phaser.Sprite {
        private overlay: Phaser.Sprite;
        private size: number;

        constructor(game: Phaser.Game, size: number, x: number = 0, y: number = 0, key?: string | Phaser.RenderTexture | Phaser.BitmapData | PIXI.Texture, frame?: string | number) {
            super(game, x, y, key, frame);

            this.size = size;
            this.scale.setTo(size);
        }

        get tileTint() {
            return this.tint;
        }

        set tileTint(tint: number) {
            this.tint = tint;
        }

        setOverlay(overlay: Phaser.Sprite)
        {
            if (this.overlay != null)
            {
                this.overlay.destroy(true);
            }

            this.overlay = overlay;
            this.overlay.scale.setTo(1 / this.size);
            this.addChild(overlay);
        }

        correct()
        {
            this.overlay.play('correct');
        }

        wrong()
        {
            this.overlay.play('wrong');
        }

        restart()
        {
            this.overlay.play('restart');
        }

        stop() {
            this.overlay.animations.stop();
            this.overlay.frame = 0;
        }
    }

    export class TileWithBorder extends Tile {
        private tile: Tile;
        private backgroundTile: Tile;

        private activeBorderColorIndex: number = -1;
        private activeBorderColors: Array<number> = null;
        private inactiveBorderColor: number = null;

        constructor(game: Phaser.Game, size: number, borderSize: number, innerBorderSize: number = 0, x: number = 0, y: number = 0, key?: string | Phaser.RenderTexture | Phaser.BitmapData | PIXI.Texture, frame?: string | number) {
            super(game, size, x, y, key, frame);

            let innerScale = (size - 2 * borderSize) / size;
            let innerOffset = borderSize / size;

            let tileScale = (size - 2 * (borderSize + innerBorderSize)) / size;
            let tileOffset = (borderSize + innerBorderSize) / size;

            this.backgroundTile = new Tile(game, innerScale, innerOffset, innerOffset, key, frame);
            this.addChild(this.backgroundTile);

            this.tile = new Tile(game, tileScale, tileOffset, tileOffset, key, frame);
            this.addChild(this.tile);
        }

        setActiveBorderColors(activeColors: Array<number>)
        {
            this.activeBorderColors = activeColors;
            this.activeBorderColorIndex = -1;
        }

        setInactiveBorderColor(inactiveColor: number) {
            this.inactiveBorderColor = inactiveColor;
            if (this.inactiveBorderColor != null)
            {
                this.borderTint = this.inactiveBorderColor;
            }
        }

        equalColor(color: TileColor): boolean
        {
            return this.tileTint == color.tileColor && this.backgroundTint == color.backgroundColor;
        }

        correct() {
            super.correct();

            if (this.activeBorderColorIndex < 0 && this.activeBorderColors.length > 0)
            {
                this.activeBorderColorIndex = 0;
            }

            if (this.activeBorderColorIndex >= 0)
            {
                this.borderTint = this.activeBorderColors[this.activeBorderColorIndex];
            }
        }

        fade()
        {
            if (this.activeBorderColorIndex < 0 || this.activeBorderColorIndex == this.activeBorderColors.length - 1)
            {
                if (this.inactiveBorderColor != null)
                {
                   this.borderTint = this.inactiveBorderColor;
                }
            }
            else
            {
                this.activeBorderColorIndex++;
                this.borderTint = this.activeBorderColors[this.activeBorderColorIndex];
            }
        }

        stop()
        {
            super.stop();

            this.activeBorderColorIndex = -1;

            if (this.inactiveBorderColor != null)
            {
                this.borderTint = this.inactiveBorderColor;
            }
        }

        get tileTint() {
            return this.tile.tint;
        }

        set tileTint(tint: number) {
            this.tile.tint = tint;
        }

        get backgroundTint()
        {
            return this.backgroundTile.tint;
        }

        set backgroundTint(tint: number)
        {
            this.backgroundTile.tint = tint;
        }

        get borderTint() {
            return this.tint;
        }

        set borderTint(tint: number) {
            this.tint = tint;
        }
    }

    export class TileColor {
        constructor(tileColorHex: string, backgroundColorHex: string = tileColorHex) {
            this.tileColor = Phaser.Color.hexToColor(tileColorHex).color;
            this.backgroundColor = Phaser.Color.hexToColor(backgroundColorHex).color;
        }

        tileColor: number;
        backgroundColor: number;
    }
}