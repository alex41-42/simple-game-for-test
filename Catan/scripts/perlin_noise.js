// Générateur de bruit de Perlin 2D

class PerlinNoise {
    constructor(seed = 0, persistence = .25, numberOfOctaves = 2) {
        this.persistence = persistence;
        this.numberOfOctaves = numberOfOctaves;
        this.seed = seed;
    }


    noise(x, y) {
        let n = this.seed * 9576890767 + x * 374761393 + y * 668265263; // grands nombres premiers
        n = (n ^ (n >> 13)) * 1274126177;
        n = n ^ (n >> 16);
        // conversion float [-1, 1]
        return (n & 0x7fffffff) / 1073741824.0 - 1;
    }

    // Lissage du bruit en moyennant les valeurs adjacentes
    smoothNoise(x, y) {
        const corners = (this.noise(x - 1, y - 1) + this.noise(x + 1, y - 1) + 
                         this.noise(x - 1, y + 1) + this.noise(x + 1, y + 1)) / 16;
        const sides = (this.noise(x - 1, y) + this.noise(x + 1, y) + 
                       this.noise(x, y - 1) + this.noise(x, y + 1)) / 8;
        const center = this.noise(x, y) / 4;
        return corners + sides + center;
    }

    // Interpolation cosinus (plus lisse que linéaire) 
    interpolate(a, b, x) {
        const ft = x * Math.PI;
        const f = (1 - Math.cos(ft)) * 0.5;
        return a * (1 - f) + b * f;
    }

    // Bruit interpolé
    interpolatedNoise(x, y) {
        const integerX = Math.floor(x);
        const fractionalX = x - integerX;

        const integerY = Math.floor(y);
        const fractionalY = y - integerY;

        const v1 = this.smoothNoise(integerX, integerY);
        const v2 = this.smoothNoise(integerX + 1, integerY);
        const v3 = this.smoothNoise(integerX, integerY + 1);
        const v4 = this.smoothNoise(integerX + 1, integerY + 1);

        const i1 = this.interpolate(v1, v2, fractionalX);
        const i2 = this.interpolate(v3, v4, fractionalX);

        return this.interpolate(i1, i2, fractionalY);
    }

    // Génération du bruit de Perlin avec plusieurs octaves
    perlinNoise2D(x, y) {
        let total = 0;
        let maxvalue = 0;

        for (let i = 0; i < this.numberOfOctaves; i++) {
            const frequency = Math.pow(2, i);
            const amplitude = Math.pow(this.persistence, i);

            total += this.interpolatedNoise(x * frequency, y * frequency) * amplitude;
            maxvalue += amplitude;
        }
        let value = total / maxvalue;
        value = (value + 1) / 2;
        value = Math.max(0, Math.min(1, value));
        return value;
    }
}