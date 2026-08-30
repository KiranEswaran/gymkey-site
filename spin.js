import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { STLLoader } from "three/addons/loaders/STLLoader.js";

const spinSection = document.querySelector("[data-spin-section]");
const modelStage = document.querySelector("[data-model-stage]");
const canvas = document.querySelector("[data-model-canvas]");
const modelStatus = document.querySelector("[data-model-status]");
const spinProgress = document.querySelector("[data-spin-progress]");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

if (spinSection && modelStage && canvas) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(31, 1, 0.1, 500);
  const product = new THREE.Group();
  const baseRotation = new THREE.Euler(-0.12, -0.28, -0.08);
  const loader = new STLLoader();

  let renderer;
  let controls;
  let frame = null;
  let isVisible = false;
  let isReady = false;
  let scrollRotation = 0;
  let manualRotationX = 0;
  let manualRotationY = 0;
  let orbitChanges = 0;

  const setStatus = (message) => {
    if (modelStatus) modelStatus.textContent = message;
  };

  const resize = () => {
    if (!renderer) return;
    const bounds = modelStage.getBoundingClientRect();
    const width = Math.max(1, Math.round(bounds.width));
    const height = Math.max(1, Math.round(bounds.height));
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.position.z = camera.aspect < 0.72 ? 150 : 136;
    camera.updateProjectionMatrix();
  };

  const updateScrollRotation = () => {
    const bounds = spinSection.getBoundingClientRect();
    const travel = Math.max(1, spinSection.offsetHeight - window.innerHeight);
    const progress = THREE.MathUtils.clamp(-bounds.top / travel, 0, 1);
    scrollRotation = reducedMotion.matches ? 0 : progress * Math.PI * 2;
    modelStage.dataset.scrollProgress = progress.toFixed(4);
    modelStage.dataset.scrollTurns = (scrollRotation / (Math.PI * 2)).toFixed(4);
    if (spinProgress) spinProgress.style.transform = `scaleX(${progress.toFixed(4)})`;
  };

  const render = () => {
    frame = null;
    if (!renderer || !isReady) return;

    const targetX = baseRotation.x + manualRotationX;
    const targetY = baseRotation.y + manualRotationY + scrollRotation;
    product.rotation.x = THREE.MathUtils.lerp(product.rotation.x, targetX, 0.08);
    product.rotation.y = THREE.MathUtils.lerp(product.rotation.y, targetY, 0.08);

    controls?.update();
    renderer.render(scene, camera);

    if (isVisible) frame = window.requestAnimationFrame(render);
  };

  const requestRender = () => {
    if (frame === null) frame = window.requestAnimationFrame(render);
  };

  const makeMesh = (geometry, material, position = [0, 0, 0]) => {
    geometry.computeVertexNormals();
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...position);
    return mesh;
  };

  const addKeyring = (group) => {
    const metal = new THREE.MeshPhysicalMaterial({
      color: 0xd8d9d5,
      metalness: 1,
      roughness: 0.22,
      clearcoat: 0.45,
      clearcoatRoughness: 0.2,
    });
    const rubber = new THREE.MeshPhysicalMaterial({
      color: 0x10110f,
      metalness: 0,
      roughness: 0.82,
      clearcoat: 0.08,
      clearcoatRoughness: 0.8,
    });

    const ring = new THREE.Mesh(new THREE.TorusGeometry(8.25, 0.66, 20, 96), metal);
    ring.position.set(-27.4, 33.1, 2.8);
    ring.rotation.set(0.14, -0.06, -0.16);
    group.add(ring);

    const tetherPath = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-14.8, 20.8, 4.25),
      new THREE.Vector3(-15.7, 24.3, 5.8),
      new THREE.Vector3(-18.8, 27.2, 5.05),
      new THREE.Vector3(-22, 28.8, 3.25),
    ]);
    const tether = new THREE.Mesh(new THREE.TubeGeometry(tetherPath, 44, 0.78, 14, false), rubber);
    group.add(tether);
  };

  const initialise = async () => {
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
      renderer.setClearColor(0xffffff, 0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.06;

      camera.position.set(0, 0, 136);
      scene.add(product);

      const hemisphere = new THREE.HemisphereLight(0xffffff, 0x565a52, 1.55);
      const keyLight = new THREE.DirectionalLight(0xffffff, 3.45);
      const fillLight = new THREE.DirectionalLight(0xdde3d7, 1.25);
      const rimLight = new THREE.DirectionalLight(0xc7ff00, 0.18);
      keyLight.position.set(-28, 44, 70);
      fillLight.position.set(36, -18, 58);
      rimLight.position.set(44, 8, -30);
      scene.add(hemisphere, keyLight, fillLight, rimLight);

      const frontMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x0d0e0c,
        metalness: 0.02,
        roughness: 0.68,
        clearcoat: 0.22,
        clearcoatRoughness: 0.64,
      });
      const backMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x090a09,
        metalness: 0.01,
        roughness: 0.78,
        clearcoat: 0.1,
        clearcoatRoughness: 0.76,
      });
      const limeMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x8ec900,
        emissive: 0x0b1600,
        emissiveIntensity: 0.04,
        metalness: 0,
        roughness: 0.3,
        clearcoat: 0.78,
        clearcoatRoughness: 0.18,
      });

      const [backGeometry, frontGeometry, limeGeometry] = await Promise.all([
        loader.loadAsync("assets/models/gymkey_v1_back_shell.stl"),
        loader.loadAsync("assets/models/gymkey_v1_front_shell.stl"),
        loader.loadAsync("assets/models/gymkey_v1_lime_insert.stl"),
      ]);

      product.add(makeMesh(backGeometry, backMaterial));
      product.add(makeMesh(frontGeometry, frontMaterial, [0, 0, 2.55]));
      product.add(makeMesh(limeGeometry, limeMaterial, [0, 12, 5.15]));
      addKeyring(product);

      const productBounds = new THREE.Box3().setFromObject(product);
      const productCentre = productBounds.getCenter(new THREE.Vector3());
      product.children.forEach((child) => child.position.sub(productCentre));
      product.rotation.copy(baseRotation);

      controls = new OrbitControls(camera, canvas);
      controls.enableDamping = true;
      controls.dampingFactor = 0.055;
      controls.enablePan = false;
      controls.rotateSpeed = 0.55;
      controls.zoomSpeed = 0.65;
      controls.minDistance = 76;
      controls.maxDistance = 154;
      controls.minPolarAngle = 0.08;
      controls.maxPolarAngle = Math.PI - 0.08;
      controls.target.set(0, 0, 0);
      controls.update();

      controls.addEventListener("start", () => {
        modelStage.classList.add("is-grabbing");
        requestRender();
      });
      controls.addEventListener("end", () => modelStage.classList.remove("is-grabbing"));
      controls.addEventListener("change", () => {
        orbitChanges += 1;
        modelStage.dataset.orbitChanges = String(orbitChanges);
        requestRender();
      });

      resize();
      updateScrollRotation();
      isReady = true;
      modelStage.classList.add("is-ready");
      modelStage.setAttribute("aria-busy", "false");
      modelStage.dataset.modelState = "ready";
      setStatus("3D ready · drag to spin");
      requestRender();
    } catch (error) {
      modelStage.setAttribute("aria-busy", "false");
      modelStage.classList.add("is-error");
      modelStage.dataset.modelState = "error";
      setStatus("3D preview unavailable");
      console.warn("GymKey 3D preview could not load.", error);
    }
  };

  const observer = new IntersectionObserver(
    ([entry]) => {
      isVisible = entry.isIntersecting;
      if (isVisible) {
        updateScrollRotation();
        requestRender();
      }
    },
    { rootMargin: "25% 0px" },
  );

  observer.observe(spinSection);
  if ("ResizeObserver" in window) {
    new ResizeObserver(() => {
      resize();
      requestRender();
    }).observe(modelStage);
  } else {
    window.addEventListener("resize", () => {
      resize();
      requestRender();
    });
  }

  window.addEventListener(
    "scroll",
    () => {
      updateScrollRotation();
      if (isVisible) requestRender();
    },
    { passive: true },
  );

  canvas.addEventListener("keydown", (event) => {
    const keyStep = Math.PI / 18;
    if (event.key === "ArrowLeft") manualRotationY -= keyStep;
    else if (event.key === "ArrowRight") manualRotationY += keyStep;
    else if (event.key === "ArrowUp") manualRotationX -= keyStep;
    else if (event.key === "ArrowDown") manualRotationX += keyStep;
    else return;

    event.preventDefault();
    modelStage.dataset.keyboardRotationX = manualRotationX.toFixed(4);
    modelStage.dataset.keyboardRotationY = manualRotationY.toFixed(4);
    requestRender();
  });

  const handleMotionPreference = () => {
    updateScrollRotation();
    requestRender();
  };
  if ("addEventListener" in reducedMotion) reducedMotion.addEventListener("change", handleMotionPreference);
  else reducedMotion.addListener(handleMotionPreference);

  initialise();
}
