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
        return distance.filter(x => x < inf);
    }

    pick_targets(initial_position, n_targets)
    {
        let targets = new Array(n_targets);
        const explored = this.reachable_cells(initial_position.x, initial_position.y);
        for (let i = 0; i < n_targets; ++i) {
            const selected_cell = explored[Math.floor(Math.random() * explored.length)];
            targets[i] = selected_cell;
        }
        return targets;
    }
}

class Game {
    constructor(width, height, initial_position, maze_builder, n_targets) {
        this.maze = maze_builder(width, height);
        this.score = 0;
        this.n_targets = n_targets;
        this.position = this.maze.get_cell_id(initial_position.x, initial_position.y);
        // select random goals
        this.targets = this.maze.pick_targets(initial_position, this.n_targets);
    }

    move(direction) {
        this.position = this.maze.move(this.position, direction);
        if (this.position == this.targets[this.score]) {
            ++this.score;
        }
    }

    win()
    {
        return this.score == this.n_targets && this.position == this.targets[this.n_targets - 1];
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

function visualize_maze(maze, level) {
    const container = document.querySelector("." + level + " .maze");
    for (let y = 0; y < maze.height; ++y) {
        const row = document.createElement("div");
        row.style.display = "flex";
        for (let x = 0; x < maze.width; ++x) {
            const cell = document.createElement("div");
            cell.classList.add('cell' + String(maze.get_cell_id(x, y)));
            cell.style.width = "100px";
            cell.style.minHeight = "100px";
            cell.style.height = "100px";
            cell.style.backgroundColor = "white";
            cell.style.border = "2px solid lightgrey";

            // now add obstacles
            let cell_id = maze.get_cell_id(x, y);
            if (!maze.is_free(cell_id, Direction.DOWN)) {
                cell.style.borderBottom = "4px solid black";
            } else {
                cell.style.borderBottom = "4px solid lightgrey";
            }
            if (!maze.is_free(cell_id, Direction.RIGHT)) {
                cell.style.borderRight = "4px solid black";
            }
            else {
                cell.style.borderRight = "4px solid lightgrey";
            }
            row.append(cell);
        }
        container.append(row)
    }
}

function draw_position(cell_id, color = "green") {
    const cell = document.querySelector(".cell" + String(cell_id));
    cell.style.backgroundColor = color;
}

function clear_position(cell_id) {
    const cell = document.querySelector(".cell" + String(cell_id));
    cell.style.backgroundColor = "white";
}
function get_color(cell_id) {
    const cell = document.querySelector(".cell" + String(cell_id));
    return cell.style.backgroundColor;
}

///
let size = 5;

let colors = new Array("blue", "purple", "red");
let game = new Game(size, size, new Position(0, 0), generate_maze_dpf, 3);
visualize_maze(game.maze, "level1");
visualize_maze(game.maze, "level2");
visualize_maze(game.maze, "level3");
visualize_maze(game.maze, "level4");
draw_position(game.position);
for (let i = 0; i < game.n_targets; ++i) {
    console.log("target " + String(game.targets[i]));
    draw_position(game.targets[i], colors[i]);
}

let previous_color = "white";

function update_position(move) {
    const position = game.position;
    const score = game.score;
    draw_position(position, previous_color);
    game.move(move);
    previous_color = get_color(game.position);
    draw_position(game.position, "green");
    if (score != game.score) {
        previous_color = "white"
    }
    if (game.win()) {
        alert("You win!");
    }
}


const clearMaze = document.getElementById('clear');
clearMaze.addEventListener('click', () => {

    const div = document.querySelector(".maze");
    draw_position(game.position, "white");
    for (let i = 0; i < game.n_targets; ++i) {
        draw_position(game.targets[i], "white");
    }
    while (div.firstChild) {
        div.removeChild(div.firstChild);
    }
    size++;
    game = new Game(size, size, new Position(0, 0), generate_maze_dpf, 3)
    visualize_maze(game.maze);
    draw_position(game.position);
    for (let i = 0; i < game.n_targets; ++i) {
        draw_position(game.targets[i], colors[i]);
    }
});

const moveLeft = document.getElementById('left');
moveLeft.addEventListener('click', () => {
    const move = Direction.LEFT;
    update_position(move);
});


const moveRight = document.getElementById('right');
moveRight.addEventListener('click', () => {
    const move = Direction.RIGHT;
    update_position(move);
});

const moveUp = document.getElementById('up');
moveUp.addEventListener('click', () => {
    const move = Direction.UP;
    update_position(move);
});

const moveDown = document.getElementById('down');
moveDown.addEventListener('click', () => {
    const move = Direction.DOWN;
    update_position(move);
});

addEventListener('keydown', function (e) {
    let move = Direction.LEFT;
    switch (e.keyCode) {
        case 37:
            move = Direction.LEFT;
            break;
        case 38:
            move = Direction.UP;
            break;
        case 39:
            move = Direction.RIGHT;
            break;
        case 40:
            move = Direction.DOWN;
            break;
        default:
            break;
    }
    update_position(move);
});

