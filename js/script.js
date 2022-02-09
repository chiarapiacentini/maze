console.log("Hello world!")

class Position {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
};


const DOWN = 0;
const RIGHT = 1;
const UP = 2;
const LEFT = 3;
const INVALID = -1;


class Maze {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.n = this.width * this.height;
        this.edges = new Array(this.n * 2).fill(true);
    }

    get_cell_id(x, y) {
        return x + this.width * y;
    }

    get_position(id) {
        const x = id % this.width;
        const y = Math.floor(id / this.width);
        return new Position(x, y);
    }

    get_successor(cell_id, direction) {
        const s = this.get_position(cell_id);
        if (direction == DOWN && s.y < this.height - 1)
            return this.get_cell_id(s.x, s.y + 1)
        if (direction == RIGHT && s.x < this.width - 1)
            return this.get_cell_id(s.x + 1, s.y)
        if (direction == UP && s.y > 0)
            return this.get_cell_id(s.x, s.y - 1)
        if (direction == LEFT && s.x > 0)
            return this.get_cell_id(s.x - 1, s.y)
        return cell_id;
    }

    get_successors(cell_id) {
        let successors = new Array();
        for (let i = 0; i < 4; ++i) {
            const successor = this.get_successor(cell_id, i);
            if (successor != cell_id) {
                successors.push(successor);
            }
        }
        return successors;
    }

    move(cell_id, direction) {
        const edge_id = this.get_edge_id(cell_id, direction);
        if (this.edges[edge_id])
            return this.get_successor(cell_id, direction);
        return cell_id;

    }

    get_moves(cell_id) {
        let successors = new Array();
        for (let i = 0; i < 4; ++i) {
            const successor = this.move(cell_id, i);
            if (successor != cell_id) {
                successors.push(successor);
            }
        }
        return successors;
    }


    get_edge_id(cell_id, direction) {
        const successor = this.get_successor(cell_id, direction);
        const id = Math.min(cell_id, successor)
        return id + this.n * (direction % 2);
    }

    set_obstacle(x, y, direction) {
        const cell_id = this.get_cell_id(x, y);
        const edge_id = this.get_edge_id(cell_id, direction);
        this.edges[edge_id] = false;
    }

    get_direction(pred, succ) {
        const pred_pos = this.get_position(pred);
        const succ_pos = this.get_position(succ);
        if (pred_pos.x + 1 == succ_pos.x)
            return RIGHT;
        if (pred_pos.x - 1 == succ_pos.x)
            return LEFT;
        if (pred_pos.y - 1 == succ_pos.y)
            return UP;
        if (pred_pos.y + 1 == succ_pos.y)
            return DOWN;
        return INVALID;
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

    printLog() {
        console.log("Create a maze with " + String(this.width) + " x " + String(this.height) + " cells")
    }

}

function generate_maze_random(x, y, threshold) {
    let maze = new Maze(x, y);
    for (let i = 0; i < maze.n * 2; ++i) {
        let p = Math.random();
        if (p < threshold)
            maze.edges[i] = false;
    }
    return maze;
}

function generate_maze_dpf(x, y) {
    let maze = new Maze(x, y);
    let visited = new Array(maze.n).fill(false);
    maze.edges.fill(false);
    const initial_cell = maze.get_cell_id(0, 0);
    let stack = new Array();
    visited[initial_cell] = true;
    stack.push(initial_cell);
    console.log(stack.length);
    // return maze;
    const max_it = 2000;
    let it = 0;
    while (stack.length != 0) {
        console.log("Iteration " + String(it) + " " + String(stack.length));
        if (it > max_it)
            break;
        ++it;
        console.log("  stack length " + String(stack.length));
        let cell = stack.pop();
        console.log("  stack length " + String(stack.length));
        let successors = maze.get_successors(cell);
        let unexplored = new Array();
        for (let i = 0; i < successors.length; ++i) {
            const successor = successors[i]
            if (!visited[successor]) {
                unexplored.push(successor);
            }
        }
        console.log(" length unexplored " + String(unexplored.length));

        if (unexplored.length != 0) {
            stack.push(cell);
            const selected_cell = unexplored[Math.floor(Math.random() * unexplored.length)];
            console.log(" selected_cell " + String(selected_cell));
            maze.set_free(cell, selected_cell);
            visited[selected_cell] = true;
            stack.push(selected_cell);
        }

    }
    for (let i = 0; i < maze.n * 2; ++i) {
        console.log("Edge " + String(i) + " " + String(maze.edges[i]));
    }
    return maze;
}

function visualize_maze(maze) {
    const container = document.querySelector(".maze");
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
            if (!maze.is_free(cell_id, DOWN)) {
                cell.style.borderBottom = "4px solid black";
            } else {
                cell.style.borderBottom = "4px solid lightgrey";
            }
            if (!maze.is_free(cell_id, RIGHT)) {
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

function draw_position(maze, x, y, color = "green") {
    const cell_id = maze.get_cell_id(x, y);
    const cell = document.querySelector(".cell" + String(cell_id));
    cell.style.backgroundColor = color;
}

function clear_position(maze, x, y) {
    const cell_id = maze.get_cell_id(x, y);
    const cell = document.querySelector(".cell" + String(cell_id));
    cell.style.backgroundColor = "white";
}

function get_color(maze, x, y)
{
    const cell_id = maze.get_cell_id(x, y);
    const cell = document.querySelector(".cell" + String(cell_id));
    return cell.style.backgroundColor;
}

function explore_maze(maze, x, y) {
    const source = maze.get_cell_id(x, y);
    // dijkstra algorithm
    const n = maze.n
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

    const max_it = 100;
    let it = 0;
    while (queue.length != 0) {

        if (it > max_it)
            break;
        ++it;
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
        console.log("min element " + String(u))

        // now remove
        if (min_index > -1) {
            queue.splice(min_index, 1);
        }

        const successors = maze.get_moves(u);
        if (successors.length == 0)
            break;
        
        for (let i = 0; i < successors.length; ++i) {
            const v = successors[i];
            if (visited.has(v))
                continue
            console.log(" not visited  " + String(v))
            const cost = distance[u] + 1;
            if (cost < distance[v]) {
                distance[v] = cost;
                predecessor[v] = u;
                visited.add(v);
            }
        }
    }
    return distance.filter( x => x < inf);
}


let reached_goals = 0;
const n_goals = 3;
let goals = new Array(n_goals);

function generate_game()
{
    reached_goals = 0;
    let maze = generate_maze_dpf(6, 6);
    const explored = explore_maze(maze, 0, 0);

    // pick three goals
    goals = new Array(n_goals);
    for (let i = 0; i < n_goals; ++i) {
        const selected_cell = explored[Math.floor(Math.random() * explored.length)];
        goals[i] = selected_cell;
    }    
    return maze;
}

maze = generate_game()
let position = new Position(0, 0);
visualize_maze(maze);
let colors = new Array("blue", "purple", "red");

draw_position(maze, position.x, position.y);
for (let i = 0; i < n_goals; ++i) {
    const goal = goals[i]
    const p = maze.get_position(goal);
    draw_position(maze, p.x, p.y, colors[i]);
}    

let previous_color = "white";

function update_position(move) {
    position_id = maze.get_cell_id(position.x, position.y);
    console.log("Move " + String(position.x) + " " + String(position.y) + " " + String(move),)
    successor_id = maze.move(position_id, move);
    draw_position(maze, position.x, position.y, previous_color);
    position = maze.get_position(successor_id);
    console.log("  to " + String(position.x) + " " + String(position.y))
    previous_color = get_color(maze, position.x, position.y);
    draw_position(maze, position.x, position.y, "green");
    if (successor_id == goals[reached_goals]) {
        ++reached_goals;
        previous_color = "white"
    }
    if (reached_goals == n_goals)
    {
        alert("You win!");
        }
}


const clearMaze = document.getElementById('clear');
clearMaze.addEventListener('click', () => {
    
    clear_position(maze, position.x, position.y);
    const div = document.querySelector(".maze");
    while (div.firstChild) {
        div.removeChild(div.firstChild);
    }
    maze = generate_game()
    position = new Position(0, 0);
    visualize_maze(maze);
    for (let i = 0; i < n_goals; ++i) {
        const goal = goals[i]
        const p = maze.get_position(goal);
        draw_position(maze, p.x, p.y, colors[i]);
    }
    position = new Position(0, 0);
    draw_position(maze, position.x, position.y);
});

const moveLeft = document.getElementById('left');
moveLeft.addEventListener('click', () => {
    const move = LEFT;
    update_position(move);
});


const moveRight = document.getElementById('right');
moveRight.addEventListener('click', () => {
    const move = RIGHT;
    update_position(move);
});

const moveUp = document.getElementById('up');
moveUp.addEventListener('click', () => {
    const move = UP;
    update_position(move);
});

const moveDown = document.getElementById('down');
moveDown.addEventListener('click', () => {
    const move = DOWN;
    update_position(move);
});

addEventListener('keydown', function (e) {
    let move = LEFT;
    switch (e.keyCode) {
        case 37:
            move = LEFT;
            break;
        case 38:
            move = UP;
            break;
        case 39:
            move = RIGHT;
            break;
        case 40:
            move = DOWN;
            break;
        default:
            break;
    }
    update_position(move);
});

