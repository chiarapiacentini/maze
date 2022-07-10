class Position {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
};

const Direction = {
    DOWN: 0,
    RIGHT: 1,
    UP: 2,
    LEFT: 3,
    INVALID: -1,
}

class Maze {
    constructor(width, height) {
        // number of columns, from left to right
        this.width = width;

        // number of rows, from top to bottom
        this.height = height;

        // total number of cells
        this.n = this.width * this.height;

        // edges are stored as a one dimensional vector, with 2 * n elements, where n is the number of cells.
        // For every cell, we store if the down and the right direction is allowed.element 0, corresponds to the down 
        // direction of cell(0, 0), element 1 down direction of cell(1, 0), etc.
        this.edges = new Array(this.n * 2).fill(false);
    }

    getCellId(x, y) {
        return x + this.width * y;
    }

    getPosition(id) {
        const x = id % this.width;
        const y = Math.floor(id / this.width);
        return new Position(x, y);
    }

    getNeighbor(cellId, direction) {
        const position = this.getPosition(cellId);
        if (this.exceedBound(position, direction))
            return cellId;
        if (direction == Direction.DOWN)
            return this.getCellId(position.x, position.y + 1)
        if (direction == Direction.RIGHT)
            return this.getCellId(position.x + 1, position.y)
        if (direction == Direction.UP)
            return this.getCellId(position.x, position.y - 1)
        if (direction == Direction.LEFT)
            return this.getCellId(position.x - 1, position.y)
        return cellId;
    }

    exceedBound(position, direction) {
        if (direction == Direction.DOWN)
            return position.y >= this.height - 1;
        if (direction == Direction.RIGHT)
            return position.x >= this.width - 1;
        if (direction == Direction.UP)
            return position.y <= 0;
        if (direction == Direction.LEFT)
            return position.x <= 0;
        return true;
    }

    getDirection(pred, succ) {
        const predPos = this.getPosition(pred);
        const succPos = this.getPosition(succ);
        if (predPos.x + 1 == succPos.x)
            return Direction.RIGHT;
        if (predPos.x - 1 == succPos.x)
            return Direction.LEFT;
        if (predPos.y - 1 == succPos.y)
            return Direction.UP;
        if (predPos.y + 1 == succPos.y)
            return Direction.DOWN;
        return Direction.INVALID;
    }

    getNeighbors(cellId) {
        let successors = new Array();
        for (const direction of Object.values(Direction)) {
            const successor = this.getNeighbor(cellId, direction);
            if (successor != cellId) {
                successors.push(successor);
            }
        }
        return successors;
    }

    getEdgeId(cellId, direction) {
        const successor = this.getNeighbor(cellId, direction);
        const id = Math.min(cellId, successor)
        return id + this.n * (direction % 2);
    }

    move(cellId, direction) {
        const edgeId = this.getEdgeId(cellId, direction);
        if (this.edges[edgeId])
            return this.getNeighbor(cellId, direction);
        return cellId;

    }

    getMoves(cellId) {
        let successors = new Array();
        for (const direction of Object.values(Direction)) {
            const successor = this.move(cellId, direction);
            if (successor != cellId) {
                successors.push(successor);
            }
        }
        return successors;
    }

    setObstacle(pred, succ) {
        const dir = this.getDirection(pred, succ);
        const edgeId = this.getEdgeId(pred, dir);
        this.edges[edgeId] = false;
    }

    setFree(pred, succ) {
        const dir = this.getDirection(pred, succ);
        const edgeId = this.getEdgeId(pred, dir);
        this.edges[edgeId] = true;
    }

    isFree(cellId, direction) {
        const pos = this.getPosition(cellId);
        if (pos.x == 0 && direction == Direction.LEFT)
            return false;
        if (pos.y == 0 && direction == Direction.UP)
            return false;
        const edgeId = this.getEdgeId(cellId, direction);
        return this.edges[edgeId];
    }

    reachableCells(x, y) {
        const source = this.getCellId(x, y);
        // dijkstra algorithm
        const n = this.n
        const inf = n * n + 1
        let distance = new Array(n).fill(inf)
        let predecessor = new Array(n).fill(-1)
        let queue = new Array()
        let visited = new Set()
        visited.add(source)
        distance[source] = 0
        for (let i = 0; i < n; ++i) {
            queue.push(i)
        }

        while (queue.length != 0) {

            let minEle = -1;
            let minPriority = inf;
            let minIndex = -1;
            for (let j = 0; j < queue.length; ++j) {
                const ele = queue[j];
                if (distance[ele] < minPriority) {
                    minPriority = distance[ele];
                    minEle = ele;
                    minIndex = j;
                }
            }
            const u = minEle

            // now remove
            if (minIndex > -1) {
                queue.splice(minIndex, 1);
            }

            const successors = this.getMoves(u);
            if (successors.length == 0)
                break;

            for (let i = 0; i < successors.length; ++i) {
                const v = successors[i];
                if (visited.has(v))
                    continue
                const cost = distance[u] + 1;
                if (cost < distance[v]) {
                    distance[v] = cost;
                    predecessor[v] = u;
                    visited.add(v);
                }
            }
        }
        let explored = new Array();
        for (let i = 0; i < distance.length; ++i) {
            if (distance[i] < inf)
                explored.push(i);
        }
        return explored;
    }

    pickTargets(initialPosition, nTargets) {
        let targets = new Array(nTargets);
        let explored = this.reachableCells(initialPosition.x, initialPosition.y);
        // leave out the first position
        console.log(explored);
        explored.splice(0, 1);
        // randomly select targets
        for (let i = 0; i < nTargets; ++i) {
            let pos = Math.floor(Math.random() * explored.length);
            const selectedCell = explored[pos];
            explored.splice(pos, 1);
            targets[i] = selectedCell;
            console.log("pick target " + String(selectedCell))
        }
        return targets;
    }
}

class Level {
    constructor(levelId, width, height, initialPosition, mazeBuilder, nTargets) {
        this.maze = mazeBuilder(width, height);
        this.score = 0;
        this.nTargets = nTargets;
        this.position = this.maze.getCellId(initialPosition.x, initialPosition.y);
        // select random goals
        this.targets = this.maze.pickTargets(initialPosition, this.nTargets);
        this.foundTargets = new Array(nTargets).fill(false);
        this.levelId = levelId
    }

    move(direction) {
        this.position = this.maze.move(this.position, direction);
    }

    // returns the index of the target if it's found, otherwise -1
    targetFound() {
        const indexOfTarget = this.targets.indexOf(this.position);
        if (indexOfTarget > -1 && !this.foundTargets[indexOfTarget]) {
            return indexOfTarget;
        }
        return -1;
    }

    won() {
        return this.score == this.nTargets;
    }

    updateTargetFound(targetId) {
        this.foundTargets[targetId] = true;
        ++this.score;
    }

}

class Game {

    // this is the model in the MCV design pattern. The state of the game is given by the current level and the state of the level
    constructor(nLevels, generator) {
        this.nLevels = nLevels; // constants
        this.currentLevel = 0;
        this.level = new Array(nLevels)
        const initialTiles = 4;
        for (let i = 0; i < this.nLevels; ++i) {
            this.level[i] = new Level(i, initialTiles + i, initialTiles + i, new Position(0, 0), generator, 3 + i);
        }
    }

    gameWon() {
        return this.currentLevel == this.nLevels
    }

    levelWon() {
        return this.getCurrentLevel().won();
    }

    advanceLevel() {
        ++this.currentLevel;
    }

    setWinLevel(level) {
        this.currentLevel = level;
        ++this.currentLevel;
    }

    getLevel(level) {
        return this.level[level % this.nLevels];
    }

    getCurrentLevel() {
        return this.getLevel(this.currentLevel);
    }

    move(direction) {
        this.getCurrentLevel().move(direction);
        console.log("move " + String(direction) + " " + this.getCurrentLevel().position)
        return this.getCurrentLevel().position;
    }

    getPosition() {
        this.getCurrentLevel().position;
    }

    updateTargetFound(targetId) {
        this.getCurrentLevel().updateTargetFound(targetId);
    }
}

class Controller {
    constructor(game, view, sounds) {
        this.game = game;
        this.view = view;
        this.sounds = sounds;
        this.musicOn = true;
        this.effectsOn = true;
    }

    onStart() {
        this.view.visualizeGame(this.game);
        this.view.visualizeLevel(this.game.getCurrentLevel());
    }

    onMove(direction) {
        const start = this.game.getCurrentLevel().position;
        const level = this.game.getCurrentLevel()
        const end = this.game.move(direction);
        this.view.updatePosition(start, end, level.levelId);

        const target = this.game.getCurrentLevel().targetFound();
        if (target > -1) {
            this.game.updateTargetFound(target);
            this.view.onTargetFound(target, this.game.getCurrentLevel().levelId);
        }

        if (this.game.levelWon()) {
            this.view.onWinLevel(this.game.getCurrentLevel());
            this.game.advanceLevel();
            if (this.game.gameWon()) {
                this.sounds.onWindGame();
                this.view.onWinGame();
            } else {
                this.sounds.onWinLevel();
                this.view.visualizeLevel(this.game.getCurrentLevel());
            }
        } else if (target > -1) {
            this.sounds.onTargetFound();
        } else if (start == end) {
            this.sounds.onHit();
        }
        else {
            this.sounds.onMove();
        }
    }

    positionOnClick() {
        const position = this.game.getCurrentLevel().position;
        const level = this.game.getCurrentLevel().levelId;
        return this.view.screenPosition(position, level);
    }

    onMoveClick(clickX, clickY, target) {
        console.log(
            "clientX: " + clickX + " " + clickY);

        const level = this.game.getCurrentLevel().levelId + 1;

        if (level == null) {
            return;
        }

        if (!document.querySelector(".l" + level + " .maze").contains(target)) {
            return;
        }

        const targetPos = this.positionOnClick();
        let direction = Direction.LEFT;

        if (Math.abs(clickX - targetPos.x) > Math.abs(clickY - targetPos.y)) {
            if (clickX < targetPos.x) {
                direction = Direction.LEFT;
            } else {
                direction = Direction.RIGHT;
            }
        } else {
            if (clickY > targetPos.y) {
                direction = Direction.DOWN;
            } else {
                direction = Direction.UP;
            }
        }
        console.log("Direction " + String(direction));
        this.onMove(direction);
    }

    switchMusic() {
        if (this.musicOn) {
            this.musicOn = false;
            this.sounds.musicOff();
            this.view.musicOff();
        } else {
            this.musicOn = true;
            this.sounds.musicOn();
            this.view.musicOn();
        }
    }

    switchSound() {
        if (this.effectsOn) {
            this.effectsOn = false;
            this.sounds.effectsOff();
            this.view.effectsOff();
        } else {
            this.effectsOn = true;
            this.sounds.effectsOn();
            this.view.effectsOn();
        }
    }
}

function generateMazeRandom(x, y, threshold) {
    let maze = new Maze(x, y);
    for (let i = 0; i < maze.n * 2; ++i) {
        let p = Math.random();
        if (p < threshold)
            maze.edges[i] = true;
    }
    return maze;
}

function generateMazeDpf(width, height) {
    // generate maze 
    let maze = new Maze(width, height);

    // start of exploration 
    const initialCell = maze.getCellId(0, 0);

    // set visited list and queue
    let visited = new Array(maze.n).fill(false);
    let stack = new Array();

    visited[initialCell] = true;
    stack.push(initialCell);

    while (stack.length != 0) {
        let cell = stack.pop();
        let successors = maze.getNeighbors(cell);

        // check if the successors have been visited
        let unexplored = new Array();
        for (let i = 0; i < successors.length; ++i) {
            const successor = successors[i]
            if (!visited[successor]) {
                unexplored.push(successor);
            }
        }

        if (unexplored.length != 0) {
            // readd note to the stack
            stack.push(cell);

            // select a random neighboring cell 
            const selectedCell = unexplored[Math.floor(Math.random() * unexplored.length)];

            // add edge
            maze.setFree(cell, selectedCell);
            visited[selectedCell] = true;
            stack.push(selectedCell);
        }

    }
    return maze;
}



class View {

    constructor() {
        this.player = "resources/davide.png";
    }

    getCell(cellId, level) {
        return document.querySelector(".l" + String(level + 1) + " .cell" + String(cellId));
    }

    getCellDim(maze) {
        return 400 / maze.width / 2;
    }

    screenPosition(cellId, level) {
        var element = this.getCell(cellId, level);
        var volume = element.getBoundingClientRect();
        var topPos = (volume.top + volume.bottom) / 2.;
        var leftPos = (volume.left + volume.right) / 2.;
        console.log("Position ", leftPos, " ", topPos);
        return new Position(leftPos, topPos);
    }

    visualizePosition(cellId, level, imgSrc) {
        const cell = this.getCell(cellId, level);
        console.log(cell.offsetWidth);
        let width = 0;
        if (typeof cell.clip !== "undefined") { width = cell.clip.width; }
        else {
            if (cell.style.pixelWidth) { width = cell.style.pixelWidth; }
            else { width = cell.offsetWidth; }
        }

        var image = cell.querySelector('img.target');
        if (image != null)
            cell.removeChild(image);
        if (imgSrc != null) {
            var img = document.createElement("img");
            img.classList.add("target");
            img.src = imgSrc
            cell.appendChild(img);
        }
    }

    visualizeMaze(maze, level) {
        const container = document.querySelector("." + level + " .maze");
        for (let y = 0; y < maze.height; ++y) {
            const row = document.createElement("div");
            row.classList.add("row");
            for (let x = 0; x < maze.width; ++x) {
                const cell = document.createElement("div");
                cell.classList.add("tile");
                cell.classList.add('cell' + String(maze.getCellId(x, y)));
                // add the tile image

                let cellId = maze.getCellId(x, y);
                const down = maze.isFree(cellId, Direction.DOWN);
                const up = maze.isFree(cellId, Direction.UP);
                const left = maze.isFree(cellId, Direction.LEFT);
                const right = maze.isFree(cellId, Direction.RIGHT);

                function addTile(cell, src, transform) {
                    var img = document.createElement("img");
                    img.src = src;
                    if (transform != null) {
                        img.style.transform = transform;
                    }
                    cell.appendChild(img);
                }
                // all neighbours are free
                if (down && up && left && right) {
                    addTile(cell, "resources/tile5.png");
                } else if (left && right && !up && !down) {
                    addTile(cell, "resources/tile2.png");
                } else if (up && down && !left && !right) {
                    addTile(cell, "resources/tile2.png", "rotate(90deg)");
                } else if (left && up && !right && !down) {
                    addTile(cell, "resources/tile3.png");
                } else if (up && right && !down && !left) {
                    addTile(cell, "resources/tile3.png", "rotate(90deg)");
                } else if (right && down && !left && !up) {
                    addTile(cell, "resources/tile3.png", "rotate(180deg)");
                } else if (down && left && !up && !right) {
                    addTile(cell, "resources/tile3.png", "rotate(270deg)");
                } else if (left && up && right && !down) {
                    addTile(cell, "resources/tile4.png");
                } else if (!left && up && right && down) {
                    addTile(cell, "resources/tile4.png", "rotate(90deg)");
                } else if (left && !up && right && down) {
                    addTile(cell, "resources/tile4.png", "rotate(180deg)");
                } else if (left && up && !right && down) {
                    addTile(cell, "resources/tile4.png", "rotate(270deg)");
                } else if (left && !up && !right && !down) {
                    addTile(cell, "resources/tile6.png");
                } else if (!left && up && !right && !down) {
                    addTile(cell, "resources/tile6.png", "rotate(90deg)");
                } else if (!left && !up && right && !down) {
                    addTile(cell, "resources/tile6.png", "rotate(180deg)");
                } else if (!left && !up && !right && down) {
                    addTile(cell, "resources/tile6.png", "rotate(270deg)");
                }
                else {
                    addTile(cell, "resources/tile1.png");
                }

                row.append(cell);
            }
            container.append(row)
        }
    }

    visualizeLevel(level) {
        const imgs = document.querySelectorAll(".l" + String(level.levelId + 1) + " .instructions img");
        let imgsArr = Array();
        for (var i = 0; i < imgs.length; i++) {
            var image = imgs[i];
            imgsArr.push(image.getAttribute("src"));
        }
        console.log(imgsArr);
        this.visualizePosition(level.position, game.currentLevel, this.player);
        for (let i = 0; i < level.nTargets; ++i) {
            this.visualizePosition(level.targets[i], game.currentLevel, imgsArr[i]);
        }
    }

    visualizeGame(game) {
        for (let l = 0; l < game.nLevels; ++l) {
            const level = game.getLevel(l);
            console.log(level.score)
            this.visualizeMaze(level.maze, "l" + String(l + 1));
        }
    }

    updatePosition(oldPosition, newPosition, level) {
        // clear old position
        this.visualizePosition(oldPosition, level, null);
        // update new position
        this.visualizePosition(newPosition, level, this.player);
    }

    onTargetFound(target, levelId) {
        console.log("Found target ", target, " at level ", levelId + 1);
        const divLevel = document.querySelector(".lvl.l" + String(levelId + 1));
        const divPerson = divLevel.querySelector(".person .p" + String(target + 1))
        divPerson.style.opacity = "1.0";
    }

    onWinLevel(level) {
        const levelId = level.levelId + 1
        const imgLevel = document.querySelector(".l" + String(levelId));
        console.log(imgLevel);
        imgLevel.style.opacity = "1.0";
        const l = document.querySelector(".lvl.l" + String(levelId + 1));
        alert("You won level " + String(levelId) + "!");
        console.log("scroll top", l);
        if (l != null)
            l.scrollIntoView(true);
    }

    onWinGame() {
        alert("You won the game!");
        const top = document.querySelector(".title");
        top.scrollIntoView(true);
        const element = document.querySelector(".play");
        var img = element.querySelector("img");
        img.src = "resources/play.png";
        var text = element.querySelector(".tooltiptext");
        text.textContent = "Gioca Ancora";
    }

    clear() {
        // clear maze
        const mazes = document.querySelectorAll(".maze");
        mazes.forEach(function (maze) {
            maze.innerHTML = '';
        })
        // reset the levels
        let imgs = document.querySelectorAll(".levels img");
        imgs.forEach(function (img) {
            img.style.opacity = "0.5";
        })

        // reset the targets of each level
        imgs = document.querySelectorAll(".person img");
        imgs.forEach(function (img) {
            img.style.opacity = "0.5";
        })

        // scroll to level 1
        const top = document.querySelector(".lvl.l1");
        top.scrollIntoView(true);
    }

    musicOn() {
        var element = document.querySelector(".music");
        var img = element.querySelector("img");
        img.src = "resources/music_on.png";
        var text = element.querySelector(".tooltiptext");
        text.textContent = "Musica Off";
    }

    musicOff() {
        var element = document.querySelector(".music");
        var img = element.querySelector("img");
        img.src = "resources/music_off.png";
        var text = element.querySelector(".tooltiptext");
        text.textContent = "Musica On";
    }

    effectsOn() {
        var element = document.querySelector(".effects");
        var img = element.querySelector("img");
        img.src = "resources/sound_on.png";
        var text = element.querySelector(".tooltiptext");
        text.textContent = "Suono Off";
    }

    effectsOff() {
        var element = document.querySelector(".effects");
        var img = element.querySelector("img");
        img.src = "resources/sound_off.png";
        var text = element.querySelector(".tooltiptext");
        text.textContent = "Suono On";
    }
}

function Sound(src, volume = 1) {
    this.sound = document.createElement("audio");
    this.sound.src = src;
    this.sound.setAttribute("preload", "auto");
    this.sound.style.display = "none";
    this.sound.volume = volume;
    document.body.appendChild(this.sound);
    this.play = function () {
        this.sound.play();
    }
    this.pause = function () {
        this.sound.pause();
    }
    this.stop = function () {
        this.sound.pause();
        this.sound.currentTime = 0;
    }
}

class Sounds {

    constructor() {
        this.soundOn = true;
        this.backgroundMusic = new Sound("resources/background.mp3", 0.5);
        this.moves = [new Sound("resources/step1.wav", 0.1), new Sound("resources/step2.wav", 0.1)];
        this.hit = new Sound("resources/hit.wav", 0.3);
        this.target = new Sound("resources/target.wav", 0.5);
        this.level = new Sound("resources/level.wav", 0.2);
        this.game = new Sound("resources/game.wav", 0.9);

        this.backgroundMusic.sound.setAttribute("loop", "true");
        this.backgroundMusic.play();
        this.nMove = 0;
    }

    play(sound) {
        this.moves[0].stop()
        this.moves[1].stop()
        this.hit.stop()
        this.target.stop()
        this.level.stop()
        this.game.stop()
        if (this.soundOn)
            sound.play();
    }

    onWindGame() {
        this.play(this.game);
    }

    onMove() {
        this.play(this.moves[this.nMove]);
        this.nMove += 1;
        this.nMove = this.nMove % this.moves.length;
    }

    onHit() {
        this.play(this.hit);
    }

    onWinLevel() {
        this.play(this.level);
    }

    onTargetFound() {
        this.play(this.target);
    }

    musicOn() {
        this.backgroundMusic.play();
    }

    musicOff() {
        this.backgroundMusic.pause();
    }

    effectsOn() {
        this.soundOn = true;
    }

    effectsOff() {
        this.soundOn = false;
    }
}
///
let size = 5;

let game = new Game(4, generateMazeDpf);

let view = new View();

const sounds = new Sounds();

let controller = new Controller(game, view, sounds);
controller.onStart();

addEventListener('keydown', function (e) {
    let direction = Direction.LEFT;
    switch (e.keyCode) {
        case 37:
            direction = Direction.LEFT;
            break;
        case 38:
            direction = Direction.UP;
            break;
        case 39:
            direction = Direction.RIGHT;
            break;
        case 40:
            direction = Direction.DOWN;
            break;
        default:
            break;
    }
    controller.onMove(direction);
});

document.body.addEventListener('click', function (e) {
    controller.onMoveClick(e.clientX, e.clientY, e.target);
}, true);

document.querySelector(".play").addEventListener(
    "click", function (e) {
        game = new Game(4, generateMazeDpf);

        view.clear();

        // create a controller for the new game
        controller = new Controller(game, view, sounds);
        controller.onStart();
    }
)

window.onscroll = function () { scrollFunction() };

function scrollFunction() {
    const imgs = document.querySelectorAll(".levels img");
    const hs = document.querySelectorAll(".levels h1, .levels h2");
    const limit = 350;
    if (document.body.scrollTop > limit || document.documentElement.scrollTop > limit) {
        imgs.forEach(function (img) {
            img.style.width = "50%";
            img.style.width = "50%";
        })
        hs.forEach(function (h2) {
            h2.style.display = "none";
        })
    } else {
        imgs.forEach(function (img) {
            img.style.width = "100%";
            img.style.width = "100%";
        })
        hs.forEach(function (h2) { h2.style.display = "block"; });
    }
}

document.querySelector(".music").addEventListener(
    "click", function (e) {
        controller.switchMusic();
    }
)

document.querySelector(".effects").addEventListener(
    "click", function (e) {
        controller.switchSound();
    }
)

const btn = document.querySelector(".play");
btn.addEventListener(
    "click", function (e) {
        var img = btn.querySelector("img")
        img.src = "resources/replay.png";
    }
)