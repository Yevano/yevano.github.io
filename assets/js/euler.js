import {
    Geometry
} from "/assets/js/geometry.js";

var canvas = document.querySelector("#euler");
var gl = canvas.getContext("webgl2");
var geometry = new Geometry(gl);
geometry.createAxisRadiusCircle([0, 0, 1], 1);
geometry.drawGeometry();