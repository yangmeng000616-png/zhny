import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  CameraPreset,
  ViewDisplayMode,
  SpatialTagAnchor,
  ProjectedTag,
  EnvironmentFieldType,
  WeatherNowcastPoint,
  RadarEchoFrame,
  AgroRiskWarning,
  SurveillanceCameraConfig,
} from '../types/digitalTwin';
import { surveillanceCamerasData } from '../data/surveillanceData';
import { ParkEnvironment, ParkSubsystems } from './ParkEnvironment';
import { DynamicActorsManager } from './DynamicActorsManager';
import { gateService } from '../services/gateService';

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
    | 'greenhouse'
    | 'facility_drone_dock'
    | 'facility_coldchain'
    | 'facility_fertigation'
    | 'facility_smart_field'
    | 'facility_flux_tower'
    | 'drone_dock'
    | 'coldchain'
    | 'fertigation'
    | 'smart_field'
    | 'flux_tower'
    | 'gate'
    | 'vehicle'
    | 'worker'
    | 'surveillance_camera';
  name: string;
  dataRef?: any;
  extra?: any;
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
  public surveillanceGroup: THREE.Group;

  // Pond & Water telemetry animation references
  private pondSubsystems: ParkSubsystems | null = null;
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
  private anemometerMesh: THREE.Group | null = null;
  private dynamicActorsManager: DynamicActorsManager | null = null;

  // Scene Lighting References
  private ambientLight: THREE.AmbientLight | null = null;
  private sunLight: THREE.DirectionalLight | null = null;
  private hemiLight: THREE.HemisphereLight | null = null;
  private fillLight: THREE.DirectionalLight | null = null;

  // Digital Twin Weather Nowcasting & 3D Meteorological Fields
  private rainParticles: THREE.Points | null = null;
  private rainCount = 3500;
  private isRaining = false;
  private rainIntensity = 0;
  private windSpeedMs = 3.2;
  private windDirectionRad = (135 * Math.PI) / 180;
  private radarEchoMesh: THREE.Mesh | null = null;
  private lightningLight: THREE.DirectionalLight | null = null;
  private lightningTimer = 0;

  // 3D Aerodynamic Wind Streamline Flow Layer
  private windStreamlinesMesh: THREE.LineSegments | null = null;
  private isWindFieldVisible = true;
  private isRainVisible = true;
  private isRadarVisible = false;

  // Selected Object Ground Framing
  private selectionRingMesh: THREE.Group | null = null;
  private selectedObjectId: string | null = null;

  // 3D Continuous Environmental Field (Slices & Particle Grid)
  private envFieldGroup: THREE.Group | null = null;
  private envFieldSliceMesh: THREE.Mesh | null = null;
  private envFieldParticlePoints: THREE.Points | null = null;
  private activeFieldType: EnvironmentFieldType = 'none';
  private fieldSliceY = 2.5;
  private fieldOpacity = 0.75;

  // 3D Spatial Anomaly Alert Beacons & Greenhouse Risk Markers
  private riskWarningBeacons: Map<string, THREE.Group> = new Map();

  // 3D Surveillance Camera Systems & Dynamic FOV Frustums
  private surveillanceFrustums: Map<
    string,
    {
      group: THREE.Group;
      coneMesh: THREE.Mesh;
      wireframe: THREE.LineSegments;
      groundRing: THREE.LineLoop;
      scanPlane: THREE.Mesh;
      camMesh: THREE.Group;
      ledLight: THREE.Mesh;
      config: SurveillanceCameraConfig;
    }
  > = new Map();
  private activeSurveillanceGhId: string = 'gh_001';
  private isSurveillanceFOVVisible: boolean = true;
  private isAllSurveillanceFOVsVisible: boolean = false;

  // 3D Spatial Anchored Badges
  private spatialTags: SpatialTagAnchor[] = [];
  private onTagsUpdate?: (tags: ProjectedTag[]) => void;
  private onCameraOrbit?: () => void;

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

  // Intelligent Boom Barrier & Entrance Gate
  private barrierPivot: THREE.Group | null = null;
  private isBarrierRaised: boolean = false;
  private barrierCurrentAngle: number = 0;
  private barrierTargetAngle: number = 0;
  private barrierSignalLight: THREE.Mesh | null = null;
  public onGateStateChange?: (isRaised: boolean) => void;

  // State flags
  public isIrrigating = true;
  public shadeCurtainOpenRatio = 0; // 0 = retracted, 1 = closed

  constructor(
    container: HTMLElement,
    callbacks?: {
      onHover?: (info: PickedObjectInfo | null, screenPos?: { x: number; y: number }) => void;
      onSelect?: (info: PickedObjectInfo) => void;
      onTagsUpdate?: (tags: ProjectedTag[]) => void;
      onCameraOrbit?: () => void;
      onGateStateChange?: (isRaised: boolean) => void;
    }
  ) {
    this.container = container;
    this.onObjectHover = callbacks?.onHover;
    this.onObjectSelect = callbacks?.onSelect;
    this.onTagsUpdate = callbacks?.onTagsUpdate;
    this.onCameraOrbit = callbacks?.onCameraOrbit;
    this.onGateStateChange = callbacks?.onGateStateChange;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    // 1. Scene setup with clean, professional digital twin background
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x090d16); // Refined deep blue-black background
    // Smooth architectural fog for realistic atmospheric depth
    this.scene.fog = new THREE.Fog(0x090d16, 200, 650);

    // 2. Camera setup - well-proportioned perspective framing the core greenhouse
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(24, 15, 26);

    // 3. Renderer setup
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    container.appendChild(this.renderer.domElement);

    // 4. OrbitControls setup
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.04; // keep camera securely above ground
    this.controls.minDistance = 5.0;
    this.controls.maxDistance = 260; // disciplined zoom-out ceiling
    this.controls.target.set(0, 2.8, 0);

    // Cancel automatic camera animation as soon as user starts mouse manipulation
    this.controls.addEventListener('start', () => {
      this.targetCamPos = null;
      this.targetControlsTarget = null;
      this.onCameraOrbit?.();
    });

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

    this.surveillanceGroup = new THREE.Group();
    this.surveillanceGroup.name = 'Surveillance_Cameras';

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
      this.parkGroup,
      this.surveillanceGroup
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
    this.buildWeatherStation();
    this.buildCampusAmenities();
    this.buildWeatherEffects();
    this.buildContinuousEnvironmentField();
    this.initSpatialTags();

    // 8.5 Build Agricultural Park Infrastructure: Roads, Perimeter Walls & Gate, Additional Greenhouses, River/Pond, Facilities
    ParkEnvironment.buildRoadNetwork(this.scene, this.parkGroup, this.interactiveObjects);
    const gateSubsystems = ParkEnvironment.buildPerimeterWallsAndGate(this.scene, this.parkGroup, this.interactiveObjects);
    this.barrierPivot = gateSubsystems.barrierPivot;
    this.barrierSignalLight = gateSubsystems.signalLight;
    ParkEnvironment.buildAdditionalGreenhouses(this.scene, this.parkGroup, this.glassMaterials, this.interactiveObjects);
    ParkEnvironment.buildAdvancedFacilities(this.scene, this.parkGroup, this.interactiveObjects);
    const pondSubsystems = ParkEnvironment.buildPondAndWaterStation(this.scene, this.parkGroup, this.interactiveObjects);
    this.pondSubsystems = pondSubsystems;
    this.pondWaterMesh = pondSubsystems.waterMesh;
    this.pondBuoy = pondSubsystems.buoy;
    this.pondBeaconLight = pondSubsystems.beaconLight;

    // 8.55 Build Virtual Surveillance Cameras & 3D FOV Frustums
    this.buildSurveillanceCameras();

    // 8.6 Initialize Dynamic Actors (Vehicles & Farm Personnel)
    this.dynamicActorsManager = new DynamicActorsManager();
    this.parkGroup.add(this.dynamicActorsManager.actorsGroup);
    this.interactiveObjects.push(...this.dynamicActorsManager.interactiveObjects);

    // Automatic Gate Recognition & Auto-pass for whitelisted vehicles
    this.dynamicActorsManager.onApproachGate = (plateNumber: string) => {
      const mode = gateService.getGateStatus().mode;
      if (mode === 'always_open') {
        this.setGateBarrierRaised(true);
        return;
      }
      if (mode === 'locked') {
        return;
      }
      if (mode === 'auto_whitelist') {
        const check = gateService.checkPlateWhitelist(plateNumber);
        if (check.isWhitelisted) {
          this.setGateBarrierRaised(true);
        }
      }
    };

    this.dynamicActorsManager.onLeaveGate = () => {
      const mode = gateService.getGateStatus().mode;
      if (mode === 'auto_whitelist') {
        this.setGateBarrierRaised(false);
      }
    };

    // 9. Event Listeners
    this.setupEvents();

    // 10. Start Animation Loop
    this.animate();
  }

  // -------------------------------------------------------------
  // LIGHTING & ENVIRONMENT
  // -------------------------------------------------------------
  private setupLighting() {
    // Natural fresh outdoor daylight ambient (balanced, brings out lush greenery)
    const ambientLight = new THREE.AmbientLight(0x334139, 0.62);
    this.scene.add(ambientLight);
    this.ambientLight = ambientLight;

    // Natural warm solar directional light (5600K balanced sunlight)
    const sunLight = new THREE.DirectionalLight(0xfffae8, 2.3);
    sunLight.position.set(48, 65, 40);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 380;
    const d = 110;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.00015;
    sunLight.shadow.radius = 1.8;
    this.scene.add(sunLight);
    this.sunLight = sunLight;

    // Sky and ground bounce hemisphere (gentle azure daylight + fresh grass bounce)
    const hemiLight = new THREE.HemisphereLight(0xbae6fd, 0x3f6212, 0.72);
    this.scene.add(hemiLight);
    this.hemiLight = hemiLight;

    // Architectural soft fill light from opposite quadrant to reveal structural details
    const fillLight = new THREE.DirectionalLight(0xdbeafe, 0.35);
    fillLight.position.set(-45, 35, -35);
    this.scene.add(fillLight);
    this.fillLight = fillLight;

    // Lightning Flash Light for storm nowcasting
    const lightning = new THREE.DirectionalLight(0xdbeafe, 0);
    lightning.position.set(0, 150, 0);
    this.scene.add(lightning);
    this.lightningLight = lightning;
  }

  private buildGroundAndSite() {
    // 1. Concrete perimeter foundation apron closely hugging greenhouse perimeter
    const groundGeo = new THREE.PlaneGeometry(28, 34);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.88,
      metalness: 0.08,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.02;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // 2. High-precision greenhouse internal hardened slab floor
    const slabGeo = new THREE.BoxGeometry(24.8, 0.2, 30.8);
    const slabMat = new THREE.MeshStandardMaterial({
      color: 0x1c2738, // Clean architectural interior floor
      roughness: 0.7,
      metalness: 0.15,
    });
    const slab = new THREE.Mesh(slabGeo, slabMat);
    slab.position.set(0, -0.1, 0);
    slab.receiveShadow = true;
    this.structureGroup.add(slab);

    // 3. Central concrete logistics aisle
    const aisleGeo = new THREE.BoxGeometry(3.0, 0.02, 30.4);
    const aisleMat = new THREE.MeshStandardMaterial({
      color: 0x243245,
      roughness: 0.55,
      metalness: 0.15,
    });
    const aisle = new THREE.Mesh(aisleGeo, aisleMat);
    aisle.position.set(0, 0.01, 0);
    aisle.receiveShadow = true;
    this.structureGroup.add(aisle);

    // Subtle safety boundary lines along aisle
    const lineMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.6 });
    const lineGeo = new THREE.PlaneGeometry(0.08, 30.2);
    const lineLeft = new THREE.Mesh(lineGeo, lineMat);
    lineLeft.rotation.x = -Math.PI / 2;
    lineLeft.position.set(-1.45, 0.022, 0);
    const lineRight = lineLeft.clone();
    lineRight.position.x = 1.45;
    this.structureGroup.add(lineLeft, lineRight);

    // Architectural reference grid (subtle, non-intrusive)
    const grid = new THREE.GridHelper(70, 35, 0x1e293b, 0x111927);
    grid.position.y = 0.001;
    this.scene.add(grid);
  }

  // -------------------------------------------------------------
  // STEEL STRUCTURE (Columns, Beams, Trusses, Gutters, Roof Purlins)
  // -------------------------------------------------------------
  private buildStructure() {
    const steelMat = new THREE.MeshStandardMaterial({
      color: 0xa0aec0, // Realistic hot-dip galvanized steel
      metalness: 0.75,
      roughness: 0.32,
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
    // Crystal clear low-iron wall glass
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xdbeafe,
      transparent: true,
      opacity: 0.22,
      roughness: 0.08,
      metalness: 0.05,
      transmission: 0.88,
      ior: 1.52,
      reflectivity: 0.75,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    this.glassMaterials.push(glassMat);

    // Diffuse tempered roof glass
    const roofGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0xe2e8f0,
      transparent: true,
      opacity: 0.25,
      roughness: 0.16,
      metalness: 0.05,
      transmission: 0.82,
      ior: 1.5,
      reflectivity: 0.65,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    this.glassMaterials.push(roofGlassMat);

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
    const slope1 = new THREE.Mesh(roofSlopeGeo, roofGlassMat);
    slope1.position.set(-9, 5.65, 0);
    slope1.rotation.y = Math.PI / 2;
    slope1.rotation.x = -slopeAngle;

    // Slope 2: X = -6 to 0 (facing -X)
    const slope2 = new THREE.Mesh(roofSlopeGeo, roofGlassMat);
    slope2.position.set(-3, 5.65, 0);
    slope2.rotation.y = Math.PI / 2;
    slope2.rotation.x = slopeAngle;

    // Slope 3: X = 0 to 6 (facing +X)
    const slope3 = new THREE.Mesh(roofSlopeGeo, roofGlassMat);
    slope3.position.set(3, 5.65, 0);
    slope3.rotation.y = Math.PI / 2;
    slope3.rotation.x = -slopeAngle;

    // Slope 4: X = 6 to 12 (facing -X)
    const slope4 = new THREE.Mesh(roofSlopeGeo, roofGlassMat);
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

    // 1.5. Industrial Wall Exhaust Fans (4 Units along East Longitudinal Wall X = 12.08 facing the road)
    const wallFanPositions = [
      { id: 'fan_wall_001', name: '1号侧墙工业强力负压大风机', z: -9 },
      { id: 'fan_wall_002', name: '2号侧墙工业强力负压大风机', z: -3 },
      { id: 'fan_wall_003', name: '3号侧墙工业强力负压大风机', z: 3 },
      { id: 'fan_wall_004', name: '4号侧墙工业强力负压大风机', z: 9 },
    ];

    for (const wp of wallFanPositions) {
      const fanGroup = new THREE.Group();
      fanGroup.position.set(12.08, 2.4, wp.z);
      fanGroup.rotation.y = -Math.PI / 2; // Face outward (+X towards road)
      fanGroup.name = wp.id;

      // Outer square louver housing
      const casingGeo = new THREE.BoxGeometry(1.8, 1.8, 0.45);
      const casing = new THREE.Mesh(casingGeo, casingMat);
      fanGroup.add(casing);

      // Inner cylindrical airway
      const tubeGeo = new THREE.CylinderGeometry(0.78, 0.78, 0.46, 24, 1, true);
      const tubeMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, side: THREE.DoubleSide });
      const tube = new THREE.Mesh(tubeGeo, tubeMat);
      tube.rotation.x = Math.PI / 2;
      fanGroup.add(tube);

      // Spinning Impeller
      const impeller = new THREE.Group();
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.12, 16), bladeMat);
      hub.rotation.x = Math.PI / 2;
      impeller.add(hub);

      const bladeGeo = new THREE.BoxGeometry(0.18, 0.62, 0.02);
      for (let i = 0; i < 6; i++) {
        const blade = new THREE.Mesh(bladeGeo, bladeMat);
        const ang = (i * Math.PI) / 3;
        blade.position.set(Math.cos(ang) * 0.4, Math.sin(ang) * 0.4, 0);
        blade.rotation.z = ang;
        blade.rotation.y = 0.25;
        impeller.add(blade);
      }
      fanGroup.add(impeller);

      this.fanBlades.push({ id: wp.id, mesh: impeller, speed: 80 });

      casing.userData = {
        id: wp.id,
        type: 'fan',
        name: wp.name,
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
    leftShadeGeo.translate(0, 14.75, 0);
    const leftShade = new THREE.Mesh(leftShadeGeo, shadeMat);
    leftShade.rotation.x = -Math.PI / 2;
    leftShade.position.set(-6, 4.45, -14.75);
    leftShade.scale.set(1, 0.01, 1); // Initially retracted along length
    leftShade.userData = { id: 'shade_curtain_001', type: 'shade_curtain', name: '内保温遮阳反光铝箔拉幕' };
    this.interactiveObjects.push(leftShade);

    const rightShadeGeo = new THREE.PlaneGeometry(11.8, 29.5);
    rightShadeGeo.translate(0, 14.75, 0);
    const rightShade = new THREE.Mesh(rightShadeGeo, shadeMat);
    rightShade.rotation.x = -Math.PI / 2;
    rightShade.position.set(6, 4.45, -14.75);
    rightShade.scale.set(1, 0.01, 1); // Initially retracted along length
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
      { id: 'sensor_ph_001', name: '根际精准酸碱度微探针(pH)', pos: [6, 0.8, 4], type: 'sensor' },
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
  // VIRTUAL SURVEILLANCE CAMERAS & 3D FOV FRUSTUM MARKERS
  // -------------------------------------------------------------
  private buildSurveillanceCameras() {
    surveillanceCamerasData.forEach((cam) => {
      // 1. Camera Physical 3D Model
      const camGroup = new THREE.Group();
      camGroup.position.set(cam.position[0], cam.position[1], cam.position[2]);

      const targetVec = new THREE.Vector3(...cam.target);
      const camPosVec = new THREE.Vector3(...cam.position);

      // Bracket base plate
      const baseGeo = new THREE.BoxGeometry(0.24, 0.24, 0.08);
      const metalMat = new THREE.MeshStandardMaterial({
        color: 0x334155,
        roughness: 0.3,
        metalness: 0.8,
      });
      const baseMesh = new THREE.Mesh(baseGeo, metalMat);
      camGroup.add(baseMesh);

      // Angled mount arm
      const armGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.45, 12);
      const armMesh = new THREE.Mesh(armGeo, metalMat);
      armMesh.position.set(0, -0.15, -0.15);
      armMesh.rotation.x = Math.PI / 4;
      camGroup.add(armMesh);

      // PTZ Dome / Bullet Camera Body
      const bodyGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.28, 20);
      const bodyMat = new THREE.MeshStandardMaterial({
        color: 0xf8fafc,
        roughness: 0.2,
        metalness: 0.1,
      });
      const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
      bodyMesh.position.set(0, -0.32, -0.28);
      bodyMesh.rotation.x = Math.PI / 3;
      camGroup.add(bodyMesh);

      // High-index optical glass lens
      const lensGeo = new THREE.SphereGeometry(0.14, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.7);
      const lensMat = new THREE.MeshPhysicalMaterial({
        color: 0x020617,
        roughness: 0.05,
        metalness: 0.9,
        transmission: 0.4,
      });
      const lensMesh = new THREE.Mesh(lensGeo, lensMat);
      lensMesh.position.set(0, -0.38, -0.34);
      lensMesh.rotation.x = Math.PI / 3;
      camGroup.add(lensMesh);

      // Optical cyan accent ring
      const ringGeo = new THREE.TorusGeometry(0.14, 0.015, 8, 24);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.set(0, -0.38, -0.34);
      ringMesh.rotation.x = Math.PI / 3;
      camGroup.add(ringMesh);

      // Status indicator LED (Blinking Red REC or Cyan online)
      const ledGeo = new THREE.SphereGeometry(0.035, 12, 12);
      const ledMat = new THREE.MeshBasicMaterial({
        color: cam.ghId === this.activeSurveillanceGhId ? 0xef4444 : 0x10b981,
        transparent: true,
        opacity: 0.9,
      });
      const ledMesh = new THREE.Mesh(ledGeo, ledMat);
      ledMesh.position.set(0.14, -0.25, -0.2);
      camGroup.add(ledMesh);

      // Interactive Click Target Box
      const hitGeo = new THREE.SphereGeometry(0.9, 12, 12);
      const hitMat = new THREE.MeshBasicMaterial({ visible: false });
      const hitMesh = new THREE.Mesh(hitGeo, hitMat);
      hitMesh.userData = {
        id: cam.id,
        type: 'surveillance_camera',
        ghId: cam.ghId,
        name: cam.name,
        extra: cam,
      };
      camGroup.add(hitMesh);
      this.interactiveObjects.push(hitMesh);

      this.surveillanceGroup.add(camGroup);

      // 2. Camera Field of View (FOV) Frustum Cone (三维视野范围标记)
      const frustumGroup = new THREE.Group();
      frustumGroup.position.copy(camPosVec);
      frustumGroup.lookAt(targetVec);

      const D = cam.range;
      const halfFovRad = ((cam.fov * Math.PI) / 180) / 2;
      const H = D * Math.tan(halfFovRad);
      const W = H * cam.aspectRatio;

      const P0 = new THREE.Vector3(-W, H, -D);
      const P1 = new THREE.Vector3(W, H, -D);
      const P2 = new THREE.Vector3(W, -H, -D);
      const P3 = new THREE.Vector3(-W, -H, -D);

      // Volumetric Transparent Cone Mesh
      const coneVertices = new Float32Array([
        // Top
        0, 0, 0, P0.x, P0.y, P0.z, P1.x, P1.y, P1.z,
        // Right
        0, 0, 0, P1.x, P1.y, P1.z, P2.x, P2.y, P2.z,
        // Bottom
        0, 0, 0, P2.x, P2.y, P2.z, P3.x, P3.y, P3.z,
        // Left
        0, 0, 0, P3.x, P3.y, P3.z, P0.x, P0.y, P0.z,
        // Far base (two triangles)
        P0.x, P0.y, P0.z, P2.x, P2.y, P2.z, P1.x, P1.y, P1.z,
        P0.x, P0.y, P0.z, P3.x, P3.y, P3.z, P2.x, P2.y, P2.z,
      ]);
      const coneGeo = new THREE.BufferGeometry();
      coneGeo.setAttribute('position', new THREE.BufferAttribute(coneVertices, 3));
      coneGeo.computeVertexNormals();

      const coneMat = new THREE.MeshBasicMaterial({
        color: 0x06b6d4,
        transparent: true,
        opacity: 0.12,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      });
      const coneMesh = new THREE.Mesh(coneGeo, coneMat);
      frustumGroup.add(coneMesh);

      // Luminous Wireframe Outline Edges
      const edgeVerts = new Float32Array([
        0, 0, 0, P0.x, P0.y, P0.z,
        0, 0, 0, P1.x, P1.y, P1.z,
        0, 0, 0, P2.x, P2.y, P2.z,
        0, 0, 0, P3.x, P3.y, P3.z,
        P0.x, P0.y, P0.z, P1.x, P1.y, P1.z,
        P1.x, P1.y, P1.z, P2.x, P2.y, P2.z,
        P2.x, P2.y, P2.z, P3.x, P3.y, P3.z,
        P3.x, P3.y, P3.z, P0.x, P0.y, P0.z,
      ]);
      const wireGeo = new THREE.BufferGeometry();
      wireGeo.setAttribute('position', new THREE.BufferAttribute(edgeVerts, 3));
      const wireMat = new THREE.LineBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.85,
      });
      const wireMesh = new THREE.LineSegments(wireGeo, wireMat);
      frustumGroup.add(wireMesh);

      // Active Dynamic Scan Plane inside the cone
      const scanGeo = new THREE.PlaneGeometry(1, 1);
      const scanMat = new THREE.MeshBasicMaterial({
        color: 0x22d3ee,
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const scanPlane = new THREE.Mesh(scanGeo, scanMat);
      scanPlane.position.set(0, 0, -D * 0.5);
      frustumGroup.add(scanPlane);

      this.surveillanceGroup.add(frustumGroup);

      // Ground Coverage Footprint Projection Circle
      const groundPoints: THREE.Vector3[] = [];
      const radius = Math.max(3, Math.sqrt(cam.groundCoverageM2 / Math.PI) * 0.8);
      for (let i = 0; i <= 32; i++) {
        const theta = (i / 32) * Math.PI * 2;
        groundPoints.push(new THREE.Vector3(Math.cos(theta) * radius, 0.08, Math.sin(theta) * radius));
      }
      const groundGeo = new THREE.BufferGeometry().setFromPoints(groundPoints);
      const groundMat = new THREE.LineBasicMaterial({
        color: 0x06b6d4,
        transparent: true,
        opacity: 0.65,
      });
      const groundRing = new THREE.LineLoop(groundGeo, groundMat);
      groundRing.position.set(cam.target[0], 0.08, cam.target[2]);
      this.surveillanceGroup.add(groundRing);

      this.surveillanceFrustums.set(cam.ghId, {
        group: frustumGroup,
        coneMesh,
        wireframe: wireMesh,
        groundRing,
        scanPlane,
        camMesh: camGroup,
        ledLight: ledMesh,
        config: cam,
      });
    });

    this.updateSurveillanceFrustumsVisibility();
  }

  // Update visibility of 3D surveillance frustums
  private updateSurveillanceFrustumsVisibility() {
    this.surveillanceFrustums.forEach((f, ghId) => {
      const isActive = ghId === this.activeSurveillanceGhId;
      if (!this.isSurveillanceFOVVisible) {
        f.group.visible = false;
        f.groundRing.visible = false;
        return;
      }

      if (isActive) {
        f.group.visible = true;
        f.groundRing.visible = true;
        (f.coneMesh.material as THREE.MeshBasicMaterial).opacity = 0.18;
        (f.wireframe.material as THREE.LineBasicMaterial).opacity = 0.95;
        (f.groundRing.material as THREE.LineBasicMaterial).opacity = 0.85;
        f.scanPlane.visible = true;
      } else if (this.isAllSurveillanceFOVsVisible) {
        f.group.visible = true;
        f.groundRing.visible = true;
        (f.coneMesh.material as THREE.MeshBasicMaterial).opacity = 0.04;
        (f.wireframe.material as THREE.LineBasicMaterial).opacity = 0.3;
        (f.groundRing.material as THREE.LineBasicMaterial).opacity = 0.25;
        f.scanPlane.visible = false;
      } else {
        f.group.visible = false;
        f.groundRing.visible = false;
      }
    });
  }

  // Set active greenhouse surveillance camera & switch 3D FOV
  public setActiveSurveillanceCamera(ghId: string, flyTo: boolean = false) {
    this.activeSurveillanceGhId = ghId;
    this.updateSurveillanceFrustumsVisibility();

    if (flyTo) {
      this.flyToSurveillanceCameraView(ghId);
    }
  }

  // Fly camera to match virtual surveillance camera viewpoint
  public flyToSurveillanceCameraView(ghId: string) {
    const frustumData = this.surveillanceFrustums.get(ghId);
    if (!frustumData) return;

    const cam = frustumData.config;
    const eye = new THREE.Vector3(...cam.position);
    const target = new THREE.Vector3(...cam.target);

    // Position camera just behind the surveillance camera for an authentic viewpoint
    const backOffset = eye.clone().sub(target).normalize().multiplyScalar(2.0);
    const cameraLookPos = eye.clone().add(backOffset);

    this.animateCameraTo(cameraLookPos, target);
  }

  // Toggle 3D FOV marker visibility
  public setSurveillanceFOVVisible(visible: boolean) {
    this.isSurveillanceFOVVisible = visible;
    this.updateSurveillanceFrustumsVisibility();
  }

  // Toggle showing all 3D FOV markers simultaneously across the entire park
  public setAllSurveillanceFOVsVisible(showAll: boolean) {
    this.isAllSurveillanceFOVsVisible = showAll;
    this.updateSurveillanceFrustumsVisibility();
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
  // WEATHER STATION (Roof Ridge Mast, Wind Cups, Vane, Pyranometer)
  // -------------------------------------------------------------
  private buildWeatherStation() {
    const weatherGroup = new THREE.Group();
    weatherGroup.position.set(0, 6.8, 4.0); // center roof ridge
    weatherGroup.name = 'weather_station_01';

    const mastMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.25 });
    const cupMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.7, roughness: 0.3 });

    // Mast pole
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 1.8, 8), mastMat);
    mast.position.y = 0.9;
    weatherGroup.add(mast);

    // Lightning rod spike
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.4, 8), mastMat);
    spike.position.y = 1.95;
    weatherGroup.add(spike);

    // Cross arm
    const crossarm = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.04, 0.04), mastMat);
    crossarm.position.y = 1.45;
    weatherGroup.add(crossarm);

    // Wind Anemometer (3 spinning cups)
    const anemoGroup = new THREE.Group();
    anemoGroup.position.set(0.45, 1.55, 0);

    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.2, 8), mastMat);
    anemoGroup.add(shaft);

    const cupAssembly = new THREE.Group();
    cupAssembly.position.y = 0.08;
    for (let i = 0; i < 3; i++) {
      const ang = (i * Math.PI * 2) / 3;
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.015, 0.015), mastMat);
      arm.position.set(Math.cos(ang) * 0.09, 0, Math.sin(ang) * 0.09);
      arm.rotation.y = -ang;
      cupAssembly.add(arm);

      // Hemispherical cup
      const cup = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8, 0, Math.PI), cupMat);
      cup.position.set(Math.cos(ang) * 0.18, 0, Math.sin(ang) * 0.18);
      cup.rotation.y = -ang + Math.PI / 2;
      cupAssembly.add(cup);
    }
    anemoGroup.add(cupAssembly);
    this.anemometerMesh = cupAssembly;
    weatherGroup.add(anemoGroup);

    // Wind Direction Vane
    const vaneGroup = new THREE.Group();
    vaneGroup.position.set(-0.45, 1.55, 0);
    const vaneShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.2, 8), mastMat);
    vaneGroup.add(vaneShaft);
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.08, 0.01), cupMat);
    fin.position.set(0.1, 0.1, 0);
    vaneGroup.add(fin);
    weatherGroup.add(vaneGroup);

    // Solar Pyranometer Dome (Sun radiation sensor)
    const domeMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xfacc15, emissiveIntensity: 0.6 });
    const pyrano = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2), domeMat);
    pyrano.position.set(0, 1.8, 0);
    weatherGroup.add(pyrano);

    // Mini Solar Panel for Weather Station
    const pvMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, metalness: 0.8, roughness: 0.2 });
    const solarPnl = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.02, 0.25), pvMat);
    solarPnl.rotation.x = 0.5;
    solarPnl.position.set(0, 1.1, 0.2);
    weatherGroup.add(solarPnl);

    // Interactive Raycasting Hit Box
    const hitBox = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.2, 1.2), new THREE.MeshBasicMaterial({ visible: false }));
    hitBox.position.y = 1.1;
    hitBox.userData = { id: 'weather_station_01', type: 'sensor', name: '室外农业气象综合监测站' };
    weatherGroup.add(hitBox);
    this.interactiveObjects.push(hitBox);

    this.structureGroup.add(weatherGroup);
  }

  // -------------------------------------------------------------
  // CAMPUS AMENITIES: CONTROL CENTER, OUTDOOR IRRIGATION TANKS & TRUCK
  // -------------------------------------------------------------
  private buildCampusAmenities() {
    const amenitiesGroup = new THREE.Group();
    amenitiesGroup.name = 'Campus_Amenities';

    // 1. Control Center / Guardhouse Building (X = 16.5, Z = 13.5)
    const controlBuilding = new THREE.Group();
    controlBuilding.position.set(16.5, 0, 13.5);
    controlBuilding.name = 'control_center_01';

    // Concrete foundation slab
    const slabMat = new THREE.MeshStandardMaterial({ color: 0xcfd8dc, roughness: 0.7 });
    const slab = new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.25, 4.8), slabMat);
    slab.position.y = 0.125;
    controlBuilding.add(slab);

    // Main office building walls
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35 });
    const walls = new THREE.Mesh(new THREE.BoxGeometry(6.0, 3.2, 4.2), wallMat);
    walls.position.y = 1.85;
    walls.castShadow = true;
    controlBuilding.add(walls);

    // Sloped blue solar panel roof (matches the reference image!)
    const solarRoofMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, metalness: 0.8, roughness: 0.25 });
    const roof = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.2, 4.6), solarRoofMat);
    roof.position.set(0, 3.55, 0);
    roof.rotation.x = -0.15; // gentle pitch
    controlBuilding.add(roof);

    // Glass ribbon windows & entrance door
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.6,
      roughness: 0.1,
      metalness: 0.2,
      transmission: 0.7,
    });
    const door = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.2, 0.05), glassMat);
    door.position.set(-1.6, 1.35, 2.12);
    controlBuilding.add(door);

    const windowPnl = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.2, 0.05), glassMat);
    windowPnl.position.set(1.1, 1.8, 2.12);
    controlBuilding.add(windowPnl);

    // Signboard on control center
    const signMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, emissive: 0x0284c7, emissiveIntensity: 0.3 });
    const sign = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.5, 0.06), signMat);
    sign.position.set(0, 3.1, 2.14);
    controlBuilding.add(sign);

    // Hit box for interaction
    const ctrlHit = new THREE.Mesh(new THREE.BoxGeometry(6.6, 3.8, 5.0), new THREE.MeshBasicMaterial({ visible: false }));
    ctrlHit.position.y = 1.9;
    ctrlHit.userData = { id: 'control_center_01', type: 'structure', name: '智慧农业中央控制中心与监控大厅' };
    controlBuilding.add(ctrlHit);
    this.interactiveObjects.push(ctrlHit);

    amenitiesGroup.add(controlBuilding);

    // 2. Outdoor Irrigation Storage Tanks & Booster Pump Station (X = 16.5, Z = 2.5)
    const tankGroup = new THREE.Group();
    tankGroup.position.set(16.5, 0, 2.5);
    tankGroup.name = 'irrigation_system_main';

    // Concrete equipment foundation
    const tankPadMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8 });
    const tankPad = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.25, 7.8), tankPadMat);
    tankPad.position.y = 0.125;
    tankGroup.add(tankPad);

    // Dual cylindrical water storage tanks
    const tankMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0, // Clean industrial white/silver
      metalness: 0.6,
      roughness: 0.25,
    });
    const saddleMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 });
    const pipeMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.7, roughness: 0.3 });
    const valveMat = new THREE.MeshStandardMaterial({ color: 0xdc2626 });

    [-1.6, 1.6].forEach((tz) => {
      // Horizontal cylinder body
      const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 3.6, 24), tankMat);
      tank.rotation.z = Math.PI / 2;
      tank.position.set(0, 1.15, tz);
      tankGroup.add(tank);

      // Spherical end caps
      const capGeo = new THREE.SphereGeometry(0.85, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
      const cap1 = new THREE.Mesh(capGeo, tankMat);
      cap1.rotation.z = -Math.PI / 2;
      cap1.position.set(1.8, 1.15, tz);
      const cap2 = new THREE.Mesh(capGeo, tankMat);
      cap2.rotation.z = Math.PI / 2;
      cap2.position.set(-1.8, 1.15, tz);
      tankGroup.add(cap1, cap2);

      // Support steel saddle cradles
      [-1.0, 1.0].forEach((sx) => {
        const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.5, 1.9), saddleMat);
        saddle.position.set(sx, 0.45, tz);
        tankGroup.add(saddle);
      });
    });

    // Connecting blue pipes & manifold
    const manifold = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.6, 12), pipeMat);
    manifold.position.set(0, 0.55, 0);
    tankGroup.add(manifold);

    const feedPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.8, 12), pipeMat);
    feedPipe.rotation.z = Math.PI / 2;
    feedPipe.position.set(-1.5, 0.55, 0);
    tankGroup.add(feedPipe);

    // Gate valve handwheels
    [-1.6, 1.6].forEach((tz) => {
      const valve = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.02, 8, 16), valveMat);
      valve.rotation.x = Math.PI / 2;
      valve.position.set(0.8, 1.15, tz + 0.9);
      tankGroup.add(valve);
    });

    // Skid-mounted booster pump unit
    const pumpMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.8, roughness: 0.2 });
    const pumpMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.6, 12), pumpMat);
    pumpMesh.rotation.x = Math.PI / 2;
    pumpMesh.position.set(-1.2, 0.5, 0);
    tankGroup.add(pumpMesh);

    // Hit box
    const tankHit = new THREE.Mesh(new THREE.BoxGeometry(4.6, 2.5, 7.8), new THREE.MeshBasicMaterial({ visible: false }));
    tankHit.position.y = 1.25;
    tankHit.userData = { id: 'irrigation_system_main', type: 'pump', name: '智能水肥一体化储水与智能变频泵组' };
    tankGroup.add(tankHit);
    this.interactiveObjects.push(tankHit);

    amenitiesGroup.add(tankGroup);

    // 3. Parked White Logistics Inspection Truck (X = 19.5, Z = -4.5)
    const truckGroup = new THREE.Group();
    truckGroup.position.set(19.5, 0, -4.5);
    truckGroup.name = 'logistics_truck';

    const truckWhiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
    const truckDarkMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 });
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });

    // Chassis
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.2, 4.8), truckDarkMat);
    chassis.position.y = 0.45;
    truckGroup.add(chassis);

    // Cab
    const cab = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.4, 1.4), truckWhiteMat);
    cab.position.set(0, 1.2, 1.6);
    truckGroup.add(cab);

    // Windshield
    const windshield = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.8), glassMat);
    windshield.position.set(0, 1.4, 2.31);
    truckGroup.add(windshield);

    // Rear cargo box
    const cargo = new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.8, 3.2), truckWhiteMat);
    cargo.position.set(0, 1.45, -0.7);
    truckGroup.add(cargo);

    // Green stripe on cargo box
    const stripeMat = new THREE.MeshStandardMaterial({ color: 0x16a34a });
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.92, 0.25, 3.1), stripeMat);
    stripe.position.set(0, 1.35, -0.7);
    truckGroup.add(stripe);

    // Wheels (4 units)
    [
      { x: -0.95, z: 1.5 },
      { x: 0.95, z: 1.5 },
      { x: -0.95, z: -1.2 },
      { x: 0.95, z: -1.2 },
    ].forEach((wp) => {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.2, 16), wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wp.x, 0.32, wp.z);
      truckGroup.add(wheel);
    });

    amenitiesGroup.add(truckGroup);

    // 4. Landscaped Agricultural Trees along Road Verge
    const treePositions = [
      { x: 15.5, z: -9.5 },
      { x: 15.5, z: -13.5 },
      { x: 15.5, z: 8.5 },
      { x: 26.5, z: -5.0 },
      { x: 26.5, z: 6.0 },
    ];

    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 });
    const leafMat1 = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.6 });
    const leafMat2 = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.5 });

    treePositions.forEach((tp) => {
      const tree = new THREE.Group();
      tree.position.set(tp.x, 0, tp.z);

      // Trunk
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 2.0, 8), trunkMat);
      trunk.position.y = 1.0;
      tree.add(trunk);

      // Canopy layers
      const cone1 = new THREE.Mesh(new THREE.ConeGeometry(1.4, 1.8, 8), leafMat1);
      cone1.position.y = 2.4;
      const cone2 = new THREE.Mesh(new THREE.ConeGeometry(1.1, 1.5, 8), leafMat2);
      cone2.position.y = 3.2;
      tree.add(cone1, cone2);

      amenitiesGroup.add(tree);
    });

    this.parkGroup.add(amenitiesGroup);
  }

  // -------------------------------------------------------------
  // 3D SPATIAL ANCHORED TAGS ENGINE
  // -------------------------------------------------------------
  private initSpatialTags() {
    this.spatialTags = [
      {
        id: 'tag_weather',
        name: '气象站',
        category: 'weather',
        worldPos: [0, 7.8, 4.0],
        icon: 'CloudSun',
        statusText: '在线 · 正常',
        subtext: '光照 68klux · 风速 2.4m/s · 晴',
        targetId: 'weather_station_01',
      },
      {
        id: 'tag_ventilation',
        name: '通风系统',
        category: 'fan',
        worldPos: [12.2, 3.6, 0.0],
        icon: 'Fan',
        statusText: '4台大功率风机 · 运行中',
        subtext: '转速 80% · 负压抽风',
        targetId: 'fan_wall_001',
      },
      {
        id: 'tag_grow_light',
        name: '补光灯',
        category: 'light',
        worldPos: [6.0, 5.0, 2.0],
        icon: 'Lightbulb',
        statusText: 'LED全光谱补光阵列',
        subtext: '亮度 75% · 智能补光中',
        targetId: 'light_grow_001',
      },
      {
        id: 'tag_sensor',
        name: '环境传感器',
        category: 'sensor',
        worldPos: [0.0, 4.2, 0.0],
        icon: 'Cpu',
        statusText: '多参数物联网传感节点',
        subtext: '温 28.6℃ · 湿 72% · CO₂ 680ppm',
        targetId: 'sensor_temp_001',
      },
      {
        id: 'tag_control_center',
        name: '控制中心',
        category: 'control',
        worldPos: [16.5, 3.6, 13.5],
        icon: 'Monitor',
        statusText: '智慧农业中央控制中心',
        subtext: '边缘PLC控制柜 · 光伏并网',
        targetId: 'control_center_01',
      },
      {
        id: 'tag_entrance_gate',
        name: '主出入口·智能道闸',
        category: 'gate',
        worldPos: [22.0, 6.2, 88.0],
        icon: 'ShieldCheck',
        statusText: '园区南大门 · 智能车牌识别出入道闸',
        subtext: '自动车牌比对 · 白名单放行 · 往来台账',
        targetId: 'facility_entrance_gate',
      },
      {
        id: 'tag_north_gate',
        name: '北大门·农机物流道',
        category: 'gate',
        worldPos: [22.0, 5.2, -100.0],
        icon: 'Truck',
        statusText: '北大门 · 重型农机与冷链物流通道',
        subtext: '大型农机出入通道',
        targetId: 'facility_north_gate',
      },
      {
        id: 'tag_irrigation',
        name: '灌溉系统',
        category: 'irrigation',
        worldPos: [16.5, 3.2, 2.5],
        icon: 'Droplets',
        statusText: '水肥一体化蓄水与泵站',
        subtext: '压力 0.35MPa · 流量 45m³/h',
        targetId: 'irrigation_system_main',
      },
      {
        id: 'tag_pond',
        name: '生态河塘水质',
        category: 'pond',
        worldPos: [42.0, 2.6, 44.0],
        icon: 'Waves',
        statusText: 'Ⅰ类生态水体 · 水位 2.45m',
        subtext: '溶解氧 7.4mg/L · 浊度 3.8NTU',
        targetId: 'pond_station_01',
      },
      {
        id: 'tag_agv',
        name: '巡检机器人',
        category: 'agv',
        worldPos: [0.0, 1.8, 0.0],
        icon: 'Bot',
        statusText: 'AGV-01 智能巡检',
        subtext: '电量 86% · 巡视中',
        targetId: 'agv_patrol_01',
      },
      {
        id: 'tag_drone_dock',
        name: '无人机机巢',
        category: 'drone',
        worldPos: [20.0, 3.2, 34.0],
        icon: 'Plane',
        statusText: '无人机智能机巢 · 待命',
        subtext: 'RTK基站锁定 · 电池100% · 巡检待飞',
        targetId: 'facility_drone_dock',
      },
      {
        id: 'tag_coldchain',
        name: '冷链物流中心',
        category: 'logistics',
        worldPos: [-36.0, 7.2, -52.0],
        icon: 'Truck',
        statusText: '冷链物流与分选中心',
        subtext: '库温 2.8℃ · 1号冷藏车装车完毕',
        targetId: 'facility_coldchain',
      },
      {
        id: 'tag_fertigation_tanks',
        name: '水肥储罐群',
        category: 'tank',
        worldPos: [42.0, 6.2, -48.0],
        icon: 'Layers',
        statusText: '水肥一体化储罐群',
        subtext: 'EC 2.2mS/cm · pH 6.2 · 储液充足',
        targetId: 'facility_fertigation_tanks',
      },
      {
        id: 'tag_smart_field',
        name: '智慧大田试验区',
        category: 'field',
        worldPos: [-36.0, 3.8, 74.0],
        icon: 'Sprout',
        statusText: '智慧大田物联网试验区',
        subtext: '太阳能杀虫灯正常 · 土壤含水24.5%',
        targetId: 'facility_smart_field',
      },
      {
        id: 'tag_flux_tower',
        name: '生态碳通量塔',
        category: 'tower',
        worldPos: [72.0, 18.2, 34.0],
        icon: 'Activity',
        statusText: '生态通量观测塔 (18m)',
        subtext: '三维超声测风 · 涡度相关碳通量',
        targetId: 'facility_flux_tower',
      },
    ];
  }

  public calculateSpatialTags() {
    if (!this.onTagsUpdate) return;
    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 600;

    const results: ProjectedTag[] = [];
    const tempVec = new THREE.Vector3();

    for (const tag of this.spatialTags) {
      if (tag.id === 'tag_agv' && this.agvRobot) {
        tempVec.copy(this.agvRobot.group.position);
        tempVec.y += 1.4;
      } else {
        tempVec.set(tag.worldPos[0], tag.worldPos[1], tag.worldPos[2]);
      }

      const dist = this.camera.position.distanceTo(tempVec);
      tempVec.project(this.camera);

      const isVisible = tempVec.z < 1.0 && tempVec.z > -1.0;
      const screenX = (tempVec.x * 0.5 + 0.5) * width;
      const screenY = (-(tempVec.y * 0.5) + 0.5) * height;

      results.push({
        ...tag,
        screenX,
        screenY,
        isVisible,
        distance: dist,
      });
    }

    this.onTagsUpdate(results);
  }

  // -------------------------------------------------------------
  // INTERACTION & EVENTS
  // -------------------------------------------------------------
  private setupEvents() {
    const dom = this.renderer.domElement;
    let pointerDownPos = { x: 0, y: 0 };
    let isDragging = false;

    dom.addEventListener('pointerdown', (e: PointerEvent) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
      isDragging = false;
      // Stop any camera lerp animation immediately on user interaction
      this.targetCamPos = null;
      this.targetControlsTarget = null;
      this.onCameraOrbit?.();
    });

    dom.addEventListener('pointermove', (e: PointerEvent) => {
      const rect = dom.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      const dist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
      if (dist > 4) {
        isDragging = true;
      }

      this.handleHover(e.clientX, e.clientY);
    });

    dom.addEventListener('pointerup', () => {
      if (isDragging) return; // User was rotating, panning or orbiting, do not treat as click!
      this.handleClick();
    });

    // Also stop camera animation on mouse wheel / trackpad pinch zoom
    dom.addEventListener('wheel', () => {
      this.targetCamPos = null;
      this.targetControlsTarget = null;
      this.onCameraOrbit?.();
    }, { passive: true });

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
            extra: obj.userData,
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
          extra: obj.userData,
          worldPosition: intersects[0].point,
        };
        // Select object to inspect details in modal without snatching user's camera viewpoint
        this.onObjectSelect?.(info);
      } else {
        this.onObjectSelect?.(null);
      }
    } else {
      // Clicked on empty terrain / sky: clear selection
      this.onObjectSelect?.(null);
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
      case 'gh5': // 5号智能蓄热日光温室
        this.animateCameraTo(new THREE.Vector3(-36, 14, 58), new THREE.Vector3(-36, 2.5, 40));
        break;
      case 'gh6': // 6号鱼菜共生生态温室
        this.animateCameraTo(new THREE.Vector3(-4, 15, 58), new THREE.Vector3(-4, 2.5, 40));
        break;
      case 'gh7': // 7号垂直气雾培农业温室
        this.animateCameraTo(new THREE.Vector3(72, 16, 18), new THREE.Vector3(72, 3.0, -4));
        break;
      case 'gh8': // 8号光伏农业一体化温室
        this.animateCameraTo(new THREE.Vector3(-68, 16, 18), new THREE.Vector3(-68, 3.0, -4));
        break;
      case 'drone_dock': // 无人机智能机巢
        this.animateCameraTo(new THREE.Vector3(20, 8, 44), new THREE.Vector3(20, 1.2, 34));
        break;
      case 'coldchain': // 冷链物流中心与采后分选
        this.animateCameraTo(new THREE.Vector3(-36, 16, -32), new THREE.Vector3(-36, 3.5, -52));
        break;
      case 'fertigation_tanks': // 水肥一体化储罐群
        this.animateCameraTo(new THREE.Vector3(42, 15, -30), new THREE.Vector3(42, 3.0, -48));
        break;
      case 'smart_field': // 智慧大田试验区
        this.animateCameraTo(new THREE.Vector3(-36, 14, 92), new THREE.Vector3(-36, 1.5, 74));
        break;
      case 'flux_tower': // 生态通量微气象塔
        this.animateCameraTo(new THREE.Vector3(72, 22, 54), new THREE.Vector3(72, 10.0, 34));
        break;
      case 'gate': // 园区南大门与智能出入道闸
        this.animateCameraTo(new THREE.Vector3(22 + 16, 12, 88 + 22), new THREE.Vector3(22, 2.5, 88));
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
  // INTELLIGENT BOOM BARRIER & ACCESS CONTROL
  // -------------------------------------------------------------
  public setGateBarrierRaised(raised: boolean) {
    this.isBarrierRaised = raised;
    this.barrierTargetAngle = raised ? Math.PI * 0.45 : 0;
    if (this.barrierSignalLight) {
      const mat = this.barrierSignalLight.material as THREE.MeshStandardMaterial;
      if (mat) {
        mat.color.setHex(raised ? 0x10b981 : 0xef4444);
        mat.emissive.setHex(raised ? 0x10b981 : 0xef4444);
      }
    }
    this.onGateStateChange?.(raised);
  }

  public isGateBarrierRaised(): boolean {
    return this.isBarrierRaised;
  }

  public toggleGateBarrier(): boolean {
    const nextState = !this.isBarrierRaised;
    this.setGateBarrierRaised(nextState);
    return nextState;
  }

  // -------------------------------------------------------------
  // WEATHER NOWCASTING & 3D METEOROLOGICAL EFFECTS
  // -------------------------------------------------------------
  private buildWeatherEffects() {
    // 1. Rain Particle System
    const rainGeo = new THREE.BufferGeometry();
    const rainPos = new Float32Array(this.rainCount * 3);
    for (let i = 0; i < this.rainCount; i++) {
      rainPos[i * 3] = (Math.random() - 0.5) * 160;
      rainPos[i * 3 + 1] = Math.random() * 55;
      rainPos[i * 3 + 2] = (Math.random() - 0.5) * 160;
    }
    rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
    const rainMat = new THREE.PointsMaterial({
      color: 0xc7d2fe,
      size: 0.3,
      transparent: true,
      opacity: 0.65,
      blending: THREE.NormalBlending,
    });
    this.rainParticles = new THREE.Points(rainGeo, rainMat);
    this.rainParticles.visible = false;
    this.scene.add(this.rainParticles);

    // 2. 3D Aerodynamic Wind Streamline Flow Field (Soft translucent atmospheric currents)
    this.buildWindStreamlineField();

    // 3. Weather Radar Atmospheric Reflectivity Echo Layer (Feathered circular disk at Y = 36m)
    const radarGeo = new THREE.CircleGeometry(85, 48);
    const radarTexture = this.createRadarEchoTexture();
    const radarMat = new THREE.MeshBasicMaterial({
      map: radarTexture,
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.radarEchoMesh = new THREE.Mesh(radarGeo, radarMat);
    this.radarEchoMesh.rotation.x = -Math.PI / 2;
    this.radarEchoMesh.position.y = 36;
    this.radarEchoMesh.visible = false;
    this.scene.add(this.radarEchoMesh);
  }

  private createRadarEchoTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(256, 256, 10, 256, 256, 250);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.65)');
      grad.addColorStop(0.35, 'rgba(255, 255, 255, 0.45)');
      grad.addColorStop(0.7, 'rgba(255, 255, 255, 0.18)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 512);

      // Subtle radar concentric range rings
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1.5;
      [75, 150, 225].forEach((r) => {
        ctx.beginPath();
        ctx.arc(256, 256, r, 0, Math.PI * 2);
        ctx.stroke();
      });
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    return texture;
  }

  private buildWindStreamlineField() {
    const streamCount = 240;
    const positions = new Float32Array(streamCount * 6);
    const colors = new Float32Array(streamCount * 6);

    // Soft sky-blue to deep atmospheric slate
    const cHead = new THREE.Color(0x0284c7);
    const cTail = new THREE.Color(0x0f172a);

    for (let i = 0; i < streamCount; i++) {
      const x = (Math.random() - 0.5) * 150;
      const y = 3.0 + Math.random() * 11;
      const z = (Math.random() - 0.5) * 150;
      const len = 2.0 + Math.random() * 1.5;
      const dx = Math.cos(this.windDirectionRad) * len;
      const dz = Math.sin(this.windDirectionRad) * len;

      positions[i * 6] = x;
      positions[i * 6 + 1] = y;
      positions[i * 6 + 2] = z;

      positions[i * 6 + 3] = x + dx;
      positions[i * 6 + 4] = y;
      positions[i * 6 + 5] = z + dz;

      colors[i * 6] = cTail.r;
      colors[i * 6 + 1] = cTail.g;
      colors[i * 6 + 2] = cTail.b;

      colors[i * 6 + 3] = cHead.r;
      colors[i * 6 + 4] = cHead.g;
      colors[i * 6 + 5] = cHead.b;
    }

    const streamGeo = new THREE.BufferGeometry();
    streamGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    streamGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const streamMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.45,
      blending: THREE.NormalBlending,
    });

    this.windStreamlinesMesh = new THREE.LineSegments(streamGeo, streamMat);
    this.windStreamlinesMesh.visible = this.isWindFieldVisible;
    this.scene.add(this.windStreamlinesMesh);
  }

  public setWeatherLayerVisible(layer: 'rain' | 'wind' | 'radar' | 'field', visible: boolean) {
    if (layer === 'rain') {
      this.isRainVisible = visible;
      if (this.rainParticles) {
        this.rainParticles.visible = visible && this.isRaining;
      }
    } else if (layer === 'wind') {
      this.isWindFieldVisible = visible;
      if (this.windStreamlinesMesh) {
        this.windStreamlinesMesh.visible = visible;
      }
    } else if (layer === 'radar') {
      this.isRadarVisible = visible;
      if (this.radarEchoMesh) {
        this.radarEchoMesh.visible = visible;
      }
    } else if (layer === 'field') {
      if (this.envFieldGroup) {
        this.envFieldGroup.visible = visible;
      }
    }
  }

  public setWeatherEffect(point: WeatherNowcastPoint) {
    this.windSpeedMs = point.windSpeed;
    this.windDirectionRad = (point.windDirectionDegrees * Math.PI) / 180;
    this.isRaining = point.precipitationMmPerHour > 0;
    this.rainIntensity = Math.min(1.0, point.precipitationMmPerHour / 30.0);

    if (this.rainParticles) {
      this.rainParticles.visible = this.isRaining && this.isRainVisible;
    }

    // Dynamic environmental sky and light adjustment based on real-time nowcast
    if (point.condition === 'storm' || point.precipitationMmPerHour >= 15) {
      this.scene.background = new THREE.Color(0x050810);
      if (this.scene.fog) (this.scene.fog as THREE.Fog).color = new THREE.Color(0x050810);
      if (this.ambientLight) this.ambientLight.intensity = 0.32;
      if (this.sunLight) this.sunLight.intensity = 0.35;
    } else if (point.condition === 'heavy_rain' || point.condition === 'moderate_rain') {
      this.scene.background = new THREE.Color(0x070b14);
      if (this.scene.fog) (this.scene.fog as THREE.Fog).color = new THREE.Color(0x070b14);
      if (this.ambientLight) this.ambientLight.intensity = 0.38;
      if (this.sunLight) this.sunLight.intensity = 0.85;
    } else {
      this.scene.background = new THREE.Color(0x090d16);
      if (this.scene.fog) (this.scene.fog as THREE.Fog).color = new THREE.Color(0x090d16);
      if (this.ambientLight) this.ambientLight.intensity = 0.45;
      if (this.sunLight) this.sunLight.intensity = 2.0;
    }
  }

  public setRadarEchoFrame(frame: RadarEchoFrame | null) {
    if (!this.radarEchoMesh) return;
    if (!frame || !this.isRadarVisible) {
      this.radarEchoMesh.visible = false;
      return;
    }
    this.radarEchoMesh.visible = true;
    const mat = this.radarEchoMesh.material as THREE.MeshBasicMaterial;
    mat.opacity = Math.min(0.7, 0.2 + (frame.maxDbz / 65) * 0.5);
    if (frame.maxDbz >= 50) {
      mat.color.setHex(0xdc2626);
    } else if (frame.maxDbz >= 40) {
      mat.color.setHex(0xf97316);
    } else if (frame.maxDbz >= 30) {
      mat.color.setHex(0xeab308);
    } else {
      mat.color.setHex(0x10b981);
    }
  }

  // -------------------------------------------------------------
  // CONTINUOUS 3D ENVIRONMENT FIELD VISUALIZATION
  // -------------------------------------------------------------
  private buildContinuousEnvironmentField() {
    this.envFieldGroup = new THREE.Group();
    this.envFieldGroup.name = 'Continuous_Environment_Field';
    this.envFieldGroup.visible = false;

    // 1. Horizontal continuous interpolated slice plane
    const planeGeo = new THREE.PlaneGeometry(23, 29, 32, 32);
    const planeMat = new THREE.MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.envFieldSliceMesh = new THREE.Mesh(planeGeo, planeMat);
    this.envFieldSliceMesh.rotation.x = -Math.PI / 2;
    this.envFieldSliceMesh.position.set(0, this.fieldSliceY, 0);
    this.envFieldGroup.add(this.envFieldSliceMesh);

    // 2. Volumetric 3D spatial points cloud
    const count = 1200;
    const ptGeo = new THREE.BufferGeometry();
    const ptPos = new Float32Array(count * 3);
    const ptColors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      ptPos[i * 3] = (Math.random() - 0.5) * 22;
      ptPos[i * 3 + 1] = 0.8 + Math.random() * 4.8;
      ptPos[i * 3 + 2] = (Math.random() - 0.5) * 28;

      ptColors[i * 3] = 0.2;
      ptColors[i * 3 + 1] = 0.8;
      ptColors[i * 3 + 2] = 0.9;
    }
    ptGeo.setAttribute('position', new THREE.BufferAttribute(ptPos, 3));
    ptGeo.setAttribute('color', new THREE.BufferAttribute(ptColors, 3));

    const ptMat = new THREE.PointsMaterial({
      size: 0.35,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.envFieldParticlePoints = new THREE.Points(ptGeo, ptMat);
    this.envFieldGroup.add(this.envFieldParticlePoints);

    this.scene.add(this.envFieldGroup);
  }

  public setEnvironmentField(type: EnvironmentFieldType, sliceHeight: number = 2.5, opacity: number = 0.75) {
    this.activeFieldType = type;
    this.fieldSliceY = sliceHeight;
    this.fieldOpacity = opacity;

    if (!this.envFieldGroup) return;

    if (type === 'none') {
      this.envFieldGroup.visible = false;
      return;
    }

    this.envFieldGroup.visible = true;
    this.rebuildEnvironmentFieldMesh(type, sliceHeight, opacity);
  }

  private rebuildEnvironmentFieldMesh(type: EnvironmentFieldType, sliceHeight: number, opacity: number) {
    if (!this.envFieldSliceMesh || !this.envFieldParticlePoints) return;

    this.envFieldSliceMesh.position.y = sliceHeight;
    (this.envFieldSliceMesh.material as THREE.MeshBasicMaterial).opacity = opacity;

    // Update Plane vertex colors
    const planeGeo = this.envFieldSliceMesh.geometry as THREE.PlaneGeometry;
    const posAttr = planeGeo.attributes.position;
    const vertexCount = posAttr.count;
    let colors = planeGeo.attributes.color as THREE.BufferAttribute;

    if (!colors || colors.count !== vertexCount) {
      colors = new THREE.BufferAttribute(new Float32Array(vertexCount * 3), 3);
      planeGeo.setAttribute('color', colors);
    }

    const cArr = colors.array as Float32Array;

    for (let i = 0; i < vertexCount; i++) {
      const vx = posAttr.getX(i);
      const vz = posAttr.getY(i); // In PlaneGeometry, Y is the Z axis after rotation
      const vy = sliceHeight;

      const rgb = this.computeFieldColor(type, vx, vy, vz);
      cArr[i * 3] = rgb.r;
      cArr[i * 3 + 1] = rgb.g;
      cArr[i * 3 + 2] = rgb.b;
    }
    colors.needsUpdate = true;

    // Update 3D points colors
    const ptGeo = this.envFieldParticlePoints.geometry as THREE.BufferGeometry;
    const ptPosAttr = ptGeo.attributes.position;
    const ptColorsAttr = ptGeo.attributes.color as THREE.BufferAttribute;
    const ptColorArr = ptColorsAttr.array as Float32Array;
    const ptCount = ptPosAttr.count;

    for (let i = 0; i < ptCount; i++) {
      const px = ptPosAttr.getX(i);
      const py = ptPosAttr.getY(i);
      const pz = ptPosAttr.getZ(i);

      const rgb = this.computeFieldColor(type, px, py, pz);
      ptColorArr[i * 3] = rgb.r;
      ptColorArr[i * 3 + 1] = rgb.g;
      ptColorArr[i * 3 + 2] = rgb.b;
    }
    ptColorsAttr.needsUpdate = true;
  }

  private computeFieldColor(type: EnvironmentFieldType, x: number, y: number, z: number): THREE.Color {
    const color = new THREE.Color();

    if (type === 'temp') {
      // Temperature field: cooler near north wet wall (z = -14), warmer at high ridge (y > 4.5)
      // Natural gradient: Slate-cyan (18C) -> Emerald (23C) -> Warm amber (27C) -> Terracotta (32C)
      const simulatedTemp = 24.5 + (y / 6.5) * 4.5 - (Math.abs(x) / 12) * 1.5 + (z / 15) * 2.0;
      const tNorm = Math.max(0, Math.min(1, (simulatedTemp - 18) / 14)); // 18 - 32 C
      if (tNorm < 0.35) {
        const f = tNorm / 0.35;
        color.setRGB(0.12 + 0.1 * f, 0.55 + 0.25 * f, 0.85 - 0.2 * f);
      } else if (tNorm < 0.7) {
        const f = (tNorm - 0.35) / 0.35;
        color.setRGB(0.22 + 0.65 * f, 0.8 - 0.15 * f, 0.65 - 0.55 * f);
      } else {
        const f = (tNorm - 0.7) / 0.3;
        color.setRGB(0.87 + 0.08 * f, 0.65 - 0.35 * f, 0.1);
      }
    } else if (type === 'humidity') {
      // Humidity field: pleasant mint -> lush turquoise -> deep moisture teal
      const simulatedHum = 80 - (y / 6.5) * 16 + (z < -5 ? 12 : 0) + (y < 1.5 ? 8 : 0);
      const hNorm = Math.max(0, Math.min(1, (simulatedHum - 50) / 45)); // 50 - 95 %
      if (hNorm < 0.4) {
        const f = hNorm / 0.4;
        color.setRGB(0.75 - 0.45 * f, 0.65 + 0.15 * f, 0.25 + 0.25 * f);
      } else {
        const f = (hNorm - 0.4) / 0.6;
        color.setRGB(0.3 - 0.15 * f, 0.8 - 0.25 * f, 0.5 + 0.4 * f);
      }
    } else if (type === 'co2') {
      // CO2 field: rich agricultural green -> vibrant lime
      const simulatedCo2 = 720 - (y > 4.5 ? 120 : 0) + (Math.cos(x * 0.4) * 60);
      const cNorm = Math.max(0, Math.min(1, (simulatedCo2 - 450) / 450));
      color.setRGB(0.1 + 0.4 * cNorm, 0.65 + 0.25 * cNorm, 0.35 - 0.15 * cNorm);
    } else if (type === 'light') {
      // Solar radiation field: soft warm solar glow
      const simulatedPar = Math.max(0.1, (y / 6.5) * (1.0 - Math.abs(x) * 0.04));
      color.setRGB(0.95, 0.85 * simulatedPar + 0.15, 0.35 * simulatedPar);
    } else if (type === 'soil_moisture') {
      // Soil moisture: fertile earth -> hydrated green
      const sNorm = Math.max(0, Math.min(1, (65 + Math.sin(x) * 10) / 100));
      color.setRGB(0.2 - 0.1 * sNorm, 0.55 + 0.35 * sNorm, 0.35 + 0.2 * sNorm);
    } else {
      color.setRGB(0.2, 0.7, 0.85);
    }

    return color;
  }

  // -------------------------------------------------------------
  // RISK WARNING HIGHLIGHTING & TARGETED 3D GREENHOUSE CALLOUTS
  // -------------------------------------------------------------
  private createRiskBadgeSprite(title: string, leadTimeText: string, isCritical: boolean): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 380;
    canvas.height = 76;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.Sprite();

    // Sleek frosted pill background
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.strokeStyle = isCritical ? 'rgba(239, 68, 68, 0.9)' : 'rgba(245, 158, 11, 0.9)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(6, 6, 368, 64, 32);
    ctx.fill();
    ctx.stroke();

    // Subtle alert indicator dot with pulse glow
    ctx.fillStyle = isCritical ? '#ef4444' : '#f59e0b';
    ctx.beginPath();
    ctx.arc(32, 38, 8, 0, Math.PI * 2);
    ctx.fill();

    // Concise, scannable text
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 22px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText(title, 50, 45);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const mat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: true,
      opacity: 0.92,
    });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(4.8, 1.0, 1);
    return sprite;
  }

  public setRiskWarnings(warnings: AgroRiskWarning[]) {
    this.riskWarningBeacons.forEach((b) => {
      this.scene.remove(b);
    });
    this.riskWarningBeacons.clear();

    const ghCoords: Record<string, { x: number; y: number; z: number; w: number; l: number; name: string }> = {
      gh_001: { x: 0, y: 0.05, z: 0, w: 24.8, l: 30.8, name: '1# 核心玻璃大棚' },
      greenhouse_01: { x: 0, y: 0.05, z: 0, w: 24.8, l: 30.8, name: '1# 核心玻璃大棚' },
      gh_002: { x: 42, y: 0.05, z: -4, w: 24, l: 28, name: '2# 连栋智能玻璃温室' },
      greenhouse_02: { x: 42, y: 0.05, z: -4, w: 24, l: 28, name: '2# 连栋智能玻璃温室' },
      gh_003: { x: -42, y: 0.05, z: -4, w: 22, l: 28, name: '3# 现代连栋圆拱温室' },
      greenhouse_03: { x: -42, y: 0.05, z: -4, w: 22, l: 28, name: '3# 现代连栋圆拱温室' },
      gh_004: { x: 0, y: 0.05, z: -46, w: 20, l: 24, name: '4# 数字立体育苗工厂' },
      greenhouse_04: { x: 0, y: 0.05, z: -46, w: 20, l: 24, name: '4# 数字立体育苗工厂' },
      gh_005: { x: -36, y: 0.05, z: 40, w: 26, l: 16, name: '5# 智能蓄热日光温室' },
      greenhouse_05: { x: -36, y: 0.05, z: 40, w: 26, l: 16, name: '5# 智能蓄热日光温室' },
      gh_006: { x: -4, y: 0.05, z: 40, w: 20, l: 20, name: '6# 鱼菜共生生态温室' },
      greenhouse_06: { x: -4, y: 0.05, z: 40, w: 20, l: 20, name: '6# 鱼菜共生生态温室' },
      gh_007: { x: 72, y: 0.05, z: -4, w: 18, l: 28, name: '7# 垂直气雾培农业温室' },
      greenhouse_07: { x: 72, y: 0.05, z: -4, w: 18, l: 28, name: '7# 垂直气雾培农业温室' },
      gh_008: { x: -68, y: 0.05, z: -4, w: 18, l: 28, name: '8# 光伏农业一体化温室' },
      greenhouse_08: { x: -68, y: 0.05, z: -4, w: 18, l: 28, name: '8# 光伏农业一体化温室' },
    };

    warnings.forEach((warn) => {
      if (warn.isMitigated) return;
      warn.impactedGreenhouses.forEach((ghId) => {
        const gh = ghCoords[ghId] || ghCoords.gh_001;
        const beaconGroup = new THREE.Group();
        beaconGroup.position.set(gh.x, gh.y, gh.z);

        const isCrit = warn.severity === 'critical';
        const alertColor = isCrit ? 0xef4444 : 0xf59e0b;

        // 1. Targeted perimeter foundation alert contour loop
        const hw = gh.w / 2 + 0.4;
        const hl = gh.l / 2 + 0.4;
        const loopGeo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-hw, 0.05, -hl),
          new THREE.Vector3(hw, 0.05, -hl),
          new THREE.Vector3(hw, 0.05, hl),
          new THREE.Vector3(-hw, 0.05, hl),
        ]);
        const loopMat = new THREE.LineBasicMaterial({
          color: alertColor,
          transparent: true,
          opacity: 0.85,
        });
        const loop = new THREE.LineLoop(loopGeo, loopMat);
        beaconGroup.add(loop);

        // 2. Corner framing ticks
        const cLen = 2.4;
        const cornerGeo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-hw, 0.05, -hl + cLen), new THREE.Vector3(-hw, 0.05, -hl),
          new THREE.Vector3(-hw, 0.05, -hl), new THREE.Vector3(-hw + cLen, 0.05, -hl),
          new THREE.Vector3(hw - cLen, 0.05, -hl), new THREE.Vector3(hw, 0.05, -hl),
          new THREE.Vector3(hw, 0.05, -hl), new THREE.Vector3(hw, 0.05, -hl + cLen),
          new THREE.Vector3(hw, 0.05, hl - cLen), new THREE.Vector3(hw, 0.05, hl),
          new THREE.Vector3(hw, 0.05, hl), new THREE.Vector3(hw - cLen, 0.05, hl),
          new THREE.Vector3(-hw + cLen, 0.05, hl), new THREE.Vector3(-hw, 0.05, hl),
          new THREE.Vector3(-hw, 0.05, hl), new THREE.Vector3(-hw, 0.05, hl - cLen),
        ]);
        const corners = new THREE.LineSegments(cornerGeo, new THREE.LineBasicMaterial({ color: alertColor, transparent: true, opacity: 0.95 }));
        beaconGroup.add(corners);

        // 3. Floating 3D Risk Badge: clean, compact spatial beacon
        const badge = this.createRiskBadgeSprite(
          `${warn.title} (${warn.forecastLeadMinutes}m)`,
          '',
          isCrit
        );
        badge.position.set(0, 6.8, 0);
        beaconGroup.add(badge);

        this.scene.add(beaconGroup);
        this.riskWarningBeacons.set(`${ghId}_${warn.id}`, beaconGroup);
      });
    });
  }

  // -------------------------------------------------------------
  // SELECTION FRAME & CAMERA FOCUS
  // -------------------------------------------------------------
  public setSelectedObject(objectId: string | null) {
    this.selectedObjectId = objectId;
    if (this.selectionRingMesh) {
      this.scene.remove(this.selectionRingMesh);
      this.selectionRingMesh = null;
    }
    if (!objectId) return;

    // Check if it's a known greenhouse or major facility
    const ghPositions: Record<string, { x: number; z: number; r: number }> = {
      gh_001: { x: 0, z: 0, r: 16 },
      greenhouse_01: { x: 0, z: 0, r: 16 },
      gh_002: { x: 42, z: -4, r: 15 },
      greenhouse_02: { x: 42, z: -4, r: 15 },
      gh_003: { x: -42, z: -4, r: 14 },
      greenhouse_03: { x: -42, z: -4, r: 14 },
      gh_004: { x: 0, z: -46, r: 13 },
      greenhouse_04: { x: 0, z: -46, r: 13 },
      gh_005: { x: -36, z: 40, r: 15 },
      greenhouse_05: { x: -36, z: 40, r: 15 },
      gh_006: { x: -4, z: 40, r: 14 },
      greenhouse_06: { x: -4, z: 40, r: 14 },
      gh_007: { x: 72, z: -4, r: 16 },
      greenhouse_07: { x: 72, z: -4, r: 16 },
      gh_008: { x: -68, z: -4, r: 16 },
      greenhouse_08: { x: -68, z: -4, r: 16 },
      facility_drone_dock: { x: 20, z: 34, r: 5 },
      facility_coldchain: { x: -36, z: -52, r: 16 },
      facility_fertigation_tanks: { x: 42, z: -48, r: 11 },
      facility_smart_field: { x: -36, z: 74, r: 18 },
      facility_flux_tower: { x: 72, z: 34, r: 5 },
      facility_entrance_gate: { x: 22, z: 88, r: 11 },
      facility_north_gate: { x: 22, z: -100, r: 9 },
    };

    let cx = 0;
    let cz = 0;
    let ringRadius = 2.0;

    if (ghPositions[objectId]) {
      cx = ghPositions[objectId].x;
      cz = ghPositions[objectId].z;
      ringRadius = ghPositions[objectId].r;
    } else {
      const obj = this.interactiveObjects.find((o) => o.userData && o.userData.id === objectId);
      if (!obj) return;
      const box = new THREE.Box3().setFromObject(obj);
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      box.getSize(size);
      box.getCenter(center);
      cx = center.x;
      cz = center.z;
      ringRadius = Math.max(1.2, Math.max(size.x, size.z) * 0.65);
    }

    const selGroup = new THREE.Group();
    selGroup.position.set(cx, 0.08, cz);

    // Inner smooth ring
    const ringGeo = new THREE.RingGeometry(ringRadius * 0.94, ringRadius, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    selGroup.add(ring);

    // 4 Corner bracket accents
    const bracketMat = new THREE.LineBasicMaterial({ color: 0x38bdf8 });
    const bLen = ringRadius * 0.35;
    const bDist = ringRadius * 1.05;
    const bVerts = [
      -bDist, 0, -bDist + bLen, -bDist, 0, -bDist,
      -bDist, 0, -bDist, -bDist + bLen, 0, -bDist,
      bDist - bLen, 0, -bDist, bDist, 0, -bDist,
      bDist, 0, -bDist, bDist, 0, -bDist + bLen,
      bDist, 0, bDist - bLen, bDist, 0, bDist,
      bDist, 0, bDist, bDist - bLen, 0, bDist,
      -bDist + bLen, 0, bDist, -bDist, 0, bDist,
      -bDist, 0, bDist, -bDist, 0, bDist - bLen,
    ];
    const bracketGeo = new THREE.BufferGeometry();
    bracketGeo.setAttribute('position', new THREE.Float32BufferAttribute(bVerts, 3));
    const brackets = new THREE.LineSegments(bracketGeo, bracketMat);
    selGroup.add(brackets);

    this.selectionRingMesh = selGroup;
    this.scene.add(selGroup);
  }

  // -------------------------------------------------------------
  // SENSOR VISIBILITY TOGGLE & CAMERA FOCUS
  // -------------------------------------------------------------
  public setSensorsVisible(visible: boolean) {
    if (this.sensorsGroup) {
      this.sensorsGroup.visible = visible;
    }
  }

  public focusOnObject(objectId: string) {
    this.setSelectedObject(objectId);

    // Auto update surveillance active camera if clicking on a camera or greenhouse
    if (objectId.startsWith('cam_')) {
      const frustumData = Array.from(this.surveillanceFrustums.values()).find(
        (f) => f.config.id === objectId
      );
      if (frustumData) {
        this.setActiveSurveillanceCamera(frustumData.config.ghId);
        const camPos = new THREE.Vector3(...frustumData.config.position);
        this.animateCameraTo(
          new THREE.Vector3(camPos.x + 6, camPos.y + 4, camPos.z + 6),
          camPos
        );
        return;
      }
    }

    if (objectId.startsWith('gh_')) {
      this.setActiveSurveillanceCamera(objectId);
    } else if (objectId === 'outdoor' || objectId === 'flux_tower' || objectId === 'facility_flux_tower') {
      this.setActiveSurveillanceCamera('outdoor');
    } else if (objectId === 'pond' || objectId === 'pond_water') {
      this.setActiveSurveillanceCamera('pond');
    }

    // Greenhouse camera presets
    if (objectId === 'gh_001' || objectId === 'greenhouse_01') {
      this.animateCameraTo(new THREE.Vector3(24, 15, 26), new THREE.Vector3(0, 2.8, 0));
      return;
    }
    if (objectId === 'gh_002' || objectId === 'greenhouse_02') {
      this.animateCameraTo(new THREE.Vector3(62, 14, 16), new THREE.Vector3(42, 3.0, -4));
      return;
    }
    if (objectId === 'gh_003' || objectId === 'greenhouse_03') {
      this.animateCameraTo(new THREE.Vector3(-22, 14, 16), new THREE.Vector3(-42, 3.0, -4));
      return;
    }
    if (objectId === 'gh_004' || objectId === 'greenhouse_04') {
      this.animateCameraTo(new THREE.Vector3(0, 16, -24), new THREE.Vector3(0, 3.0, -46));
      return;
    }
    if (objectId === 'gh_005' || objectId === 'greenhouse_05') {
      this.animateCameraTo(new THREE.Vector3(-36, 14, 58), new THREE.Vector3(-36, 2.5, 40));
      return;
    }
    if (objectId === 'gh_006' || objectId === 'greenhouse_06') {
      this.animateCameraTo(new THREE.Vector3(-4, 15, 58), new THREE.Vector3(-4, 2.5, 40));
      return;
    }
    if (objectId === 'gh_007' || objectId === 'greenhouse_07') {
      this.animateCameraTo(new THREE.Vector3(72, 16, 18), new THREE.Vector3(72, 3.0, -4));
      return;
    }
    if (objectId === 'gh_008' || objectId === 'greenhouse_08') {
      this.animateCameraTo(new THREE.Vector3(-68, 16, 18), new THREE.Vector3(-68, 3.0, -4));
      return;
    }
    if (objectId === 'facility_drone_dock') {
      this.animateCameraTo(new THREE.Vector3(20, 8, 44), new THREE.Vector3(20, 1.2, 34));
      return;
    }
    if (objectId === 'facility_coldchain') {
      this.animateCameraTo(new THREE.Vector3(-36, 16, -32), new THREE.Vector3(-36, 3.5, -52));
      return;
    }
    if (objectId === 'facility_fertigation_tanks') {
      this.animateCameraTo(new THREE.Vector3(42, 15, -30), new THREE.Vector3(42, 3.0, -48));
      return;
    }
    if (objectId === 'facility_smart_field') {
      this.animateCameraTo(new THREE.Vector3(-36, 14, 92), new THREE.Vector3(-36, 1.5, 74));
      return;
    }
    if (objectId === 'facility_flux_tower') {
      this.animateCameraTo(new THREE.Vector3(72, 22, 54), new THREE.Vector3(72, 10.0, 34));
      return;
    }
    if (objectId === 'facility_entrance_gate' || objectId === 'gate') {
      this.animateCameraTo(new THREE.Vector3(22 + 16, 12, 88 + 22), new THREE.Vector3(22, 2.5, 88));
      return;
    }
    if (objectId === 'facility_north_gate') {
      this.animateCameraTo(new THREE.Vector3(22 + 16, 12, -100 - 22), new THREE.Vector3(22, 2.5, -100));
      return;
    }

    const obj = this.interactiveObjects.find((o) => o.userData && o.userData.id === objectId);
    if (obj) {
      const worldPos = new THREE.Vector3();
      obj.getWorldPosition(worldPos);
      this.animateCameraTo(
        new THREE.Vector3(worldPos.x + 8, worldPos.y + 6, worldPos.z + 10),
        worldPos
      );
    }
  }

  // -------------------------------------------------------------
  // HISTORICAL TIMELINE PLAYBACK STATE
  // -------------------------------------------------------------
  public setHistoricalState(hourFraction: number, envSnapshot?: any, devices?: any[]) {
    // 1. Sun & ambient lighting based on 24h clock
    const sunAngle = ((hourFraction - 6) / 12) * Math.PI;
    const isDay = hourFraction >= 6 && hourFraction <= 18;

    if (this.sunLight) {
      const radius = 90;
      this.sunLight.position.set(Math.cos(sunAngle) * radius, Math.max(8, Math.sin(sunAngle) * radius), 45);
      if (isDay) {
        const elevation = Math.sin(sunAngle);
        this.sunLight.intensity = Math.max(0.3, elevation * 2.4);
        if (elevation < 0.25) {
          this.sunLight.color.setHex(0xfba260);
          if (this.ambientLight) this.ambientLight.color.setHex(0xfed7aa);
        } else {
          this.sunLight.color.setHex(0xe0f2fe);
          if (this.ambientLight) this.ambientLight.color.setHex(0xdbeafe);
        }
      } else {
        this.sunLight.intensity = 0.15;
        this.sunLight.color.setHex(0x38bdf8);
        if (this.ambientLight) {
          this.ambientLight.intensity = 0.25;
          this.ambientLight.color.setHex(0x1e293b);
        }
      }
    }

    // 2. Sync devices if provided
    if (devices && Array.isArray(devices)) {
      devices.forEach((dev) => {
        if (dev.type === 'fan') {
          this.updateFanSpeed(dev.id, dev.power ? dev.value : 0);
        } else if (dev.type === 'roof_vent') {
          this.updateRoofVentAngle(dev.power ? dev.value : 0);
        } else if (dev.type === 'grow_light') {
          this.updateGrowLights(dev.power, dev.value);
        } else if (dev.type === 'shade_curtain') {
          this.updateShadeCurtainRatio(dev.value / 100);
        }
      });
    }

    // 3. AGV movement along corridor
    if (this.agvRobot) {
      const posRatio = (Math.sin(hourFraction * Math.PI * 4) + 1) / 2;
      this.agvRobot.group.position.z = -12 + posRatio * 24;
    }
  }

  public resetToLiveLighting() {
    if (this.sunLight) {
      this.sunLight.position.set(45, 65, 35);
      this.sunLight.intensity = 2.0;
      this.sunLight.color.setHex(0xffffff);
    }
    if (this.ambientLight) {
      this.ambientLight.intensity = 0.45;
      this.ambientLight.color.setHex(0xdbeafe);
    }
    this.scene.background = new THREE.Color(0x090d16);
    if (this.scene.fog) {
      (this.scene.fog as THREE.Fog).color = new THREE.Color(0x090d16);
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

    // 3. Shading Curtains Scaling / Sliding Animation along length (local Y)
    const targetScaleY = Math.max(0.01, this.shadeCurtainOpenRatio);
    this.shadeCurtains.forEach((curtain) => {
      curtain.scale.y += (targetScaleY - curtain.scale.y) * 3 * delta;
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

    // 7. Pond Water Surface Wave Ripples, Aerator Spray Particles, Swimming Koi & Buoy Animation
    if (this.pondSubsystems) {
      ParkEnvironment.updatePond(this.pondSubsystems, elapsedTime);
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

    // 8.5 Rotate weather anemometer cups modulated by wind speed
    if (this.anemometerMesh) {
      this.anemometerMesh.rotation.y += Math.max(1.0, this.windSpeedMs * 0.8) * delta;
    }

    // 8.6 Digital Twin Rain & Weather Animation
    if (this.isRaining && this.rainParticles && this.isRainVisible) {
      const posAttr = this.rainParticles.geometry.attributes.position;
      const positions = posAttr.array as Float32Array;
      const fallSpeed = (22 + this.rainIntensity * 28) * delta;
      const windOffset = Math.sin(this.windDirectionRad) * this.windSpeedMs * delta * 0.6;
      for (let i = 0; i < this.rainCount; i++) {
        positions[i * 3 + 1] -= fallSpeed;
        positions[i * 3] += windOffset;
        if (positions[i * 3 + 1] < 0) {
          positions[i * 3 + 1] = 48 + Math.random() * 8;
        }
      }
      posAttr.needsUpdate = true;
    }

    // 8.6b 3D Wind Vector Streamline Flow Animation
    if (this.isWindFieldVisible && this.windStreamlinesMesh) {
      const posAttr = this.windStreamlinesMesh.geometry.attributes.position;
      const pos = posAttr.array as Float32Array;
      const speed = Math.max(1.5, this.windSpeedMs * 1.2) * delta;
      const dx = Math.cos(this.windDirectionRad) * speed;
      const dz = Math.sin(this.windDirectionRad) * speed;
      const count = pos.length / 6;

      for (let i = 0; i < count; i++) {
        pos[i * 6] += dx;
        pos[i * 6 + 2] += dz;
        pos[i * 6 + 3] += dx;
        pos[i * 6 + 5] += dz;

        // Wrap around bounds [-80, 80]
        if (pos[i * 6] > 80) {
          pos[i * 6] -= 160;
          pos[i * 6 + 3] -= 160;
        } else if (pos[i * 6] < -80) {
          pos[i * 6] += 160;
          pos[i * 6 + 3] += 160;
        }
        if (pos[i * 6 + 2] > 80) {
          pos[i * 6 + 2] -= 160;
          pos[i * 6 + 5] -= 160;
        } else if (pos[i * 6 + 2] < -80) {
          pos[i * 6 + 2] += 160;
          pos[i * 6 + 5] += 160;
        }
      }
      posAttr.needsUpdate = true;
    }

    // 8.7 Storm Lightning Flash
    if (this.lightningLight) {
      this.lightningTimer += delta;
      if (this.lightningTimer > 4.5 && Math.random() < 0.05) {
        this.lightningLight.intensity = 3.2 + Math.random() * 2.0;
        this.lightningTimer = 0;
      } else if (this.lightningLight.intensity > 0) {
        this.lightningLight.intensity = Math.max(0, this.lightningLight.intensity - 12 * delta);
      }
    }

    // 8.8 Pulsate Agro-Risk Warning Beacons & Badges
    this.riskWarningBeacons.forEach((beacon) => {
      const badge = beacon.children[2];
      if (badge) {
        badge.position.y = 8.2 + Math.sin(elapsedTime * 2.0) * 0.25;
      }
      const loop = beacon.children[0];
      if (loop && (loop as any).material) {
        (loop as any).material.opacity = 0.6 + Math.sin(elapsedTime * 3.5) * 0.35;
      }
    });

    // 8.8b Rotate Interactive Selection Ring
    if (this.selectionRingMesh) {
      this.selectionRingMesh.rotation.y += 0.4 * delta;
    }

    // 8.8c Boom Barrier Gate Arm Animation
    if (this.barrierPivot) {
      this.barrierCurrentAngle = THREE.MathUtils.lerp(
        this.barrierCurrentAngle,
        this.barrierTargetAngle,
        delta * 6.0
      );
      this.barrierPivot.rotation.z = this.barrierCurrentAngle;
    }

    // 8.9 Continuous Environment Field Particles Shimmer
    if (this.envFieldGroup && this.envFieldGroup.visible && this.envFieldParticlePoints) {
      this.envFieldParticlePoints.rotation.y = Math.sin(elapsedTime * 0.2) * 0.03;
    }

    // 8.10 Update Dynamic Park Actors (Electric Reefer Truck, Utility Cart, Workers)
    if (this.dynamicActorsManager) {
      this.dynamicActorsManager.update(delta, elapsedTime);
    }

    // 8.11 Animate Active Surveillance Camera FOV Scanning Beam & Status LEDs
    const activeFrustum = this.surveillanceFrustums.get(this.activeSurveillanceGhId);
    if (activeFrustum && this.isSurveillanceFOVVisible && activeFrustum.group.visible) {
      const D = activeFrustum.config.range;
      const scanT = (elapsedTime * 0.4) % 1.0;
      const curZ = -D * (0.08 + scanT * 0.88);
      activeFrustum.scanPlane.position.z = curZ;

      const halfFovRad = ((activeFrustum.config.fov * Math.PI) / 180) / 2;
      const curH = 2 * Math.abs(curZ) * Math.tan(halfFovRad);
      const curW = curH * activeFrustum.config.aspectRatio;
      activeFrustum.scanPlane.scale.set(curW, curH, 1);

      // Pulse ground projection ring
      const ringScale = 1.0 + Math.sin(elapsedTime * 3.0) * 0.04;
      activeFrustum.groundRing.scale.set(ringScale, 1, ringScale);
    }

    // Pulse Surveillance Camera Status LEDs
    this.surveillanceFrustums.forEach((f, ghId) => {
      if (f.ledLight && (f.ledLight.material as THREE.MeshBasicMaterial)) {
        const isCurrent = ghId === this.activeSurveillanceGhId;
        const ledMat = f.ledLight.material as THREE.MeshBasicMaterial;
        if (isCurrent) {
          const blink = Math.sin(elapsedTime * 6.0) > 0 ? 1 : 0.25;
          ledMat.color.setHex(0xef4444); // Blinking red REC
          ledMat.opacity = blink;
        } else {
          ledMat.color.setHex(0x10b981); // Solid emerald online
          ledMat.opacity = 0.75;
        }
      }
    });

    // 9. Update 3D projected spatial tags
    this.calculateSpatialTags();

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
