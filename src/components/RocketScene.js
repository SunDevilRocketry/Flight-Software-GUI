import * as THREE from 'three';

function RocketSilhouette() {
  // Scene setup
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Rocket body (cylinder)
  const bodyGeometry = new THREE.CylinderGeometry(0.5, 0.5, 3, 32);
  const bodyMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 }); // Black for silhouette
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.y = 1.5; // Position it above the ground

  // Rocket fins (cones)
  const finGeometry = new THREE.ConeGeometry(0.3, 1, 4);
  const finMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const fin1 = new THREE.Mesh(finGeometry, finMaterial);
  const fin2 = new THREE.Mesh(finGeometry, finMaterial);
  fin1.rotation.z = Math.PI / 4;
  fin2.rotation.z = -Math.PI / 4;
  fin1.position.set(-0.6, -0.5, 0);
  fin2.position.set(0.6, -0.5, 0);

  // Rocket nose (cone)
  const noseGeometry = new THREE.ConeGeometry(0.5, 1, 32);
  const noseMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const nose = new THREE.Mesh(noseGeometry, noseMaterial);
  nose.position.y = 2.75; // Position it at the top of the rocket

  // Add all components to the scene
  scene.add(body);
  scene.add(fin1);
  scene.add(fin2);
  scene.add(nose);

  // Camera position
  camera.position.z = 5;

  // Animation loop
  function animate() {
    requestAnimationFrame(animate);

    // Render the scene
    renderer.render(scene, camera);
  }

  animate();
}

export default RocketSilhouette;