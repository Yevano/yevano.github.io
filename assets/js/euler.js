import {
    drawGeometry
} from "/assets/js/geometry.js";

var canvas = document.querySelector("#euler");
var gl = canvas.getContext("webgl2");
drawGeometry(gl);