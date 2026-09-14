import * as THREE from 'three';

/**
 * Waypoint definition for road vehicles
 */
interface RoadWaypoint {
  x: number;
  z: number;
}

export class DynamicActorsManager {
  public actorsGroup: THREE.Group;
  public interactiveObjects: THREE.Object3D[] = [];

  // Gate proximity callbacks
  public onApproachGate?: (plateNumber: string) => void;
  public onLeaveGate?: (plateNumber: string) => void;
  private isNearGate: boolean = false;

  // 1. Vehicles
  private reeferTruck: {
    group: THREE.Group;
    wheels: THREE.Mesh[];
    waypoints: RoadWaypoint[];
    currentSegment: number;
    segmentProgress: number; // 0 to 1
    speed: number;
  } | null = null;

  private utilityCart: {
    group: THREE.Group;
    wheels: THREE.Mesh[];
    startX: number;
    endX: number;
    currentX: number;
    dir: number; // 1 or -1
    zPos: number;
    speed: number;
  } | null = null;

  // 2. People
  private technicianWorker: {
    group: THREE.Group;
    leftLeg: THREE.Group;
    rightLeg: THREE.Group;
    leftArm: THREE.Group;
    rightArm: THREE.Group;
    startZ: number;
    endZ: number;
    currentZ: number;
    xPos: number;
    dir: number;
    speed: number;
    isInspecting: boolean;
    inspectTimer: number;
  } | null = null;

  private logisticsLoader: {
    group: THREE.Group;
    leftLeg: THREE.Group;
    rightLeg: THREE.Group;
    leftArm: THREE.Group;
    rightArm: THREE.Group;
    trolleyGroup: THREE.Group;
    startX: number;
    endX: number;
    currentX: number;
    zPos: number;
    dir: number;
    speed: number;
  } | null = null;

  private pondInspector: {
    group: THREE.Group;
    leftArm: THREE.Group;
    rightArm: THREE.Group;
    head: THREE.Mesh;
    basePos: THREE.Vector3;
  } | null = null;

  constructor() {
    this.actorsGroup = new THREE.Group();
    this.actorsGroup.name = 'Dynamic_Park_Actors';

    this.initElectricReeferTruck();
    this.initElectricUtilityCart();
    this.initTechnicianWorker();
    this.initLogisticsLoader();
    this.initPondInspector();
  }

  // =============================================================
  // 1. DYNAMIC VEHICLE: 新能源智能冷链物流货车 (Electric Reefer Truck)
  // Drives along the outer service road loop between Greenhouses and Logistics Center
  // =============================================================
  private initElectricReeferTruck() {
    const truckGroup = new THREE.Group();
    truckGroup.name = 'Dynamic_Reefer_Truck';

    // Materials
    const cabMat = new THREE.MeshStandardMaterial({
      color: 0x059669, // Emerald green clean-energy commercial vehicle livery
      roughness: 0.25,
      metalness: 0.6,
    });
    const boxMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc, // Insulated refrigerated body white
      roughness: 0.35,
      metalness: 0.2,
    });
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.1,
      metalness: 0.9,
    });
    const wheelMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.9,
    });
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.8,
      roughness: 0.3,
    });
    const lightMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x38bdf8,
      emissiveIntensity: 1.2,
    });
    const tailLightMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xef4444,
      emissiveIntensity: 1.0,
    });
    const logoMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.4,
    });

    // 1. Truck Cab (Tractor)
    const cab = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.2, 2.0), cabMat);
    cab.position.set(0, 1.45, 2.4);
    truckGroup.add(cab);

    // Aerodynamic cab roof deflector
    const deflector = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.4, 1.2), cabMat);
    deflector.position.set(0, 2.7, 2.2);
    deflector.rotation.x = -0.3;
    truckGroup.add(deflector);

    // Windshield
    const windshield = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.95, 0.1), glassMat);
    windshield.position.set(0, 1.8, 3.42);
    truckGroup.add(windshield);

    // Front Headlights
    [-0.85, 0.85].forEach((hx) => {
      const headlight = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.2, 0.1), lightMat);
      headlight.position.set(hx, 0.85, 3.42);
      truckGroup.add(headlight);
    });

    // 2. Refrigerated Insulated Cargo Box (冷藏车厢)
    const cargoBox = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2.5, 5.4), boxMat);
    cargoBox.position.set(0, 1.9, -1.2);
    truckGroup.add(cargoBox);

    // Branding stripe on cargo box sides
    [-1.26, 1.26].forEach((sx) => {
      const stripe = new THREE.Mesh(new THREE.PlaneGeometry(5.0, 0.45), logoMat);
      stripe.position.set(sx, 2.0, -1.2);
      stripe.rotation.y = sx > 0 ? Math.PI / 2 : -Math.PI / 2;
      truckGroup.add(stripe);
    });

    // Front Refrigeration Thermo-King Unit
    const reefer = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.7, 0.5), logoMat);
    reefer.position.set(0, 2.9, 1.4);
    truckGroup.add(reefer);

    // Rear Taillights
    [-1.0, 1.0].forEach((tx) => {
      const taillight = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.08), tailLightMat);
      taillight.position.set(tx, 0.9, -3.92);
      truckGroup.add(taillight);
    });

    // 3. Six Wheels with Rims
    const wheels: THREE.Mesh[] = [];
    const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.3, 16);
    const rimGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.32, 12);

    const wheelOffsets = [
      [-1.25, 2.3], [1.25, 2.3],     // Front steer axle
      [-1.25, -2.1], [1.25, -2.1],   // Rear drive axle 1
      [-1.25, -3.1], [1.25, -3.1],   // Rear drive axle 2
    ];

    wheelOffsets.forEach(([wx, wz]) => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wx, 0.42, wz);
      wheel.castShadow = true;

      const rim = new THREE.Mesh(rimGeo, rimMat);
      wheel.add(rim);

      wheels.push(wheel);
      truckGroup.add(wheel);
    });

    // Interactive Hitbox for License Plate & Mission Inspection
    const truckHit = new THREE.Mesh(
      new THREE.BoxGeometry(2.8, 3.4, 7.8),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    truckHit.position.set(0, 1.7, -1.0);
    truckHit.userData = {
      id: 'dynamic_actor_truck',
      type: 'vehicle',
      plateNumber: '苏E·A886F',
      plateColor: 'green',
      name: '新能源冷链物流货车 [苏E·A886F]',
      categoryName: '4.2米 纯电动恒温冷藏货车',
      model: '福田智蓝 新能源冷链专用',
      driverName: '陈志强',
      driverPhone: '138-1234-5678',
      company: '盒马鲜生华东冷链直运车队',
      mission: '5#高糖番茄温室采收提货，发往盒马鲜生华东中心仓',
      destination: '5#智能化温室 / 冷链物流中心',
      entryTime: '09:42:15',
      status: '在园作业装运中',
      cargo: '5#棚高糖串收番茄 1850kg',
      isWhitelisted: true,
    };
    truckGroup.add(truckHit);
    this.interactiveObjects.push(truckHit);

    // Initial positioning
    truckGroup.position.set(-36, 0.04, -24);
    this.actorsGroup.add(truckGroup);

    // Define route waypoints around park loop
    // Northern Service Road (Z = -24) -> North-South Main Highway (X = 22) -> Southern Loop (Z = 60) -> Western Lane (X = -58) -> loop
    const waypoints: RoadWaypoint[] = [
      { x: -58, z: -24 },
      { x: -36, z: -24 }, // Near coldchain hub
      { x: 0, z: -24 },   // Near 4# nursery
      { x: 22, z: -24 },  // Turn south onto Main Highway
      { x: 22, z: 20 },   // Crossing central avenue
      { x: 22, z: 60 },   // Turn west onto Southern Loop
      { x: 0, z: 60 },    // Passing south of Greenhouses 5 & 6
      { x: -36, z: 60 },  // Passing smart field
      { x: -58, z: 60 },  // Turn north onto Western Logistics Lane
      { x: -58, z: 20 },  // Cruising north
      { x: -58, z: -24 }, // Back to north road
    ];

    this.reeferTruck = {
      group: truckGroup,
      wheels,
      waypoints,
      currentSegment: 0,
      segmentProgress: 0,
      speed: 6.5, // meters per second (~23 km/h farm speed limit)
    };
  }

  // =============================================================
  // 2. DYNAMIC VEHICLE: 园区新能源农资巡检与果蔬转运电瓶车 (Electric Utility Cart)
  // Cruises along the East-West Central Avenue (Z = 20) between Greenhouses
  // =============================================================
  private initElectricUtilityCart() {
    const cartGroup = new THREE.Group();
    cartGroup.name = 'Dynamic_Utility_Cart';

    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b, // High-visibility agricultural safety yellow
      roughness: 0.35,
      metalness: 0.4,
    });
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.8,
      roughness: 0.3,
    });
    const wheelMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.9,
    });
    const crateMat1 = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.6 }); // Red strawberry crates
    const crateMat2 = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.6 }); // Green tomato crates

    // Cart base chassis
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.3, 2.6), bodyMat);
    chassis.position.y = 0.35;
    cartGroup.add(chassis);

    // Front cowl & steering column
    const cowl = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.5, 0.8), bodyMat);
    cowl.position.set(0, 0.65, 0.8);
    cartGroup.add(cowl);

    // Seats & roll bar cage
    const seat = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.3, 0.6), frameMat);
    seat.position.set(0, 0.6, 0.1);
    cartGroup.add(seat);

    // Roll cage posts & canopy roof
    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.08, 1.8), bodyMat);
    roof.position.set(0, 1.65, 0.2);
    cartGroup.add(roof);

    [-0.55, 0.55].forEach((rx) => {
      const postF = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.0, 8), frameMat);
      postF.position.set(rx, 1.15, 0.7);
      const postB = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.0, 8), frameMat);
      postB.position.set(rx, 1.15, -0.4);
      cartGroup.add(postF, postB);
    });

    // Rear cargo bed with loaded fresh harvest crates
    const cargoBed = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.3, 1.1), frameMat);
    cargoBed.position.set(0, 0.6, -0.75);
    cartGroup.add(cargoBed);

    // Stacks of harvest crates
    [-0.3, 0.3].forEach((cx) => {
      const cr1 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.22, 0.45), crateMat1);
      cr1.position.set(cx, 0.85, -0.6);
      const cr2 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.22, 0.45), crateMat2);
      cr2.position.set(cx, 0.85, -1.0);
      cartGroup.add(cr1, cr2);
    });

    // Headlights
    const lightMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x38bdf8,
      emissiveIntensity: 1.0,
    });
    [-0.45, 0.45].forEach((lx) => {
      const l = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), lightMat);
      l.position.set(lx, 0.55, 1.22);
      cartGroup.add(l);
    });

    // 4 Wheels
    const wheels: THREE.Mesh[] = [];
    const wheelGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.18, 14);
    [
      [-0.7, 0.8], [0.7, 0.8],
      [-0.7, -0.8], [0.7, -0.8],
    ].forEach(([wx, wz]) => {
      const w = new THREE.Mesh(wheelGeo, wheelMat);
      w.rotation.z = Math.PI / 2;
      w.position.set(wx, 0.25, wz);
      wheels.push(w);
      cartGroup.add(w);
    });

    // Interactive Hitbox for Utility Cart
    const cartHit = new THREE.Mesh(
      new THREE.BoxGeometry(2.0, 2.2, 3.6),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    cartHit.position.set(0, 1.1, 0);
    cartHit.userData = {
      id: 'dynamic_actor_cart',
      type: 'vehicle',
      plateNumber: '苏E·F0116',
      plateColor: 'green',
      name: '园区电动果蔬转运车 [苏E·F0116]',
      categoryName: '纯电动农业平板转运电瓶车',
      model: '绿友农用电动平板车',
      driverName: '赵海峰',
      driverPhone: '135-2233-4455',
      company: '园区内部生产运维班组',
      mission: '果蔬转运与熊蜂授粉箱/生物农药换装配送',
      destination: '1#~8#温室主通道 / 配肥站',
      entryTime: '07:15:00',
      status: '在园转运中',
      cargo: '食品级采收周转筐 120只',
      isWhitelisted: true,
    };
    cartGroup.add(cartHit);
    this.interactiveObjects.push(cartHit);

    cartGroup.position.set(0, 0.04, 20); // On Central Avenue (Z = 20)
    this.actorsGroup.add(cartGroup);

    this.utilityCart = {
      group: cartGroup,
      wheels,
      startX: -48,
      endX: 48,
      currentX: -10,
      dir: 1,
      zPos: 20,
      speed: 3.8, // meters per second
    };
  }

  // =============================================================
  // 3. DYNAMIC PERSON: 农艺巡检员 / 植保技术员 (Agricultural Technician)
  // Walks between Greenhouse 1 and Greenhouse 2 / zebra crossing
  // =============================================================
  private initTechnicianWorker() {
    const personGroup = new THREE.Group();
    personGroup.name = 'Dynamic_Technician_Worker';

    const clothesMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.7 }); // Blue work uniform
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 }); // Slate work pants
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.6 }); // Stylized clean tone
    const hatMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.9 }); // Straw sun hat
    const tabletMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.2,
      metalness: 0.8,
    });
    const tabletScreenMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.8,
    });

    // Torso (Upper body: Height 0.6m)
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.55, 0.22), clothesMat);
    torso.position.y = 1.05;
    personGroup.add(torso);

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), skinMat);
    head.position.y = 1.45;
    personGroup.add(head);

    // Wide-brim Agricultural Straw Sun Hat
    const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.03, 16), hatMat);
    hatBrim.position.y = 1.54;
    const hatCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.12, 16), hatMat);
    hatCrown.position.y = 1.6;
    personGroup.add(hatBrim, hatCrown);

    // Left Leg (Pivot at hip: y = 0.78)
    const leftLeg = new THREE.Group();
    leftLeg.position.set(-0.11, 0.78, 0);
    const leftLegMesh = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.78, 0.12), pantsMat);
    leftLegMesh.position.y = -0.39;
    leftLeg.add(leftLegMesh);
    personGroup.add(leftLeg);

    // Right Leg
    const rightLeg = new THREE.Group();
    rightLeg.position.set(0.11, 0.78, 0);
    const rightLegMesh = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.78, 0.12), pantsMat);
    rightLegMesh.position.y = -0.39;
    rightLeg.add(rightLegMesh);
    personGroup.add(rightLeg);

    // Left Arm (Swings while walking)
    const leftArm = new THREE.Group();
    leftArm.position.set(-0.25, 1.28, 0);
    const leftArmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.52, 0.1), clothesMat);
    leftArmMesh.position.y = -0.26;
    leftArm.add(leftArmMesh);
    personGroup.add(leftArm);

    // Right Arm (Holding inspection tablet)
    const rightArm = new THREE.Group();
    rightArm.position.set(0.25, 1.28, 0);
    const rightArmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.35, 0.1), clothesMat);
    rightArmMesh.position.set(0, -0.17, 0.1);
    rightArmMesh.rotation.x = -Math.PI / 4;
    rightArm.add(rightArmMesh);

    // Inspection Tablet
    const tablet = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.14, 0.02), tabletMat);
    tablet.position.set(0, -0.3, 0.28);
    tablet.rotation.x = -0.6;
    const tabletScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.12), tabletScreenMat);
    tabletScreen.position.set(0, 0, 0.015);
    tablet.add(tabletScreen);
    rightArm.add(tablet);
    personGroup.add(rightArm);

    // Set initial spot: Pedestrian path near Greenhouse 1 south entrance
    personGroup.position.set(8.5, 0, 10);
    personGroup.rotation.y = 0;

    const techHit = new THREE.Mesh(
      new THREE.BoxGeometry(1.0, 2.0, 1.0),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    techHit.position.set(0, 1.0, 0);
    techHit.userData = { id: 'worker_technician', type: 'worker', name: '大棚物联网巡检农艺师' };
    personGroup.add(techHit);
    this.interactiveObjects.push(techHit);

    this.actorsGroup.add(personGroup);

    this.technicianWorker = {
      group: personGroup,
      leftLeg,
      rightLeg,
      leftArm,
      rightArm,
      startZ: -10,
      endZ: 18,
      currentZ: 10,
      xPos: 8.5,
      dir: 1,
      speed: 1.2, // ~4.3 km/h walking speed
      isInspecting: false,
      inspectTimer: 0,
    };
  }

  // =============================================================
  // 4. DYNAMIC PERSON: 采收装卸工与手推运输车 (Logistics Harvest Loader with Trolley)
  // Pushes a harvest cart from Greenhouse area towards Cold Chain Hub
  // =============================================================
  private initLogisticsLoader() {
    const loaderGroup = new THREE.Group();
    loaderGroup.name = 'Dynamic_Logistics_Loader';

    const clothesMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.7 }); // Green harvest staff uniform
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.6 });
    const capMat = new THREE.MeshStandardMaterial({ color: 0x059669, roughness: 0.6 }); // Baseball cap
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.3 });
    const crateMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.5 }); // Fresh red fruit crates

    // Person Torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.52, 0.22), clothesMat);
    torso.position.set(0, 1.05, -0.3);
    torso.rotation.x = 0.1; // Leaning slightly forward pushing trolley
    loaderGroup.add(torso);

    // Head & Cap
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), skinMat);
    head.position.set(0, 1.45, -0.28);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.15, 0.08, 12), capMat);
    cap.position.set(0, 1.51, -0.28);
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.02, 0.12), capMat);
    visor.position.set(0, 1.48, -0.18);
    loaderGroup.add(head, cap, visor);

    // Legs
    const leftLeg = new THREE.Group();
    leftLeg.position.set(-0.11, 0.78, -0.3);
    const lMesh = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.78, 0.12), pantsMat);
    lMesh.position.y = -0.39;
    leftLeg.add(lMesh);
    loaderGroup.add(leftLeg);

    const rightLeg = new THREE.Group();
    rightLeg.position.set(0.11, 0.78, -0.3);
    const rMesh = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.78, 0.12), pantsMat);
    rMesh.position.y = -0.39;
    rightLeg.add(rMesh);
    loaderGroup.add(rightLeg);

    // Arms reaching forward to hold trolley handle
    const leftArm = new THREE.Group();
    leftArm.position.set(-0.24, 1.25, -0.25);
    const laMesh = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.48, 0.09), clothesMat);
    laMesh.position.set(0, -0.2, 0.18);
    laMesh.rotation.x = -0.7;
    leftArm.add(laMesh);
    loaderGroup.add(leftArm);

    const rightArm = new THREE.Group();
    rightArm.position.set(0.24, 1.25, -0.25);
    const raMesh = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.48, 0.09), clothesMat);
    raMesh.position.set(0, -0.2, 0.18);
    raMesh.rotation.x = -0.7;
    rightArm.add(raMesh);
    loaderGroup.add(rightArm);

    // 2-Wheel Manual Harvest Cart / Trolley
    const trolleyGroup = new THREE.Group();
    trolleyGroup.position.set(0, 0, 0.3);

    // Handlebars
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.04, 0.04), metalMat);
    handle.position.set(0, 0.95, -0.05);
    const handlePostL = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.8, 8), metalMat);
    handlePostL.position.set(-0.25, 0.6, 0.15);
    handlePostL.rotation.x = 0.5;
    const handlePostR = handlePostL.clone();
    handlePostR.position.set(0.25, 0.6, 0.15);
    trolleyGroup.add(handle, handlePostL, handlePostR);

    // Cart platform & wheels
    const platform = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.08, 1.0), metalMat);
    platform.position.set(0, 0.28, 0.5);
    trolleyGroup.add(platform);

    const twGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.06, 12);
    const twMat = new THREE.MeshStandardMaterial({ color: 0x18181b });
    [-0.38, 0.38].forEach((twx) => {
      const tw = new THREE.Mesh(twGeo, twMat);
      tw.rotation.z = Math.PI / 2;
      tw.position.set(twx, 0.15, 0.5);
      trolleyGroup.add(tw);
    });

    // 3 Harvest produce crates stacked on cart
    const crate1 = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.22, 0.4), crateMat);
    crate1.position.set(0, 0.42, 0.35);
    const crate2 = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.22, 0.4), crateMat);
    crate2.position.set(0, 0.42, 0.75);
    const crate3 = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.22, 0.4), crateMat);
    crate3.position.set(0, 0.64, 0.55);
    trolleyGroup.add(crate1, crate2, crate3);

    loaderGroup.add(trolleyGroup);

    // Set initial position: On crosswalk / service road between GH1 & GH3
    loaderGroup.position.set(-15, 0, 16.5);

    const loaderHit = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 2.0, 2.2),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    loaderHit.position.set(0, 1.0, 0.2);
    loaderHit.userData = { id: 'worker_loader', type: 'worker', name: '果蔬采收装卸搬运员' };
    loaderGroup.add(loaderHit);
    this.interactiveObjects.push(loaderHit);

    this.actorsGroup.add(loaderGroup);

    this.logisticsLoader = {
      group: loaderGroup,
      leftLeg,
      rightLeg,
      leftArm,
      rightArm,
      trolleyGroup,
      startX: -32,
      endX: 12,
      currentX: -15,
      zPos: 16.5,
      dir: 1,
      speed: 1.0, // meters per second
    };
  }

  // =============================================================
  // 5. DYNAMIC PERSON: 鱼塘水产技术员 (Aquaculture Inspector on Pier)
  // Stands on the wooden pier of the ecological fish pond, observing and sampling water
  // =============================================================
  private initPondInspector() {
    const personGroup = new THREE.Group();
    personGroup.name = 'Dynamic_Pond_Inspector';

    const clothesMat = new THREE.MeshStandardMaterial({ color: 0x0d9488, roughness: 0.7 }); // Teal aquaculture uniform
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 }); // Waterproof wader pants
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.6 });
    const bucketMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4 }); // Yellow feed bucket

    // Torso & Head
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.55, 0.22), clothesMat);
    torso.position.y = 1.05;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), skinMat);
    head.position.y = 1.45;
    personGroup.add(torso, head);

    // Legs
    const lLeg = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.78, 0.13), pantsMat);
    lLeg.position.set(-0.11, 0.39, 0);
    const rLeg = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.78, 0.13), pantsMat);
    rLeg.position.set(0.11, 0.39, 0);
    personGroup.add(lLeg, rLeg);

    // Arms
    const leftArm = new THREE.Group();
    leftArm.position.set(-0.24, 1.25, 0);
    const laMesh = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.5, 0.09), clothesMat);
    laMesh.position.y = -0.25;
    leftArm.add(laMesh);
    personGroup.add(leftArm);

    const rightArm = new THREE.Group();
    rightArm.position.set(0.24, 1.25, 0);
    const raMesh = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.5, 0.09), clothesMat);
    raMesh.position.y = -0.25;
    rightArm.add(raMesh);

    // Feed / Water Testing Bucket held in right hand
    const bucket = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.09, 0.22, 12), bucketMat);
    bucket.position.set(0, -0.45, 0.08);
    rightArm.add(bucket);
    personGroup.add(rightArm);

    // Stand on the wooden pier at pond (X = 28, Y = 0.25, Z = 36)
    const basePos = new THREE.Vector3(28, 0.25, 36);
    personGroup.position.copy(basePos);
    personGroup.rotation.y = -Math.PI / 4; // Facing the pond water & buoy

    const pondHit = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 1.9, 0.9),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    pondHit.position.set(0, 0.9, 0);
    pondHit.userData = { id: 'worker_pond_inspector', type: 'worker', name: '生态鱼塘水质巡检与投喂技术员' };
    personGroup.add(pondHit);
    this.interactiveObjects.push(pondHit);

    this.actorsGroup.add(personGroup);

    this.pondInspector = {
      group: personGroup,
      leftArm,
      rightArm,
      head,
      basePos,
    };
  }

  // =============================================================
  // UPDATE LOOP (Frame Animation)
  // =============================================================
  public update(delta: number, elapsedTime: number) {
    // 1. Update Reefer Truck along Waypoints
    if (this.reeferTruck) {
      const truck = this.reeferTruck;
      const curWp = truck.waypoints[truck.currentSegment];
      const nextIdx = (truck.currentSegment + 1) % truck.waypoints.length;
      const nextWp = truck.waypoints[nextIdx];

      // Gate proximity detection (Main Entrance gate is near X = 16.5, Z = 14.5)
      const tPos = truck.group.position;
      const distToGate = Math.hypot(tPos.x - 16.5, tPos.z - 14.5);
      if (distToGate < 18.0) {
        if (!this.isNearGate) {
          this.isNearGate = true;
          this.onApproachGate?.('苏E·A886F');
        }
      } else if (distToGate > 25.0) {
        if (this.isNearGate) {
          this.isNearGate = false;
          this.onLeaveGate?.('苏E·A886F');
        }
      }

      const dx = nextWp.x - curWp.x;
      const dz = nextWp.z - curWp.z;
      const segmentDist = Math.hypot(dx, dz);

      if (segmentDist > 0.01) {
        truck.segmentProgress += (truck.speed * delta) / segmentDist;

        if (truck.segmentProgress >= 1) {
          truck.segmentProgress = 0;
          truck.currentSegment = nextIdx;
        }

        // Interpolate position
        const px = THREE.MathUtils.lerp(curWp.x, nextWp.x, truck.segmentProgress);
        const pz = THREE.MathUtils.lerp(curWp.z, nextWp.z, truck.segmentProgress);
        truck.group.position.set(px, 0.04, pz);

        // Compute heading angle
        const targetAngle = Math.atan2(dx, dz);
        // Smooth rotation
        let diff = targetAngle - truck.group.rotation.y;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        truck.group.rotation.y += diff * Math.min(1, delta * 6);

        // Spin wheels proportional to speed
        const wheelRollSpeed = (truck.speed / 0.42) * delta;
        truck.wheels.forEach((w) => {
          w.rotation.x += wheelRollSpeed;
        });
      }
    }

    // 2. Update Utility Cart on Central Avenue (Z = 20)
    if (this.utilityCart) {
      const cart = this.utilityCart;
      cart.currentX += cart.dir * cart.speed * delta;

      if (cart.currentX > cart.endX) {
        cart.currentX = cart.endX;
        cart.dir = -1;
      } else if (cart.currentX < cart.startX) {
        cart.currentX = cart.startX;
        cart.dir = 1;
      }

      cart.group.position.x = cart.currentX;
      cart.group.position.z = cart.zPos;
      // Heading: 0 means pointing +Z. For +X movement, rotation.y = Math.PI / 2
      const targetRot = cart.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
      truckLerpRot(cart.group, targetRot, delta * 8);

      const roll = (cart.speed / 0.25) * delta * cart.dir;
      cart.wheels.forEach((w) => {
        w.rotation.x += roll;
      });
    }

    // 3. Update Technician Worker (Patrolling & Inspecting)
    if (this.technicianWorker) {
      const tech = this.technicianWorker;

      if (tech.isInspecting) {
        tech.inspectTimer += delta;
        // Holding tablet and looking down
        tech.leftLeg.rotation.x = 0;
        tech.rightLeg.rotation.x = 0;
        tech.leftArm.rotation.x = Math.sin(elapsedTime * 2) * 0.1;
        tech.rightArm.rotation.x = -0.4 + Math.sin(elapsedTime * 3) * 0.05;

        if (tech.inspectTimer > 4.0) {
          // Finish inspection checkpoint, resume walking
          tech.isInspecting = false;
          tech.inspectTimer = 0;
          tech.dir = -tech.dir; // Turn around
        }
      } else {
        tech.currentZ += tech.dir * tech.speed * delta;

        if (tech.currentZ > tech.endZ || tech.currentZ < tech.startZ) {
          tech.isInspecting = true; // Pause to inspect crops
          tech.inspectTimer = 0;
        }

        tech.group.position.z = tech.currentZ;
        tech.group.position.x = tech.xPos;
        const targetRot = tech.dir > 0 ? 0 : Math.PI;
        truckLerpRot(tech.group, targetRot, delta * 10);

        // Walking gait animation
        const walkCycle = elapsedTime * 5.5;
        tech.leftLeg.rotation.x = Math.sin(walkCycle) * 0.55;
        tech.rightLeg.rotation.x = -Math.sin(walkCycle) * 0.55;
        tech.leftArm.rotation.x = -Math.sin(walkCycle) * 0.45;
        // Torso slight bob
        tech.group.position.y = Math.abs(Math.sin(walkCycle * 2)) * 0.04;
      }
    }

    // 4. Update Logistics Loader pushing harvest cart
    if (this.logisticsLoader) {
      const ldr = this.logisticsLoader;
      ldr.currentX += ldr.dir * ldr.speed * delta;

      if (ldr.currentX > ldr.endX) {
        ldr.currentX = ldr.endX;
        ldr.dir = -1;
      } else if (ldr.currentX < ldr.startX) {
        ldr.currentX = ldr.startX;
        ldr.dir = 1;
      }

      ldr.group.position.x = ldr.currentX;
      ldr.group.position.z = ldr.zPos;
      const targetRot = ldr.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
      truckLerpRot(ldr.group, targetRot, delta * 8);

      const walkCycle = elapsedTime * 4.8;
      ldr.leftLeg.rotation.x = Math.sin(walkCycle) * 0.45;
      ldr.rightLeg.rotation.x = -Math.sin(walkCycle) * 0.45;
      ldr.group.position.y = Math.abs(Math.sin(walkCycle * 2)) * 0.03;
    }

    // 5. Update Pond Inspector on Dock (Occasional looking / gesturing)
    if (this.pondInspector) {
      const pnd = this.pondInspector;
      pnd.head.rotation.y = Math.sin(elapsedTime * 0.8) * 0.35;
      pnd.head.rotation.x = 0.2 + Math.cos(elapsedTime * 0.6) * 0.15; // Looking down at water
      pnd.rightArm.rotation.x = Math.sin(elapsedTime * 1.2) * 0.12;
      pnd.leftArm.rotation.x = -Math.sin(elapsedTime * 0.9) * 0.08;
    }
  }
}

/** Helper function to smoothly slerp rotation around Y axis */
function truckLerpRot(obj: THREE.Object3D, targetY: number, alpha: number) {
  let diff = targetY - obj.rotation.y;
  while (diff < -Math.PI) diff += Math.PI * 2;
  while (diff > Math.PI) diff -= Math.PI * 2;
  obj.rotation.y += diff * Math.min(1, alpha);
}
