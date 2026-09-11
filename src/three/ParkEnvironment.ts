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
      color: 0x0c1524, // Deep cyber agricultural ground surface
      roughness: 0.9,
      metalness: 0.1,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.06;
    ground.receiveShadow = true;
    parkGroup.add(ground);

    // Subtle agricultural open field plots around the perimeter
    const plotMat1 = new THREE.MeshStandardMaterial({ color: 0x0f2a20, roughness: 0.85 });
    const plotMat2 = new THREE.MeshStandardMaterial({ color: 0x132338, roughness: 0.85 });

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

    // Ground Grid with luminous cyan coordinate markers
    const parkGrid = new THREE.GridHelper(240, 48, 0x0284c7, 0x162238);
    parkGrid.position.y = -0.04;
    parkGroup.add(parkGrid);

    // -------------------------------------------------------------
    // ROAD SYSTEM (Asphalt, Markings, Curbs, Crosswalks)
    // -------------------------------------------------------------
    const asphaltMat = new THREE.MeshStandardMaterial({
      color: 0x080e18, // Deep sleek cyber asphalt highway
      roughness: 0.7,
      metalness: 0.2,
    });
    const curbMat = new THREE.MeshStandardMaterial({
      color: 0x334155, // Clean dark slate architectural curb
      roughness: 0.5,
      metalness: 0.2,
    });
    const yellowLineMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
    const whiteLineMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 }); // High-visibility glowing cyan edge line

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

    // 4. Zebra Crossings (斑马线) at key spots
    this.createZebraCrossing(parkGroup, whiteLineMat, 22, 16.5, false);
    this.createZebraCrossing(parkGroup, whiteLineMat, 22, 24.5, false);
    this.createZebraCrossing(parkGroup, whiteLineMat, 0, 20, true);
    this.createZebraCrossing(parkGroup, whiteLineMat, 42, 20, true);
    this.createZebraCrossing(parkGroup, whiteLineMat, -42, 20, true);

    // 5. Modern Solar LED Street Lights (16 poles along the roads)
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
      // Along East-West Avenue
      [-58, 20 + 3.8],
      [-28, 20 + 3.8],
      [-10, 20 + 3.8],
      [8, 20 + 3.8],
      [58, 20 + 3.8],
    ];

    streetLightPositions.forEach(([lx, lz], idx) => {
      this.createStreetLight(parkGroup, lx, lz, idx);
    });

    // 6. Directional Agricultural Park Road Signs
    this.createRoadSign(parkGroup, 24.5, 23.5, '园区核心导览');
    this.createRoadSign(parkGroup, -20, 23.5, '3号圆拱温室 ➔');
    this.createRoadSign(parkGroup, 24.5, -20, '4号育苗中心 ➔');
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
      color: 0x94a3b8, // Crisp silver-steel truss visible against dark background
      metalness: 0.85,
      roughness: 0.25,
    });

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8, // High-tech cyan-tinted architectural glass
      transparent: true,
      opacity: 0.32,
      roughness: 0.08,
      metalness: 0.1,
      transmission: 0.8,
      ior: 1.45,
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

    // Arch film material (Translucent frosted agricultural PO film)
    const filmMat = new THREE.MeshPhysicalMaterial({
      color: 0xdcfce7,
      transparent: true,
      opacity: 0.38,
      roughness: 0.25,
      metalness: 0.05,
      transmission: 0.65,
      side: THREE.DoubleSide,
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

    // 2. Realistic Animated Water Surface (MeshPhysicalMaterial)
    const waterGeo = new THREE.PlaneGeometry(pondWidth - 1.2, pondLength - 1.2, 40, 32);
    const waterMat = new THREE.MeshPhysicalMaterial({
      color: 0x0284c7, // Vibrant clean cyan-blue
      emissive: 0x0369a1,
      emissiveIntensity: 0.15,
      roughness: 0.06,
      metalness: 0.1,
      transmission: 0.75,
      transparent: true,
      opacity: 0.88,
      ior: 1.333,
      reflectivity: 0.9,
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
}
