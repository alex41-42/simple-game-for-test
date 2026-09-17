class Layer {
    constructor({ seed, width, height, type, scale = 0.1 }) {
        this.seed = seed;
        this.width = width;
        this.height = height;
        this.type = type;
        this.scale = scale;

        this.map = [];
        this.visible = true;

        this.perlin = new PerlinNoise(seed);
    }

    generate() {
        for (let y = 0; y < this.height; y++) {
            this.map[y] = [];

            for (let x = 0; x < this.width; x++) {

                let value = this.perlin.perlinNoise2D(
                    x * this.scale,
                    y * this.scale
                );

                let tile = null;

                if (this.type === "ground") {
                    if (value < 0.4375) tile = new Tile("water");
                    else if (value < 0.475) tile = new Tile("sand");
                    else tile = new Tile("grass");
                }

                if (this.type === "objects") {
                    if (value > 0.675) tile = new Tile("mountain");
                    else if (value > 0.575) tile = new Tile("forest");
                    else tile = new Tile("empty");
                }

                this.map[y][x] = tile;
            }
        }
    }

    computeEdges() {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {

                let tile = this.map[y][x];
                if (!tile) continue;

                let U  = this.map[y-1]?.[x] ?? tile;
                let D  = this.map[y+1]?.[x] ?? tile;
                let L  = this.map[y]?.[x-1] ?? tile;
                let R  = this.map[y]?.[x+1] ?? tile;

                let UL = this.map[y-1]?.[x-1] ?? tile;
                let UR = this.map[y-1]?.[x+1] ?? tile;
                let DL = this.map[y+1]?.[x-1] ?? tile;
                let DR = this.map[y+1]?.[x+1] ?? tile;

                tile.edging(U,D,L,R, UL,UR,DL,DR);
                tile.smoothing();
                tile.set();
            }
        }
    }

    draw(ctx, offsetX, offsetY, screenW, screenH, tileSize) {

        const tileX = Math.floor(offsetX / tileSize);
        const tileY = Math.floor(offsetY / tileSize);

        const subX = offsetX % tileSize;
        const subY = offsetY % tileSize;

        for (let y = 0; y <= Math.floor(screenH / tileSize)+1; y++) {
            for (let x = 0; x <= Math.floor(screenW / tileSize)+1; x++) {

                const tile = this.map[tileY + y]?.[tileX + x];
                if (!tile) continue;

                tile.draw(
                    x * tileSize - subX,
                    y * tileSize - subY
                );
            }
        }
    }
}