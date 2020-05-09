var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(90, 1, 0.1, 1000);
var renderer = new THREE.WebGLRenderer();
renderer.setSize(640, 640);
document.getElementById("euler").appendChild( renderer.domElement );

var geometry = new THREE.BoxGeometry();
var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
var cube = new THREE.Mesh( geometry, material );
scene.add( cube );

camera.position.z = 5;

function animate() {
    requestAnimationFrame( animate );
    renderer.render( scene, camera );
}

animate();