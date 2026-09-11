import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CameraPreset, ViewDisplayMode } from '../types/digitalTwin';
import { ParkEnvironment } from './ParkEnvironment';

export interface PickedObjectInfo {
  id: string;
  type:
    | 'fan'
    | 'roof_vent'
    | 'wet_curtain'
    | 'pump'
    | 'grow_light'
    | 'shade_curtain'
    | 'sensor'
    | 'crop_zone'
    | 'agv'
    | 'structure'
    | 'pond_buoy'
    | 'water_pump_station'
    | 'greenhouse';
  name: string;
  dataRef?: any;
  worldPosition: THREE.Vector3;
}

export class GreenhouseScene {
  public container: HTMLElement;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public controls: OrbitControls;

  // Semantic Object Groups
  public rootGroup: THREE.Group;
  public structureGroup: THREE.Group;
  public coverGroup: THREE.Group;
  public ventilationGroup: THREE.Group;
  public irrigationGroup: THREE.Group;
  public lightingGroup: THREE.Group;
  public shadingGroup: THREE.Group;
  public sensorsGroup: THREE.Group;
  public cropsGroup: THREE.Group;
  public roboticsGroup: THREE.Group;
  public effectsGroup: THREE.Group;
  public parkGroup: THREE.Group;

  // Pond & Water telemetry animation references
  private pondWaterMesh: THREE.Mesh | null = null;
  private pondBuoy: THREE.Group | null = null;
  private pondBeaconLight: THREE.PointLight | null = null;

  // Dynamic References for Animation
  private fanBlades: { id: string; mesh: THREE.Group; speed: number }[] = [];
  private roofVents: { id: string; group: THREE.Group; targetAngle: number; currentAngle: number }[] = [];
  private shadeCurtains: THREE.Mesh[] = [];
  private growLights: { id: string; light: THREE.SpotLight; glowMesh: THREE.Mesh }[] = [];
  private waterFlowParticles: THREE.Points | null = null;
  private agvRobot: { group: THREE.Group; lidarPuck: THREE.Mesh; zDir: number } | null = null;
  private sensorNodes: { id: string; group: THREE.Group; halo: THREE.Mesh }[] = [];

  // Interactive Raycasting
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private interactiveObjects: THREE.Object3D[] = [];
  private hoveredObject: THREE.Object3D | null = null;
  private onObjectHover?: (info: PickedObjectInfo | null, screenPos?: { x: number; y: number }) => void;
  private onObjectSelect?: (info: PickedObjectInfo) => void;

  // Camera Animation
  private targetCamPos: THREE.Vector3 | null = null;
  private targetControlsTarget: THREE.Vector3 | null = null;

  // Materials Cache for Display Modes (x-ray, standard, etc.)
  private glassMaterials: THREE.MeshPhysicalMaterial[] = [];
  private structureMaterials: THREE.MeshStandardMaterial[] = [];

  private isDisposed = false;
  private animationFrameId: number | null = null;
  private clock = new THREE.Clock();

  // State flags
  public isIrrigating = true;
  public shadeCurtainOpenRatio = 0; // 0 = retracted, 1 = closed

  constructor(
    container: HTMLElement,
    callbacks?: {
      onHover?: (info: PickedObjectInfo | null, screenPos?: { x: number; y: number }) => void;
      onSelect?: (info: PickedObjectInfo) => void;
    }
  ) {
    this.container = container;
    this.onObjectHover = callbacks?.onHover;
    this.onObjectSelect = callbacks?.onSelect;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    // 1. Scene setup with realistic natural daylight environment
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xe6f0f8); // Crisp daylight architectural sky
    this.scene.fog = new THREE.FogExp2(0xe6f0f8, 0.005);

    // 2. Camera setup
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 500);
    this.camera.position.set(28, 22, 34);

    // 3. Renderer setup
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    container.appendChild(this.renderer.domElement);

    // 4. OrbitControls setup
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2 + 0.02; // prevent going below ground
    this.controls.minDistance = 3;
    this.controls.maxDistance = 280;
    this.controls.target.set(0, 3, 0);

    // 5. Initialize Groups
    this.rootGroup = new THREE.Group();
    this.rootGroup.name = 'Greenhouse_Digital_Twin';

    this.structureGroup = new THREE.Group();
    this.structureGroup.name = 'Structure';

    this.coverGroup = new THREE.Group();
    this.coverGroup.name = 'Cover';

    this.ventilationGroup = new THREE.Group();
    this.ventilationGroup.name = 'Ventilation';

    this.irrigationGroup = new THREE.Group();
    this.irrigationGroup.name = 'Irrigation';

    this.lightingGroup = new THREE.Group();
    this.lightingGroup.name = 'Lighting';

    this.shadingGroup = new THREE.Group();
    this.shadingGroup.name = 'Shading';

    this.sensorsGroup = new THREE.Group();
    this.sensorsGroup.name = 'Sensors';

    this.cropsGroup = new THREE.Group();
    this.cropsGroup.name = 'Crops';

    this.roboticsGroup = new THREE.Group();
    this.roboticsGroup.name = 'Robotics';

    this.effectsGroup = new THREE.Group();
    this.effectsGroup.name = 'Effects';

    this.parkGroup = new THREE.Group();
    this.parkGroup.name = 'Park_Environment';

    this.rootGroup.add(
      this.structureGroup,
      this.coverGroup,
      this.ventilationGroup,
      this.irrigationGroup,
      this.lightingGroup,
      this.shadingGroup,
      this.sensorsGroup,
      this.cropsGroup,
      this.roboticsGroup,
      this.effectsGroup,
      this.parkGroup
    );
    this.scene.add(this.rootGroup);

    // 6. Lighting & Environment
    this.setupLighting();
    this.buildGroundAndSite();

    // 7. Raycaster & Interaction
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // 8. Build Entire Greenhouse Subsystems
    this.buildStructure();
    this.buildCovering();
    this.buildVentilationSystem();
    this.buildIrrigationSystem();
    this.buildLightingSystem();
    this.buildShadingSystem();
    this.buildCrops();
    this.buildSensorNodes();
    this.buildAGVRobot();
    this.buildControlRoomAndEnergy();

    // 8.5 Build Agricultural Park Infrastructure: Roads, Additional Greenhouses, River/Pond
    ParkEnvironment.buildRoadNetwork(this.scene, this.parkGroup, this.interactiveObjects);
    ParkEnvironment.buildAdditionalGreenhouses(this.scene, this.parkGroup, this.glassMaterials, this.interactiveObjects);
    const pondSubsystems = ParkEnvironment.buildPondAndWaterStation(this.scene, this.parkGroup, this.interactiveObjects);
    this.pondWaterMesh = pondSubsystems.waterMesh;
    this.pondBuoy = pondSubsystems.buoy;
    this.pondBeaconLight = pondSubsystems.beaconLight;

    // 9. Event Listeners
    this.setupEvents();

    // 10. Start Animation Loop
    this.animate();
  }

  // -------------------------------------------------------------
  // LIGHTING & ENVIRONMENT
  // -------------------------------------------------------------
  private setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.15);
    this.scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffcf0, 2.1);
    sunLight.position.set(50, 70, 45);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 280;
    const d = 80;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.0003;
    this.scene.add(sunLight);

    // Daylight sky hemisphere light
    const hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0xbbf7d0, 0.7);
    this.scene.add(hemiLight);
  }

  private buildGroundAndSite() {
    // 1. Concrete perimeter foundation apron
    const groundGeo = new THREE.PlaneGeometry(80, 80);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0xdde6ed,
      roughness: 0.9,
      metalness: 0.05,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.02;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // 2. High-precision greenhouse internal hardened slab floor
    // Greenhouse dimensions: Width: 24m (-12 to +12), Length: 30m (-15 to +15)
    const slabGeo = new THREE.BoxGeometry(24.8, 0.2, 30.8);
    const slabMat = new THREE.MeshStandardMaterial({
      color: 0xe8eef4,
      roughness: 0.6,
      metalness: 0.1,
    });
    const slab = new THREE.Mesh(slabGeo, slabMat);
    slab.position.set(0, -0.1, 0);
    slab.receiveShadow = true;
    this.structureGroup.add(slab);

    // 3. Central concrete logistics aisle
    const aisleGeo = new THREE.BoxGeometry(3.0, 0.02, 30.4);
    const aisleMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.4,
      metalness: 0.1,
    });
    const aisle = new THREE.Mesh(aisleGeo, aisleMat);
    aisle.position.set(0, 0.01, 0);
    aisle.receiveShadow = true;
    this.structureGroup.add(aisle);

    // Yellow safety boundary lines along aisle
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xeab308 });
    const lineGeo = new THREE.PlaneGeometry(0.08, 30.2);
    const lineLeft = new THREE.Mesh(lineGeo, lineMat);
    lineLeft.rotation.x = -Math.PI / 2;
    lineLeft.position.set(-1.45, 0.022, 0);
    const lineRight = lineLeft.clone();
    lineRight.position.x = 1.45;
    this.structureGroup.add(lineLeft, lineRight);

    // Ground Grid helper for architectural coordinate reference
    const grid = new THREE.GridHelper(70, 35, 0x0284c7, 0xc8d7e6);
    grid.position.y = 0.001;
    this.scene.add(grid);
  }

  // -------------------------------------------------------------
  // STEEL STRUCTURE (Columns, Beams, Trusses, Gutters, Roof Purlins)
  // -------------------------------------------------------------
  private buildStructure() {
    const steelMat = new THREE.MeshStandardMaterial({
      color: 0xcfd8dc,
      metalness: 0.85,
      roughness: 0.22,
    });
    this.structureMaterials.push(steelMat);

    const columnGeo = new THREE.BoxGeometry(0.18, 4.5, 0.18);
    const eaveHeight = 4.5;
    const ridgeHeight = 6.8;

    // Dual-span Venlo design:
    // Span 1: X = -12 to 0 (Center at -6, Ridge at -6, height 6.8)
    // Span 2: X = 0 to 12 (Center at +6, Ridge at +6, height 6.8)
    // Central valley gutter at X = 0 (height 4.5)
    // Side gutters at X = -12 and X = +12 (height 4.5)

    const zSpacing = 5.0; // 7 rows along length (-15, -10, -5, 0, 5, 10, 15)
    const zCoords = [-15, -10, -5, 0, 5, 10, 15];
    const xColumns = [-12, 0, 12];

    // Perimeter and central columns
    for (const z of zCoords) {
      for (const x of xColumns) {
        const col = new THREE.Mesh(columnGeo, steelMat);
        col.position.set(x, eaveHeight / 2, z);
        col.castShadow = true;
        col.receiveShadow = true;
        this.structureGroup.add(col);

        // Concrete column base plinth
        const plinthGeo = new THREE.BoxGeometry(0.35, 0.25, 0.35);
        const plinthMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.9 });
        const plinth = new THREE.Mesh(plinthGeo, plinthMat);
        plinth.position.set(x, 0.12, z);
        this.structureGroup.add(plinth);
      }
    }

    // Longitudinal Gutter Beams (along Z at X = -12, 0, 12)
    const gutterGeo = new THREE.BoxGeometry(0.24, 0.2, 30.2);
    for (const x of xColumns) {
      const gutter = new THREE.Mesh(gutterGeo, steelMat);
      gutter.position.set(x, eaveHeight, 0);
      gutter.castShadow = true;
      this.structureGroup.add(gutter);
    }

    // Transverse Trusses at each Z column row
    for (const z of zCoords) {
      // Bottom chord horizontal beam across span 1 (-12 to 0) & span 2 (0 to 12)
      const chordGeo = new THREE.BoxGeometry(12, 0.12, 0.12);
      const chordLeft = new THREE.Mesh(chordGeo, steelMat);
      chordLeft.position.set(-6, eaveHeight, z);
      const chordRight = new THREE.Mesh(chordGeo, steelMat);
      chordRight.position.set(6, eaveHeight, z);
      this.structureGroup.add(chordLeft, chordRight);

      // Venlo triangular roof rafters (left span: -12 to -6 to 0)
      this.createVenloTruss(steelMat, -12, -6, 0, eaveHeight, ridgeHeight, z);
      // Venlo triangular roof rafters (right span: 0 to 6 to 12)
      this.createVenloTruss(steelMat, 0, 6, 12, eaveHeight, ridgeHeight, z);
    }

    // Longitudinal Ridge Beams (along Z at X = -6 and X = +6, Y = ridgeHeight)
    const ridgeBeamGeo = new THREE.BoxGeometry(0.14, 0.14, 30.2);
    const leftRidge = new THREE.Mesh(ridgeBeamGeo, steelMat);
    leftRidge.position.set(-6, ridgeHeight, 0);
    const rightRidge = new THREE.Mesh(ridgeBeamGeo, steelMat);
    rightRidge.position.set(6, ridgeHeight, 0);
    this.structureGroup.add(leftRidge, rightRidge);

    // Intermediate roof purlins
    const purlinGeo = new THREE.BoxGeometry(0.08, 0.08, 30.2);
    const purlinPositions = [
      { x: -9, y: (eaveHeight + ridgeHeight) / 2 },
      { x: -3, y: (eaveHeight + ridgeHeight) / 2 },
      { x: 3, y: (eaveHeight + ridgeHeight) / 2 },
      { x: 9, y: (eaveHeight + ridgeHeight) / 2 },
    ];
    purlinPositions.forEach((pos) => {
      const purlin = new THREE.Mesh(purlinGeo, steelMat);
      purlin.position.set(pos.x, pos.y, 0);
      this.structureGroup.add(purlin);
    });

    // Cross X-bracings on side bays
    this.createXBracing(steelMat, -12, 0, 5, eaveHeight);
    this.createXBracing(steelMat, -12, -10, -5, eaveHeight);
    this.createXBracing(steelMat, 12, 0, 5, eaveHeight);
    this.createXBracing(steelMat, 12, -10, -5, eaveHeight);
  }

  private createVenloTruss(mat: THREE.Material, xLeft: number, xMid: number, xRight: number, yEave: number, yRidge: number, z: number) {
    const rafterLen = Math.hypot(xMid - xLeft, yRidge - yEave);
    const angle = Math.atan2(yRidge - yEave, xMid - xLeft);

    const rafterGeo = new THREE.BoxGeometry(rafterLen, 0.1, 0.1);

    // Left slope rafter
    const r1 = new THREE.Mesh(rafterGeo, mat);
    r1.position.set((xLeft + xMid) / 2, (yEave + yRidge) / 2, z);
    r1.rotation.z = angle;
    r1.castShadow = true;

    // Right slope rafter
    const r2 = new THREE.Mesh(rafterGeo, mat);
    r2.position.set((xMid + xRight) / 2, (yEave + yRidge) / 2, z);
    r2.rotation.z = -angle;
    r2.castShadow = true;

    // Vertical king post from bottom chord to ridge
    const kingPostGeo = new THREE.BoxGeometry(0.1, yRidge - yEave, 0.1);
    const kingPost = new THREE.Mesh(kingPostGeo, mat);
    kingPost.position.set(xMid, yEave + (yRidge - yEave) / 2, z);

    // Diagonal web struts
    const strutLen = Math.hypot((xMid - xLeft) / 2, yRidge - yEave);
    const strutGeo = new THREE.BoxGeometry(strutLen, 0.06, 0.06);
    const s1 = new THREE.Mesh(strutGeo, mat);
    s1.position.set((xLeft + xMid) / 2, yEave + (yRidge - yEave) / 3, z);
    s1.rotation.z = -angle * 0.7;

    const s2 = new THREE.Mesh(strutGeo, mat);
    s2.position.set((xMid + xRight) / 2, yEave + (yRidge - yEave) / 3, z);
    s2.rotation.z = angle * 0.7;

    this.structureGroup.add(r1, r2, kingPost, s1, s2);
  }

  private createXBracing(mat: THREE.Material, x: number, z1: number, z2: number, h: number) {
    const len = Math.hypot(z2 - z1, h);
    const angle = Math.atan2(h, z2 - z1);
    const barGeo = new THREE.CylinderGeometry(0.02, 0.02, len);

    const b1 = new THREE.Mesh(barGeo, mat);
    b1.position.set(x, h / 2, (z1 + z2) / 2);
    b1.rotation.x = angle;

    const b2 = new THREE.Mesh(barGeo, mat);
    b2.position.set(x, h / 2, (z1 + z2) / 2);
    b2.rotation.x = -angle;

    this.structureGroup.add(b1, b2);
  }

  // -------------------------------------------------------------
  // COVERING (Tempered Low-Iron Glass & Translucent PC Panels)
  // -------------------------------------------------------------
  private buildCovering() {
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x93c5fd,
      transparent: true,
      opacity: 0.26,
      roughness: 0.12,
      metalness: 0.1,
      transmission: 0.82,
      ior: 1.52,
      reflectivity: 0.6,
      depthWrite: false,
    });
    this.glassMaterials.push(glassMat);

    // 1. Left Wall Glass (-12, length 30, height 4.5)
    const wallGeo = new THREE.PlaneGeometry(30, 4.4);
    const leftWall = new THREE.Mesh(wallGeo, glassMat);
    leftWall.position.set(-12, 2.25, 0);
    leftWall.rotation.y = Math.PI / 2;
    this.coverGroup.add(leftWall);

    // 2. Right Wall Glass (+12, length 30, height 4.5)
    const rightWall = new THREE.Mesh(wallGeo, glassMat);
    rightWall.position.set(12, 2.25, 0);
    rightWall.rotation.y = -Math.PI / 2;
    this.coverGroup.add(rightWall);

    // 3. Gable End Walls (Z = -15 and Z = +15)
    // Wall bottom section: Width 24, Height 4.5
    const endWallBottomGeo = new THREE.PlaneGeometry(24, 4.4);
    const frontWall = new THREE.Mesh(endWallBottomGeo, glassMat);
    frontWall.position.set(0, 2.25, 15);
    const backWall = new THREE.Mesh(endWallBottomGeo, glassMat);
    backWall.position.set(0, 2.25, -15);
    backWall.rotation.y = Math.PI;
    this.coverGroup.add(frontWall, backWall);

    // 4. Gable Roof Triangular Gables (Dual Venlo Triangles)
    // Left Gable Triangle: (-12, 4.5) to (-6, 6.8) to (0, 4.5)
    const triShape = new THREE.Shape();
    triShape.moveTo(-6, 0);
    triShape.lineTo(0, 2.3);
    triShape.lineTo(6, 0);
    triShape.closePath();
    const triGeo = new THREE.ShapeGeometry(triShape);

    const gableFrontLeft = new THREE.Mesh(triGeo, glassMat);
    gableFrontLeft.position.set(-6, 4.5, 15);
    const gableFrontRight = new THREE.Mesh(triGeo, glassMat);
    gableFrontRight.position.set(6, 4.5, 15);

    const gableBackLeft = new THREE.Mesh(triGeo, glassMat);
    gableBackLeft.position.set(-6, 4.5, -15);
    gableBackLeft.rotation.y = Math.PI;
    const gableBackRight = new THREE.Mesh(triGeo, glassMat);
    gableBackRight.position.set(6, 4.5, -15);
    gableBackRight.rotation.y = Math.PI;

    this.coverGroup.add(gableFrontLeft, gableFrontRight, gableBackLeft, gableBackRight);

    // 5. Roof Glass Pitches (4 slopes)
    const slopeLen = Math.hypot(6, 2.3);
    const slopeAngle = Math.atan2(2.3, 6);
    const roofSlopeGeo = new THREE.PlaneGeometry(slopeLen, 29.8);

    // Slope 1: X = -12 to -6 (facing +X)
    const slope1 = new THREE.Mesh(roofSlopeGeo, glassMat);
    slope1.position.set(-9, 5.65, 0);
    slope1.rotation.y = Math.PI / 2;
    slope1.rotation.x = -slopeAngle;

    // Slope 2: X = -6 to 0 (facing -X)
    const slope2 = new THREE.Mesh(roofSlopeGeo, glassMat);
    slope2.position.set(-3, 5.65, 0);
    slope2.rotation.y = Math.PI / 2;
    slope2.rotation.x = slopeAngle;

    // Slope 3: X = 0 to 6 (facing +X)
    const slope3 = new THREE.Mesh(roofSlopeGeo, glassMat);
    slope3.position.set(3, 5.65, 0);
    slope3.rotation.y = Math.PI / 2;
    slope3.rotation.x = -slopeAngle;

    // Slope 4: X = 6 to 12 (facing -X)
    const slope4 = new THREE.Mesh(roofSlopeGeo, glassMat);
    slope4.position.set(9, 5.65, 0);
    slope4.rotation.y = Math.PI / 2;
    slope4.rotation.x = slopeAngle;

    this.coverGroup.add(slope1, slope2, slope3, slope4);

    // Aluminum glass glazing bar patterns (structural framing grid)
    this.buildGlazingBars();
  }

  private buildGlazingBars() {
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.6, roughness: 0.4 });
    const zPositions = [-12.5, -7.5, -2.5, 2.5, 7.5, 12.5];
    const barGeo = new THREE.BoxGeometry(0.04, 4.4, 0.04);

    for (const z of zPositions) {
      const b1 = new THREE.Mesh(barGeo, frameMat);
      b1.position.set(-11.95, 2.25, z);
      const b2 = new THREE.Mesh(barGeo, frameMat);
      b2.position.set(11.95, 2.25, z);
      this.coverGroup.add(b1, b2);
    }
  }

  // -------------------------------------------------------------
  // VENTILATION SYSTEM (Exhaust Fans, Continuous Roof Vents, Wet Curtain)
  // -------------------------------------------------------------
  private buildVentilationSystem() {
    // 1. Exhaust Fans (2 Units on North Gable Wall Z = +14.9, at X = -10.8 and +10.8)
    const fanPositions = [
      { id: 'fan_001', name: '1号山墙负压风机', x: -10.8, y: 3.2, z: 14.85 },
      { id: 'fan_002', name: '2号山墙负压风机', x: 10.8, y: 3.2, z: 14.85 },
    ];

    const casingMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7, roughness: 0.3 });
    const bladeMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.8, roughness: 0.2 });

    for (const fp of fanPositions) {
      const fanGroup = new THREE.Group();
      fanGroup.position.set(fp.x, fp.y, fp.z);
      fanGroup.name = fp.id;

      // Outer square louver housing
      const casingGeo = new THREE.BoxGeometry(1.8, 1.8, 0.45);
      const casing = new THREE.Mesh(casingGeo, casingMat);
      fanGroup.add(casing);

      // Inner cylindrical airway
      const tubeGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.46, 24, 1, true);
      const tubeMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, side: THREE.DoubleSide });
      const tube = new THREE.Mesh(tubeGeo, tubeMat);
      tube.rotation.x = Math.PI / 2;
      fanGroup.add(tube);

      // Spinning Impeller (Hub + 6 Aerodynamic Blades)
      const impeller = new THREE.Group();
      impeller.position.set(0, 0, 0);

      const hubGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.12, 16);
      const hub = new THREE.Mesh(hubGeo, bladeMat);
      hub.rotation.x = Math.PI / 2;
      impeller.add(hub);

      const bladeGeo = new THREE.BoxGeometry(0.18, 0.65, 0.02);
      for (let i = 0; i < 6; i++) {
        const blade = new THREE.Mesh(bladeGeo, bladeMat);
        const ang = (i * Math.PI) / 3;
        blade.position.set(Math.cos(ang) * 0.42, Math.sin(ang) * 0.42, 0);
        blade.rotation.z = ang;
        blade.rotation.y = 0.25; // pitch angle
        impeller.add(blade);
      }
      fanGroup.add(impeller);

      this.fanBlades.push({ id: fp.id, mesh: impeller, speed: 80 });

      // Interactive metadata binding
      casing.userData = {
        id: fp.id,
        type: 'fan',
        name: fp.name,
      };
      this.interactiveObjects.push(casing);

      this.ventilationGroup.add(fanGroup);
    }

    // 2. Continuous Motorized Roof Vents (along ridges at X = -6 and X = +6)
    // Modeled with mechanical pivot hinge along top edge!
    const ventMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.5,
      roughness: 0.1,
      metalness: 0.3,
    });

    const ventGeo = new THREE.PlaneGeometry(1.2, 8.0);
    const hingeMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.8, roughness: 0.2 });

    const ventConfigs = [
      { id: 'vent_roof_001', name: '屋脊双向电动排气天窗群', x: -6, y: 6.8, z: 0, slope: 1 },
      { id: 'vent_roof_002', name: '东脊自然采光通风天窗群', x: 6, y: 6.8, z: 0, slope: -1 },
    ];

    ventConfigs.forEach((vc) => {
      const ventHingeGroup = new THREE.Group();
      ventHingeGroup.position.set(vc.x, vc.y, vc.z);
      ventHingeGroup.name = vc.id;

      // Hinge torque bar
      const barGeo = new THREE.CylinderGeometry(0.04, 0.04, 8.2);
      const bar = new THREE.Mesh(barGeo, hingeMat);
      bar.rotation.x = Math.PI / 2;
      ventHingeGroup.add(bar);

      // Flap sash mounted on hinge
      const flap = new THREE.Mesh(ventGeo, ventMat);
      flap.position.set(vc.slope * 0.6, -0.2, 0);
      flap.rotation.y = Math.PI / 2;
      flap.rotation.x = vc.slope * 0.38; // standard roof slope
      flap.userData = { id: vc.id, type: 'roof_vent', name: vc.name };
      ventHingeGroup.add(flap);
      this.interactiveObjects.push(flap);

      this.roofVents.push({
        id: vc.id,
        group: ventHingeGroup,
        targetAngle: 0.45, // rad
        currentAngle: 0.45,
      });

      this.ventilationGroup.add(ventHingeGroup);
    });

    // 3. Wet Curtain Cooling Pad (南端山墙 Z = -14.9, Center span X = -8 to +8)
    const padGroup = new THREE.Group();
    padGroup.position.set(0, 2.3, -14.85);

    const padGeo = new THREE.BoxGeometry(16, 2.8, 0.35);
    const padMat = new THREE.MeshStandardMaterial({
      color: 0x92400e, // honeycombed cellulose pad brown/amber
      roughness: 0.85,
      metalness: 0.05,
    });
    const pad = new THREE.Mesh(padGeo, padMat);
    pad.userData = { id: 'wet_curtain_001', type: 'wet_curtain', name: '进风端高效水帘蒸发降温幕墙' };
    this.interactiveObjects.push(pad);
    padGroup.add(pad);

    // Aluminum frame around pad
    const padFrameGeo = new THREE.BoxGeometry(16.3, 0.15, 0.45);
    const pframeTop = new THREE.Mesh(padFrameGeo, casingMat);
    pframeTop.position.set(0, 1.45, 0);
    const pframeBottom = new THREE.Mesh(padFrameGeo, casingMat);
    pframeBottom.position.set(0, -1.45, 0);
    padGroup.add(pframeTop, pframeBottom);

    this.ventilationGroup.add(padGroup);
  }

  // -------------------------------------------------------------
  // IRRIGATION SYSTEM (Pumps, Storage Tank, Manifold, Drip Pipes & Water Particles)
  // -------------------------------------------------------------
  private buildIrrigationSystem() {
    // Water pump station located at equipment corner (X = 11.5, Z = -13)
    const pumpStationGroup = new THREE.Group();
    pumpStationGroup.position.set(11.2, 0, -13);

    // 1. Stainless Steel / PE Vertical Water Reservoir Tank
    const tankGeo = new THREE.CylinderGeometry(1.2, 1.2, 3.2, 24);
    const tankMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      metalness: 0.6,
      roughness: 0.25,
    });
    const tank = new THREE.Mesh(tankGeo, tankMat);
    tank.position.set(0, 1.6, 0);
    tank.castShadow = true;
    tank.userData = { id: 'water_tank_01', type: 'pump', name: '10m³智能水肥母液储水罐' };
    this.interactiveObjects.push(tank);
    pumpStationGroup.add(tank);

    // Tank level indicator column
    const levelGlassGeo = new THREE.CylinderGeometry(0.04, 0.04, 2.6);
    const levelMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const levelGlass = new THREE.Mesh(levelGlassGeo, levelMat);
    levelGlass.position.set(1.25, 1.6, 0);
    pumpStationGroup.add(levelGlass);

    // 2. Dual Booster Irrigation Pumps & Manifold (Twin pumps)
    const pumpMat = new THREE.MeshStandardMaterial({ color: 0x047857, metalness: 0.7, roughness: 0.3 }); // Agricultural green
    const pumpBaseGeo = new THREE.BoxGeometry(0.7, 0.45, 0.9);
    const pumpBase = new THREE.Mesh(pumpBaseGeo, pumpMat);
    pumpBase.position.set(-1.8, 0.25, 0);
    pumpBase.userData = { id: 'pump_irrigation_001', type: 'pump', name: '变频恒压微滴灌水肥一体泵' };
    this.interactiveObjects.push(pumpBase);
    pumpStationGroup.add(pumpBase);

    // Motor cylinder
    const motorGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.55, 16);
    const motor = new THREE.Mesh(motorGeo, pumpMat);
    motor.rotation.x = Math.PI / 2;
    motor.position.set(-1.8, 0.55, 0);
    pumpStationGroup.add(motor);

    // Pressure Gauge Dial
    const gaugeGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.05, 16);
    const gaugeMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
    const gauge = new THREE.Mesh(gaugeGeo, gaugeMat);
    gauge.rotation.x = Math.PI / 2;
    gauge.position.set(-1.8, 0.9, 0.3);
    pumpStationGroup.add(gauge);

    this.irrigationGroup.add(pumpStationGroup);

    // 3. Main Delivery Pipeline (Running overhead along central aisle)
    const pipeMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.5, roughness: 0.3 });
    const mainPipeGeo = new THREE.CylinderGeometry(0.08, 0.08, 29.5, 16);
    const mainPipe = new THREE.Mesh(mainPipeGeo, pipeMat);
    mainPipe.rotation.x = Math.PI / 2;
    mainPipe.position.set(0, 3.8, 0);
    this.irrigationGroup.add(mainPipe);

    // 4. Feeder drops to each planting bed row
    const dropGeo = new THREE.CylinderGeometry(0.03, 0.03, 3.0);
    const dripMat = new THREE.MeshStandardMaterial({ color: 0x0369a1, metalness: 0.3, roughness: 0.4 });
    const rowX = [-10, -8, -6, -4, 4, 6, 8, 10];
    rowX.forEach((rx) => {
      // Horizontal branch
      const branchGeo = new THREE.CylinderGeometry(0.03, 0.03, Math.abs(rx));
      const branch = new THREE.Mesh(branchGeo, pipeMat);
      branch.rotation.z = Math.PI / 2;
      branch.position.set(rx / 2, 3.8, -13);
      this.irrigationGroup.add(branch);

      // Vertical downpipe
      const drop = new THREE.Mesh(dropGeo, dripMat);
      drop.position.set(rx, 2.3, -13);
      this.irrigationGroup.add(drop);

      // Longitudinal drip line running on crop beds
      const dripLineGeo = new THREE.CylinderGeometry(0.02, 0.02, 26, 8);
      const dripLine = new THREE.Mesh(dripLineGeo, dripMat);
      dripLine.rotation.x = Math.PI / 2;
      dripLine.position.set(rx, 0.82, 0);
      this.irrigationGroup.add(dripLine);
    });

    // 5. Dynamic Water Flow Shimmer Particle Effect
    this.createWaterFlowParticles();
  }

  private createWaterFlowParticles() {
    const particleCount = 180;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const c1 = new THREE.Color(0x38bdf8);
    const c2 = new THREE.Color(0x67e8f9);

    for (let i = 0; i < particleCount; i++) {
      // Along planting beds
      const row = Math.floor(Math.random() * 8);
      const rowX = [-10, -8, -6, -4, 4, 6, 8, 10][row];
      positions[i * 3] = rowX + (Math.random() - 0.5) * 0.1;
      positions[i * 3 + 1] = 0.8 + Math.random() * 0.04;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 25;

      const c = Math.random() > 0.5 ? c1 : c2;
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const pMat = new THREE.PointsMaterial({
      size: 0.12,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });

    this.waterFlowParticles = new THREE.Points(pGeo, pMat);
    this.effectsGroup.add(this.waterFlowParticles);
  }

  // -------------------------------------------------------------
  // HORTICULTURAL LED GROW LIGHTING SYSTEM
  // -------------------------------------------------------------
  private buildLightingSystem() {
    const fixtureMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.2 });
    const ledMat = new THREE.MeshStandardMaterial({
      color: 0xf43f5e, // Photosynthetic red/blue horticultural spectrum
      emissive: 0xf43f5e,
      emissiveIntensity: 0.0, // initially off
    });

    const lightZPositions = [-10, -5, 0, 5, 10];
    const lightXPositions = [-7, -3, 3, 7];

    lightZPositions.forEach((z, zIdx) => {
      lightXPositions.forEach((x, xIdx) => {
        const id = `light_grow_${zIdx}_${xIdx}`;
        const lightFixture = new THREE.Group();
        lightFixture.position.set(x, 4.4, z);

        // Aluminum heat-sink bar
        const barGeo = new THREE.BoxGeometry(2.4, 0.08, 0.25);
        const bar = new THREE.Mesh(barGeo, fixtureMat);
        lightFixture.add(bar);

        // Emissive LED strip face
        const stripGeo = new THREE.BoxGeometry(2.3, 0.02, 0.18);
        const strip = new THREE.Mesh(stripGeo, ledMat.clone());
        strip.position.set(0, -0.045, 0);
        strip.userData = { id, type: 'grow_light', name: 'LED植物生长特定波长补光灯组' };
        this.interactiveObjects.push(strip);
        lightFixture.add(strip);

        // Hanging suspension wire cables
        const wireGeo = new THREE.CylinderGeometry(0.006, 0.006, 0.8);
        const wireMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8 });
        const w1 = new THREE.Mesh(wireGeo, wireMat);
        w1.position.set(-1.0, 0.4, 0);
        const w2 = new THREE.Mesh(wireGeo, wireMat);
        w2.position.set(1.0, 0.4, 0);
        lightFixture.add(w1, w2);

        // Realistic downward SpotLight
        const spotLight = new THREE.SpotLight(0xfb7185, 0.0, 10, Math.PI / 4, 0.5, 1.2);
        spotLight.position.set(0, -0.05, 0);
        spotLight.target.position.set(0, -4, 0);
        lightFixture.add(spotLight);
        lightFixture.add(spotLight.target);

        this.growLights.push({ id, light: spotLight, glowMesh: strip });
        this.lightingGroup.add(lightFixture);
      });
    });
  }

  // -------------------------------------------------------------
  // SHADING CURTAIN SYSTEM (Motorized Aluminum Foil Screen)
  // -------------------------------------------------------------
  private buildShadingSystem() {
    // Shading screen positioned beneath roof trusses at Y = 4.45
    // Two large retractable panels for left and right bays
    const shadeMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8, // reflective silver-white shade cloth
      roughness: 0.6,
      metalness: 0.4,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.92,
    });

    const leftShadeGeo = new THREE.PlaneGeometry(11.8, 29.5);
    const leftShade = new THREE.Mesh(leftShadeGeo, shadeMat);
    leftShade.rotation.x = -Math.PI / 2;
    leftShade.position.set(-6, 4.45, 0);
    leftShade.scale.set(0.01, 1, 1); // Initially retracted
    leftShade.userData = { id: 'shade_curtain_001', type: 'shade_curtain', name: '内保温遮阳反光铝箔拉幕' };
    this.interactiveObjects.push(leftShade);

    const rightShade = new THREE.Mesh(leftShadeGeo, shadeMat);
    rightShade.rotation.x = -Math.PI / 2;
    rightShade.position.set(6, 4.45, 0);
    rightShade.scale.set(0.01, 1, 1); // Initially retracted
    rightShade.userData = { id: 'shade_curtain_001', type: 'shade_curtain', name: '内保温遮阳反光铝箔拉幕' };
    this.interactiveObjects.push(rightShade);

    this.shadeCurtains.push(leftShade, rightShade);
    this.shadingGroup.add(leftShade, rightShade);
  }

  // -------------------------------------------------------------
  // CROPS & PRODUCTION STRUCTURES (Tomatoes, Lettuce, Strawberries, Nursery)
  // -------------------------------------------------------------
  private buildCrops() {
    // 1. Zone A: Vine Cherry Tomatoes (吊蔓粉果番茄) - West Bay, North section
    this.buildTomatoZone([-9, -7, -5, -3], 1.5, 13.5, 'crop_zone_01', 'A区·粉番茄高产吊蔓栽培区');

    // 2. Zone B: Hydroponic NFT Lettuce (水培生菜区) - East Bay, North section
    this.buildLettuceNFTZone([3, 5, 7, 9], 1.5, 13.5, 'crop_zone_02', 'B区·水培多层管道生菜区');

    // 3. Zone C: Elevated Strawberry Gutters (红颜草莓高架立体区) - West Bay, South section
    this.buildStrawberryZone([-9, -7, -5, -3], -13.5, -1.5, 'crop_zone_03', 'C区·红颜草莓高架立体栽培区');

    // 4. Zone D: Automated Seedling Nursery Tables (穴盘育苗苗床) - East Bay, South section
    this.buildNurseryZone([3, 5, 7, 9], -13.5, -1.5, 'crop_zone_04', 'D区·集约化自动化育苗苗床区');
  }

  private buildTomatoZone(rowX: number[], zStart: number, zEnd: number, zoneId: string, zoneName: string) {
    const gutterMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.4 });
    const stemMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 });
    const fruitMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3, metalness: 0.1 });
    const wireMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8 });

    const len = zEnd - zStart;
    const centerZ = (zStart + zEnd) / 2;

    rowX.forEach((rx) => {
      // White growing trough with coir substrate
      const troughGeo = new THREE.BoxGeometry(0.5, 0.4, len);
      const trough = new THREE.Mesh(troughGeo, gutterMat);
      trough.position.set(rx, 0.2, centerZ);
      trough.userData = { id: zoneId, type: 'crop_zone', name: zoneName };
      this.interactiveObjects.push(trough);
      this.cropsGroup.add(trough);

      // Trellis hanging wire strings
      const wireGeo = new THREE.CylinderGeometry(0.004, 0.004, 3.2);
      for (let z = zStart + 0.8; z < zEnd; z += 1.2) {
        const wire = new THREE.Mesh(wireGeo, wireMat);
        wire.position.set(rx, 2.0, z);
        this.cropsGroup.add(wire);

        // Tomato foliage clumps (procedural spheres + leaves for high performance)
        const foliageGeo = new THREE.DodecahedronGeometry(0.28, 1);
        const f1 = new THREE.Mesh(foliageGeo, stemMat);
        f1.position.set(rx + (Math.random() - 0.5) * 0.1, 1.2 + Math.random() * 0.3, z);
        f1.scale.set(1.1, 1.6, 1.0);
        const f2 = new THREE.Mesh(foliageGeo, stemMat);
        f2.position.set(rx + (Math.random() - 0.5) * 0.1, 2.0 + Math.random() * 0.3, z);
        f2.scale.set(1.0, 1.4, 0.9);
        this.cropsGroup.add(f1, f2);

        // Ripe Tomato fruit clusters
        const fruitCluster = new THREE.Group();
        fruitCluster.position.set(rx + 0.18, 1.1 + Math.random() * 0.2, z);
        const berryGeo = new THREE.SphereGeometry(0.06, 8, 8);
        for (let b = 0; b < 4; b++) {
          const berry = new THREE.Mesh(berryGeo, fruitMat);
          berry.position.set((b % 2) * 0.07, -Math.floor(b / 2) * 0.07, (Math.random() - 0.5) * 0.04);
          fruitCluster.add(berry);
        }
        this.cropsGroup.add(fruitCluster);
      }
    });
  }

  private buildLettuceNFTZone(rowX: number[], zStart: number, zEnd: number, zoneId: string, zoneName: string) {
    const pvcMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25 });
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.7, roughness: 0.3 });
    const lettuceMat = new THREE.MeshStandardMaterial({ color: 0x4ade80, roughness: 0.6 });

    const len = zEnd - zStart;
    const centerZ = (zStart + zEnd) / 2;

    rowX.forEach((rx) => {
      // 3-tier A-frame NFT rack
      const tiers = [0.4, 0.9, 1.4];
      tiers.forEach((ty, tIdx) => {
        const pipeGeo = new THREE.BoxGeometry(0.32, 0.12, len);
        const pipe = new THREE.Mesh(pipeGeo, pvcMat);
        pipe.position.set(rx, ty, centerZ);
        pipe.userData = { id: zoneId, type: 'crop_zone', name: zoneName };
        this.interactiveObjects.push(pipe);
        this.cropsGroup.add(pipe);

        // Fresh butterhead lettuce heads along the gutter
        const lettuceGeo = new THREE.SphereGeometry(0.14, 8, 8);
        for (let z = zStart + 0.6; z < zEnd; z += 0.85) {
          const lettuce = new THREE.Mesh(lettuceGeo, lettuceMat);
          lettuce.position.set(rx, ty + 0.12, z);
          lettuce.scale.set(1.2, 0.8, 1.2);
          this.cropsGroup.add(lettuce);
        }
      });

      // Supporting legs
      const legGeo = new THREE.CylinderGeometry(0.02, 0.02, 1.5);
      for (let z = zStart + 1.0; z < zEnd; z += 4.0) {
        const leg = new THREE.Mesh(legGeo, frameMat);
        leg.position.set(rx, 0.75, z);
        this.cropsGroup.add(leg);
      }
    });
  }

  private buildStrawberryZone(rowX: number[], zStart: number, zEnd: number, zoneId: string, zoneName: string) {
    const troughMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.5 });
    const legMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.3 });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.7 });
    const berryMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.3 });

    const len = Math.abs(zEnd - zStart);
    const centerZ = (zStart + zEnd) / 2;

    rowX.forEach((rx) => {
      // Elevated hanging gutter at waist height (1.2m)
      const troughGeo = new THREE.BoxGeometry(0.4, 0.25, len);
      const trough = new THREE.Mesh(troughGeo, troughMat);
      trough.position.set(rx, 1.15, centerZ);
      trough.userData = { id: zoneId, type: 'crop_zone', name: zoneName };
      this.interactiveObjects.push(trough);
      this.cropsGroup.add(trough);

      // Support steel H-posts
      const legGeo = new THREE.BoxGeometry(0.04, 1.15, 0.04);
      for (let z = zStart + 1.0; z < zEnd; z += 3.5) {
        const leg = new THREE.Mesh(legGeo, legMat);
        leg.position.set(rx, 0.575, z);
        this.cropsGroup.add(leg);
      }

      // Strawberry plant mounds & hanging red berries
      const plantGeo = new THREE.ConeGeometry(0.18, 0.2, 7);
      const redGeo = new THREE.ConeGeometry(0.04, 0.07, 6);
      for (let z = zStart + 0.5; z < zEnd; z += 0.7) {
        const plant = new THREE.Mesh(plantGeo, leafMat);
        plant.position.set(rx, 1.35, z);
        plant.scale.set(1.3, 0.8, 1.3);
        this.cropsGroup.add(plant);

        // Hanging strawberries
        const red1 = new THREE.Mesh(redGeo, berryMat);
        red1.rotation.x = Math.PI;
        red1.position.set(rx + 0.22, 1.18, z);
        this.cropsGroup.add(red1);
      }
    });
  }

  private buildNurseryZone(rowX: number[], zStart: number, zEnd: number, zoneId: string, zoneName: string) {
    const benchMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.3 });
    const trayMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
    const sproutMat = new THREE.MeshStandardMaterial({ color: 0x84cc16, roughness: 0.5 });

    const len = Math.abs(zEnd - zStart);
    const centerZ = (zStart + zEnd) / 2;

    rowX.forEach((rx) => {
      // Aluminum rolling seedling bench
      const benchGeo = new THREE.BoxGeometry(0.85, 0.1, len);
      const bench = new THREE.Mesh(benchGeo, benchMat);
      bench.position.set(rx, 0.75, centerZ);
      bench.userData = { id: zoneId, type: 'crop_zone', name: zoneName };
      this.interactiveObjects.push(bench);
      this.cropsGroup.add(bench);

      // Seedling trays on top
      const trayGeo = new THREE.BoxGeometry(0.8, 0.04, len - 0.2);
      const tray = new THREE.Mesh(trayGeo, trayMat);
      tray.position.set(rx, 0.82, centerZ);
      this.cropsGroup.add(tray);

      // Microgreen sprouts pattern
      const sproutGeo = new THREE.SphereGeometry(0.04, 6, 6);
      for (let z = zStart + 0.4; z < zEnd; z += 0.4) {
        const s1 = new THREE.Mesh(sproutGeo, sproutMat);
        s1.position.set(rx - 0.2, 0.87, z);
        const s2 = new THREE.Mesh(sproutGeo, sproutMat);
        s2.position.set(rx + 0.2, 0.87, z);
        this.cropsGroup.add(s1, s2);
      }
    });
  }

  // -------------------------------------------------------------
  // SENSOR NODES (Temp/Humidity, CO2, Light/PAR, Soil Probes)
  // -------------------------------------------------------------
  private buildSensorNodes() {
    const sensors = [
      { id: 'sensor_temp_001', name: '1号区环境温湿度传感节点', pos: [-6, 2.5, -4], type: 'sensor' },
      { id: 'sensor_temp_002', name: '2号区环境温湿度传感节点', pos: [6, 2.5, -4], type: 'sensor' },
      { id: 'sensor_co2_001', name: '高精度红外二氧化碳分析仪', pos: [0, 4.0, 0], type: 'sensor' },
      { id: 'sensor_light_001', name: '全光谱量子光合有效辐射仪(PAR)', pos: [0, 6.2, 0], type: 'sensor' },
      { id: 'sensor_soil_001', name: '根区多深度水肥一体化土壤探针', pos: [-6, 0.8, 4], type: 'sensor' },
      { id: 'sensor_soil_002', name: '基质含盐量EC/电导率传感器', pos: [-6, 0.8, -10], type: 'sensor' },
    ];

    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.7, roughness: 0.2 });
    const mastMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.9, roughness: 0.2 });
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.6,
    });

    sensors.forEach((s) => {
      const nodeGroup = new THREE.Group();
      nodeGroup.position.set(s.pos[0], s.pos[1], s.pos[2]);

      // Sensor Body (Weather shield multi-tier housing)
      const shieldGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.35, 12);
      const shield = new THREE.Mesh(shieldGeo, bodyMat);
      shield.userData = { id: s.id, type: 'sensor', name: s.name };
      nodeGroup.add(shield);
      this.interactiveObjects.push(shield);

      // Solar small power panel on top
      const solarGeo = new THREE.BoxGeometry(0.25, 0.02, 0.25);
      const solarMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.9 });
      const solar = new THREE.Mesh(solarGeo, solarMat);
      solar.position.set(0, 0.19, 0);
      nodeGroup.add(solar);

      // Mounting mast
      const mastGeo = new THREE.CylinderGeometry(0.015, 0.015, 1.2);
      const mast = new THREE.Mesh(mastGeo, mastMat);
      mast.position.set(0, -0.65, 0);
      nodeGroup.add(mast);

      // Glowing pulsating digital twin ring / radar beacon
      const ringGeo = new THREE.RingGeometry(0.3, 0.35, 24);
      const ring = new THREE.Mesh(ringGeo, haloMat.clone());
      ring.rotation.x = Math.PI / 2;
      nodeGroup.add(ring);

      this.sensorNodes.push({ id: s.id, group: nodeGroup, halo: ring });
      this.sensorsGroup.add(nodeGroup);
    });
  }

  // -------------------------------------------------------------
  // AUTONOMOUS PATROL ROBOT (AGV)
  // -------------------------------------------------------------
  private buildAGVRobot() {
    const agvGroup = new THREE.Group();
    agvGroup.position.set(0, 0.25, 0);

    const chassisMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.8, roughness: 0.2 });
    const bumperMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.7 });
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });

    // Chassis base
    const chassisGeo = new THREE.BoxGeometry(0.7, 0.25, 1.1);
    const chassis = new THREE.Mesh(chassisGeo, chassisMat);
    chassis.userData = { id: 'agv_patrol_01', type: 'agv', name: 'AGV-01 智能多光谱农情巡检机器人' };
    this.interactiveObjects.push(chassis);
    agvGroup.add(chassis);

    // Front/Rear Bumpers
    const bumperGeo = new THREE.BoxGeometry(0.74, 0.12, 0.12);
    const fb = new THREE.Mesh(bumperGeo, bumperMat);
    fb.position.set(0, -0.06, 0.56);
    const rb = new THREE.Mesh(bumperGeo, bumperMat);
    rb.position.set(0, -0.06, -0.56);
    agvGroup.add(fb, rb);

    // 4 Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.08, 16);
    const wheelPositions = [
      { x: -0.38, z: 0.35 },
      { x: 0.38, z: 0.35 },
      { x: -0.38, z: -0.35 },
      { x: 0.38, z: -0.35 },
    ];
    wheelPositions.forEach((wp) => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wp.x, -0.08, wp.z);
      agvGroup.add(wheel);
    });

    // Sensor & Camera Mast with Spinning 360° LiDAR Puck
    const mastGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.65);
    const mast = new THREE.Mesh(mastGeo, bumperMat);
    mast.position.set(0, 0.45, 0.2);
    agvGroup.add(mast);

    const lidarGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.08, 16);
    const lidarMat = new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x10b981, emissiveIntensity: 0.6 });
    const lidarPuck = new THREE.Mesh(lidarGeo, lidarMat);
    lidarPuck.position.set(0, 0.8, 0.2);
    agvGroup.add(lidarPuck);

    // Status LED Halo
    const beaconGeo = new THREE.SphereGeometry(0.04, 12, 12);
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.set(0, 0.9, 0.2);
    agvGroup.add(beacon);

    this.agvRobot = { group: agvGroup, lidarPuck, zDir: 1 };
    this.roboticsGroup.add(agvGroup);
  }

  // -------------------------------------------------------------
  // CONTROL CABINET & SOLAR PV PANELS
  // -------------------------------------------------------------
  private buildControlRoomAndEnergy() {
    // 1. PLC Control & Power Cabinet (Located at entrance X = -1.2, Z = 14.5)
    const cabGroup = new THREE.Group();
    cabGroup.position.set(-2.0, 1.1, 14.2);

    const cabMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6, roughness: 0.4 });
    const cabGeo = new THREE.BoxGeometry(0.9, 1.8, 0.45);
    const cabinet = new THREE.Mesh(cabGeo, cabMat);
    cabinet.userData = { id: 'cabinet_plc_01', type: 'structure', name: '智能温室集成电控与边缘物联网网关柜' };
    this.interactiveObjects.push(cabinet);
    cabGroup.add(cabinet);

    // Touch display on cabinet door
    const screenGeo = new THREE.PlaneGeometry(0.4, 0.3);
    const screenMat = new THREE.MeshBasicMaterial({ color: 0x0284c7 });
    const screen = new THREE.Mesh(screenGeo, screenMat);
    screen.position.set(0, 0.3, 0.23);
    cabGroup.add(screen);

    // Status indicator pilot lights (Green, Amber, Red)
    const ledMat1 = new THREE.MeshBasicMaterial({ color: 0x22c55e });
    const ledMat2 = new THREE.MeshBasicMaterial({ color: 0x3b82f6 });
    const pGeo = new THREE.SphereGeometry(0.02, 8, 8);
    const p1 = new THREE.Mesh(pGeo, ledMat1);
    p1.position.set(-0.15, 0.6, 0.23);
    const p2 = new THREE.Mesh(pGeo, ledMat2);
    p2.position.set(0.15, 0.6, 0.23);
    cabGroup.add(p1, p2);

    this.structureGroup.add(cabGroup);
  }

  // -------------------------------------------------------------
  // INTERACTION & EVENTS
  // -------------------------------------------------------------
  private setupEvents() {
    const dom = this.renderer.domElement;

    dom.addEventListener('pointermove', (e: PointerEvent) => {
      const rect = dom.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.handleHover(e.clientX, e.clientY);
    });

    dom.addEventListener('click', () => {
      this.handleClick();
    });

    window.addEventListener('resize', this.onWindowResize);
  }

  private handleHover(screenX: number, screenY: number) {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.interactiveObjects, true);

    if (intersects.length > 0) {
      const topHit = intersects[0];
      let obj: THREE.Object3D | null = topHit.object;
      while (obj && !obj.userData?.id && obj.parent) {
        obj = obj.parent;
      }

      if (obj && obj.userData?.id) {
        this.container.style.cursor = 'pointer';
        if (this.hoveredObject !== obj) {
          this.hoveredObject = obj;
          const info: PickedObjectInfo = {
            id: obj.userData.id,
            type: obj.userData.type,
            name: obj.userData.name,
            worldPosition: topHit.point,
          };
          this.onObjectHover?.(info, { x: screenX, y: screenY });
        }
        return;
      }
    }

    if (this.hoveredObject) {
      this.hoveredObject = null;
      this.container.style.cursor = 'default';
      this.onObjectHover?.(null);
    }
  }

  private handleClick() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.interactiveObjects, true);

    if (intersects.length > 0) {
      let obj: THREE.Object3D | null = intersects[0].object;
      while (obj && !obj.userData?.id && obj.parent) {
        obj = obj.parent;
      }

      if (obj && obj.userData?.id) {
        const info: PickedObjectInfo = {
          id: obj.userData.id,
          type: obj.userData.type,
          name: obj.userData.name,
          worldPosition: intersects[0].point,
        };
        this.onObjectSelect?.(info);

        // Gently focus camera target to object position
        this.focusOnPosition(intersects[0].point);
      }
    }
  }

  private onWindowResize = () => {
    if (this.isDisposed || !this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    if (width === 0 || height === 0) return;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  // -------------------------------------------------------------
  // PUBLIC CONTROLS & CAMERA PRESETS
  // -------------------------------------------------------------
  public setCameraPreset(preset: CameraPreset) {
    switch (preset) {
      case 'aerial': // 鸟瞰视角
        this.animateCameraTo(new THREE.Vector3(26, 24, 32), new THREE.Vector3(0, 3, 0));
        break;
      case 'park_panorama': // 园区全貌超广角
        this.animateCameraTo(new THREE.Vector3(75, 62, 85), new THREE.Vector3(0, 2, 0));
        break;
      case 'pond': // 生态河塘水质与水位监测站视角
        this.animateCameraTo(new THREE.Vector3(54, 15, 62), new THREE.Vector3(42, 1.2, 44));
        break;
      case 'gh2': // 2号连栋玻璃温室
        this.animateCameraTo(new THREE.Vector3(58, 16, 18), new THREE.Vector3(42, 3, -4));
        break;
      case 'gh3': // 3号现代连栋圆拱温室
        this.animateCameraTo(new THREE.Vector3(-58, 16, 18), new THREE.Vector3(-42, 3, -4));
        break;
      case 'gh4': // 4号数字育苗工厂
        this.animateCameraTo(new THREE.Vector3(0, 18, -20), new THREE.Vector3(0, 3.5, -46));
        break;
      case 'front': // 正立面
        this.animateCameraTo(new THREE.Vector3(0, 4.5, 36), new THREE.Vector3(0, 3.5, 0));
        break;
      case 'side': // 侧立面
        this.animateCameraTo(new THREE.Vector3(34, 4.5, 0), new THREE.Vector3(0, 3.5, 0));
        break;
      case 'top': // 顶视图
        this.animateCameraTo(new THREE.Vector3(0, 48, 0.1), new THREE.Vector3(0, 0, 0));
        break;
      case 'interior': // 室内漫游视角 (Inside aisle walking view)
        this.animateCameraTo(new THREE.Vector3(0, 1.8, 12), new THREE.Vector3(0, 2.0, -5));
        break;
      case 'zone1': // A区番茄聚焦
        this.animateCameraTo(new THREE.Vector3(-6, 3.5, 12), new THREE.Vector3(-6, 1.5, 5));
        break;
      case 'zone2': // B区水培生菜聚焦
        this.animateCameraTo(new THREE.Vector3(6, 3.5, 12), new THREE.Vector3(6, 1.5, 5));
        break;
      case 'pump_room': // 设备间与泵站聚焦
        this.animateCameraTo(new THREE.Vector3(12, 3.5, -9), new THREE.Vector3(11.2, 1.2, -13));
        break;
    }
  }

  public animateCameraTo(targetCamPos: THREE.Vector3, targetControlsTarget: THREE.Vector3) {
    this.targetCamPos = targetCamPos.clone();
    this.targetControlsTarget = targetControlsTarget.clone();
  }

  public focusOnPosition(point: THREE.Vector3) {
    const offset = this.camera.position.clone().sub(this.controls.target).normalize().multiplyScalar(12);
    const newCamPos = point.clone().add(offset);
    newCamPos.y = Math.max(newCamPos.y, 2.5);
    this.animateCameraTo(newCamPos, point);
  }

  public setDisplayMode(mode: ViewDisplayMode) {
    this.glassMaterials.forEach((mat) => {
      if (mode === 'xray') {
        mat.opacity = 0.06;
        mat.wireframe = true;
      } else if (mode === 'structure_only') {
        mat.opacity = 0.0;
        mat.wireframe = false;
      } else {
        mat.opacity = 0.26;
        mat.wireframe = false;
      }
      mat.needsUpdate = true;
    });

    this.structureMaterials.forEach((mat) => {
      if (mode === 'thermal') {
        mat.color.setHex(0xf97316);
      } else {
        mat.color.setHex(0xcfd8dc);
      }
      mat.needsUpdate = true;
    });
  }

  // -------------------------------------------------------------
  // DYNAMIC DIGITAL TWIN ACTUATOR UPDATES
  // -------------------------------------------------------------
  public updateFanSpeed(fanId: string, speedPct: number) {
    const fan = this.fanBlades.find((f) => f.id === fanId);
    if (fan) {
      fan.speed = speedPct;
    }
  }

  public updateRoofVentAngle(angleDeg: number) {
    const rad = (angleDeg * Math.PI) / 180;
    this.roofVents.forEach((rv) => {
      rv.targetAngle = rad;
    });
  }

  public updateShadeCurtainRatio(ratio: number) {
    // 0 = retracted, 1 = fully shading
    this.shadeCurtainOpenRatio = Math.max(0, Math.min(1, ratio));
  }

  public updateGrowLights(power: boolean, intensityPct: number) {
    const intensity = power ? (intensityPct / 100) * 12 : 0;
    const emissive = power ? (intensityPct / 100) * 1.5 : 0;

    this.growLights.forEach((gl) => {
      gl.light.intensity = intensity;
      const mat = gl.glowMesh.material as THREE.MeshStandardMaterial;
      if (mat) {
        mat.emissiveIntensity = emissive;
      }
    });
  }

  public updateIrrigation(isRunning: boolean) {
    this.isIrrigating = isRunning;
    if (this.waterFlowParticles) {
      this.waterFlowParticles.visible = isRunning;
    }
  }

  // -------------------------------------------------------------
  // MAIN ANIMATION LOOP
  // -------------------------------------------------------------
  private animate = () => {
    if (this.isDisposed) return;
    this.animationFrameId = requestAnimationFrame(this.animate);

    const delta = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    // 1. Fan Blades Rotation Animation
    this.fanBlades.forEach((f) => {
      if (f.speed > 0) {
        f.mesh.rotation.z += (f.speed / 100) * 28 * delta;
      }
    });

    // 2. Roof Vents Hinge Lerp Animation
    this.roofVents.forEach((rv) => {
      rv.currentAngle += (rv.targetAngle - rv.currentAngle) * 4 * delta;
      rv.group.rotation.x = rv.currentAngle * 0.5;
    });

    // 3. Shading Curtains Scaling / Sliding Animation
    const targetScaleX = Math.max(0.01, this.shadeCurtainOpenRatio);
    this.shadeCurtains.forEach((curtain) => {
      curtain.scale.x += (targetScaleX - curtain.scale.x) * 3 * delta;
    });

    // 4. Water Particles Shimmer in Drip Lines
    if (this.isIrrigating && this.waterFlowParticles) {
      const positions = this.waterFlowParticles.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < positions.length / 3; i++) {
        positions[i * 3 + 2] += 2.5 * delta;
        if (positions[i * 3 + 2] > 13.5) {
          positions[i * 3 + 2] = -13.5;
        }
      }
      this.waterFlowParticles.geometry.attributes.position.needsUpdate = true;
    }

    // 5. AGV Robot Navigation Loop along Central Corridor (Z = -13 to +13)
    if (this.agvRobot) {
      const rob = this.agvRobot;
      rob.group.position.z += rob.zDir * 1.2 * delta;
      if (rob.group.position.z > 12.5) {
        rob.zDir = -1;
        rob.group.rotation.y = Math.PI;
      } else if (rob.group.position.z < -12.5) {
        rob.zDir = 1;
        rob.group.rotation.y = 0;
      }
      // Spin LiDAR puck
      rob.lidarPuck.rotation.y += 12 * delta;
    }

    // 6. Sensor Status Halo Pulsation
    this.sensorNodes.forEach((s) => {
      const scale = 1.0 + Math.sin(elapsedTime * 3.5 + s.group.position.x) * 0.18;
      s.halo.scale.set(scale, scale, scale);
    });

    // 7. Pond Water Surface Wave Ripples & Buoy Bobbing Animation
    if (this.pondWaterMesh) {
      const posAttr = this.pondWaterMesh.geometry.attributes.position;
      const count = posAttr.count;
      for (let i = 0; i < count; i++) {
        const u = posAttr.getX(i);
        const v = posAttr.getY(i);
        const wave = Math.sin(u * 0.35 + elapsedTime * 2.2) * 0.08 + Math.cos(v * 0.35 + elapsedTime * 1.8) * 0.06;
        posAttr.setZ(i, wave);
      }
      posAttr.needsUpdate = true;
    }

    if (this.pondBuoy) {
      // Buoy floating heave and pitch on waves
      this.pondBuoy.position.y = -0.1 + Math.sin(elapsedTime * 2.0) * 0.06;
      this.pondBuoy.rotation.z = Math.sin(elapsedTime * 1.5) * 0.03;
      this.pondBuoy.rotation.x = Math.cos(elapsedTime * 1.7) * 0.03;
    }

    if (this.pondBeaconLight) {
      // Blinking 5G telemetry beacon light
      this.pondBeaconLight.intensity = Math.sin(elapsedTime * 5.0) > 0 ? 1.8 : 0.2;
    }

    // 8. Smooth Camera Lerp
    if (this.targetCamPos && this.targetControlsTarget) {
      this.camera.position.lerp(this.targetCamPos, 0.06);
      this.controls.target.lerp(this.targetControlsTarget, 0.06);

      if (
        this.camera.position.distanceTo(this.targetCamPos) < 0.08 &&
        this.controls.target.distanceTo(this.targetControlsTarget) < 0.08
      ) {
        this.targetCamPos = null;
        this.targetControlsTarget = null;
      }
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  // -------------------------------------------------------------
  // DISPOSE & CLEANUP
  // -------------------------------------------------------------
  public dispose() {
    this.isDisposed = true;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('resize', this.onWindowResize);

    this.controls.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
