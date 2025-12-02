const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Game variables
let player = {
    x: 2,
    y: 2,
    angle: 0,
    speed: 0.1,
    turnSpeed: 0.05
};

const map = [
    [1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 0, 0, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 0, 0, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 2, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1]
];

const enemies = [
    { x: 3.5, y: 3.5, health: 100, color: 'red' }
];

const FOV = Math.PI / 3;
const NUM_RAYS = canvas.width;
const HALF_FOV = FOV / 2;
const STEP_ANGLE = FOV / NUM_RAYS;
const zBuffer = new Array(NUM_RAYS);

function gameLoop() {
    clearScreen();
    drawBackground();
    castRays();
    drawEnemies();
    updatePlayer();
    requestAnimationFrame(gameLoop);
}

function castRays() {
    let rayAngle = player.angle - HALF_FOV;
    for (let i = 0; i < NUM_RAYS; i++) {
        castRay(rayAngle, i);
        rayAngle += STEP_ANGLE;
    }
}

function castRay(rayAngle, rayIndex) {
    let rayX = player.x;
    let rayY = player.y;

    const rayCos = Math.cos(rayAngle) / 100;
    const raySin = Math.sin(rayAngle) / 100;

    let wall = 0;
    while (wall === 0) {
        rayX += rayCos;
        rayY += raySin;
        wall = map[Math.floor(rayY)][Math.floor(rayX)];
    }

    const distance = Math.sqrt(Math.pow(player.x - rayX, 2) + Math.pow(player.y - rayY, 2));
    const correctedDistance = distance * Math.cos(rayAngle - player.angle);
    zBuffer[rayIndex] = correctedDistance;
    const wallHeight = (1 / correctedDistance) * canvas.height;

    const wallTop = canvas.height / 2 - wallHeight / 2;

    // Wall color based on distance
    const shade = Math.max(0, 255 - correctedDistance * 20);
    ctx.fillStyle = `rgb(${shade}, ${shade}, ${shade})`;
    ctx.fillRect(rayIndex, wallTop, 1, wallHeight);
}

function drawEnemies() {
    enemies.forEach(enemy => {
        if (enemy.health <= 0) return;

        const dx = enemy.x - player.x;
        const dy = enemy.y - player.y;
        let distance = Math.sqrt(dx * dx + dy * dy);

        let enemyAngle = Math.atan2(dy, dx);
        let angleDifference = enemyAngle - player.angle;

        if (angleDifference < -Math.PI) angleDifference += 2 * Math.PI;
        if (angleDifference > Math.PI) angleDifference -= 2 * Math.PI;

        const inFov = Math.abs(angleDifference) < HALF_FOV;

        if (inFov && distance > 0.5) {
            const screenX = (angleDifference / HALF_FOV) * (canvas.width / 2) + (canvas.width / 2);
            const spriteSize = (1 / distance) * (canvas.height / 2);

            const startX = screenX - spriteSize / 2;
            const startY = canvas.height / 2 - spriteSize / 2;

            for (let x = 0; x < spriteSize; x++) {
                const screenColumn = Math.floor(startX + x);
                if (screenColumn >= 0 && screenColumn < NUM_RAYS && zBuffer[screenColumn] > distance) {
                    ctx.fillStyle = enemy.color;
                    ctx.fillRect(startX + x, startY, 1, spriteSize);
                }
            }
        }
    });
}

function clearScreen() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

document.addEventListener('click', () => {
    const angleTolerance = 0.1;
    enemies.forEach(enemy => {
        if (enemy.health > 0) {
            const dx = enemy.x - player.x;
            const dy = enemy.y - player.y;
            const enemyAngle = Math.atan2(dy, dx);
            let angleDifference = enemyAngle - player.angle;

            if (angleDifference < -Math.PI) angleDifference += 2 * Math.PI;
            if (angleDifference > Math.PI) angleDifference -= 2 * Math.PI;

            if (Math.abs(angleDifference) < angleTolerance) {
                enemy.health -= 25;
            }
        }
    });
});

function drawBackground() {
    // Ceiling
    ctx.fillStyle = 'gray';
    ctx.fillRect(0, 0, canvas.width, canvas.height / 2);

    // Floor
    ctx.fillStyle = 'lightgray';
    ctx.fillRect(0, canvas.height / 2, canvas.width, canvas.height / 2);
}

let keys = {};

document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

function updatePlayer() {
    let newX = player.x;
    let newY = player.y;

    if (keys['w'] || keys['ArrowUp']) {
        newX += Math.cos(player.angle) * player.speed;
        newY += Math.sin(player.angle) * player.speed;
    }
    if (keys['s'] || keys['ArrowDown']) {
        newX -= Math.cos(player.angle) * player.speed;
        newY -= Math.sin(player.angle) * player.speed;
    }
    if (keys['a'] || keys['ArrowLeft']) {
        player.angle -= player.turnSpeed;
    }
    if (keys['d'] || keys['ArrowRight']) {
        player.angle += player.turnSpeed;
    }

    if (map[Math.floor(newY)][Math.floor(newX)] === 0) {
        player.x = newX;
        player.y = newY;
    }
}

gameLoop();
