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

    get_cell_id(x, y) {
        return x + this.width * y;
    }

    get_position(id) {
        const x = id % this.width;
        const y = Math.floor(id / this.width);
        return new Position(x, y);
    }

    get_neighbor(cell_id, direction) {
        const position = this.get_position(cell_id);
        if (this.exceed_bound(position, direction))
            return cell_id;
        if (direction == Direction.DOWN)
            return this.get_cell_id(position.x, position.y + 1)
        if (direction == Direction.RIGHT)
            return this.get_cell_id(position.x + 1, position.y)
        if (direction == Direction.UP)
            return this.get_cell_id(position.x, position.y - 1)
        if (direction == Direction.LEFT)
            return this.get_cell_id(position.x - 1, position.y)
        return cell_id;
    }

    exceed_bound(position, direction) {
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

    get_direction(pred, succ) {
        const pred_pos = this.get_position(pred);
        const succ_pos = this.get_position(succ);
        if (pred_pos.x + 1 == succ_pos.x)
            return Direction.RIGHT;
        if (pred_pos.x - 1 == succ_pos.x)
            return Direction.LEFT;
        if (pred_pos.y - 1 == succ_pos.y)
            return Direction.UP;
        if (pred_pos.y + 1 == succ_pos.y)
            return Direction.DOWN;
        return Direction.INVALID;
    }

    get_neighbors(cell_id) {
        let successors = new Array();
        for (const direction of Object.values(Direction)) {
            const successor = this.get_neighbor(cell_id, direction);
            if (successor != cell_id) {
                successors.push(successor);
            }
        }
        return successors;
    }

    get_edge_id(cell_id, direction) {
        const successor = this.get_neighbor(cell_id, direction);
        const id = Math.min(cell_id, successor)
        return id + this.n * (direction % 2);
    }

    move(cell_id, direction) {
        const edge_id = this.get_edge_id(cell_id, direction);
        if (this.edges[edge_id])
            return this.get_neighbor(cell_id, direction);
        return cell_id;

    }

    get_moves(cell_id) {
        let successors = new Array();
        for (const direction of Object.values(Direction)) {
            const successor = this.move(cell_id, direction);
            if (successor != cell_id) {
                successors.push(successor);
            }
        }
        return successors;
    }

    set_obstacle(pred, succ) {
        const dir = this.get_direction(pred, succ);
        const edge_id = this.get_edge_id(pred, dir);
        this.edges[edge_id] = false;
    }

    set_free(pred, succ) {
        const dir = this.get_direction(pred, succ);
        const edge_id = this.get_edge_id(pred, dir);
        this.edges[edge_id] = true;
    }

    is_free(cell_id, direction) {
        const pos = this.get_position(cell_id);
        if (pos.x == 0 && direction == Direction.LEFT)
            return false;
        if (pos.y == 0 && direction == Direction.UP)
            return false;
        const edge_id = this.get_edge_id(cell_id, direction);
        return this.edges[edge_id];
    }

    reachable_cells(x, y) {
        const source = this.get_cell_id(x, y);
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

            let min_ele = -1;
            let min_priority = inf;
            let min_index = -1;
            for (let j = 0; j < queue.length; ++j) {
                const ele = queue[j];
                if (distance[ele] < min_priority) {
                    min_priority = distance[ele];
                    min_ele = ele;
                    min_index = j;
                }
            }
            const u = min_ele

            // now remove
            if (min_index > -1) {
                queue.splice(min_index, 1);
            }

            const successors = this.get_moves(u);
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

    pick_targets(initial_position, n_targets) {
        let targets = new Array(n_targets);
        let explored = this.reachable_cells(initial_position.x, initial_position.y);
        // leave out the first position
        console.log(explored);
        explored.splice(0, 1);
        // randomly select targets
        for (let i = 0; i < n_targets; ++i) {
            let pos = Math.floor(Math.random() * explored.length);
            const selected_cell = explored[pos];
            explored.splice(pos, 1);
            targets[i] = selected_cell;
            console.log("pick target " + String(selected_cell))
        }
        return targets;
    }
}

class Level {
    constructor(level_id, width, height, initial_position, maze_builder, n_targets) {
        this.maze = maze_builder(width, height);
        this.score = 0;
        this.n_targets = n_targets;
        this.position = this.maze.get_cell_id(initial_position.x, initial_position.y);
        // select random goals
        this.targets = this.maze.pick_targets(initial_position, this.n_targets);
        this.found_targets = new Array(n_targets).fill(false);
        this.level_id = level_id
    }

    move(direction) {
        this.position = this.maze.move(this.position, direction);
    }

    // returns the index of the target if it's found, otherwise -1
    targetFound() {
        const indexOfTarget = this.targets.indexOf(this.position);
        if (indexOfTarget > -1 && !this.found_targets[indexOfTarget]) {
            return indexOfTarget;
        }
        return -1;
    }

    won() {
        return this.score == this.n_targets;
    }

    updateTargetFound(targetId) {
        this.found_targets[targetId] = true;
        ++this.score;
    }

}

class Game {

    // this is the model in the MCV design pattern. The state of the game is given by the current level and the state of the level
    constructor(n_levels, generator) {
        this.n_levels = n_levels; // constants
        this.current_level = 0;
        this.level = new Array(n_levels)
        const initial_tiles = 4;
        for (let i = 0; i < this.n_levels; ++i) {
            this.level[i] = new Level(i, initial_tiles + i, initial_tiles+ i, new Position(0, 0), generator, 3 + i);
        }
    }

    game_won() {
        return this.current_level == this.n_levels
    }

    level_won() {
        return this.get_current_level().won();
    }

    advance_level() {
        ++this.current_level;
    }

    set_win_level(level) {
        this.current_level = level;
        ++this.current_level;
    }

    get_level(level) {
        return this.level[level];
    }

    get_current_level() {
        return this.get_level(this.current_level);
    }

    move(direction) {
        this.get_current_level().move(direction);
        console.log("move " + String(direction) + " " + this.get_current_level().position)
        return this.get_current_level().position;
    }

    get_position()
    {
        this.get_current_level().position;
    }

    updateTargetFound(targetId) {
        this.get_current_level().updateTargetFound(targetId);
    }
}

class Controller {
    constructor(game, view) {
        this.game = game;
        this.view = view;
    }

    onStart() {
        this.view.visualize_game(this.game);
        this.view.visualize_level(this.game.get_current_level());
    }

    onMove(direction) {
        const start = this.game.get_current_level().position;
        const level = this.game.get_current_level()
        const end = this.game.move(direction);
        this.view.update_position(start, end, level.level_id);

        const target = this.game.get_current_level().targetFound();
        if (target > -1) {
            this.view.onTargetFound(target, this.game.get_current_level().level_id);
            this.game.updateTargetFound(target);
        }

        if (this.game.level_won()) {
            this.view.onWinLevel(this.game.get_current_level());
            this.game.advance_level();
            if (this.game.game_won()) {
                this.view.onWinGame();
            } else {
                this.view.visualize_level(this.game.get_current_level());
            }
        }
    }
}

function generate_maze_random(x, y, threshold) {
    let maze = new Maze(x, y);
    for (let i = 0; i < maze.n * 2; ++i) {
        let p = Math.random();
        if (p < threshold)
            maze.edges[i] = true;
    }
    return maze;
}

function generate_maze_dpf(width, height) {
    // generate maze 
    let maze = new Maze(width, height);

    // start of exploration 
    const initial_cell = maze.get_cell_id(0, 0);

    // set visited list and queue
    let visited = new Array(maze.n).fill(false);
    let stack = new Array();

    visited[initial_cell] = true;
    stack.push(initial_cell);

    while (stack.length != 0) {
        let cell = stack.pop();
        let successors = maze.get_neighbors(cell);

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
            const selected_cell = unexplored[Math.floor(Math.random() * unexplored.length)];

            // add edge
            maze.set_free(cell, selected_cell);
            visited[selected_cell] = true;
            stack.push(selected_cell);
        }

    }
    return maze;
}



class View {

    constructor()
    {
        this.player = "resources/davide.png";
    }
    
    get_cell(cell_id, level) {
        return document.querySelector(".l" + String(level + 1) + " .cell" + String(cell_id));
    }

    draw_position(cell_id, level, color = "green") {
        const cell = this.get_cell(cell_id, level);
        cell.style.backgroundColor = color;
    }

    get_cell_dim(maze)
    {
        return 500 / maze.width;
    }

    visualize_position(cell_id, level, imgSrc) {
        const cell = this.get_cell(cell_id, level);
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
            const pos = width / 4;
            var img = document.createElement("img");
            img.classList.add("target");
            img.src = imgSrc
            img.style.opacity = "1.0";
            img.style.position = "absolute";
            img.style.bottom = String(pos) + "px";
            img.style.left = String(pos) + "px";
            img.style.zIndex = "2";
            img.style.width = "50%"; /* or any custom size */
            img.style.height = "50%"; 
            img.style.ObjectFit = "contain";
            cell.appendChild(img);
        }
    }

    visualize_maze(maze, level) {
        const container = document.querySelector("." + level + " .maze");
        const dim_cell = String(this.get_cell_dim(maze)) + "px";
        // const dim_board = String(500. / (maze.width * 100)) + "px";
        for (let y = 0; y < maze.height; ++y) {
            const row = document.createElement("div");
            row.style.display = "flex";
            for (let x = 0; x < maze.width; ++x) {
                const cell = document.createElement("div");
                cell.classList.add('cell' + String(maze.get_cell_id(x, y)));
                // add the tile image

                let cell_id = maze.get_cell_id(x, y);
                const down = maze.is_free(cell_id, Direction.DOWN);
                const up = maze.is_free(cell_id, Direction.UP);
                const left = maze.is_free(cell_id, Direction.LEFT);
                const right = maze.is_free(cell_id, Direction.RIGHT);

                function addTile(cell, src, transform) {
                    var img = document.createElement("img");
                    img.src = src;
                    img.style.maxWidth = dim_cell;
                    img.style.borderRadius = "10%";
                    img.style.opacity = "1.0";
                    img.style.border = "4px";
                    img.style.zIndex = "1";
                    if (transform != null) {
                        img.style.transform = transform;
                    }
                    cell.appendChild(img);   
                }
                // all neighbours are free
                if (down && up && left && right) {
                    addTile(cell, "resources/tile5.svg");
                } else if (left && right && !up && !down) {
                    addTile(cell, "resources/tile2.svg");
                } else if (up && down && !left && !right) {
                    addTile(cell, "resources/tile2.svg", "rotate(90deg)");
                } else if (left && up && !right && !down) {
                    addTile(cell, "resources/tile3.svg");
                } else if (up && right && !down && !left) {
                    addTile(cell, "resources/tile3.svg", "rotate(90deg)");
                } else if (right && down && !left && !up) {
                    addTile(cell, "resources/tile3.svg", "rotate(180deg)");
                } else if (down && left && !up && !right) {
                    addTile(cell, "resources/tile3.svg", "rotate(270deg)");
                } else if (left && up && right && !down) {
                    addTile(cell, "resources/tile4.svg");
                } else if (!left && up && right && down) {
                    addTile(cell, "resources/tile4.svg", "rotate(90deg)");
                } else if (left && !up && right && down) {
                    addTile(cell, "resources/tile4.svg", "rotate(180deg)");
                } else if (left && up && !right && down) {
                    addTile(cell, "resources/tile4.svg", "rotate(270deg)");
                } else if (left && !up && !right && !down) {
                    addTile(cell, "resources/tile6.svg");
                } else if (!left && up && !right && !down) {
                    addTile(cell, "resources/tile6.svg", "rotate(90deg)");
                } else if (!left && !up && right && !down) {
                    addTile(cell, "resources/tile6.svg", "rotate(180deg)");
                } else if (!left && !up && !right && down) {
                    addTile(cell, "resources/tile6.svg", "rotate(270deg)");
                }
                else {
                    addTile(cell, "resources/tile1.svg");
                }
                cell.style.position = "relative";
                cell.style.borderRadius = "10%";
                cell.style.margin = "4px";
                cell.style.padding = "0px";
                cell.style.border = "0px";
                row.append(cell);
            }
            row.style.margin = "0px";
            row.style.padding = "0px";
            row.style.border = "0px";
            container.append(row)
        }
    }

    visualize_level(level) {
        const imgs = document.querySelectorAll(".l" + String(level.level_id + 1) + " .instructions img");
        let imgsArr = Array();
        for (var i = 0; i < imgs.length; i++) {
            var image = imgs[i];
            imgsArr.push(image.getAttribute("src"));
        }
        console.log(imgsArr);
        this.visualize_position(level.position, game.current_level, this.player);
        for (let i = 0; i < level.n_targets; ++i) {
            this.visualize_position(level.targets[i], game.current_level, imgsArr[i]);
        }
    }

    visualize_game(game) {
        for (let l = 0; l < game.n_levels; ++l) {
            const level = game.get_level(l);
            console.log(level.score)
            this.visualize_maze(level.maze, "l" + String(l + 1));
        }
    }

    update_position(old_position, new_position, level)
    {
        // clear old position
        this.visualize_position(old_position, level, null);
        // update new position
        this.visualize_position(new_position, level, this.player);
    }

    onTargetFound(target, levelId)
    {
        console.log("Found target ", target, " at level ", levelId + 1);
        const divLevel = document.querySelector(".lvl.l" + String(levelId + 1));
        const divPerson = divLevel.querySelector(".person .p" + String(target + 1))
        divPerson.style.opacity = "1.0";
    }

    onWinLevel(level)
    {
        const level_id = level.level_id + 1
        alert("You won level "+ String(level_id) + "!");
        const img_level = document.querySelector(".l" + String(level_id));
        console.log(img_level);
        img_level.style.opacity = "1.0";
        const l = document.querySelector(".lvl.l" + String(level_id + 1));
        console.log("scroll top", l);
        if (l != null)
            l.scrollIntoView(true);
    }

    onWinGame()
    {
        alert("You won the game!");
        const top = document.querySelector(".title");
        top.scrollIntoView(true);

    }
}

///
let size = 5;

let game = new Game(4, generate_maze_dpf);

let view = new View();

let controller = new Controller(game, view);
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

