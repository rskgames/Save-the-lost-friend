function generateRiverBasicLevel(width, height, xMargin) {
    var startX = xMargin;
    var endX = width - 2 * xMargin;

    var level = [];
    for (var y = 0; y < height; y++) {
        var columns = [];
        for (var x = 0; x < width; x++) {
            if ((x > endX) || (x < startX)) { // River bank.
                columns.push("x");
            } else if (y == height - 1) { // River Bank
                columns.push("x");
            } else {
                columns.push(" "); // Everything else is initially empty.
            }
        }
        level.push(columns);
    }

    return level;
}

function generateRiverLevelWithObstacles(level) {
    var width = level[0].length;
    var height = level.length;
    var xMargin = 1;
    var endX = width - xMargin;

    var startY = height - 2;
    var startX;
    var firstTime = true;

    while (startY > 1) { // Add standing pfs at regular intervals
        // Place platform
        startX = ~~(xMargin + Math.random() * (endX - xMargin - 10));
        level[startY][startX] = "n";
        if (firstTime) {
            level[startY][startX + 1] = "@"; // Place the player at the bottom most board.
            firstTime = false;
        }
        startY = startY - 2;
        // Place a moving log on this row.
        if (startY < 2) {
            break;
        }
        startX = ~~(xMargin + Math.random() * (endX - xMargin - 10));
        level[startY][startX] = "|";
        startY = startY - 2;
    }
    // Place a moving log at first posn/
    startX = ~~(xMargin + Math.random() * (endX - xMargin - 10));
    level[1][startX] = "|";
    // Set the winning goal character.
    level[0][~~(width / 2)] = "#";
    return level;
}


var xMargin = 1;
var riverLevelMap = generateRiverLevelWithObstacles(generateRiverBasicLevel(50, 60, xMargin));

function RiverPlayer(pos) {
    PlayerNonPlatformer.call(this, pos);
    this.health = 50;
}

RiverPlayer.prototype = Object.create(PlayerNonPlatformer.prototype);

RiverPlayer.prototype.move = function(step, level, keys) {
    if (!this.inCollision) {
        this.speed.x = 0;
        this.speed.y = 0;
    }
    var PLAYER_NON_PLATFORM_SPEED = 4;
    if (keys.left) {
        if (this.inCollision) {
            this.speed.x += -1 * PLAYER_NON_PLATFORM_SPEED;
        } else {
            this.speed.x = -1 * PLAYER_NON_PLATFORM_SPEED;
        }
        this.facingRight = false;

    }
    if (keys.right) {
        if (this.inCollision) {
            this.speed.x += PLAYER_NON_PLATFORM_SPEED;
        } else {
            this.speed.x = PLAYER_NON_PLATFORM_SPEED;
        }
        this.facingRight = true;
    }
    if (keys.up) {
        this.speed.y = -1 * PLAYER_NON_PLATFORM_SPEED;
        this.facingUp = true;
    }
    if (keys.down) {
        this.speed.y = PLAYER_NON_PLATFORM_SPEED;
        this.facingUp = false;
    }

    var motion = new Vector(this.speed.x * step, this.speed.y * step);
    var newPos = this.pos.plus(motion);
    this.checkCollision(newPos, level);
};

RiverPlayer.prototype.checkCollision = function(newPos, level) {
    var obstacle = level.collisionWith(newPos, this.size, "obstacle")
    if (!obstacle) {
        this.newPos = newPos;
    } else {
        this.newPos = this.pos;
    }
}

RiverPlayer.prototype.act = function(step, level, keys) {
    if (!Game.inInteraction) {
        this.move(step, level, keys);
    }
    // Check for collisions with dynamic layer.
    var collidedObject = level.actorAt(this);
    if (collidedObject) {
        if (collidedObject.speed) {
            this.speed.x = collidedObject.speed.x;
            this.speed.y = collidedObject.speed.y;
        }
        this.pos = this.newPos;
        this.inCollision = true;
        if (collidedObject.type == "WinningGoal") {
            level.playerTouched("WinningGoal", null);
        }
    } else {
        this.inCollision = false;
        level.playerTouched("fierce river", null);
    }
    if (level.status == "lost") { // Losing animation.
        this.pos.y += step;
        this.size.y -= step;
    }

    var triggerObject = level.collisionWith(this.pos, this.size, "trigger");
    if (triggerObject) {
        level.levelInfo.playerInteract(triggerObject, level);
    } else {
        Game.inGameMessage = false;
    }
    if (level.player.playerHitTimer > 0) {
        level.player.playerHitTimer--;
    }
    if (level.player.skipDialogTimer > 0) {
        level.player.skipDialogTimer--;
    }
};

var riverLevelBackgroundChars = {
    "x": "wall"
};

var riverLevelActorChars = {
    "@": RiverPlayer,
    "n": StandingPlatform,
    "|": MovingLog,
    "g": RiverGem
};

function RiverGem(pos) {
    Gem.call(this, pos, "FireStoneGem", "#FE7777", "#FE2222", "river gem.");
}

RiverGem.prototype = Object.create(Gem.prototype);

function RiverObject(pos, type, color, size) {
    this.pos = pos;
    this.type = type;
    this.size = size;
    this.color = color;
}

RiverObject.prototype.draw = function(cx, x, y) {
    cx.save();
    cx.fillStyle = this.color;
    cx.fillRect(x, y, this.size.x * Game.scale, this.size.y * Game.scale);
    cx.restore();
}

RiverObject.prototype.act = function(step, level) {

}

function MovingLog(pos) {
    var xSize = ~~(2 + Math.random() * 5); // Size between 2 to 7.
    var ySize = 1;
    var size = new Vector(xSize, ySize);
    var speedX = ~~~(5 + Math.random() * 5); // Speed bw 2 to 7.
    this.speed = new Vector(speedX, 0);
    RiverObject.call(this, pos, "MovingLog", "brown", size);
}

MovingLog.prototype = Object.create(RiverObject.prototype);


// Called at every step of the animate.
MovingLog.prototype.act = function(step, level) {
    var newPos = this.pos.plus(this.speed.times(step)); // Calculate newPos
    if (!level.collisionWith(newPos, this.size, "obstacle")) { // If no obstacle set newPos
        this.pos = newPos
    } else {
        this.speed = this.speed.times(-1); // Reverse direction if obstacle.
    }
};

function StandingPlatform(pos) {
    var xSize = ~~(3 + Math.random() * 7); // Size between 3 to 10.
    var ySize = 1;
    var size = new Vector(xSize, ySize);
    RiverObject.call(this, pos, "StandingPlatform", "grey", size);
    this.speed = new Vector(0, 0);
}

StandingPlatform.prototype = Object.create(RiverObject.prototype);

function ModCanvasDisplay(parent, level) {
    console.log("Mod canvas called");
    CanvasDisplay.call(this, parent, level);
}
ModCanvasDisplay.prototype = Object.create(CanvasDisplay.prototype);

ModCanvasDisplay.prototype.drawActors = function() {
    this.level.actors.forEach(function(actor) {
        var width = actor.size.x * Game.scale;
        var height = actor.size.y * Game.scale;
        var x = (actor.pos.x - this.viewport.left) * Game.scale;
        var y = (actor.pos.y - this.viewport.top) * Game.scale;
        if (actor.type != "player")
            actor.draw(this.cx, x, y);
    }, this);
    var x = (this.level.player.pos.x - this.viewport.left) * Game.scale;
    var y = (this.level.player.pos.y - this.viewport.top) * Game.scale;
    this.level.player.draw(this.cx, x, y);
}

var riverLevel = new LevelInfo(LEVEL_TYPE.PLATFORMER, riverLevelMap, riverLevelBackgroundChars, riverLevelActorChars);
riverLevel.display = ModCanvasDisplay;
riverLevel.platformerType = "vertical";

riverLevel.drawBackground = function(backgroundChar, cx, x, y) {
    if (backgroundChar == "wall") {
        cx.fillStyle = "gold";
        cx.fillRect(x, y, Game.scale + 1, Game.scale + 1);
    } else if (backgroundChar == "fierceRiver") {
        cx.fillStyle = "green";
        cx.fillRect(x, y, Game.scale + 1, Game.scale + 1);
    }
};

riverLevel.playerTouched = function(type, actor, level) {
    if (type == "fierce river" && level.status == null) {
        Game.hud.setGameMessage("Drowned in the fierce river.");
        return "lost";
    } else if (type == "RiverGem") { //Filter the coin from actor list as it is picked
        level.actors = level.actors.filter(function(inDivActor) {
            return inDivActor != actor;
        });
        Game.hud.setGameMessage(actor.winMessage);
        return "won";
    }
}