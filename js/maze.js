class Maze {
    constructor(width, height){
        this.width = width;
        this.height = height;
        this.n = this.width * this.height;
        this.edges = new Array(this.n * 2);
    }

    printLog()
    {
        console.log("Create a maze with " + String(this.width) + " x " +  String(this.height) + " cells")
    }
}
  
export {Maze}
  