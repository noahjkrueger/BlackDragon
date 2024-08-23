import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';



const scene = new THREE.Scene();
const c_white = new THREE.Color(0xffffff);
scene.background = c_white;

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.getElementById("canvas").appendChild( renderer.domElement );

const loader = new GLTFLoader();
loader.load( '../img/Dragon_Emblem.glb', function (gltf) {
	scene.add(gltf.scene);
}, undefined, function ( error ) {
	console.error( error );
} );

// const geometry = new THREE.BoxGeometry( 2, 2, 2 );
// const material = new THREE.MeshBasicMaterial( { color: 0xffffff } );
// const cube = new THREE.Mesh( geometry, material );
// scene.add( cube );
camera.position.z = 2.5;

function animate() {
    // cube.rotation.x += 0.01;
    // cube.rotation.y += 0.01;
	renderer.render( scene, camera );
}
renderer.setAnimationLoop( animate );