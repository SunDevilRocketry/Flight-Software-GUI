import * as THREE from 'three';
import { useEffect, useRef } from "react";

function MyThree() {
  const refContainer = useRef(null);
  const rendererRef = useRef(null); 

  useEffect(() => {
    if (!refContainer.current) return;

    // Get container dimensions
    const width = refContainer.current.clientWidth;
    const height = refContainer.current.clientHeight;

    // Create Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    rendererRef.current = renderer; // Store renderer reference

    refContainer.current.appendChild(renderer.domElement);

    // Create a rotating cube
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    camera.position.z = 5;

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      cube.rotation.x += 0.01;
      cube.rotation.y += 0.01;
      renderer.render(scene, camera);
    };
    animate();

    // Resize handling
    const handleResize = () => {
      if (refContainer.current) {
        const newWidth = refContainer.current.clientWidth;
        const newHeight = refContainer.current.clientHeight;
        renderer.setSize(newWidth, newHeight);
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
      }
    };
    
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      refContainer.current?.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  return <div ref={refContainer} className="w-full h-full" />;
}

export default MyThree;