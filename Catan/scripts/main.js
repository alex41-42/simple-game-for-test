const canvas = document.getElementById('Canvas');
const ctx = canvas.getContext('2d');
const PI = Math.PI;
function range(a, b, c) {return Math.min(c, Math.max(b, a))}

// Resize/Fullscreen
function updateConstants() {
    SCREEN_WIDTH = canvas.width;
    SCREEN_HEIGHT = canvas.height;
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    updateConstants();
}

window.addEventListener('resize', resizeCanvas);

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
}

// Load Pictures
const images = {};

function loadImages() {
    const sources = {
        tileset: "assets/Tileset.png",
        items: "assets/Items.png",
        
    };

    let loaded = 0;
    let total = Object.keys(sources).length;

    for (let key in sources) {
        images[key] = new Image();
        images[key].src = sources[key];
        images[key].onload = () => {
            loaded++;
            if (loaded === total) {
                main();
            }
        };
    }
}

// Map
const TILESET_SIZE = 16;
const TILE_SIZE = 48;

const MAP_WIDTH = 100;
const MAP_HEIGHT = 100;
const SEED = Math.floor(Math.random() * 10000); // random seed for Perlin noise
const SCALE = 0.1; // important: zoom du bruit

const MINIMAP_WIDTH = 200;
const MINIMAP_HEIGHT = 200;
const MINIMAP_PADDING = 10;
const MINIMAP_TILE_SIZE = Math.min(MINIMAP_WIDTH / MAP_WIDTH, MINIMAP_HEIGHT / MAP_HEIGHT);

const perlin = new PerlinNoise(SEED);

// Tileset pointers
let pointers = {
    "water":{
        "":[[7,3], [3,8], [4,8]],
        "u":[[1,8]],
        "d":[[1,6]],
        "l":[[2,7]],
        "r":[[0,7]],
        "ul":[[3,6]],
        "ur":[[4,6]],
        "dl":[[3,7]],
        "dr":[[4,7]],
        "lu":[[2,8]],
        "ru":[[0,8]],
        "ld":[[2,6]],
        "rd":[[0,6]],
    },
    "sand": {
        "":[[1,4], [3,5], [4,5], [1,7]],
        "u":[[1,3]],
        "d":[[1,5]],
        "l":[[0,4]],
        "r":[[2,4]],
        "ul":[[0,3]],
        "ur":[[2,3]],
        "dl":[[0,5]],
        "dr":[[2,5]],
        "lu":[[4,4]],
        "ru":[[3,4]],
        "ld":[[4,3]],
        "rd":[[3,3]],
    },
    "grass": { "":[[1,1], [3,2], [4,2]] },
    "forest": { 
        "":[[7,4],[7,5]],
        "u":[[11,8]],
        "d":[[11,2]],
        "l":[[13,3]],
        "r":[[10,3]],
        "ul":[[8,4]],
        "ur":[[9,4]],
        "dl":[[8,5]],
        "dr":[[9,5]],
        "lu":[[13,8]],
        "ru":[[10,8]],
        "ld":[[13,2]],
        "rd":[[10,2]],
    },
    "mountain": { "":[[11,6], [12,7], [11,7]] },
};
let order = {
    "water":0,
    "sand":1,
    "grass":2,
    "forest":3,
    "mountain":4
};

let layers = [];

function initLayers() {

    const ground = new Layer({
        seed: SEED,
        width: MAP_WIDTH,
        height: MAP_HEIGHT,
        type: "ground"
    });

    const objects = new Layer({
        seed: SEED,
        width: MAP_WIDTH,
        height: MAP_HEIGHT,
        type: "objects"
    });

    ground.generate();
    objects.generate();

    for (let i = 0; i < 5; i++) {
        ground.computeEdges();
        objects.computeEdges();
    }

    layers = [ground, objects];
}

function drawLayers(posX = 0, posY = 0) {
    for (let layer of layers) {
        if (!layer.visible) continue;

        layer.draw(
            ctx,
            posX,
            posY,
            SCREEN_WIDTH,
            SCREEN_HEIGHT,
            TILE_SIZE
        );
    }
}

// Input handling
let keys = {};
document.addEventListener('keydown', (e) => {keys[e.key] = true});
document.addEventListener('keyup', (e) => {keys[e.key] = false});

let mouseX = 0;
let mouseY = 0;
document.addEventListener('mousemove', (mouse) => {
    mouseX = mouse.clientX, mouseY = mouse.clientY;
});
let onclick = false;
let leftClick = false;
let rightClick = false;
document.addEventListener('mousedown', (e) => {
    onclick = true;
    if (e.button === 0) leftClick = true;
    if (e.button === 2) rightClick = true;
});

document.addEventListener('mouseup', (e) => {
    onclick = false;
    if (e.button === 0) leftClick = false;
    if (e.button === 2) rightClick = false;
});

document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
});

let roll = false;
let rolldirection = 0; // -1 ou 1
let notchs = 0;
// reset automatique
function resetRoll() {
    roll = false;
    rolldirection = 0;
    notchs = 0;
}

document.addEventListener('wheel', (e) => {
    roll = true;
    // direction : deltaY > 0 = scroll bas (1), < 0 = scroll haut (-1)
    rolldirection = Math.sign(e.deltaY);
    notchs = Math.min(10, Math.max(1, Math.abs(e.deltaY) / 100));
    notchs = Math.round(notchs);
}, { passive: true });

// main()
running = true;
function main() {

    resizeCanvas();
    updateConstants();

    initLayers();
    gameLoop();
}

// ----------vars for loop/window----------
let Loop = 0;
let FullscreenCooldown = 0;
let rightClickCooldown = 0;
let edgeDetectionSize = TILE_SIZE * 3;

// ----------vars for game----------
let posX = 0;
let posY = 0;
let inventory = [
    { name: "wood", tile: [2,4], count: 500 },
    { name: "meat", tile: [4,1], count: 500 },
    { name: "wheat", tile: [5,1], count: 500 },
    { name: "gold", tile: [5,2], count: 500 },
    { name: "rock", tile: [1,2], count: 500 },
    { name: "brick", tile: [0,2], count: 500 },
];
const COST_NAMES = ["wood", "meat", "wheat", "gold", "rock", "brick"];
let buildID = [0,0,0];
let cursorSize;
let cursorBlock;
let cursorMultiplier = 1;

function mod(n, m) {
    return ((n % m) + m) % m; // modulo that handles negative numbers correctly
}

function getBuildCategory() {
    return BUILDING_CATEGORIES[buildID[0]]?.id ?? "";
}

function getBuildMaterial() {
    return BUILDING_MATERIALS[buildID[1]] ?? "";
}

function getBuildChoices() {
    const category = getBuildCategory();
    const material = getBuildMaterial();
    return BUILDINGS
        .filter(building => building.category === category && building.material === material)
        .map(building => building.id);
} // returns an array of build names for the current category and material

function updateCursorFromBuildID() {
    const choices = getBuildChoices();
    if (!choices.length) return;
    buildID[2] = mod(buildID[2], choices.length);
    const thirdArg = choices[buildID[2]];
    const entry = BUILDINGS.find(building =>
        building.category === getBuildCategory() &&
        building.material === getBuildMaterial() &&
        building.id === thirdArg
    );
    cursorSize = entry?.size ?? [1, 1];
    cursorBlock = entry?.sprite ?? [0, 0];
    cursorMultiplier = entry?.multiplier ?? 1;
} // updates cursorSize, cursorBlock, and cursorMultiplier based on the current buildID

function getCurrentBuildKey() {
    const choices = getBuildChoices();
    return choices[mod(buildID[2], choices.length)] || "";
} // returns the current build name based on the current buildID

function getCurrentBuildEntry() {
    const category = getBuildCategory();
    const material = getBuildMaterial();
    const key = getCurrentBuildKey();
    return BUILDINGS.find(building =>
        building.category === category &&
        building.material === material &&
        building.id === key
    );
} // returns the current build entry from the build_tree based on the current buildID

function getCurrentBuildCost() {
    const entry = getCurrentBuildEntry();
    return entry?.cost ?? [0, 0, 0, 0, 0, 0];
} // returns the cost array for the current build entry, or a default array of zeros if the entry is not found

function getCurrentBuildName() {
    return getCurrentBuildKey();
} // returns the current build name based on the current buildID

function getCurrentBuildMultiplier() {
    return cursorMultiplier;
}

function hasResources(cost) {
    for (let i = 0; i < COST_NAMES.length; i++) {
        const required = cost[i] ?? 0;
        const available = inventory[i]?.count ?? 0;
        if (available < required) return false;
    }
    return true;
} // checks if the player has enough resources in the inventory to cover the specified cost array

function applyCost(cost) {
    for (let i = 0; i < COST_NAMES.length; i++) {
        const required = cost[i] ?? 0;
        if (required > 0 && inventory[i]) {
            inventory[i].count = Math.max(0, inventory[i].count - required);
        }
    }
}

updateCursorFromBuildID();

function cursorCheck(list, cursorSize) {
    for (let i = 0; i < cursorSize[1]; i++) {
        for (let j = 0; j < cursorSize[0]; j++) {
            if (!list[i][j]) return false;
        }
    }
    return true;
} // checks if all tiles under the cursor are valid for building, based on the provided list of booleans and the cursor size

// ----------Time----------
let startTime = performance.now();
let elapsedTime = 0;
let fps = 0;
let lastFrameTime = performance.now();
function formatTime(ms) {
    let totalSeconds = Math.floor(ms / 1000);
    let minutes = Math.floor(totalSeconds / 60);
    let seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function updateFrameStats() {
    elapsedTime = performance.now() - startTime;
    const now = performance.now();
    const delta = now - lastFrameTime;
    lastFrameTime = now;

    const currentFPS = 1000 / delta;
    fps = fps * 0.9 + currentFPS * 0.1;
}

function getCursorScreenPosition() {
    return {
        screenSourisX: Math.floor(mouseX / TILE_SIZE) * TILE_SIZE - posX % TILE_SIZE,
        screenSourisY: Math.floor(mouseY / TILE_SIZE) * TILE_SIZE - posY % TILE_SIZE,
        mapSourisX: Math.floor(mouseX / TILE_SIZE) + Math.floor(posX / TILE_SIZE),
        mapSourisY: Math.floor(mouseY / TILE_SIZE) + Math.floor(posY / TILE_SIZE)
    };
}

function drawCursorPreview() {
    const { screenSourisX, screenSourisY } = getCursorScreenPosition();

    drawImage(
        ctx,
        images["tileset"],
        cursorBlock[0] * TILESET_SIZE,
        cursorBlock[1] * TILESET_SIZE,
        TILESET_SIZE * cursorSize[0],
        TILESET_SIZE * cursorSize[1],
        screenSourisX,
        screenSourisY,
        TILE_SIZE * cursorSize[0],
        TILE_SIZE * cursorSize[1],
        1
    );
}

function buildCursorMap() {
    const cursorMap = [];
    const { mapSourisX, mapSourisY } = getCursorScreenPosition();

    for (let i = 0; i < cursorSize[1]; i++) {
        cursorMap[i] = [];
        for (let j = 0; j < cursorSize[0]; j++) {
            const tileX = range(0, mapSourisX + j, MAP_WIDTH - 1);
            const tileY = range(0, mapSourisY + i, MAP_HEIGHT - 1);

            let valid = true;
            for (let l = 0; l < layers.length; l++) {
                const tile = layers[l].map[tileY][tileX];
                if (!(tile.type === "grass" || tile.type === "sand" || tile.type === "empty")) {
                    valid = false;
                    break;
                }
            }

            cursorMap[i][j] = valid;
            const tileSelectColor = valid ? [0, 255, 0] : [255, 0, 0];
            const { screenSourisX, screenSourisY } = getCursorScreenPosition();
            const finalColor = !hasResources(getCurrentBuildCost()) ? [255, 180, 0] : tileSelectColor;

            fillRect(
                ctx,
                screenSourisX + j * TILE_SIZE,
                screenSourisY + i * TILE_SIZE,
                TILE_SIZE,
                TILE_SIZE,
                finalColor,
                0.5
            );
        }
    }

    return cursorMap;
}

function drawInventoryUI() {
    fillRect(ctx, 0, 0, SCREEN_WIDTH, TILE_SIZE, [0,0,0], 0.5);
    const gap = SCREEN_WIDTH / inventory.length;

    for (let i = 0; i < inventory.length; i++) {
        const item = inventory[i];
        const tile = item.tile;
        const x = i * gap;
        const y = 0;

        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(
            images["items"],
            tile[0] * TILESET_SIZE,
            tile[1] * TILESET_SIZE,
            TILESET_SIZE,
            TILESET_SIZE,
            x,
            y,
            TILE_SIZE,
            TILE_SIZE
        );

        drawText(ctx, "x" + item.count, 20, x + TILE_SIZE, y + (TILE_SIZE + 20) / 2);
    }
}

function drawBuildCostUI() {
    const titleTextHeight = 20;
    const cost = getCurrentBuildCost();
    const costX = 0;
    const costLineHeight = TILE_SIZE / 2;
    const costWidth = 160;
    const costHeight = (COST_NAMES.length + 1) * costLineHeight + titleTextHeight;
    const costY = SCREEN_HEIGHT - costHeight ;

    fillRect(ctx, costX, costY, costWidth, costHeight, [0, 0, 0], 0.5);
    ctx.strokeStyle = "white";

    drawText(ctx, "Build Cost: ", 20, costX, costY);
    for (let i = 0; i < COST_NAMES.length; i++) {
        const resourceCost = cost[i] ?? 0;
        const iconTile = inventory[i].tile;
        const iconX = costX;
        const iconY = costY + costLineHeight * i + titleTextHeight;

        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(
            images["items"],
            iconTile[0] * TILESET_SIZE,
            iconTile[1] * TILESET_SIZE,
            TILESET_SIZE,
            TILESET_SIZE,
            iconX,
            iconY,
            TILE_SIZE / 2,
            TILE_SIZE / 2
        );

        drawText(ctx, "x" + resourceCost, TILE_SIZE / 4, iconX + TILE_SIZE / 2, iconY + TILE_SIZE / 8);
    }
}

function drawMinimap() {
    const minimapX = SCREEN_WIDTH - MINIMAP_WIDTH - MINIMAP_PADDING;
    const minimapY = SCREEN_HEIGHT - MINIMAP_HEIGHT - MINIMAP_PADDING;

    fillRect(ctx, minimapX, minimapY, MINIMAP_WIDTH, MINIMAP_HEIGHT, [0, 0, 0], 0.5);
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.strokeRect(minimapX, minimapY, MINIMAP_WIDTH, MINIMAP_HEIGHT);

    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            let color = [0, 0, 0];

            const groundLayer = layers[0];
            if (groundLayer && groundLayer.visible) {
                const tile = groundLayer.map[y][x];
                if (tile) {
                    if (tile.type === "water") color = [0, 100, 255];
                    else if (tile.type === "sand") color = [210, 180, 140];
                    else if (tile.type === "grass") color = [40, 180, 40];
                }
            }

            const objectLayer = layers[1];
            if (objectLayer && objectLayer.visible) {
                const tile = objectLayer.map[y][x];
                if (tile && tile.type === "object") {
                    color = [200, 200, 200];
                } else if (tile && (tile.type === "forest" || tile.type === "mountain")) {
                    color = tile.type === "forest" ? [0, 120, 0] : [80, 80, 80];
                }
            }

            const drawX = minimapX + x * MINIMAP_TILE_SIZE;
            const drawY = minimapY + y * MINIMAP_TILE_SIZE;
            fillRect(ctx, drawX, drawY, MINIMAP_TILE_SIZE, MINIMAP_TILE_SIZE, color, 1);
        }
    }

    const viewX = minimapX + (posX / (MAP_WIDTH * TILE_SIZE)) * MINIMAP_WIDTH;
    const viewY = minimapY + (posY / (MAP_HEIGHT * TILE_SIZE)) * MINIMAP_HEIGHT;
    const viewW = (SCREEN_WIDTH / (MAP_WIDTH * TILE_SIZE)) * MINIMAP_WIDTH;
    const viewH = (SCREEN_HEIGHT / (MAP_HEIGHT * TILE_SIZE)) * MINIMAP_HEIGHT;

    ctx.strokeStyle = "yellow";
    ctx.lineWidth = 1;
    ctx.strokeRect(viewX, viewY, viewW, viewH);
}

function handleMapMovement() {
    if (mouseY < edgeDetectionSize) {
        posY -= Math.floor(Math.abs(mouseY - edgeDetectionSize) / 10);
    }
    if (mouseY > SCREEN_HEIGHT - edgeDetectionSize) {
        posY += Math.floor(Math.abs(mouseY - (SCREEN_HEIGHT - edgeDetectionSize)) / 10);
    }
    if (mouseX < edgeDetectionSize) {
        posX -= Math.floor(Math.abs(mouseX - edgeDetectionSize) / 10);
    }
    if (mouseX > SCREEN_WIDTH - edgeDetectionSize) {
        posX += Math.floor(Math.abs(mouseX - (SCREEN_WIDTH - edgeDetectionSize)) / 10);
    }

    posX = Math.max(0, Math.min(posX, MAP_WIDTH * TILE_SIZE - SCREEN_WIDTH));
    posY = Math.max(0, Math.min(posY, MAP_HEIGHT * TILE_SIZE - SCREEN_HEIGHT));
}

function handleBuildPlacement(cursorMap) {
    if (!leftClick || !cursorCheck(cursorMap, cursorSize)) return;

    const cost = getCurrentBuildCost();
    if (!hasResources(cost)) return;

    const baseX = range(0, Math.floor(mouseX / TILE_SIZE) + Math.floor(posX / TILE_SIZE), MAP_WIDTH - 1);
    const baseY = range(0, Math.floor(mouseY / TILE_SIZE) + Math.floor(posY / TILE_SIZE), MAP_HEIGHT - 1);
    applyCost(cost);

    for (let i = 0; i < cursorSize[1]; i++) {
        for (let j = 0; j < cursorSize[0]; j++) {
            const mapSourisX = range(0, baseX + j, MAP_WIDTH - 1);
            const mapSourisY = range(0, baseY + i, MAP_HEIGHT - 1);
            const newTile = new Tile("object");
            newTile.set(cursorBlock[0] + j, cursorBlock[1] + i);
            newTile.resourceMultiplier = cursorMultiplier;
            layers[1].map[mapSourisY][mapSourisX] = newTile;
        }
    }
}

function handleBuildSelection() {
    if (!roll) return;

    const choices = getBuildChoices();
    if (choices.length) {
        buildID[2] = mod(buildID[2] + notchs * rolldirection, choices.length);
        updateCursorFromBuildID();
    }
    resetRoll();
}

function handleFullscreenKey() {
    if (keys["f"] && FullscreenCooldown <= 0) {
        toggleFullscreen();
        FullscreenCooldown = 30;
    } else {
        FullscreenCooldown -= 1;
    }
}

function drawBuildButton() {
    const buildButtonX = (SCREEN_WIDTH + TILE_SIZE) / 2;
    const buildButtonY = SCREEN_HEIGHT - TILE_SIZE * 2;

    fillRect(ctx, buildButtonX, buildButtonY, TILE_SIZE, TILE_SIZE, [0,0,0], 0.5);
    ctx.drawImage(
        images["items"],
        1 * TILESET_SIZE,
        3 * TILESET_SIZE,
        TILESET_SIZE,
        TILESET_SIZE,
        buildButtonX,
        buildButtonY,
        TILE_SIZE,
        TILE_SIZE
    );
}

function gameLoop() {
    updateFrameStats();

    fillRect(ctx, 0, 0, SCREEN_WIDTH, SCREEN_HEIGHT, [0,0,0]);
    drawLayers(posX, posY);
    drawCursorPreview();

    const cursorMap = buildCursorMap();
    drawInventoryUI();
    drawBuildCostUI();
    drawMinimap();
    drawBuildButton();

    handleMapMovement();
    handleBuildPlacement(cursorMap);
    handleBuildSelection();
    handleFullscreenKey();

    if (running) {
        requestAnimationFrame(gameLoop);
        Loop++;
    }
}

loadImages();