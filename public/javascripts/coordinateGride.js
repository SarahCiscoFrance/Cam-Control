const c = document.querySelector(`#canvas`),
    ctx = c.getContext(`2d`),
    coordinate_indicator = document.querySelector(`#coordinate`);

let c_width = c.width,
    c_height = c.height,
    squares_per = 25;

const c_center = [c_width/2, c_height/2],
      step = c_center[0] / squares_per;

ctx.beginPath();
ctx.fillStyle = `#111`;
ctx.moveTo(0,0);
ctx.rect(0, 0, c_width, c_height);
ctx.fill();

// Grid
ctx.lineWidth = 0.25;
ctx.strokeStyle = `#0f9d5880`;

// Horizontal Lines
ctx.beginPath();
ctx.moveTo(0,0); let it = 0;
while( it < c_height ) {
    ctx.lineTo(c_width, it);
    it += step;
    ctx.moveTo(0, it);
}
ctx.stroke(); it = 0;

// Vertical Lines
ctx.beginPath();
ctx.moveTo(0,0);
while( it < c_width ) {
    ctx.lineTo(it, c_height);
    it += step;
    ctx.moveTo(it, 0);
}
ctx.stroke(); it = 0;

// Axises
ctx.lineWidth = 2;
ctx.strokeStyle = `#0f9d58`;

// Horizontal Axis
let xOffsetTop = step * Math.round(c_height / step / 2);
ctx.beginPath();
ctx.moveTo(0, xOffsetTop);
ctx.lineTo(c_width, xOffsetTop);
ctx.stroke();

// Vertical Axis
let yOffsetLeft = c_center[0];
ctx.beginPath();
ctx.moveTo(yOffsetLeft,0);
ctx.lineTo(yOffsetLeft, c_height);
ctx.stroke();


// Cursor and coordinates
const positionSyncMouse = (elem, mouse) => {
    elem.style.left = `${mouse.pageX}px`;
    elem.style.top = `${mouse.pageY}px`;
    elem.innerHTML = `${-(mouse.offsetX - yOffsetLeft)},${-Math.round(mouse.offsetY - xOffsetTop)}`;
}

// c.onmouseenter = (event) => {
//     document.body.style.cursor = `crosshair`;
//     coordinate_indicator.classList.add(`show`);
//     positionSyncMouse(coordinate_indicator, event);
// }

// c.onmouseleave = () => {
//     document.body.style.cursor = `default`;
//     coordinate_indicator.classList.remove(`show`);
// }

c.onmousemove = (event) => {  
  positionSyncMouse(coordinate_indicator, event);
}

// c.onclick = (event) => {
//     var rect = c.getBoundingClientRect();
//     var x = event.clientX - rect.left;
//     var y = event.clientY - rect.top;
//     console.log(coordinate_indicator.innerHTML);
//     drawCoordinates(x,y);
// }


var pointSize = 3;
let cw = c.width;
let ch = c.height;

function drawCoordinates(x,y){	
    var ctx = document.getElementById("canvas").getContext("2d");
        //clear the canvas
        ctx.clearRect(0, 0, cw, ch);
        recreateGride();

    ctx.fillStyle = "#ff2626"; // Red color

  ctx.beginPath();
  ctx.arc(x, y, pointSize, 0, Math.PI * 2, true);
  ctx.fill();
}


function recreateGride() {
    ctx.beginPath();
ctx.fillStyle = `#111`;
ctx.moveTo(0,0);
ctx.rect(0, 0, c_width, c_height);
ctx.fill();

// Grid
ctx.lineWidth = 0.25;
ctx.strokeStyle = `#0f9d5880`;

// Horizontal Lines
ctx.beginPath();
ctx.moveTo(0,0); let it = 0;
while( it < c_height ) {
    ctx.lineTo(c_width, it);
    it += step;
    ctx.moveTo(0, it);
}
ctx.stroke(); it = 0;

// Vertical Lines
ctx.beginPath();
ctx.moveTo(0,0);
while( it < c_width ) {
    ctx.lineTo(it, c_height);
    it += step;
    ctx.moveTo(it, 0);
}
ctx.stroke(); it = 0;

// Axises
ctx.lineWidth = 2;
ctx.strokeStyle = `#0f9d58`;

// Horizontal Axis
let xOffsetTop = step * Math.round(c_height / step / 2);
ctx.beginPath();
ctx.moveTo(0, xOffsetTop);
ctx.lineTo(c_width, xOffsetTop);
ctx.stroke();

// Vertical Axis
let yOffsetLeft = c_center[0];
ctx.beginPath();
ctx.moveTo(yOffsetLeft,0);
ctx.lineTo(yOffsetLeft, c_height);
ctx.stroke();
}