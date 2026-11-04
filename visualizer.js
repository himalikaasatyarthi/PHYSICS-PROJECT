import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export function createVisualizer(container) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0d1525);

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(8, 7, 9);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.target.set(0, 0, 0);

  scene.add(new THREE.AmbientLight(0xffffff, 1.5));
  const light = new THREE.DirectionalLight(0xffffff, 1.5);
  light.position.set(5, 8, 6);
  scene.add(light);

  const grid = new THREE.GridHelper(10, 20, 0x3b5478, 0x263650);
  scene.add(grid);

  // Three.js uses Y as its vertical axis. We map the physics Z axis to Three.js Y.
  const axes = new THREE.Group();
  const axisLength = 5.4;
  function addAxis(start, end, color) {
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([start, end]),
      new THREE.LineBasicMaterial({ color })
    );
    axes.add(line);
  }
  addAxis(new THREE.Vector3(-axisLength, 0, 0), new THREE.Vector3(axisLength, 0, 0), 0xff7185); // X
  addAxis(new THREE.Vector3(0, -axisLength, 0), new THREE.Vector3(0, axisLength, 0), 0x58dfb2); // Z (vertical)
  addAxis(new THREE.Vector3(0, 0, -axisLength), new THREE.Vector3(0, 0, axisLength), 0x65a9ff); // Y
  scene.add(axes);

  const point = new THREE.Mesh(
    new THREE.SphereGeometry(0.13, 24, 24),
    new THREE.MeshStandardMaterial({ color: 0xffd36e, emissive: 0x5b3b09, roughness: 0.35 })
  );
  scene.add(point);

  const pointGlow = new THREE.PointLight(0xffc95c, 1.5, 3);
  scene.add(pointGlow);

  const radiusLine = new THREE.Line(
    new THREE.BufferGeometry(),
    new THREE.LineDashedMaterial({ color: 0xffd36e, dashSize: 0.12, gapSize: 0.08 })
  );
  scene.add(radiusLine);

  const projectionMaterial = new THREE.LineDashedMaterial({ color: 0x8b9bb5, dashSize: 0.1, gapSize: 0.08 });
  const projections = new THREE.Group();
  const projectionLines = [];
  for (let i = 0; i < 3; i++) {
    const line = new THREE.Line(new THREE.BufferGeometry(), projectionMaterial);
    projections.add(line);
    projectionLines.push(line);
  }
  scene.add(projections);

  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(1, 24, 16),
    new THREE.MeshBasicMaterial({ color: 0x9d7bff, wireframe: true, transparent: true, opacity: 0.13 })
  );
  sphere.scale.setScalar(0.001);
  scene.add(sphere);

  function setLine(line, points) {
    line.geometry.dispose();
    line.geometry = new THREE.BufferGeometry().setFromPoints(points);
    if (line.material.isLineDashedMaterial) line.computeLineDistances();
  }

  function setPoint(x, y, z) {
    // Physics (x,y,z) -> Three.js (x,z,-y), so the vertical axis is visually upright.
    const p = new THREE.Vector3(x, z, -y);
    point.position.copy(p);
    pointGlow.position.copy(p);

    setLine(radiusLine, [new THREE.Vector3(0, 0, 0), p]);
    setLine(projectionLines[0], [p, new THREE.Vector3(x, 0, -y)]);
    setLine(projectionLines[1], [new THREE.Vector3(x, 0, -y), new THREE.Vector3(x, 0, 0)]);
    setLine(projectionLines[2], [p, new THREE.Vector3(0, z, 0)]);
    sphere.scale.setScalar(Math.max(0.001, p.length()));
  }

  function showGrid(visible) { grid.visible = visible; }
  function showProjections(visible) { projections.visible = visible; }

  function resetView() {
    camera.position.set(8, 7, 9);
    controls.target.set(0, 0, 0);
    controls.update();
  }

  function resize() {
    const width = container.clientWidth;
    const height = container.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }
  const observer = new ResizeObserver(resize);
  observer.observe(container);

  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  return { setPoint, showGrid, showProjections, resetView };
}
