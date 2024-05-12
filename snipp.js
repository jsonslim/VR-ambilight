const robot = require("robotjs");

function captureScreenArea() {
	// const img = robot.screen.capture(x, y, width, height);
    
    console.log(robot.getScreenSize()) // gets wrong value
}

captureScreenArea()