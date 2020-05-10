require("/assets/js/three.js");

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(90, 1, 0.1, 1000);
var renderer = new THREE.WebGLRenderer();
renderer.setSize(640, 640);
document.getElementById("euler").appendChild( renderer.domElement );

var material = new THREE.LineBasicMaterial({ color: 0x00ff00 });
var geometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-0.5, 0, 0),
    new THREE.Vector3(0.5, 0, 0)
]);

scene.add(new THREE.Line(geometry, material));

camera.position.z = 5;

function animate() {
    requestAnimationFrame( animate );
    renderer.render( scene, camera );
}

animate();