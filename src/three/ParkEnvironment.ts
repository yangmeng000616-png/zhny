import * as THREE from 'three';

export interface ParkSubsystems {
  waterMesh: THREE.Mesh;
  buoy: THREE.Group;
  beaconLight: THREE.PointLight;
}

export class ParkEnvironment {
  public static buildRoadNetwork(
    scene: THREE.Scene,
    parkGroup: THREE.Group,
    interactiveObjects: THREE.Object3D[]
  ) {
    // 1. Campus Extended Ground Surface (240m x 240m)
    const groundGeo = new THREE.PlaneGeometry(240, 240);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x111622, // Natural deep dark agricultural campus terrain
      roughness: 0.88,
      metalness: 0.05,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.06;
    ground.receiveShadow = true;
    parkGroup.add(ground);

    // Subtle agricultural open field plots around the perimeter
    const plotMat1 = new THREE.MeshStandardMaterial({ color: 0x15221b, roughness: 0.85 });
    const plotMat2 = new THREE.MeshStandardMaterial({ color: 0x16202c, roughness: 0.85 });

    // Open farm plot A (Far East)
    const plotA = new THREE.Mesh(new THREE.PlaneGeometry(35, 75), plotMat1);
    plotA.rotation.x = -Math.PI / 2;
    plotA.position.set(78, -0.05, -5);
    parkGroup.add(plotA);

    // Open farm plot B (Far West)
    const plotB = new THREE.Mesh(new THREE.PlaneGeometry(35, 75), plotMat2);
    plotB.rotation.x = -Math.PI / 2;
    plotB.position.set(-78, -0.05, -5);
    parkGroup.add(plotB);

    // Architectural subtle reference grid (subdued, non-intrusive)
    const parkGrid = new THREE.GridHelper(240, 48, 0x1e293b, 0x141d2a);
    parkGrid.position.y = -0.04;
    parkGroup.add(parkGrid);

    // -------------------------------------------------------------
    // ROAD SYSTEM (Asphalt, Markings, Curbs, Crosswalks)
    // -------------------------------------------------------------
    const asphaltMat = new THREE.MeshStandardMaterial({
      color: 0x1a2332, // Realistic matte dark asphalt
      roughness: 0.82,
      metalness: 0.12,
    });
    const curbMat = new THREE.MeshStandardMaterial({
      color: 0x334155, // Clean dark slate architectural curb
      roughness: 0.6,
      metalness: 0.15,
    });
    const yellowLineMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.5 });
    const whiteLineMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.5 }); // Crisp matte off-white road marking line

    // 1. North-South Main Highway (南北主干道: X = 22, Z from -90 to +90, Width 7.2m)
    const mainRoadGeo = new THREE.BoxGeometry(7.2, 0.08, 180);
    const mainRoad = new THREE.Mesh(mainRoadGeo, asphaltMat);
    mainRoad.position.set(22, 0.02, 0);
    mainRoad.receiveShadow = true;
    parkGroup.add(mainRoad);

    // Curbs for main road
    const curbLeft = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 180), curbMat);
    curbLeft.position.set(22 - 3.75, 0.06, 0);
    const curbRight = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 180), curbMat);
    curbRight.position.set(22 + 3.75, 0.06, 0);
    parkGroup.add(curbLeft, curbRight);

    // White Edge Markings
    const edgeLineGeo = new THREE.PlaneGeometry(0.18, 180);
    const whiteEdgeLeft = new THREE.Mesh(edgeLineGeo, whiteLineMat);
    whiteEdgeLeft.rotation.x = -Math.PI / 2;
    whiteEdgeLeft.position.set(22 - 3.2, 0.065, 0);
    const whiteEdgeRight = new THREE.Mesh(edgeLineGeo, whiteLineMat);
    whiteEdgeRight.rotation.x = -Math.PI / 2;
    whiteEdgeRight.position.set(22 + 3.2, 0.065, 0);
    parkGroup.add(whiteEdgeLeft, whiteEdgeRight);

    // Dashed Yellow Center Line
    const dashLen = 2.5;
    const gapLen = 2.5;
    const totalDashes = Math.floor(180 / (dashLen + gapLen));
    for (let i = 0; i < totalDashes; i++) {
      const z = -90 + (i + 0.5) * (dashLen + gapLen);
      // skip intersections
      if ((z > 16 && z < 25) || (z > -28 && z < -18)) continue;
      const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.16, dashLen), yellowLineMat);
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(22, 0.065, z);
      parkGroup.add(dash);
    }

    // 2. East-West Central Connecting Avenue (东西向主联络道: Z = 20, X from -75 to +75, Width 6.5m)
    const ewRoadGeo = new THREE.BoxGeometry(150, 0.08, 6.5);
    const ewRoad = new THREE.Mesh(ewRoadGeo, asphaltMat);
    ewRoad.position.set(0, 0.02, 20);
    ewRoad.receiveShadow = true;
    parkGroup.add(ewRoad);

    // Curbs for EW road
    const ewCurbTop = new THREE.Mesh(new THREE.BoxGeometry(150, 0.15, 0.3), curbMat);
    ewCurbTop.position.set(0, 0.06, 20 - 3.4);
    const ewCurbBot = new THREE.Mesh(new THREE.BoxGeometry(150, 0.15, 0.3), curbMat);
    ewCurbBot.position.set(0, 0.06, 20 + 3.4);
    parkGroup.add(ewCurbTop, ewCurbBot);

    // Dashed center line for EW road
    const ewDashes = Math.floor(150 / (dashLen + gapLen));
    for (let i = 0; i < ewDashes; i++) {
      const x = -75 + (i + 0.5) * (dashLen + gapLen);
      // skip intersection with main road
      if (x > 18 && x < 26) continue;
      const dash = new THREE.Mesh(new THREE.PlaneGeometry(dashLen, 0.16), yellowLineMat);
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(x, 0.065, 20);
      parkGroup.add(dash);
    }

    // 3. Northern Inter-Greenhouse Service Road (北部生产服务道: Z = -24, X from -65 to +65, Width 5.5m)
    const northRoadGeo = new THREE.BoxGeometry(130, 0.08, 5.5);
    const northRoad = new THREE.Mesh(northRoadGeo, asphaltMat);
    northRoad.position.set(0, 0.02, -24);
    northRoad.receiveShadow = true;
    parkGroup.add(northRoad);

    // 4. Southern Agricultural Loop Road (南部示范区环线道: Z = 60, X from -75 to +75, Width 5.5m)
    const southRoadGeo = new THREE.BoxGeometry(150, 0.08, 5.5);
    const southRoad = new THREE.Mesh(southRoadGeo, asphaltMat);
    southRoad.position.set(0, 0.02, 60);
    southRoad.receiveShadow = true;
    parkGroup.add(southRoad);

    // Curbs for South road
    const southCurbTop = new THREE.Mesh(new THREE.BoxGeometry(150, 0.15, 0.3), curbMat);
    southCurbTop.position.set(0, 0.06, 60 - 2.9);
    const southCurbBot = new THREE.Mesh(new THREE.BoxGeometry(150, 0.15, 0.3), curbMat);
    southCurbBot.position.set(0, 0.06, 60 + 2.9);
    parkGroup.add(southCurbTop, southCurbBot);

    // 5. Western Farm Logistics Lane (西部农机通道: X = -58, Z from -60 to +60, Width 4.8m)
    const westLaneGeo = new THREE.BoxGeometry(4.8, 0.08, 120);
    const westLane = new THREE.Mesh(westLaneGeo, asphaltMat);
    westLane.position.set(-58, 0.02, 0);
    westLane.receiveShadow = true;
    parkGroup.add(westLane);

    // 6. Eastern Facility Lane (东部公用设施支道: X = 58, Z from -60 to +60, Width 4.8m)
    const eastLaneGeo = new THREE.BoxGeometry(4.8, 0.08, 120);
    const eastLane = new THREE.Mesh(eastLaneGeo, asphaltMat);
    eastLane.position.set(58, 0.02, 0);
    eastLane.receiveShadow = true;
    parkGroup.add(eastLane);

    // 7. Zebra Crossings (斑马线) at key spots
    this.createZebraCrossing(parkGroup, whiteLineMat, 22, 16.5, false);
    this.createZebraCrossing(parkGroup, whiteLineMat, 22, 24.5, false);
    this.createZebraCrossing(parkGroup, whiteLineMat, 0, 20, true);
    this.createZebraCrossing(parkGroup, whiteLineMat, 42, 20, true);
    this.createZebraCrossing(parkGroup, whiteLineMat, -42, 20, true);
    this.createZebraCrossing(parkGroup, whiteLineMat, 22, 60, false);
    this.createZebraCrossing(parkGroup, whiteLineMat, -36, 60, true);
    this.createZebraCrossing(parkGroup, whiteLineMat, 0, 60, true);

    // 8. Modern Solar LED Street Lights (Poles along the expanded road network)
    const streetLightPositions = [
      // Along Main North-South Highway
      [22 + 4.2, -75],
      [22 + 4.2, -50],
      [22 + 4.2, -10],
      [22 + 4.2, 10],
      [22 + 4.2, 35],
      [22 + 4.2, 60],
      [22 + 4.2, 80],
      [22 - 4.2, -65],
      [22 - 4.2, -35],
      [22 - 4.2, 5],
      [22 - 4.2, 45],
      // Along East-West Central Avenue
      [-58, 20 + 3.8],
      [-28, 20 + 3.8],
      [-10, 20 + 3.8],
      [8, 20 + 3.8],
      [58, 20 + 3.8],
      // Along Southern Loop Road
      [-45, 60 + 3.4],
      [-15, 60 + 3.4],
      [15, 60 + 3.4],
      [45, 60 + 3.4],
      [-58, 60 - 3.4],
      // Along Western & Eastern lanes
      [-58 - 3.0, -15],
      [-58 - 3.0, 45],
      [58 + 3.0, -15],
      [58 + 3.0, 45],
    ];

    streetLightPositions.forEach(([lx, lz], idx) => {
      this.createStreetLight(parkGroup, lx, lz, idx);
    });

    // 9. Directional Agricultural Park Road Signs
    this.createRoadSign(parkGroup, 24.5, 23.5, '园区核心导览');
    this.createRoadSign(parkGroup, -20, 23.5, '3#圆拱 ➔ 8#光伏温室');
    this.createRoadSign(parkGroup, 24.5, -20, '4#育苗中心 · 水肥罐区 ➔');
    this.createRoadSign(parkGroup, 24.5, 52, '5#日光 ➔ 6#鱼菜共生');
    this.createRoadSign(parkGroup, 26, 32, '无人机智能机巢 ➔');
    this.createRoadSign(parkGroup, -48, -20, '冷链物流中心 ➔');
    this.createRoadSign(parkGroup, 66, 20, '7#垂直气雾培 · 通量塔 ➔');
  }

  private static createZebraCrossing(
    group: THREE.Group,
    mat: THREE.Material,
    xCenter: number,
    zCenter: number,
    isEW: boolean
  ) {
    const stripes = 7;
    const stripeWidth = 0.45;
    const stripeGap = 0.4;
    const stripeLength = 4.2;

    for (let i = 0; i < stripes; i++) {
      const offset = (i - (stripes - 1) / 2) * (stripeWidth + stripeGap);
      const stripeGeo = isEW
        ? new THREE.PlaneGeometry(stripeWidth, stripeLength)
        : new THREE.PlaneGeometry(stripeLength, stripeWidth);
      const stripe = new THREE.Mesh(stripeGeo, mat);
      stripe.rotation.x = -Math.PI / 2;
      if (isEW) {
        stripe.position.set(xCenter + offset, 0.066, zCenter);
      } else {
        stripe.position.set(xCenter, 0.066, zCenter + offset);
      }
      group.add(stripe);
    }
  }

  private static createStreetLight(group: THREE.Group, x: number, z: number, id: number) {
    const lightGroup = new THREE.Group();
    lightGroup.position.set(x, 0, z);

    const metalMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.85,
      roughness: 0.3,
    });

    // Base flange
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 0.2, 8), metalMat);
    base.position.y = 0.1;
    lightGroup.add(base);

    // Pole
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 6.0, 8), metalMat);
    pole.position.y = 3.0;
    lightGroup.add(pole);

    // Cantilever arm
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.4, 8), metalMat);
    arm.rotation.z = Math.PI / 3;
    arm.position.set(-0.5, 5.8, 0);
    lightGroup.add(arm);

    // Solar PV panel on top
    const pvMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, metalness: 0.8, roughness: 0.2 });
    const solarPV = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.04, 0.6), pvMat);
    solarPV.rotation.x = 0.4;
    solarPV.position.set(0, 6.1, 0);
    lightGroup.add(solarPV);

    // Luminaire lamp head
    const lampMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xfef08a,
      emissiveIntensity: 0.8,
    });
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.25), lampMat);
    lamp.position.set(-1.0, 5.5, 0);
    lightGroup.add(lamp);

    group.add(lightGroup);
  }

  private static createRoadSign(group: THREE.Group, x: number, z: number, text: string) {
    const signGroup = new THREE.Group();
    signGroup.position.set(x, 0, z);

    const poleMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8, roughness: 0.3 });
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3.2, 8), poleMat);
    pole.position.y = 1.6;
    signGroup.add(pole);

    // Sign plate
    const plateMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.2, roughness: 0.4 });
    const plate = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.8, 0.06), plateMat);
    plate.position.set(0, 2.6, 0);
    signGroup.add(plate);

    // Border
    const borderMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const border = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.72, 0.07), borderMat);
    border.position.set(0, 2.6, 0);
    signGroup.add(border);

    group.add(signGroup);
  }

  // -------------------------------------------------------------
  // ADDITIONAL GREENHOUSES (GH #2 East, GH #3 West, GH #4 North)
  // -------------------------------------------------------------
  public static buildAdditionalGreenhouses(
    scene: THREE.Scene,
    parkGroup: THREE.Group,
    glassMaterials: THREE.MeshPhysicalMaterial[],
    interactiveObjects: THREE.Object3D[]
  ) {
    const steelMat = new THREE.MeshStandardMaterial({
      color: 0xa0aec0, // Realistic hot-dip galvanized steel
      metalness: 0.75,
      roughness: 0.32,
    });

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xe0f2fe, // Clean crystal low-iron architectural glass
      transparent: true,
      opacity: 0.22,
      roughness: 0.08,
      metalness: 0.05,
      transmission: 0.88,
      reflectivity: 0.75,
      ior: 1.52,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    glassMaterials.push(glassMat);

    // =============================================================
    // 2# 连栋智能玻璃温室 (East Greenhouse #2, X = 42, Z = -4)
    // =============================================================
    const gh2Group = new THREE.Group();
    gh2Group.position.set(42, 0, -4);
    gh2Group.userData = {
      id: 'greenhouse_02',
      type: 'greenhouse',
      name: '2# 智能连栋玻璃温室 (立体草莓示范区)',
    };

    // Slab foundation (22m x 28m)
    const slab2 = new THREE.Mesh(
      new THREE.BoxGeometry(22.4, 0.2, 28.4),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 })
    );
    slab2.position.y = -0.1;
    slab2.receiveShadow = true;
    gh2Group.add(slab2);

    // Columns & Gutters for GH #2 (Dual-span Venlo: span 11m each, length 28m)
    const colGeo = new THREE.BoxGeometry(0.16, 4.5, 0.16);
    const zList = [-14, -9.3, -4.6, 0, 4.6, 9.3, 14];
    const xList = [-11, 0, 11];

    zList.forEach((z) => {
      xList.forEach((x) => {
        const c = new THREE.Mesh(colGeo, steelMat);
        c.position.set(x, 2.25, z);
        c.castShadow = true;
        gh2Group.add(c);
      });
    });

    // Venlo Roof Peaks (Left peak at -5.5, Right peak at +5.5, Ridge height 6.2)
    zList.forEach((z) => {
      // Left span
      this.createSimpleTruss(gh2Group, steelMat, -11, -5.5, 0, 4.5, 6.2, z);
      // Right span
      this.createSimpleTruss(gh2Group, steelMat, 0, 5.5, 11, 4.5, 6.2, z);
    });

    // Longitudinal Gutter & Ridge Beams
    xList.forEach((x) => {
      const g = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.18, 28.2), steelMat);
      g.position.set(x, 4.5, 0);
      gh2Group.add(g);
    });
    [-5.5, 5.5].forEach((rx) => {
      const r = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 28.2), steelMat);
      r.position.set(rx, 6.2, 0);
      gh2Group.add(r);
    });

    // Glass Walls
    const wallEast = new THREE.Mesh(new THREE.BoxGeometry(0.05, 4.5, 28), glassMat);
    wallEast.position.set(11, 2.25, 0);
    const wallWest = new THREE.Mesh(new THREE.BoxGeometry(0.05, 4.5, 28), glassMat);
    wallWest.position.set(-11, 2.25, 0);
    const wallNorth = new THREE.Mesh(new THREE.BoxGeometry(22, 4.5, 0.05), glassMat);
    wallNorth.position.set(0, 2.25, 14);
    const wallSouth = new THREE.Mesh(new THREE.BoxGeometry(22, 4.5, 0.05), glassMat);
    wallSouth.position.set(0, 2.25, -14);
    gh2Group.add(wallEast, wallWest, wallNorth, wallSouth);

    // Glass Roof Panels
    this.createVenloRoofGlass(gh2Group, glassMat, -11, -5.5, 0, 4.5, 6.2, 28);
    this.createVenloRoofGlass(gh2Group, glassMat, 0, 5.5, 11, 4.5, 6.2, 28);

    // Internal High-wire Strawberry Gutters (4 rows)
    const strawRowMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.6 });
    const berryMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 });
    [-7.5, -3.5, 3.5, 7.5].forEach((rx) => {
      // Gutter trough
      const trough = new THREE.Mesh(
        new THREE.BoxGeometry(0.45, 0.18, 24),
        new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.7 })
      );
      trough.position.set(rx, 1.2, 0);
      gh2Group.add(trough);

      // Strawberry foliage canopy
      const plantRow = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.35, 23.8), strawRowMat);
      plantRow.position.set(rx, 1.45, 0);
      gh2Group.add(plantRow);

      // Red berries
      for (let bz = -10; bz <= 10; bz += 2.0) {
        const berry = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 6), berryMat);
        berry.position.set(rx + (Math.random() - 0.5) * 0.35, 1.35, bz);
        gh2Group.add(berry);
      }
    });

    // Marquee Signboard on GH2
    this.createGreenhouseSign(gh2Group, 0, 4.7, 14.2, '2# 连栋智能玻璃温室 (高架立体草莓示范棚)');

    parkGroup.add(gh2Group);
    interactiveObjects.push(gh2Group);

    // =============================================================
    // 3# 现代连栋圆拱温室 (West Greenhouse #3, X = -42, Z = -4)
    // =============================================================
    const gh3Group = new THREE.Group();
    gh3Group.position.set(-42, 0, -4);
    gh3Group.userData = {
      id: 'greenhouse_03',
      type: 'greenhouse',
      name: '3# 现代连栋圆拱温室 (优质叶菜示范棚)',
    };

    // Slab foundation (22m x 28m)
    const slab3 = new THREE.Mesh(
      new THREE.BoxGeometry(22.4, 0.2, 28.4),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 })
    );
    slab3.position.y = -0.1;
    gh3Group.add(slab3);

    // 3-span Gothic Curved Arches (Span 1: -11 to -3.6, Span 2: -3.6 to +3.6, Span 3: 3.6 to 11)
    const spanWidth = 7.33;
    const archCenters = [-7.33, 0, 7.33];
    const archEave = 3.6;
    const archPeak = 5.6;

    // Arch film material (Translucent diffuse agricultural PO film)
    const filmMat = new THREE.MeshPhysicalMaterial({
      color: 0xf8fafc,
      transparent: true,
      opacity: 0.35,
      roughness: 0.32,
      metalness: 0.02,
      transmission: 0.72,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    glassMaterials.push(filmMat);

    // Arch steel hoops along Z
    for (let z = -14; z <= 14; z += 3.5) {
      archCenters.forEach((cx) => {
        // Vertical side posts
        const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, archEave, 8), steelMat);
        p1.position.set(cx - spanWidth / 2, archEave / 2, z);
        const p2 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, archEave, 8), steelMat);
        p2.position.set(cx + spanWidth / 2, archEave / 2, z);
        gh3Group.add(p1, p2);

        // Curved hoop roof
        const curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(cx - spanWidth / 2, archEave, z),
          new THREE.Vector3(cx, archPeak, z),
          new THREE.Vector3(cx + spanWidth / 2, archEave, z),
        ]);
        const tubeGeo = new THREE.TubeGeometry(curve, 16, 0.05, 8, false);
        const tube = new THREE.Mesh(tubeGeo, steelMat);
        gh3Group.add(tube);
      });
    }

    // Curved Film Roof Surfaces
    archCenters.forEach((cx) => {
      // Create curved roof mesh
      const roofGeo = new THREE.CylinderGeometry(
        spanWidth / 2,
        spanWidth / 2,
        28,
        20,
        1,
        true,
        0,
        Math.PI
      );
      const roofMesh = new THREE.Mesh(roofGeo, filmMat);
      roofMesh.rotation.z = Math.PI / 2;
      roofMesh.rotation.y = Math.PI / 2;
      roofMesh.position.set(cx, archEave, 0);
      gh3Group.add(roofMesh);
    });

    // Vertical film sides
    const sideEast3 = new THREE.Mesh(new THREE.BoxGeometry(0.05, archEave, 28), filmMat);
    sideEast3.position.set(11, archEave / 2, 0);
    const sideWest3 = new THREE.Mesh(new THREE.BoxGeometry(0.05, archEave, 28), filmMat);
    sideWest3.position.set(-11, archEave / 2, 0);
    gh3Group.add(sideEast3, sideWest3);

    // Internal Hydroponic NFT Green Leaf Beds
    const nftMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.5 });
    [-7.5, -3.5, 0, 3.5, 7.5].forEach((nx) => {
      const trough = new THREE.Mesh(
        new THREE.BoxGeometry(0.7, 0.25, 24),
        new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 })
      );
      trough.position.set(nx, 0.8, 0);
      const greens = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.35, 23.8), nftMat);
      greens.position.set(nx, 1.05, 0);
      gh3Group.add(trough, greens);
    });

    // Marquee Signboard on GH3
    this.createGreenhouseSign(gh3Group, 0, 4.2, 14.2, '3# 现代连栋圆拱温室 (优质叶菜示范棚)');

    parkGroup.add(gh3Group);
    interactiveObjects.push(gh3Group);

    // =============================================================
    // 4# 数字种苗繁育中心 (North Greenhouse #4, X = 0, Z = -46)
    // =============================================================
    const gh4Group = new THREE.Group();
    gh4Group.position.set(0, 0, -46);
    gh4Group.userData = {
      id: 'greenhouse_04',
      type: 'greenhouse',
      name: '4# 数字化种苗繁育中心 (植物工厂)',
    };

    // Plant factory insulated structure (32m x 18m x 6.8m)
    const wallPanelMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9, // Crisp cleanroom white insulated architectural panels
      metalness: 0.2,
      roughness: 0.35,
    });

    // Main cleanroom building block
    const factoryBuilding = new THREE.Mesh(new THREE.BoxGeometry(32, 6.8, 18), wallPanelMat);
    factoryBuilding.position.y = 3.4;
    factoryBuilding.castShadow = true;
    factoryBuilding.receiveShadow = true;
    gh4Group.add(factoryBuilding);

    // Front panoramic observation glass ribbon window
    const glassRibbon = new THREE.Mesh(
      new THREE.BoxGeometry(26, 3.2, 0.15),
      new THREE.MeshPhysicalMaterial({
        color: 0x67e8f9,
        transmission: 0.85,
        transparent: true,
        opacity: 0.3,
        roughness: 0.1,
      })
    );
    glassRibbon.position.set(0, 3.2, 9.05);
    gh4Group.add(glassRibbon);

    // Visible purple/magenta vertical nursery LED rack arrays through the window
    const rackLightMat = new THREE.MeshStandardMaterial({
      color: 0xf43f5e,
      emissive: 0xf43f5e,
      emissiveIntensity: 1.2,
    });
    for (let rx = -10; rx <= 10; rx += 4.5) {
      for (let ry = 1.5; ry <= 5.0; ry += 1.2) {
        const shelf = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.08, 1.2), rackLightMat);
        shelf.position.set(rx, ry, 7.5);
        gh4Group.add(shelf);
      }
    }

    // Rooftop HVAC condensing chillers (2 units)
    [-8, 8].forEach((hx) => {
      const hvac = new THREE.Mesh(
        new THREE.BoxGeometry(3.2, 1.4, 2.4),
        new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.7, roughness: 0.3 })
      );
      hvac.position.set(hx, 7.5, 0);
      gh4Group.add(hvac);
    });

    // Rooftop Solar Photovoltaic Array (4 rows)
    const pvMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, metalness: 0.8, roughness: 0.2 });
    for (let rz = -5; rz <= 5; rz += 3.2) {
      const solarRow = new THREE.Mesh(new THREE.BoxGeometry(24, 0.08, 2.2), pvMat);
      solarRow.rotation.x = 0.3;
      solarRow.position.set(0, 7.3, rz);
      gh4Group.add(solarRow);
    }

    // Marquee Signboard on GH4
    this.createGreenhouseSign(gh4Group, 0, 5.8, 9.15, '4# 数字化种苗繁育中心 (植物工厂)');

    parkGroup.add(gh4Group);
    interactiveObjects.push(gh4Group);

    // =============================================================
    // GREENHOUSE 5: 5# 智能蓄热高效日光温室 (Chinese High-Efficiency Solar Greenhouse with Thermal Wall & Quilt Roller)
    // Position: X = -36, Z = 40 | Dimensions: 26m wide, 16m deep, 5.8m high
    // =============================================================
    const gh5Group = new THREE.Group();
    gh5Group.position.set(-36, 0, 40);
    gh5Group.userData = {
      id: 'greenhouse_05',
      type: 'greenhouse',
      name: '5# 智能蓄热高效日光温室 (节能低碳冬暖示范棚)',
      description: '北方经典被动蓄热日光温室现代化升级版。配置复合保温北山墙、自动化电动卷帘被机、双层散光PO膜及内部智能水帘通风。',
    };

    // 1. Heavy Masonry Thermal Storage North Wall (北侧蓄热保温厚山墙)
    const northWallMat = new THREE.MeshStandardMaterial({
      color: 0x475569, // Slate masonry thermal wall
      roughness: 0.9,
      metalness: 0.05,
    });
    const northWall = new THREE.Mesh(new THREE.BoxGeometry(26, 4.2, 0.9), northWallMat);
    northWall.position.set(0, 2.1, -7.5);
    gh5Group.add(northWall);

    // North Wall Coping / Parapet (顶冠饰线)
    const coping = new THREE.Mesh(new THREE.BoxGeometry(26.4, 0.25, 1.1), new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 }));
    coping.position.set(0, 4.3, -7.5);
    gh5Group.add(coping);

    // 2. Gable End Walls (East & West Gable Walls - 东西立山墙)
    [-13, 13].forEach((gx) => {
      const gableBase = new THREE.Mesh(new THREE.BoxGeometry(0.5, 3.8, 15), northWallMat);
      gableBase.position.set(gx, 1.9, 0);
      gh5Group.add(gableBase);
    });

    // 3. North Sloped Insulated Back Roof (后坡保温屋顶: from z = -7.5, y = 4.2 to ridge at z = -3.5, y = 5.8)
    const backRoofLen = Math.hypot(4.0, 1.6);
    const backRoofAng = Math.atan2(1.6, 4.0);
    const backRoof = new THREE.Mesh(
      new THREE.BoxGeometry(26, 0.35, backRoofLen),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 })
    );
    backRoof.position.set(0, 5.0, -5.5);
    backRoof.rotation.x = backRoofAng;
    gh5Group.add(backRoof);

    // 4. Curved South-Facing Galvanized Arches & Translucent PO Film (南向大采光弧面)
    const archMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.25 });
    const poFilmMat = new THREE.MeshPhysicalMaterial({
      color: 0xe0f2fe,
      transmission: 0.88,
      transparent: true,
      opacity: 0.35,
      roughness: 0.15,
      ior: 1.48,
    });
    glassMaterials.push(poFilmMat);

    // Curved front truss rib lines
    for (let rx = -12; rx <= 12; rx += 2.4) {
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(rx, 5.8, -3.5),
        new THREE.Vector3(rx, 4.8, 4.5),
        new THREE.Vector3(rx, 0.4, 7.8)
      );
      const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.05, 6, false), archMat);
      gh5Group.add(tube);
    }

    // Curved PO Film covering mesh
    const frontRoofGeo = new THREE.PlaneGeometry(25.6, 12.5, 20, 10);
    const pos = frontRoofGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const v = (pos.getY(i) + 6.25) / 12.5; // 0 at bottom (south), 1 at top (ridge)
      const curY = 0.4 + (5.8 - 0.4) * Math.sin(v * Math.PI * 0.5);
      const curZ = 7.8 - 11.3 * v;
      pos.setY(i, curY);
      pos.setZ(i, curZ);
    }
    frontRoofGeo.computeVertexNormals();
    const poFilmCover = new THREE.Mesh(frontRoofGeo, poFilmMat);
    gh5Group.add(poFilmCover);

    // 5. Automated Motorized Thermal Blanket Roller (电动卷帘机与保温被卷轴)
    const quiltRoll = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.35, 25.8, 16),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85 })
    );
    quiltRoll.rotation.z = Math.PI / 2;
    quiltRoll.position.set(0, 5.75, -2.5);
    gh5Group.add(quiltRoll);

    // Motor gearbox drive unit at east end
    const motorBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.7, 0.7),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.6, roughness: 0.3 })
    );
    motorBox.position.set(13.2, 5.75, -2.5);
    gh5Group.add(motorBox);

    // Articulated support swing arm from ground
    const swingArm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 6.5),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.7, roughness: 0.3 })
    );
    swingArm.position.set(13.2, 2.9, 2.0);
    swingArm.rotation.x = 0.75;
    gh5Group.add(swingArm);

    // 6. Interior vegetable growing beds (cucumbers / melons with climbing trellises)
    const bedMat = new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.7 });
    for (let bz = -1; bz <= 5; bz += 2.2) {
      const bed = new THREE.Mesh(new THREE.BoxGeometry(23, 0.3, 0.9), new THREE.MeshStandardMaterial({ color: 0x3f3f46 }));
      bed.position.set(0, 0.15, bz);
      const crops = new THREE.Mesh(new THREE.BoxGeometry(22.6, 1.2, 0.6), bedMat);
      crops.position.set(0, 0.8, bz);
      gh5Group.add(bed, crops);
    }

    this.createGreenhouseSign(gh5Group, 0, 4.6, 8.2, '5# 智能蓄热日光温室 (冬暖高效示范棚)');
    parkGroup.add(gh5Group);
    interactiveObjects.push(gh5Group);

    // =============================================================
    // GREENHOUSE 6: 6# 鱼菜共生生态循环温室 (Aquaponics Circular Eco Greenhouse)
    // Position: X = -4, Z = 40 | Dimensions: 20m wide, 20m deep, 5.4m high
    // =============================================================
    const gh6Group = new THREE.Group();
    gh6Group.position.set(-4, 0, 40);
    gh6Group.userData = {
      id: 'greenhouse_06',
      type: 'greenhouse',
      name: '6# 鱼菜共生生态循环温室 (水产养殖与无土栽培协同)',
      description: '现代循环水产养殖(RAS)与深液流水培(DWC)生态循环示范单元。通过微滤、生物降解与植物根系吸附，实现养鱼不换水、种菜不施肥。',
    };

    // Foundation curb
    const gh6Foundation = new THREE.Mesh(
      new THREE.BoxGeometry(20.4, 0.4, 20.4),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 })
    );
    gh6Foundation.position.set(0, 0.2, 0);
    gh6Group.add(gh6Foundation);

    // Steel framework columns
    const steelWhiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.8, roughness: 0.2 });
    [-10, 0, 10].forEach((colX) => {
      [-10, -5, 0, 5, 10].forEach((colZ) => {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.16, 4.2, 0.16), steelWhiteMat);
        post.position.set(colX, 2.1, colZ);
        gh6Group.add(post);
      });
    });

    // Glass walls
    const gh6GlassMat = new THREE.MeshPhysicalMaterial({
      color: 0xa5f3fc,
      transmission: 0.9,
      transparent: true,
      opacity: 0.26,
      roughness: 0.1,
    });
    glassMaterials.push(gh6GlassMat);

    const gh6GlassWalls = new THREE.Mesh(new THREE.BoxGeometry(19.8, 3.8, 19.8), gh6GlassMat);
    gh6GlassWalls.position.set(0, 2.2, 0);
    gh6Group.add(gh6GlassWalls);

    // Twin-span curved Gothic roof
    [-5, 5].forEach((spanX) => {
      for (let rz = -10; rz <= 10; rz += 4) {
        const curve = new THREE.QuadraticBezierCurve3(
          new THREE.Vector3(spanX - 4.8, 4.0, rz),
          new THREE.Vector3(spanX, 5.4, rz),
          new THREE.Vector3(spanX + 4.8, 4.0, rz)
        );
        const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.05, 6, false), steelWhiteMat);
        gh6Group.add(tube);
      }
    });

    // 4 Large Circular Aquaculture Fish Tanks (4座循环水养殖圆池)
    const tankBodyMat = new THREE.MeshStandardMaterial({ color: 0x0f766e, roughness: 0.4, metalness: 0.2 });
    const fishWaterMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.88,
      roughness: 0.2,
    });

    const tankCoords = [
      [-4.5, -4.5],
      [4.5, -4.5],
      [-4.5, 4.5],
      [4.5, 4.5],
    ];

    tankCoords.forEach(([tx, tz], tidx) => {
      // Outer polypropylene cylinder tank
      const tank = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 1.5, 24, 1, true), tankBodyMat);
      tank.position.set(tx, 0.95, tz);

      // Water surface inside
      const water = new THREE.Mesh(new THREE.CylinderGeometry(2.35, 2.35, 0.05, 24), fishWaterMat);
      water.position.set(tx, 1.55, tz);

      // Tank top rim lip
      const rim = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.08, 8, 24), steelWhiteMat);
      rim.rotation.x = Math.PI / 2;
      rim.position.set(tx, 1.7, tz);

      // Central aerator vortex nozzle
      const aerator = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.5), new THREE.MeshStandardMaterial({ color: 0x38bdf8 }));
      aerator.position.set(tx, 1.75, tz);

      gh6Group.add(tank, water, rim, aerator);
    });

    // Central inspection walkway between tanks
    const catwalk = new THREE.Mesh(
      new THREE.BoxGeometry(16, 0.12, 1.2),
      new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8, roughness: 0.3 })
    );
    catwalk.position.set(0, 1.75, 0);
    gh6Group.add(catwalk);

    // Bio-filtration & sediment reaction columns
    [-8, 8].forEach((bx) => {
      const bioCol = new THREE.Mesh(
        new THREE.CylinderGeometry(0.8, 0.8, 2.6, 16),
        new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.6, roughness: 0.3 })
      );
      bioCol.position.set(bx, 1.5, 0);
      gh6Group.add(bioCol);
    });

    // Deep Water Culture Hydroponic Float Beds along the perimeter
    [-8.5, 8.5].forEach((lx) => {
      const bed = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.4, 16), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
      bed.position.set(lx, 0.4, 0);
      const lettuce = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.25, 15.6), new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.6 }));
      lettuce.position.set(lx, 0.7, 0);
      gh6Group.add(bed, lettuce);
    });

    this.createGreenhouseSign(gh6Group, 0, 4.4, 10.15, '6# 鱼菜共生生态循环温室 (水产养殖与无土栽培协同)');
    parkGroup.add(gh6Group);
    interactiveObjects.push(gh6Group);

    // =============================================================
    // GREENHOUSE 7: 7# 垂直气雾培与未来农业温室 (Aeroponics & Vertical A-Frame Tower Greenhouse)
    // Position: X = 72, Z = -4 | Dimensions: 18m wide, 28m deep, 6.4m high
    // =============================================================
    const gh7Group = new THREE.Group();
    gh7Group.position.set(72, 0, -4);
    gh7Group.userData = {
      id: 'greenhouse_07',
      type: 'greenhouse',
      name: '7# 垂直气雾培与未来立体农业温室',
      description: '全控型超高透光立体气雾培温室。配置6组大型A字架气雾培立柱群、根系高压脉冲超声微雾灌溉、全光谱植物补光与养分自循环。',
    };

    // Concrete foundation
    const gh7Foundation = new THREE.Mesh(
      new THREE.BoxGeometry(18.4, 0.4, 28.4),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 })
    );
    gh7Foundation.position.set(0, 0.2, 0);
    gh7Group.add(gh7Foundation);

    // Ultra-clear crystal glass shell
    const gh7GlassMat = new THREE.MeshPhysicalMaterial({
      color: 0xecfeff,
      transmission: 0.94,
      transparent: true,
      opacity: 0.22,
      roughness: 0.08,
      metalness: 0.05,
    });
    glassMaterials.push(gh7GlassMat);

    const gh7Walls = new THREE.Mesh(new THREE.BoxGeometry(17.8, 4.5, 27.8), gh7GlassMat);
    gh7Walls.position.set(0, 2.45, 0);
    gh7Group.add(gh7Walls);

    // High pitched glass roof
    const gh7RoofMat = new THREE.MeshPhysicalMaterial({
      color: 0xcffafe,
      transmission: 0.92,
      transparent: true,
      opacity: 0.28,
      roughness: 0.1,
    });
    glassMaterials.push(gh7RoofMat);

    [-4.5, 4.5].forEach((rx) => {
      this.createVenloRoofGlass(gh7Group, gh7RoofMat, rx - 4.5, rx, rx + 4.5, 4.5, 6.4, 27.8);
    });

    // 6 Large Vertical Triangular A-Frame Aeroponic Towers (6组大型立体A字架气雾培种植塔)
    const towerBoardMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 }); // White food-grade PVC
    const towerCropMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.6 }); // Dense vibrant greens
    const mistPipeMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.6, roughness: 0.3 });

    [-4.2, 4.2].forEach((ax) => {
      [-8, 0, 8].forEach((az) => {
        // Sloped panel left
        const panelLeft = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.4, 6.5), towerBoardMat);
        panelLeft.position.set(ax - 0.75, 1.8, az);
        panelLeft.rotation.z = 0.45;

        // Sloped panel right
        const panelRight = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.4, 6.5), towerBoardMat);
        panelRight.position.set(ax + 0.75, 1.8, az);
        panelRight.rotation.z = -0.45;

        // Green crops on left and right sides
        const cropL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 3.2, 6.3), towerCropMat);
        cropL.position.set(ax - 0.82, 1.8, az);
        cropL.rotation.z = 0.45;

        const cropR = new THREE.Mesh(new THREE.BoxGeometry(0.16, 3.2, 6.3), towerCropMat);
        cropR.position.set(ax + 0.82, 1.8, az);
        cropR.rotation.z = -0.45;

        // Top mist distribution pipe
        const topPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 6.5), mistPipeMat);
        topPipe.rotation.x = Math.PI / 2;
        topPipe.position.set(ax, 3.3, az);

        // Overhead LED grow light bar
        const ledBar = new THREE.Mesh(
          new THREE.BoxGeometry(0.3, 0.1, 6.5),
          new THREE.MeshStandardMaterial({ color: 0xf43f5e, emissive: 0xf43f5e, emissiveIntensity: 1.5 })
        );
        ledBar.position.set(ax, 4.2, az);

        gh7Group.add(panelLeft, panelRight, cropL, cropR, topPipe, ledBar);
      });
    });

    this.createGreenhouseSign(gh7Group, 0, 5.2, 14.15, '7# 垂直气雾培与未来农业温室 (太空农业立体栽培示范)');
    parkGroup.add(gh7Group);
    interactiveObjects.push(gh7Group);

    // =============================================================
    // GREENHOUSE 8: 8# 光伏农业一体化智能温室 (Agrivoltaic BIPV Eco Greenhouse)
    // Position: X = -68, Z = -4 | Dimensions: 18m wide, 28m deep, 5.8m high
    // =============================================================
    const gh8Group = new THREE.Group();
    gh8Group.position.set(-68, 0, -4);
    gh8Group.userData = {
      id: 'greenhouse_08',
      type: 'greenhouse',
      name: '8# 光伏农业一体化智能温室 (BIPV绿色低碳农业)',
      description: '屋顶集成半透明碲化镉薄膜光伏电池与超白漫透玻璃，棚内种植喜阴高附加值名贵中药材(铁皮石斛)与食用菌菌棒立体化层架，实现“顶上发电、棚下种植”。',
    };

    // Foundation
    const gh8Foundation = new THREE.Mesh(
      new THREE.BoxGeometry(18.4, 0.4, 28.4),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 })
    );
    gh8Foundation.position.set(0, 0.2, 0);
    gh8Group.add(gh8Foundation);

    // Side walls
    const gh8WallMat = new THREE.MeshPhysicalMaterial({
      color: 0xbae6fd,
      transmission: 0.88,
      transparent: true,
      opacity: 0.3,
      roughness: 0.15,
    });
    glassMaterials.push(gh8WallMat);

    const gh8Walls = new THREE.Mesh(new THREE.BoxGeometry(17.8, 3.8, 27.8), gh8WallMat);
    gh8Walls.position.set(0, 2.1, 0);
    gh8Group.add(gh8Walls);

    // Roof: Alternating BIPV Photovoltaic Solar Glass & Clear Glass
    const bipvMat = new THREE.MeshStandardMaterial({
      color: 0x1e3a8a, // Deep solar cell navy
      metalness: 0.88,
      roughness: 0.18,
    });

    [-4.5, 4.5].forEach((spanX) => {
      for (let rz = -12; rz <= 12; rz += 4.5) {
        const isSolar = Math.abs(rz) % 9 < 4.5;
        const panelMat = isSolar ? bipvMat : gh8WallMat;
        const panel = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.08, 4.2), panelMat);
        panel.position.set(spanX - 2.1, 4.6, rz);
        panel.rotation.z = 0.35;

        const panelRight = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.08, 4.2), panelMat);
        panelRight.position.set(spanX + 2.1, 4.6, rz);
        panelRight.rotation.z = -0.35;

        gh8Group.add(panel, panelRight);
      }
    });

    // Inverter and Battery Energy Storage Cabinets (光伏逆变与储能一体柜)
    [-3, 3].forEach((ix) => {
      const invCabinet = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 2.2, 0.8),
        new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.6, roughness: 0.3 })
      );
      invCabinet.position.set(ix, 1.2, -13.2);
      gh8Group.add(invCabinet);
    });

    // Interior 3-Tier Shade Racks with Medicinal Herbs & Mushroom Logs
    const woodRackMat = new THREE.MeshStandardMaterial({ color: 0x78716c, roughness: 0.8 });
    const herbPlantMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.5 }); // Dendrobium green
    const mushroomMat = new THREE.MeshStandardMaterial({ color: 0x44403c, roughness: 0.9 }); // Shiitake mushroom logs

    [-4.5, 4.5].forEach((rx) => {
      for (let rz = -8; rz <= 8; rz += 4) {
        // Multi-tier timber rack
        for (let ry = 0.6; ry <= 2.2; ry += 0.8) {
          const shelf = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.08, 3.2), woodRackMat);
          shelf.position.set(rx, ry, rz);

          // Tier 1 & 2: Medicinal herbs; Tier 3: Mushroom logs
          const crop = new THREE.Mesh(
            new THREE.BoxGeometry(3.0, 0.25, 3.0),
            ry < 1.8 ? herbPlantMat : mushroomMat
          );
          crop.position.set(rx, ry + 0.18, rz);

          gh8Group.add(shelf, crop);
        }
      }
    });

    this.createGreenhouseSign(gh8Group, 0, 4.6, 14.15, '8# 光伏农业一体化温室 (阴生名贵中药材与食用菌示范区)');
    parkGroup.add(gh8Group);
    interactiveObjects.push(gh8Group);
  }

  private static createSimpleTruss(
    group: THREE.Group,
    mat: THREE.Material,
    x1: number,
    xMid: number,
    x2: number,
    yEave: number,
    yRidge: number,
    z: number
  ) {
    const len1 = Math.hypot(xMid - x1, yRidge - yEave);
    const ang1 = Math.atan2(yRidge - yEave, xMid - x1);
    const r1 = new THREE.Mesh(new THREE.BoxGeometry(len1, 0.08, 0.08), mat);
    r1.position.set((x1 + xMid) / 2, (yEave + yRidge) / 2, z);
    r1.rotation.z = ang1;

    const len2 = Math.hypot(x2 - xMid, yRidge - yEave);
    const ang2 = Math.atan2(yRidge - yEave, x2 - xMid);
    const r2 = new THREE.Mesh(new THREE.BoxGeometry(len2, 0.08, 0.08), mat);
    r2.position.set((xMid + x2) / 2, (yEave + yRidge) / 2, z);
    r2.rotation.z = -ang2;

    group.add(r1, r2);
  }

  private static createVenloRoofGlass(
    group: THREE.Group,
    mat: THREE.Material,
    x1: number,
    xMid: number,
    x2: number,
    yEave: number,
    yRidge: number,
    length: number
  ) {
    const slopeLen = Math.hypot(xMid - x1, yRidge - yEave);
    const angle = Math.atan2(yRidge - yEave, xMid - x1);

    const g1 = new THREE.Mesh(new THREE.PlaneGeometry(slopeLen, length), mat);
    g1.position.set((x1 + xMid) / 2, (yEave + yRidge) / 2, 0);
    g1.rotation.y = Math.PI / 2;
    g1.rotation.x = -angle;

    const g2 = new THREE.Mesh(new THREE.PlaneGeometry(slopeLen, length), mat);
    g2.position.set((xMid + x2) / 2, (yEave + yRidge) / 2, 0);
    g2.rotation.y = Math.PI / 2;
    g2.rotation.x = angle;

    group.add(g1, g2);
  }

  private static createGreenhouseSign(group: THREE.Group, x: number, y: number, z: number, title: string) {
    const banner = new THREE.Mesh(
      new THREE.BoxGeometry(10, 0.9, 0.12),
      new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        emissive: 0x0284c7,
        emissiveIntensity: 0.4,
        roughness: 0.3,
      })
    );
    banner.position.set(x, y, z);
    group.add(banner);
  }

  // -------------------------------------------------------------
  // ECOLOGICAL RIVER/POND & WATER TELEMETRY BUOY STATION
  // -------------------------------------------------------------
  public static buildPondAndWaterStation(
    scene: THREE.Scene,
    parkGroup: THREE.Group,
    interactiveObjects: THREE.Object3D[]
  ): ParkSubsystems {
    const pondCenter = new THREE.Vector3(42, 0, 44);
    const pondWidth = 38;
    const pondLength = 30;

    // 1. Excavated Sunken Pond Basin & Embankment
    const basinMat = new THREE.MeshStandardMaterial({
      color: 0x8295a8,
      roughness: 0.9,
    });

    // Sunken bed
    const bedGeo = new THREE.BoxGeometry(pondWidth, 2.6, pondLength);
    const bedMesh = new THREE.Mesh(bedGeo, basinMat);
    bedMesh.position.set(pondCenter.x, -1.35, pondCenter.z);
    parkGroup.add(bedMesh);

    // Stone riprap slope border (驳岸乱石与护坡)
    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.8,
    });
    // Add stone boulders along perimeter
    for (let angle = 0; angle < Math.PI * 2; angle += 0.2) {
      const rx = (pondWidth / 2) * Math.cos(angle) + (Math.random() - 0.5) * 1.2;
      const rz = (pondLength / 2) * Math.sin(angle) + (Math.random() - 0.5) * 1.2;
      const rock = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.7 + Math.random() * 0.5, 0),
        stoneMat
      );
      rock.position.set(pondCenter.x + rx, 0.1, pondCenter.z + rz);
      rock.rotation.set(Math.random(), Math.random(), Math.random());
      parkGroup.add(rock);
    }

    // 2. Realistic Natural Reservoir Water Surface (MeshPhysicalMaterial)
    const waterGeo = new THREE.PlaneGeometry(pondWidth - 1.2, pondLength - 1.2, 40, 32);
    const waterMat = new THREE.MeshPhysicalMaterial({
      color: 0x0f4c5c, // Deep natural reservoir water
      roughness: 0.08,
      metalness: 0.05,
      transmission: 0.82,
      transparent: true,
      opacity: 0.85,
      ior: 1.333,
      reflectivity: 0.85,
      depthWrite: false,
    });
    const waterMesh = new THREE.Mesh(waterGeo, waterMat);
    waterMesh.rotation.x = -Math.PI / 2;
    waterMesh.position.set(pondCenter.x, -0.22, pondCenter.z);
    parkGroup.add(waterMesh);

    // Water lilies / Lotus pads floating on water
    const lilyMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.6 });
    for (let i = 0; i < 18; i++) {
      const lx = pondCenter.x + (Math.random() - 0.5) * (pondWidth - 8);
      const lz = pondCenter.z + (Math.random() - 0.5) * (pondLength - 8);
      const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.02, 12), lilyMat);
      pad.position.set(lx, -0.2, lz);
      parkGroup.add(pad);
    }

    // 3. Wooden Inspection Dock/Pier (观水平台与监测码头)
    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x78350f,
      roughness: 0.8,
    });
    const pierGeo = new THREE.BoxGeometry(4.5, 0.2, 10);
    const pier = new THREE.Mesh(pierGeo, woodMat);
    pier.position.set(pondCenter.x - 14, 0.15, pondCenter.z - 8);
    pier.receiveShadow = true;
    parkGroup.add(pier);

    // Pier guardrails
    const railMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.6 });
    const rail1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.8, 10), railMat);
    rail1.position.set(pondCenter.x - 14 - 2.1, 0.65, pondCenter.z - 8);
    const rail2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.8, 10), railMat);
    rail2.position.set(pondCenter.x - 14 + 2.1, 0.65, pondCenter.z - 8);
    parkGroup.add(rail1, rail2);

    // 4. Solar Telemetry Buoy (生态水质水温水位智能浮标站)
    const buoyGroup = new THREE.Group();
    buoyGroup.position.set(pondCenter.x, -0.1, pondCenter.z);
    buoyGroup.userData = {
      id: 'pond_station_01',
      type: 'pond_buoy',
      name: '生态灌溉蓄水河塘水质监测站',
    };

    // Buoy Hull (Yellow marine cylinder)
    const hullMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      metalness: 0.3,
      roughness: 0.4,
    });
    const hull = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.0, 0.8, 16), hullMat);
    hull.position.y = 0.2;
    buoyGroup.add(hull);

    // Lower white collar
    const collarMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(1.22, 1.22, 0.2, 16), collarMat);
    collar.position.y = 0.35;
    buoyGroup.add(collar);

    // Mast tower
    const mastMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8 });
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.8, 8), mastMat);
    mast.position.y = 1.3;
    buoyGroup.add(mast);

    // Solar PV panel on buoy
    const solarBuoy = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 0.04, 0.8),
      new THREE.MeshStandardMaterial({ color: 0x1e3a8a, metalness: 0.8, roughness: 0.2 })
    );
    solarBuoy.rotation.x = 0.4;
    solarBuoy.position.set(0, 1.6, 0);
    buoyGroup.add(solarBuoy);

    // 5G Wireless Whip Antenna
    const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.2, 6), mastMat);
    ant.position.set(0.3, 2.2, 0);
    buoyGroup.add(ant);

    // Blinking signal beacon light
    const beaconGeo = new THREE.SphereGeometry(0.14, 8, 8);
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.set(0, 2.25, 0);
    buoyGroup.add(beacon);

    const beaconLight = new THREE.PointLight(0x22d3ee, 1.5, 12);
    beaconLight.position.set(0, 2.3, 0);
    buoyGroup.add(beaconLight);

    // Submerged Multi-parameter Sensor Probe Cage (DO, pH, Level, Temp, EC, Turbidity)
    const probeCage = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.3, 1.4, 8),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.9, roughness: 0.2 })
    );
    probeCage.position.y = -0.7;
    buoyGroup.add(probeCage);

    parkGroup.add(buoyGroup);
    interactiveObjects.push(buoyGroup);

    // 5. Pond Water Intake Pumping Station (河塘生态提水灌溉泵站)
    const pumpStationGroup = new THREE.Group();
    pumpStationGroup.position.set(pondCenter.x - 17, 0, pondCenter.z - 4);
    pumpStationGroup.userData = {
      id: 'pump_station_pond',
      type: 'water_pump_station',
      name: '河塘生态取水提水泵站',
    };

    // Concrete pumping base pad
    const pumpPad = new THREE.Mesh(
      new THREE.BoxGeometry(4.5, 0.4, 5.0),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 })
    );
    pumpPad.position.y = 0.2;
    pumpStationGroup.add(pumpPad);

    // Shelter canopy
    const canopyMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.5, roughness: 0.3 });
    const canopy = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.15, 5.4), canopyMat);
    canopy.position.y = 3.2;
    pumpStationGroup.add(canopy);

    // 4 posts
    [[-2, -2.2], [-2, 2.2], [2, -2.2], [2, 2.2]].forEach(([px, pz]) => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.8, 8), mastMat);
      post.position.set(px, 1.6, pz);
      pumpStationGroup.add(post);
    });

    // Dual blue centrifugal irrigation lift pumps
    const pumpMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.8, roughness: 0.25 });
    [-0.9, 0.9].forEach((px) => {
      const pumpBody = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.7, 12), pumpMat);
      pumpBody.rotation.x = Math.PI / 2;
      pumpBody.position.set(px, 0.75, 0);
      pumpStationGroup.add(pumpBody);

      // Electric motor casing
      const motor = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.35, 0.8, 12),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 })
      );
      motor.rotation.x = Math.PI / 2;
      motor.position.set(px, 0.75, -0.75);
      pumpStationGroup.add(motor);
    });

    // Intake pipe dipping into the pond water
    const pipeMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.7, roughness: 0.3 });
    const suctionPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 5.5, 12), pipeMat);
    suctionPipe.rotation.z = Math.PI / 4;
    suctionPipe.position.set(2.4, 0.2, 0);
    pumpStationGroup.add(suctionPipe);

    parkGroup.add(pumpStationGroup);
    interactiveObjects.push(pumpStationGroup);

    return {
      waterMesh,
      buoy: buoyGroup,
      beaconLight,
    };
  }

  // =============================================================
  // ADVANCED PARK FACILITIES (无人机智能机巢、冷链物流、水肥储罐群、智慧大田试验区、生态通量塔)
  // =============================================================
  public static buildAdvancedFacilities(
    scene: THREE.Scene,
    parkGroup: THREE.Group,
    interactiveObjects: THREE.Object3D[]
  ) {
    const galvanizedMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.25 });
    const techWhiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.3, roughness: 0.2 });
    const darkSlateMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 });
    const cyanTechMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.7, roughness: 0.3 });
    const hazardStripeMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4 });

    // -------------------------------------------------------------
    // 1. AUTONOMOUS DRONE DOCKING STATION & HELIPAD (无人机智能机巢与停机坪)
    // Position: X = 20, Z = 34 (Near main road intersection & pond)
    // -------------------------------------------------------------
    const droneDockGroup = new THREE.Group();
    droneDockGroup.position.set(20, 0, 34);
    droneDockGroup.userData = {
      id: 'facility_drone_dock',
      type: 'drone_dock',
      name: '无人机智能机巢 (全天候自主巡检与植保起降站)',
      description: '工业级全天候自动化智能无人机舱。支持自主快速换电与接触式充电、RTK厘米级差分定位基站、气象自感知与超视距全自主巡航。',
    };

    // Helipad concrete slab (7m x 7m x 0.2m)
    const helipadSlab = new THREE.Mesh(
      new THREE.BoxGeometry(7.2, 0.2, 7.2),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 })
    );
    helipadSlab.position.y = 0.1;
    droneDockGroup.add(helipadSlab);

    // Yellow safety border
    const yellowBorder = new THREE.Mesh(
      new THREE.BoxGeometry(7.4, 0.05, 0.2),
      hazardStripeMat
    );
    yellowBorder.position.set(0, 0.21, 3.6);
    const yellowBorderNorth = yellowBorder.clone();
    yellowBorderNorth.position.set(0, 0.21, -3.6);
    const yellowBorderWest = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.05, 7.4), hazardStripeMat);
    yellowBorderWest.position.set(-3.6, 0.21, 0);
    const yellowBorderEast = yellowBorderWest.clone();
    yellowBorderEast.position.set(3.6, 0.21, 0);
    droneDockGroup.add(yellowBorder, yellowBorderNorth, yellowBorderWest, yellowBorderEast);

    // White Landing Circle
    const circleMark = new THREE.Mesh(
      new THREE.RingGeometry(2.4, 2.6, 32),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.4 })
    );
    circleMark.rotation.x = -Math.PI / 2;
    circleMark.position.y = 0.215;
    droneDockGroup.add(circleMark);

    // "H" Letter Landing Mark
    const hLeft = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 2.2), new THREE.MeshStandardMaterial({ color: 0xe2e8f0 }));
    hLeft.rotation.x = -Math.PI / 2;
    hLeft.position.set(-0.8, 0.22, 0);
    const hRight = hLeft.clone();
    hRight.position.set(0.8, 0.22, 0);
    const hBar = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.35), new THREE.MeshStandardMaterial({ color: 0xe2e8f0 }));
    hBar.rotation.x = -Math.PI / 2;
    hBar.position.set(0, 0.22, 0);
    droneDockGroup.add(hLeft, hRight, hBar);

    // Smart Drone Dock Hangar Cabinet (机巢箱体: 1.8m x 1.8m x 1.2m)
    const dockBase = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 0.8, 1.8),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.2 })
    );
    dockBase.position.set(0, 0.6, 0);
    droneDockGroup.add(dockBase);

    // Split Sliding Open Hatch Roofs
    const hatchL = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.12, 1.85), techWhiteMat);
    hatchL.position.set(-1.1, 1.05, 0);
    const hatchR = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.12, 1.85), techWhiteMat);
    hatchR.position.set(1.1, 1.05, 0);
    droneDockGroup.add(hatchL, hatchR);

    // High-Precision RTK Differential Base Station Mast
    const rtkPole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.8, 8), galvanizedMat);
    rtkPole.position.set(-2.8, 1.5, -2.8);
    const rtkAntenna = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.22, 0.25, 16),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 })
    );
    rtkAntenna.position.set(-2.8, 2.9, -2.8);
    droneDockGroup.add(rtkPole, rtkAntenna);

    // Ultrasonic anemometer on opposite corner
    const weatherPole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.2, 8), galvanizedMat);
    weatherPole.position.set(2.8, 1.2, -2.8);
    const anemometerHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8 })
    );
    anemometerHead.position.set(2.8, 2.3, -2.8);
    droneDockGroup.add(weatherPole, anemometerHead);

    // Modern Agricultural Quadcopter Drone (多旋翼农用无人机停泊在机巢中央)
    const droneBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.18, 0.6),
      new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.9, roughness: 0.2 })
    );
    droneBody.position.set(0, 1.15, 0);
    droneDockGroup.add(droneBody);

    // 4 Rotor Arms & Propeller Rotors
    const armAngle = [Math.PI / 4, (3 * Math.PI) / 4, (-3 * Math.PI) / 4, -Math.PI / 4];
    armAngle.forEach((ang, aidx) => {
      const armLen = 0.75;
      const ax = Math.cos(ang) * armLen;
      const az = Math.sin(ang) * armLen;
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, armLen, 8), darkSlateMat);
      arm.rotation.z = Math.PI / 2;
      arm.rotation.y = -ang;
      arm.position.set(ax / 2, 1.15, az / 2);

      // Motor pod
      const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.14, 12), cyanTechMat);
      motor.position.set(ax, 1.2, az);

      // Dual propeller blade
      const prop = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.015, 0.06),
        new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.8, roughness: 0.2 })
      );
      prop.position.set(ax, 1.28, az);
      prop.rotation.y = aidx * 0.7;

      droneDockGroup.add(arm, motor, prop);
    });

    // 4K Multispectral Gimbal Camera on front of drone
    const gimbal = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.9, roughness: 0.1 })
    );
    gimbal.position.set(0, 1.05, 0.35);
    droneDockGroup.add(gimbal);

    parkGroup.add(droneDockGroup);
    interactiveObjects.push(droneDockGroup);

    // -------------------------------------------------------------
    // 2. COLD CHAIN LOGISTICS CENTER & POST-HARVEST SORTING HUB (农产品冷链物流中心与分选车间)
    // Position: X = -36, Z = -52 | Dimensions: 26m wide, 16m deep, 6.8m high
    // -------------------------------------------------------------
    const coldChainGroup = new THREE.Group();
    coldChainGroup.position.set(-36, 0, -52);
    coldChainGroup.userData = {
      id: 'facility_coldchain',
      type: 'coldchain',
      name: '农产品冷链物流中心与采后智能分选车间',
      description: '现代农产品采后加工与冷链集散枢纽。包含500吨多温区保鲜冷库、高通量果蔬AI光电分选线、液压升降装卸月台及新能源冷藏车编队。',
    };

    // Main cold warehouse building
    const warehouseMat = new THREE.MeshStandardMaterial({
      color: 0x334155, // Cleanroom slate insulated sandwich panels
      roughness: 0.4,
      metalness: 0.2,
    });
    const warehouseBody = new THREE.Mesh(new THREE.BoxGeometry(26, 6.8, 16), warehouseMat);
    warehouseBody.position.set(0, 3.4, 0);
    coldChainGroup.add(warehouseBody);

    // Deep blue fascia trim
    const fascia = new THREE.Mesh(new THREE.BoxGeometry(26.4, 0.8, 16.4), cyanTechMat);
    fascia.position.set(0, 6.6, 0);
    coldChainGroup.add(fascia);

    // Signboard
    this.createGreenhouseSign(coldChainGroup, 0, 5.8, 8.25, '农产品冷链物流与采后智能分选中心');

    // Elevated Loading Dock Platform (0.9m high, along south facade: Z = 8 to 11.5)
    const dockApron = new THREE.Mesh(
      new THREE.BoxGeometry(26, 0.9, 3.5),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 })
    );
    dockApron.position.set(0, 0.45, 9.75);
    coldChainGroup.add(dockApron);

    // Safety hazard striping along dock apron front
    const hazardEdge = new THREE.Mesh(
      new THREE.BoxGeometry(26.1, 0.25, 0.15),
      hazardStripeMat
    );
    hazardEdge.position.set(0, 0.8, 11.55);
    coldChainGroup.add(hazardEdge);

    // 2 Loading Bay Roll-up Shutter Doors & Rubber Dock Seals
    [-6, 6].forEach((bx) => {
      const door = new THREE.Mesh(
        new THREE.BoxGeometry(4.2, 4.0, 0.15),
        new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.6, metalness: 0.4 })
      );
      door.position.set(bx, 2.9, 8.05);

      // Black rubber bumper pads
      const bumperL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.4, 0.35), darkSlateMat);
      bumperL.position.set(bx - 2.4, 0.8, 11.6);
      const bumperR = bumperL.clone();
      bumperR.position.set(bx + 2.4, 0.8, 11.6);

      coldChainGroup.add(door, bumperL, bumperR);
    });

    // Refrigerated Delivery Truck (冷藏厢式货车停靠在1号月台)
    const truckGroup = new THREE.Group();
    truckGroup.position.set(-6, 0, 16.5);

    // Tractor Cab (农业祖母绿涂装)
    const truckCabMat = new THREE.MeshStandardMaterial({ color: 0x059669, roughness: 0.3, metalness: 0.6 });
    const cab = new THREE.Mesh(new THREE.BoxGeometry(2.8, 2.6, 2.4), truckCabMat);
    cab.position.set(0, 1.7, 3.2);

    // Cab Windshield
    const windshield = new THREE.Mesh(
      new THREE.BoxGeometry(2.6, 1.1, 0.1),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.9 })
    );
    windshield.position.set(0, 2.1, 4.42);
    truckGroup.add(cab, windshield);

    // Truck Insulated Box Body (白色冷藏货厢: 2.8m x 2.8m x 6.4m)
    const truckBox = new THREE.Mesh(
      new THREE.BoxGeometry(2.8, 2.8, 6.4),
      techWhiteMat
    );
    truckBox.position.set(0, 2.2, -1.2);

    // Front refrigeration unit (Thermo King 冷机)
    const reeferUnit = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.8, 0.6),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.6, roughness: 0.3 })
    );
    reeferUnit.position.set(0, 3.2, 1.9);

    // Truck Wheels (6 wheels)
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });
    const wheelGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.35, 16);
    [
      [-1.4, 3.2], [1.4, 3.2],
      [-1.4, -2.2], [1.4, -2.2],
      [-1.4, -3.4], [1.4, -3.4],
    ].forEach(([wx, wz]) => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wx, 0.48, wz);
      truckGroup.add(wheel);
    });

    truckGroup.add(truckBox, reeferUnit);
    coldChainGroup.add(truckGroup);

    // Electric Forklift on the loading apron (电动平衡重叉车)
    const forkliftGroup = new THREE.Group();
    forkliftGroup.position.set(6, 0.9, 9.8);
    const flBody = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.8, 1.6),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4, metalness: 0.5 })
    );
    flBody.position.y = 0.45;
    const flRollCage = new THREE.Mesh(
      new THREE.BoxGeometry(1.0, 1.2, 1.0),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 })
    );
    flRollCage.position.set(0, 1.25, -0.2);
    // Mast & Forks
    const flMast = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.8, 0.1), galvanizedMat);
    flMast.position.set(0, 1.0, 0.85);
    const flForkL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.9), galvanizedMat);
    flForkL.position.set(-0.25, 0.15, 1.3);
    const flForkR = flForkL.clone();
    flForkR.position.set(0.25, 0.15, 1.3);
    forkliftGroup.add(flBody, flRollCage, flMast, flForkL, flForkR);

    // Wooden pallet on forklift with green harvest crates
    const pallet = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 0.12, 1.0),
      new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.8 })
    );
    pallet.position.set(0, 0.22, 1.3);
    const crates = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.4, 0.8),
      new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.5 })
    );
    crates.position.set(0, 0.48, 1.3);
    forkliftGroup.add(pallet, crates);

    coldChainGroup.add(forkliftGroup);

    parkGroup.add(coldChainGroup);
    interactiveObjects.push(coldChainGroup);

    // -------------------------------------------------------------
    // 3. CENTRAL FERTIGATION STORAGE TANKS & SILO SKID (水肥一体化中央母液储罐群与配肥站)
    // Position: X = 42, Z = -48 | Northeast sector
    // -------------------------------------------------------------
    const fertGroup = new THREE.Group();
    fertGroup.position.set(42, 0, -48);
    fertGroup.userData = {
      id: 'facility_fertigation_tanks',
      type: 'fertigation_tanks',
      name: '水肥一体化中央母液储罐群与原液配肥站',
      description: '全园区智慧精准水肥中枢。配置大量元素母液罐(A/B)、微量元素储罐与酸液平衡罐，采用多通道文丘里高频注入，全自动EC/pH闭环调控。',
    };

    // Environmental containment bund (防渗围堰: 18m x 14m x 0.5m)
    const bundFloor = new THREE.Mesh(
      new THREE.BoxGeometry(18, 0.25, 14),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 })
    );
    bundFloor.position.y = 0.12;
    fertGroup.add(bundFloor);

    // Bund perimeter containment wall
    const wallGeoX = new THREE.BoxGeometry(18.4, 0.6, 0.35);
    const wallNorth = new THREE.Mesh(wallGeoX, galvanizedMat);
    wallNorth.position.set(0, 0.35, -7.1);
    const wallSouth = new THREE.Mesh(wallGeoX, galvanizedMat);
    wallSouth.position.set(0, 0.35, 7.1);
    const wallGeoZ = new THREE.BoxGeometry(0.35, 0.6, 14.2);
    const wallWest = new THREE.Mesh(wallGeoZ, galvanizedMat);
    wallWest.position.set(-9.1, 0.35, 0);
    const wallEast = new THREE.Mesh(wallGeoZ, galvanizedMat);
    wallEast.position.set(9.1, 0.35, 0);
    fertGroup.add(wallNorth, wallSouth, wallWest, wallEast);

    // 4 Giant Cylindrical Storage Tanks
    const ssMat = new THREE.MeshStandardMaterial({
      color: 0xcfd8dc,
      metalness: 0.94,
      roughness: 0.18,
    });
    const acidMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      metalness: 0.7,
      roughness: 0.3,
    });

    const tanksInfo = [
      { x: -5.5, z: -2.5, r: 1.4, h: 5.6, mat: ssMat, name: 'A母液罐' },
      { x: -1.8, z: -2.5, r: 1.4, h: 5.6, mat: ssMat, name: 'B母液罐' },
      { x: 1.8, z: -2.5, r: 1.0, h: 4.6, mat: acidMat, name: '酸平衡罐' },
      { x: 5.5, z: -2.5, r: 1.6, h: 5.8, mat: ssMat, name: '微量元素罐' },
    ];

    tanksInfo.forEach((t) => {
      // Cylinder tank body
      const tank = new THREE.Mesh(new THREE.CylinderGeometry(t.r, t.r, t.h, 24), t.mat);
      tank.position.set(t.x, t.h / 2 + 0.25, t.z);

      // Domed top cap
      const dome = new THREE.Mesh(new THREE.SphereGeometry(t.r, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), t.mat);
      dome.position.set(t.x, t.h + 0.25, t.z);

      // Liquid level sight tube gauge on front
      const gauge = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, t.h * 0.8, 8),
        new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.2 })
      );
      gauge.position.set(t.x, t.h * 0.5 + 0.25, t.z + t.r + 0.08);

      fertGroup.add(tank, dome, gauge);
    });

    // Elevated Catwalk connecting the tank tops (y = 5.6)
    const catwalkMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.85, roughness: 0.3 });
    const highCatwalk = new THREE.Mesh(new THREE.BoxGeometry(14, 0.15, 1.2), catwalkMat);
    highCatwalk.position.set(0, 5.6, -2.5);
    fertGroup.add(highCatwalk);

    // Catwalk handrails
    const railGeo = new THREE.BoxGeometry(14, 0.05, 0.05);
    const railFront = new THREE.Mesh(railGeo, galvanizedMat);
    railFront.position.set(0, 6.6, -1.9);
    const railBack = new THREE.Mesh(railGeo, galvanizedMat);
    railBack.position.set(0, 6.6, -3.1);
    fertGroup.add(railFront, railBack);

    // Caged Access Ladder from ground
    const ladderMast = new THREE.Mesh(new THREE.BoxGeometry(0.6, 5.6, 0.1), galvanizedMat);
    ladderMast.position.set(-7.5, 2.8, -2.5);
    fertGroup.add(ladderMast);

    // Skid-Mounted Dosing Machine & Booster Pumps in front (z = 3.5)
    const skidFrame = new THREE.Mesh(
      new THREE.BoxGeometry(7.2, 0.3, 2.8),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.7, roughness: 0.3 })
    );
    skidFrame.position.set(0, 0.35, 3.5);
    fertGroup.add(skidFrame);

    // 4 Precision Injection Dosing Pump Blocks
    [-2.2, -0.7, 0.7, 2.2].forEach((px) => {
      const pump = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.35, 0.8, 12),
        new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.8, roughness: 0.2 })
      );
      pump.rotation.x = Math.PI / 2;
      pump.position.set(px, 0.85, 3.5);

      const motor = new THREE.Mesh(
        new THREE.CylinderGeometry(0.28, 0.28, 0.7, 12),
        darkSlateMat
      );
      motor.rotation.x = Math.PI / 2;
      motor.position.set(px, 0.85, 2.85);

      fertGroup.add(pump, motor);
    });

    // Interconnecting pipe lines
    const mainPipe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 14, 12),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.8, roughness: 0.2 })
    );
    mainPipe.rotation.z = Math.PI / 2;
    mainPipe.position.set(0, 1.2, 1.0);
    fertGroup.add(mainPipe);

    this.createGreenhouseSign(fertGroup, 0, 4.2, 7.3, '水肥一体化中央母液储罐群与原液配肥站');

    parkGroup.add(fertGroup);
    interactiveObjects.push(fertGroup);

    // -------------------------------------------------------------
    // 4. HIGH-STANDARD SMART FIELD TRIAL ZONE (高标准智慧大田物联网对比试验区)
    // Position: X = -36, Z = 74 | South parcel
    // -------------------------------------------------------------
    const smartFieldGroup = new THREE.Group();
    smartFieldGroup.position.set(-36, 0, 74);
    smartFieldGroup.userData = {
      id: 'facility_smart_field',
      type: 'smart_field',
      name: '高标准智慧大田物联网对比试验区',
      description: '大田露天种植与设施温室对比科研示范区。配备太阳能频振式智能杀虫灯、土壤多参数分层墒情监测哨、水肥微喷滴灌管网及气象遥测站。',
    };

    // Cultivated organic dark soil ground (32m x 20m x 0.15m)
    const soilPlot = new THREE.Mesh(
      new THREE.BoxGeometry(32, 0.15, 20),
      new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.95 })
    );
    soilPlot.position.y = 0.08;
    smartFieldGroup.add(soilPlot);

    // Raised bedding crop rows (8 rows)
    const outdoorCropMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.7 });
    for (let rz = -7.5; rz <= 7.5; rz += 2.2) {
      const ridge = new THREE.Mesh(
        new THREE.BoxGeometry(29, 0.2, 0.9),
        new THREE.MeshStandardMaterial({ color: 0x3f3f46, roughness: 0.9 })
      );
      ridge.position.set(0, 0.18, rz);

      const outdoorPlants = new THREE.Mesh(
        new THREE.BoxGeometry(28.6, 0.45, 0.6),
        outdoorCropMat
      );
      outdoorPlants.position.set(0, 0.45, rz);

      smartFieldGroup.add(ridge, outdoorPlants);
    }

    // 2 Solar-Powered Vibration Insecticidal Pest Killing Lamps (太阳能频振式智能杀虫灯)
    [-9, 9].forEach((lx) => {
      const lampGroup = new THREE.Group();
      lampGroup.position.set(lx, 0, 0);

      // Steel pole (height 3.2m)
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3.2, 8), galvanizedMat);
      pole.position.y = 1.6;

      // Top Angled Solar PV Panel (40W)
      const panel = new THREE.Mesh(
        new THREE.BoxGeometry(0.85, 0.05, 0.6),
        new THREE.MeshStandardMaterial({ color: 0x1e3a8a, metalness: 0.85, roughness: 0.2 })
      );
      panel.position.set(0, 3.3, 0);
      panel.rotation.x = 0.45;

      // Rainproof White Canopy
      const canopy = new THREE.Mesh(
        new THREE.ConeGeometry(0.5, 0.25, 16),
        techWhiteMat
      );
      canopy.position.set(0, 3.0, 0);

      // Pest Attraction Purple/UV Glowing Light Tube
      const uvLight = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 0.6, 12),
        new THREE.MeshStandardMaterial({
          color: 0xa855f7,
          emissive: 0xa855f7,
          emissiveIntensity: 2.2,
        })
      );
      uvLight.position.set(0, 2.5, 0);

      // High-voltage wire grid cage around UV light
      const grid = new THREE.Mesh(
        new THREE.CylinderGeometry(0.24, 0.24, 0.7, 12, 1, true),
        new THREE.MeshStandardMaterial({ color: 0x94a3b8, wireframe: true })
      );
      grid.position.set(0, 2.5, 0);

      // Yellow pest collection funnel
      const funnel = new THREE.Mesh(
        new THREE.ConeGeometry(0.35, 0.35, 16),
        new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.5 })
      );
      funnel.rotation.x = Math.PI;
      funnel.position.set(0, 2.0, 0);

      lampGroup.add(pole, panel, canopy, uvLight, grid, funnel);
      smartFieldGroup.add(lampGroup);
    });

    // 3 Soil Multi-Depth Telemetry Probes (土壤多参数监测哨)
    [-12, 0, 12].forEach((sx) => {
      const probePole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.8, 8), galvanizedMat);
      probePole.position.set(sx, 0.9, 6.5);
      const miniPanel = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.03, 0.25), new THREE.MeshStandardMaterial({ color: 0x1e3a8a }));
      miniPanel.position.set(sx, 1.8, 6.5);
      miniPanel.rotation.x = 0.5;
      const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.35, 6), darkSlateMat);
      ant.position.set(sx, 2.0, 6.5);
      smartFieldGroup.add(probePole, miniPanel, ant);
    });

    this.createGreenhouseSign(smartFieldGroup, 0, 2.4, 10.3, '高标准智慧大田物联网对比试验区');

    parkGroup.add(smartFieldGroup);
    interactiveObjects.push(smartFieldGroup);

    // -------------------------------------------------------------
    // 5. AGRO-ECOLOGICAL FLUX & MICROMETEOROLOGICAL TOWER (生态微气象与碳通量观测铁塔)
    // Position: X = 72, Z = 34 | Eastern perimeter
    // -------------------------------------------------------------
    const towerGroup = new THREE.Group();
    towerGroup.position.set(72, 0, 34);
    towerGroup.userData = {
      id: 'facility_flux_tower',
      type: 'flux_tower',
      name: '生态微气象与碳通量综合观测铁塔',
      description: '18米高规格农业生态微气象梯度观测塔。搭载超声波三维风速风向仪、涡度相关开路CO₂/H₂O气体分析仪及四分量净辐射计，高精研判碳汇与水分蒸散。',
    };

    // Concrete foundation base
    const towerBase = new THREE.Mesh(
      new THREE.BoxGeometry(4.8, 0.4, 4.8),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 })
    );
    towerBase.position.y = 0.2;
    towerGroup.add(towerBase);

    // 18m Tall 4-Legged Lattice Tower (Tapering from 3.6m to 1.2m)
    const towerH = 18.0;
    const baseW = 3.6;
    const topW = 1.0;

    // 4 Corner Main Leg Columns
    const legCoords = [
      [-1, -1], [1, -1], [1, 1], [-1, 1],
    ];
    legCoords.forEach(([lx, lz]) => {
      const p1 = new THREE.Vector3((lx * baseW) / 2, 0.4, (lz * baseW) / 2);
      const p2 = new THREE.Vector3((lx * topW) / 2, towerH, (lz * topW) / 2);
      const len = p1.distanceTo(p2);
      const legMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, len, 8), galvanizedMat);
      const mid = p1.clone().add(p2).multiplyScalar(0.5);
      legMesh.position.copy(mid);
      legMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), p2.clone().sub(p1).normalize());
      towerGroup.add(legMesh);
    });

    // Cross Bracing Horizontals & Diagonals
    for (let yh = 3.0; yh < towerH; yh += 2.8) {
      const frac = yh / towerH;
      const curW = baseW + (topW - baseW) * frac;
      const ringMesh = new THREE.Mesh(new THREE.BoxGeometry(curW, 0.05, 0.05), galvanizedMat);
      ringMesh.position.set(0, yh, curW / 2);
      const ringMesh2 = ringMesh.clone();
      ringMesh2.position.set(0, yh, -curW / 2);
      const ringMesh3 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, curW), galvanizedMat);
      ringMesh3.position.set(curW / 2, yh, 0);
      const ringMesh4 = ringMesh3.clone();
      ringMesh4.position.set(-curW / 2, yh, 0);

      towerGroup.add(ringMesh, ringMesh2, ringMesh3, ringMesh4);
    }

    // 3 Maintenance Platforms with Handrails (at 6m, 12m, 17.5m)
    [6.0, 12.0, 17.5].forEach((py) => {
      const frac = py / towerH;
      const pSize = baseW + (topW - baseW) * frac + 0.6;
      const plat = new THREE.Mesh(new THREE.BoxGeometry(pSize, 0.08, pSize), catwalkMat);
      plat.position.set(0, py, 0);

      const railH = new THREE.BoxGeometry(pSize, 0.04, pSize);
      const railMesh = new THREE.Mesh(railH, new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 })); // Safety red rail
      railMesh.position.set(0, py + 0.9, 0);

      towerGroup.add(plat, railMesh);
    });

    // Flux Instruments: 3D Ultrasonic Anemometer & Gas Analyzer Arm at 12m
    const boomArm = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.6, 8), galvanizedMat);
    boomArm.rotation.z = Math.PI / 2;
    boomArm.position.set(1.8, 12.5, 0);
    const ultrasonicHead = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.15, 0.4, 8),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.8, roughness: 0.2 })
    );
    ultrasonicHead.position.set(3.0, 12.5, 0);

    // Open-path CO2/H2O Infrared Gas Analyzer
    const gasAnalyzer = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 0.5, 12),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.8, roughness: 0.2 })
    );
    gasAnalyzer.rotation.x = Math.PI / 2;
    gasAnalyzer.position.set(2.6, 12.3, 0);

    towerGroup.add(boomArm, ultrasonicHead, gasAnalyzer);

    // Top Lightning Rod (避雷针)
    const lightningRod = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.04, 2.2, 8), galvanizedMat);
    lightningRod.position.set(0, towerH + 1.1, 0);
    towerGroup.add(lightningRod);

    // Red Aviation Obstruction Warning Light on Top
    const beaconLight = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 16, 16),
      new THREE.MeshStandardMaterial({
        color: 0xef4444,
        emissive: 0xef4444,
        emissiveIntensity: 2.8,
      })
    );
    beaconLight.position.set(0, towerH + 0.2, 0);
    towerGroup.add(beaconLight);

    // Telemetry & solar power battery box on ground
    const groundBox = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 1.8, 0.8),
      techWhiteMat
    );
    groundBox.position.set(0, 1.0, 1.8);
    towerGroup.add(groundBox);

    this.createGreenhouseSign(towerGroup, 0, 3.2, 2.6, '生态微气象与碳通量综合观测铁塔');

    parkGroup.add(towerGroup);
    interactiveObjects.push(towerGroup);
  }
}
