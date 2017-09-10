function generateSteps(level, xMargin, treeHeight) {
    var width = level[0].length;
    var height = level.length;
    var leftX = xMargin;
    var rightX = width - xMargin;
    var isLeft = true;
    var minPlatWidth = ~~(width / 5);
    var maxPlatWidth = ~~(width / 4);
    var minYDist = treeHeight; // Holds where to generate the next step.
    var maxYDist = ~~(1.5 * treeHeight);
    var startY = height - 2;
    var stepWidth, startX, yStep;
    var firstTime = true;
    var lastPlaced = 0;
    var cloudDistance = 10;
    while (startY > 5) { // Add standing steps at regular intervals
        // Place platform
        stepWidth = ~~(minPlatWidth + Math.random() * (maxPlatWidth - minPlatWidth));
        if (isLeft) {
            startX = leftX;
        } else {
            startX = rightX - stepWidth;
        }
        for (var i = 0; i < stepWidth; i++) {
            level[startY][startX + i] = "x";
        }
        if (firstTime) {
            level[startY][startX] = "@"; // Place the player at the bottom most board.
            firstTime = false;
        }
        isLeft = !isLeft;

        if (startY > height / 2) {
            level[startY - 1][startX + 1] = "t";
        } else {
            level[startY - 1][startX + 1] = "T";
        }
        if ((startY < .75 * height) && lastPlaced > cloudDistance) {
            level[startY][~~(width / 2)] = "C";
            lastPlaced = 0;
        }
        nextY = ~~(minYDist + Math.random() * (maxYDist - minYDist));
        startY = startY - nextY - 1;
        lastPlaced = lastPlaced + nextY + 1;
    }
    // Set the winning goal character.
    level[2][~~(width / 2)] = "g";
    return level;
}

function generateAirBasicLevel(width, height, xMargin, treeHeight) {
    var startX = xMargin;
    var endX = width - 2 * xMargin;

    var level = [];
    for (var y = 0; y < height; y++) {
        var columns = [];
        for (var x = 0; x < width; x++) {
            if ((x > endX) || (x < startX)) { // Mountain left and right
                columns.push("x");
            } else if (y == height - 1) { // Ground
                columns.push("x");
            } else {
                columns.push(" "); // Everything else is initially empty.
            }
        }
        level.push(columns);
    }

    level = generateSteps(level, xMargin, treeHeight);
    return level;
}

function AirPlayer(pos) {
    PlayerPlatformer.call(this, pos);
    this.drawLast = true;
    this.health = 100;
    this.flyPower = 1000;
    this.fly = true;
}

AirPlayer.prototype = Object.create(PlayerPlatformer.prototype);

function AirGem(pos) {
    Gem.call(this, pos, "AirGem", "#DCDCDC", "#ECECEC", "air gem.");
}

AirGem.prototype = Object.create(Gem.prototype);

function EvilCloud(pos) {
    var xSize = ~~(2 + Math.random() * 5); // Size between 2 to 7.
    var ySize = 1;
    var size = new Vector(xSize, ySize);
    var speedX = ~~~(5 + Math.random() * 5); // Speed bw 2 to 7.
    this.speed = new Vector(speedX, 0);
    this.size = size;
    this.pos = pos;
    this.type = "EvilCloud";
}

// Called at every step of the animate.
EvilCloud.prototype.act = function(step, level) {
    var newPos = this.pos.plus(this.speed.times(step)); // Calculate newPos
    if (!level.collisionWith(newPos, this.size, "obstacle")) { // If no obstacle set newPos
        this.pos = newPos
    } else {
        this.speed = this.speed.times(-1); // Reverse direction if obstacle.
    }
};

EvilCloud.prototype.draw = function(cx, x, y) {
    cx.save();
    cx.fillStyle = "grey";
    cx.fillRect(x, y, this.size.x * Game.scale, this.size.y * Game.scale);
    cx.restore();
}

function Tree(pos, character) {
    this.pos = pos;
    this.size = new Vector(3, 12);
    this.horizBranchNos = 1 + getRandomElement([2, 4])
    this.vertBranchNos = 2 + ~~(Math.random() * 4);
    this.treeColor = "green";
}

Tree.prototype.type = "tree";
Tree.prototype.act = function(step, level) {

};

Tree.prototype.draw = function(cx, x, y) {
    cx.save();
    //console.log(this.pos.x * Game.scale + " " + this.pos.y * Game.scale + " " + x + " " + y);   
    drawTree(cx, x, y + (1 * Game.scale), this.horizBranchNos, this.vertBranchNos, this.treeColor);
    cx.restore();
}


function ConiTree(pos) {
    var xSize = 4;
    var ySize = 10;
    var size = new Vector(xSize, ySize);
    Tree.call(this, pos, size);
}

ConiTree.prototype = Object.create(Tree.prototype);

ConiTree.prototype.draw = function(cx, x, y) {
    cx.save();
    drawTree(cx, x, y + (2 * Game.scale));
    cx.restore();
}

var airLevelBackgroundChars = {
    "x": "wall"
};


var airLevelActorChars = {
    "@": AirPlayer,
    "t": Tree,
    "T": ConiTree,
    "C": EvilCloud,
    "g": AirGem
};

var xMargin = 1;
var treeHeight = 5;
var airLevelMap = generateAirBasicLevel(50, 60, xMargin, treeHeight);

var airLevel = new LevelInfo(LEVEL_TYPE.PLATFORMER, airLevelMap, airLevelBackgroundChars, airLevelActorChars);
airLevel.display = CanvasDisplay;
airLevel.platformerType = "vertical";

airLevel.drawBackground = function(backgroundChar, cx, x, y) {
    if (backgroundChar == "wall") {
        cx.fillStyle = "gold";
        cx.fillRect(x, y, Game.scale + 1, Game.scale + 1);
    } else if (backgroundChar == "fierceRiver") {
        cx.fillStyle = "green";
        cx.fillRect(x, y, Game.scale + 1, Game.scale + 1);
    }
};

airLevel.playerTouched = function(type, actor, level) {
    if (type == "fierce river" && level.status == null) {
        Game.hud.setGameMessage("You crashed into the abyss.");
        return "lost";
    } else if (type == "AirGem") { //Filter the coin from actor list as it is picked
        level.actors = level.actors.filter(function(inDivActor) {
            return inDivActor != actor;
        });
        Game.hud.setGameMessage(actor.winMessage);
        return "won";
    } else if (type == "EvilCloud") {
        reducePlayerHealth(50, level, "Beware of the Evil Cloud.");
    }
    if (level.player.health <= 0 && level.status == null) {
        return "lost"
    }
}