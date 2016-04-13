module Tiles
{
    export class TileFactory {
        private game: Phaser.Game;
        private key: string | Phaser.RenderTexture | Phaser.BitmapData | PIXI.Texture;

        public size: number = 8;
        public borderSize: number = 1;

        constructor(game: Phaser.Game, key: string | Phaser.RenderTexture | Phaser.BitmapData | PIXI.Texture) {
            this.game = game;
            this.key = key;
        }

        createTile(x: number = 0, y: number = 0, size: number = this.size): Tile {
            return new Tile(this.game, size, x, y, this.key);
        }

        createTileWithBorder(x: number = 0, y: number = 0, size: number = this.size, borderSize: number = this.borderSize): TileWithBorder {
            return new TileWithBorder(this.game, size, borderSize, x, y, this.key);
        }
    }

    class Tile extends Phaser.Sprite {
        constructor(game: Phaser.Game, size: number, x: number = 0, y: number = 0, key?: string | Phaser.RenderTexture | Phaser.BitmapData | PIXI.Texture, frame?: string | number) {
            super(game, x, y, key, frame);

            this.scale.setTo(size);
        }

        get tileTint() {
            return this.tint;
        }

        set tileTint(tint: number) {
            this.tint = tint;
        }
    }

    class TileWithBorder extends Tile {
        private tile: Tile;

        constructor(game: Phaser.Game, size: number, borderSize: number, x: number = 0, y: number = 0, key?: string | Phaser.RenderTexture | Phaser.BitmapData | PIXI.Texture, frame?: string | number) {
            super(game, size, x, y, key, frame);

            let innerScale = (size - 2 * borderSize) / size;
            let innerOffset = borderSize / size;

            this.tile = new Tile(game, innerScale, innerOffset, innerOffset, key, frame);

            this.addChild(this.tile);
        }

        get tileTint() {
            return this.tile.tint;
        }

        set tileTint(tint: number) {
            this.tile.tint = tint;
        }

        get borderTint() {
            return this.tint;
        }

        set borderTint(tint: number) {
            this.tint = tint;
        }
    }
}