import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
const canvas = document.getElementById("3D-canvas");

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 3);

const light1 = new THREE.PointLight(0xffffff, 100);
light1.position.set(2.5, 2.5, 2.5);
scene.add(light1);

const light2 = new THREE.PointLight(0xffffff, 100);
light2.position.set(-2.5, 2.5, 2.5);
scene.add(light2);

const renderer = new THREE.WebGLRenderer();
canvas.appendChild(renderer.domElement);

// const controls = new OrbitControls(camera, renderer.domElement);
// controls.enableDamping = true;

const loader = new GLTFLoader();
loader.load( '../img/Dragon_Emblem_2.glb', 
	function (gltf) {
		const model = gltf.scene;
		scene.add(model);
		// Set the model's initial position
		const not_mobile = canvas.clientWidth > 800
		const xoffset = not_mobile ?  -2 : 0.5;
		const zoffset = not_mobile ?  0 : -2;
		const yoffset = not_mobile ?  0 : 2;
		model.position.set(xoffset, yoffset, zoffset);
		// Animate the model
		const animate = () => {
		requestAnimationFrame(animate);
			// Rotate the model
			model.rotation.y += 0.01;
			model.rotation.x -= 0.01; // Adjust the rotation speed as needed
			// controls.update();
			renderer.render(scene, camera);
			renderer.setSize((not_mobile ? 2 : 1) * canvas.clientWidth, canvas.clientHeight);
		};
		animate();
	}, undefined, function ( error ) {
	console.error( error );
});

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});