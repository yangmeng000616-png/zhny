import * as THREE from 'three';

export interface KoiFishActor {
  mesh: THREE.Group;
  orbitCenter: THREE.Vector3;
  radiusX: number;
  radiusZ: number;
  speed: number;
  phase: number;
  tail: THREE.Mesh;
}

export interface ParkSubsystems {
  waterMesh: THREE.Mesh;
  buoy: THREE.Group;
  beaconLight: THREE.PointLight;
  fountainParticles?: THREE.Points;
  fountainMeshList?: THREE.Group[];
  fishList?: KoiFishActor[];
}

export interface PerimeterGateSubsystems {
  barrierPivot: THREE.Group;
  signalLight: THREE.Mesh;
}

export class ParkEnvironment {
  // -------------------------------------------------------------
  // PROCEDURAL TEXTURE GENERATORS (Lawn Grass & Water Caustics)
  // -------------------------------------------------------------
  public static createGrassTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Rich agricultural springtime grass green base
    ctx.fillStyle = '#3a7d32';
    ctx.fillRect(0, 0, 512, 512);

    // Subtle manicured lawn mowing stripes
    for (let y = 0; y < 512; y += 64) {
      ctx.fillStyle = y % 128 === 0 ? 'rgba(76, 154, 66, 0.24)' : 'rgba(44, 98, 38, 0.22)';
      ctx.fillRect(0, y, 512, 64);
    }

    // Dense organic grass blade grain and fibrous texture
    for (let i = 0; i < 26000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const length = 2.5 + Math.random() * 4;
      const angle = (Math.random() - 0.5) * 0.7;
      const r = Math.floor(45 + Math.random() * 45);
      const g = Math.floor(115 + Math.random() * 65);
      const b = Math.floor(35 + Math.random() * 40);
      const alpha = 0.35 + Math.random() * 0.45;
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.sin(angle) * length, y - Math.cos(angle) * length);
      ctx.stroke();
    }

    // Subtle earthy clover and turf highlights
    for (let i = 0; i < 50; i++) {
      const cx = Math.random() * 512;
      const cy = Math.random() * 512;
      const rad = 6 + Math.random() * 20;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
      grad.addColorStop(0, 'rgba(88, 172, 70, 0.3)');
      grad.addColorStop(1, 'rgba(50, 110, 42, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, rad, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(38, 38);
    return texture;
  }

  public static createWaterTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Aquatic gradient: sky-lit turquoise to deep reservoir blue
    const grad = ctx.createLinearGradient(0, 0, 512, 512);
    grad.addColorStop(0, '#0284c7');
    grad.addColorStop(0.45, '#0891b2');
    grad.addColorStop(1, '#0e7490');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // Refracted caustic light web
    ctx.strokeStyle = 'rgba(224, 242, 254, 0.42)';
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    for (let i = 0; i < 160; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const r = 10 + Math.random() * 26;
      ctx.beginPath();
      for (let a = 0; a < Math.PI * 2; a += 0.95) {
        const px = x + Math.cos(a) * r + (Math.random() - 0.5) * 5;
        const py = y + Math.sin(a) * r + (Math.random() - 0.5) * 5;
        if (a === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
    }

    // Specular sunlight sparkles
    for (let i = 0; i < 350; i++) {
      const sx = Math.random() * 512;
      const sy = Math.random() * 512;
      const sr = 1 + Math.random() * 2.2;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(6, 6);
    return texture;
  }

  public static buildRoadNetwork(
    scene: THREE.Scene,
    parkGroup: THREE.Group,
    interactiveObjects: THREE.Object3D[]
  ) {
    // -------------------------------------------------------------
    // 1. CAMPUS LUSH GRASSLAND TERRAIN SYSTEM (280m x 280m)
    // Seamlessly covers all blank spaces with high-quality green lawn,
    // with an exact excavation opening cutout for the ecological pond!
    // Pond Cutout Box: X from 23 to 61 (width 38), Z from 29 to 59 (length 30)
    // -------------------------------------------------------------
    const grassTex = this.createGrassTexture();
    const grassMat = new THREE.MeshStandardMaterial({
      map: grassTex,
      color: 0x48963f, // Vibrant fresh agricultural lawn green
      roughness: 0.82,
      metalness: 0.02,
    });

    // 4 Seamless Grassland Plates surrounding the Pond Cutout
    // A. West Plate: X: -140 to 23 (width 163, length 280)
    const plateWestGeo = new THREE.PlaneGeometry(163, 280);
    const plateWest = new THREE.Mesh(plateWestGeo, grassMat);
    plateWest.rotation.x = -Math.PI / 2;
    plateWest.position.set(-58.5, -0.04, 0);
    plateWest.receiveShadow = true;
    parkGroup.add(plateWest);

    // B. East Plate: X: 61 to 140 (width 79, length 280)
    const plateEastGeo = new THREE.PlaneGeometry(79, 280);
    const plateEast = new THREE.Mesh(plateEastGeo, grassMat);
    plateEast.rotation.x = -Math.PI / 2;
    plateEast.position.set(100.5, -0.04, 0);
    plateEast.receiveShadow = true;
    parkGroup.add(plateEast);

    // C. North Plate: X: 23 to 61 (width 38, length 169, Z: -140 to 29)
    const plateNorthGeo = new THREE.PlaneGeometry(38, 169);
    const plateNorth = new THREE.Mesh(plateNorthGeo, grassMat);
    plateNorth.rotation.x = -Math.PI / 2;
    plateNorth.position.set(42, -0.04, -55.5);
    plateNorth.receiveShadow = true;
    parkGroup.add(plateNorth);

    // D. South Plate: X: 23 to 61 (width 38, length 81, Z: 59 to 140)
    const plateSouthGeo = new THREE.PlaneGeometry(38, 81);
    const plateSouth = new THREE.Mesh(plateSouthGeo, grassMat);
    plateSouth.rotation.x = -Math.PI / 2;
    plateSouth.position.set(42, -0.04, 99.5);
    plateSouth.receiveShadow = true;
    parkGroup.add(plateSouth);

    // -------------------------------------------------------------
    // 2. AGRICULTURAL OPEN DEMONSTRATION FIELDS & ORCHARD
    // -------------------------------------------------------------
    // East Field: High-Standard Organic Vegetable Furrow Ridges (露天起垄蔬菜示范区)
    this.createVegetableDemoField(parkGroup, 78, -5, 34, 72);

    // West Field: Ecological High-Density Dwarf Fruit Tree Orchard (生态矮化密植果林)
    this.createFruitTreeOrchard(parkGroup, -78, -5, 34, 72);

    // Central Scenic Lawn & Flowerbed Plaza (中央迎宾生态花坛与绿化景观)
    this.createCentralScenicPlaza(parkGroup);

    // Avenue Roadside Trees & Perimeter Windbreak Forest
    this.createCampusForestry(parkGroup);

    // -------------------------------------------------------------
    // ROAD SYSTEM (Asphalt, Markings, Curbs, Crosswalks, Service Spurs)
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
    const whiteLineMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.5 });
    const hazardStripeMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.4 });

    // Helper to create straight road segment
    const addRoad = (
      x: number,
      z: number,
      width: number,
      length: number,
      isEW: boolean,
      hasCurbs: boolean = true
    ) => {
      const geo = isEW
        ? new THREE.BoxGeometry(length, 0.08, width)
        : new THREE.BoxGeometry(width, 0.08, length);
      const mesh = new THREE.Mesh(geo, asphaltMat);
      mesh.position.set(x, 0.02, z);
      mesh.receiveShadow = true;
      parkGroup.add(mesh);

      if (hasCurbs) {
        if (isEW) {
          const curbTop = new THREE.Mesh(new THREE.BoxGeometry(length, 0.15, 0.28), curbMat);
          curbTop.position.set(x, 0.06, z - width / 2 - 0.14);
          const curbBot = new THREE.Mesh(new THREE.BoxGeometry(length, 0.15, 0.28), curbMat);
          curbBot.position.set(x, 0.06, z + width / 2 + 0.14);
          parkGroup.add(curbTop, curbBot);
        } else {
          const curbL = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.15, length), curbMat);
          curbL.position.set(x - width / 2 - 0.14, 0.06, z);
          const curbR = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.15, length), curbMat);
          curbR.position.set(x + width / 2 + 0.14, 0.06, z);
          parkGroup.add(curbL, curbR);
        }
      }
      return mesh;
    };

    // Helper to create dashed center line
    const addDashedLine = (
      xStart: number,
      zStart: number,
      xEnd: number,
      zEnd: number,
      dashLen: number = 2.4,
      gapLen: number = 2.4
    ) => {
      const dx = xEnd - xStart;
      const dz = zEnd - zStart;
      const totalLen = Math.hypot(dx, dz);
      const steps = Math.floor(totalLen / (dashLen + gapLen));
      const ux = dx / totalLen;
      const uz = dz / totalLen;
      const angle = Math.atan2(dx, dz);

      for (let i = 0; i < steps; i++) {
        const dist = (i + 0.5) * (dashLen + gapLen);
        const px = xStart + ux * dist;
        const pz = zStart + uz * dist;
        const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.16, dashLen), yellowLineMat);
        dash.rotation.x = -Math.PI / 2;
        dash.rotation.z = -angle;
        dash.position.set(px, 0.066, pz);
        parkGroup.add(dash);
      }
    };

    // =============================================================
    // 1. NORTH-SOUTH CENTRAL ARTERY (南北中轴主干道: X = 22)
    // =============================================================
    // External Approach Highway (outside south gate: Z = 88 to 125, width 8.6m)
    addRoad(22, 106.5, 8.6, 37, false, true);
    addDashedLine(22, 89.5, 22, 125);

    // Internal Central Highway (inside campus: Z = -78 to 88, length 166m, width 7.8m)
    addRoad(22, 5, 7.8, 166, false, true);
    addDashedLine(22, -76, 22, 87);

    // North Highway Outer Connector (north of north gate: Z = -78 to -115, width 7.8m)
    addRoad(22, -96.5, 7.8, 37, false, true);
    addDashedLine(22, -115, 22, -79.5);

    // White Edge Lines for Main Road
    const whiteEdgeL = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 166), whiteLineMat);
    whiteEdgeL.rotation.x = -Math.PI / 2;
    whiteEdgeL.position.set(22 - 3.55, 0.065, 5);
    const whiteEdgeR = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 166), whiteLineMat);
    whiteEdgeR.rotation.x = -Math.PI / 2;
    whiteEdgeR.position.set(22 + 3.55, 0.065, 5);
    parkGroup.add(whiteEdgeL, whiteEdgeR);

    // =============================================================
    // 2. COMPLETE PERIMETER RING ROAD (完整外环环园巡检安保大道)
    // =============================================================
    // South Outer Ring Road (南部内环道: Z = 80, X from -84 to +86, length 170m, width 5.5m)
    addRoad(1, 80, 5.5, 170, true, true);
    addDashedLine(-84, 80, 86, 80);

    // North Outer Ring Road (北部巡检道: Z = -70, X from -84 to +86, length 170m, width 5.5m)
    addRoad(1, -70, 5.5, 170, true, true);
    addDashedLine(-84, -70, 86, -70);

    // West Outer Ring Road (西部围界外环: X = -84, Z from -70 to +80, length 150m, width 5.2m)
    addRoad(-84, 5, 5.2, 150, false, true);
    addDashedLine(-84, -70, -84, 80);

    // East Outer Ring Road (东部围界外环: X = 86, Z from -70 to +80, length 150m, width 5.2m)
    addRoad(86, 5, 5.2, 150, false, true);
    addDashedLine(86, -70, 86, 80);

    // =============================================================
    // 3. INTERNAL PRIMARY CROSS ARTERIES (园区内部主要横向与纵向干道)
    // =============================================================
    // East-West Central Connecting Avenue (东西向中央大道: Z = 20, X from -84 to +86, length 170m, width 6.6m)
    addRoad(1, 20, 6.6, 170, true, true);
    addDashedLine(-84, 20, 86, 20);

    // Northern Production Service Road (北部温室服务道: Z = -24, X from -84 to +86, length 170m, width 5.8m)
    addRoad(1, -24, 5.8, 170, true, true);
    addDashedLine(-84, -24, 86, -24);

    // Southern Agricultural Loop Road (南部高产示范环线: Z = 55, X from -84 to +86, length 170m, width 5.8m)
    addRoad(1, 55, 5.8, 170, true, true);
    addDashedLine(-84, 55, 86, 55);

    // Western Logistics & Farm Machinery Lane (西部农机与冷链骨干道: X = -58, Z from -70 to +70, length 140m, width 5.2m)
    addRoad(-58, 0, 5.2, 140, false, true);
    addDashedLine(-58, -70, -58, 70);

    // Eastern Utility Lane (东部试验示范支干道: X = 58, Z from -70 to +70, length 140m, width 5.2m)
    addRoad(58, 0, 5.2, 140, false, true);
    addDashedLine(58, -70, 58, 70);

    // =============================================================
    // 4. LOGISTICS YARD & SPECIALIZED SERVICE SPURS (专用物流广场与进出支路)
    // =============================================================
    // A. Cold Chain Logistics Loading Apron & Turning Yard (冷链物流装卸重卡回车广场: X = -36, Z = -38, 34m x 18m)
    const coldChainApronGeo = new THREE.BoxGeometry(34, 0.08, 18);
    const coldChainApron = new THREE.Mesh(coldChainApronGeo, asphaltMat);
    coldChainApron.position.set(-36, 0.02, -38);
    coldChainApron.receiveShadow = true;
    parkGroup.add(coldChainApron);

    // Hazard striping along loading apron perimeter
    const apronHazard = new THREE.Mesh(new THREE.BoxGeometry(34.2, 0.12, 0.3), hazardStripeMat);
    apronHazard.position.set(-36, 0.06, -47.1);
    parkGroup.add(apronHazard);

    // B. Fertigation & Water Hub Dedicated Spur (水肥一体化中心进出通道: X = 42, Z from -48 to -24, width 4.2m)
    addRoad(42, -36, 4.2, 24, false, true);

    // C. Ecological Fish Pond Service Road (生态鱼塘与观景台作业道: X = 42, Z from -24 to -4, width 4.2m)
    addRoad(42, -14, 4.2, 20, false, true);

    // D. Autonomous Drone Dock Service Spur (无人机机巢专用联络道: Z = 34, X from 12 to 22, width 4.0m)
    addRoad(17, 34, 4.0, 10, true, true);

    // E. Inter-Greenhouse Harvest Aisle (1#智能玻璃温室与3#大棚间采摘道: X = -20, Z from -24 to +20, width 3.8m)
    addRoad(-20, -2, 3.8, 44, false, true);

    // F. Southern Greenhouse Harvest Aisle (1#与6#鱼菜共生棚间机耕道: X = -4, Z from 20 to 55, width 3.8m)
    addRoad(-4, 37.5, 3.8, 35, false, true);

    // G. Smart Outdoor Field Agricultural Spur (智能大田农机作业道: X = -36, Z from 55 to 74, width 4.2m)
    addRoad(-36, 64.5, 4.2, 19, false, true);

    // H. Eddy Covariance Flux Tower Service Track (通量观测塔维护便道: Z = 34, X from 58 to 74, width 3.8m)
    addRoad(66, 34, 3.8, 16, true, true);

    // =============================================================
    // 5. MAIN ENTRANCE PLAZA & PARKING BAYS (主大门迎宾广场与车位)
    // =============================================================
    // West Visitor & Inspection Parking Bay (X = 10 to 18, Z = 74 to 82)
    const parkBayGeo = new THREE.BoxGeometry(10, 0.08, 12);
    const parkBay = new THREE.Mesh(parkBayGeo, asphaltMat);
    parkBay.position.set(13.5, 0.02, 74);
    parkGroup.add(parkBay);

    // 4 Striped Parking Stalls
    for (let p = 0; p < 4; p++) {
      const pz = 70 + p * 2.8;
      const stallLine = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 0.14), whiteLineMat);
      stallLine.rotation.x = -Math.PI / 2;
      stallLine.position.set(13.5, 0.065, pz);
      parkGroup.add(stallLine);
    }

    // East Logistics Staging & Check-in Bay (X = 26 to 34, Z = 74 to 82)
    const stagingBayGeo = new THREE.BoxGeometry(10, 0.08, 12);
    const stagingBay = new THREE.Mesh(stagingBayGeo, asphaltMat);
    stagingBay.position.set(30.5, 0.02, 74);
    parkGroup.add(stagingBay);

    // =============================================================
    // 6. ROAD MARKINGS: STOP LINES, HATCHED ZONES & ARROWS
    // =============================================================
    // Yellow Cross-Hatched Safety Box at Main Entrance Gate (黄线网格禁停区: X = 22, Z = 88)
    this.createHatchedBox(parkGroup, 22, 88, 8.4, 7.5);
    // Yellow Cross-Hatched Safety Box at Central Intersection (X = 22, Z = 20)
    this.createHatchedBox(parkGroup, 22, 20, 8.4, 7.5);
    // Yellow Cross-Hatched Safety Box at Northern Intersection (X = 22, Z = -24)
    this.createHatchedBox(parkGroup, 22, -24, 8.4, 7.0);

    // STOP "停" Road Markings at Main Gate Inbound & Outbound
    this.createStopLine(parkGroup, whiteLineMat, 20.2, 90.5, 3.4);
    this.createStopLine(parkGroup, whiteLineMat, 23.8, 85.5, 3.4);

    // White Directional Straight & Turn Arrows on Main Artery
    this.createRoadArrow(parkGroup, whiteLineMat, 20.2, 95, 0); // Inbound straight
    this.createRoadArrow(parkGroup, whiteLineMat, 20.2, 72, 0); // Northbound straight
    this.createRoadArrow(parkGroup, whiteLineMat, 23.8, 76, Math.PI); // Southbound exit straight
    this.createRoadArrow(parkGroup, whiteLineMat, 20.2, 28, 0); // Central straight
    this.createRoadArrow(parkGroup, whiteLineMat, 23.8, 12, Math.PI); // Central exit straight

    // =============================================================
    // 7. ZEBRA PEDESTRIAN CROSSINGS (斑马线)
    // =============================================================
    this.createZebraCrossing(parkGroup, whiteLineMat, 22, 82.5, false);
    this.createZebraCrossing(parkGroup, whiteLineMat, 22, 16.5, false);
    this.createZebraCrossing(parkGroup, whiteLineMat, 22, 24.5, false);
    this.createZebraCrossing(parkGroup, whiteLineMat, 0, 20, true);
    this.createZebraCrossing(parkGroup, whiteLineMat, 42, 20, true);
    this.createZebraCrossing(parkGroup, whiteLineMat, -42, 20, true);
    this.createZebraCrossing(parkGroup, whiteLineMat, 22, 55, false);
    this.createZebraCrossing(parkGroup, whiteLineMat, -36, 55, true);
    this.createZebraCrossing(parkGroup, whiteLineMat, 0, 55, true);
    this.createZebraCrossing(parkGroup, whiteLineMat, -58, -24, false);
    this.createZebraCrossing(parkGroup, whiteLineMat, -36, -24, true);

    // =============================================================
    // 8. MODERN SOLAR LED STREET LIGHTS (全园区智能路灯网络)
    // =============================================================
    const streetLightPositions = [
      // Along Main North-South Highway
      [22 + 4.5, -95],
      [22 + 4.5, -75],
      [22 + 4.5, -50],
      [22 + 4.5, -10],
      [22 + 4.5, 10],
      [22 + 4.5, 35],
      [22 + 4.5, 60],
      [22 + 4.5, 80],
      [22 + 4.5, 105],
      [22 - 4.5, -65],
      [22 - 4.5, -35],
      [22 - 4.5, 5],
      [22 - 4.5, 45],
      [22 - 4.5, 95],
      // Along Outer Ring Roads
      [-84 - 3.2, -45],
      [-84 - 3.2, 15],
      [-84 - 3.2, 50],
      [86 + 3.2, -45],
      [86 + 3.2, 15],
      [86 + 3.2, 50],
      [-40, 80 + 3.4],
      [0, 80 + 3.4],
      [50, 80 + 3.4],
      [-40, -70 - 3.4],
      [0, -70 - 3.4],
      [50, -70 - 3.4],
      // Along East-West Central Avenue
      [-58, 20 + 3.8],
      [-28, 20 + 3.8],
      [-10, 20 + 3.8],
      [8, 20 + 3.8],
      [58, 20 + 3.8],
      // Along Southern Loop Road
      [-45, 55 + 3.4],
      [-15, 55 + 3.4],
      [15, 55 + 3.4],
      [45, 55 + 3.4],
      // Along Cold Chain Yard & Logistics Lanes
      [-58 - 3.2, -35],
      [-20, -38 - 9.5],
      [-58 - 3.2, 20],
      [58 + 3.2, -15],
      [58 + 3.2, 45],
    ];

    streetLightPositions.forEach(([lx, lz], idx) => {
      this.createStreetLight(parkGroup, lx, lz, idx);
    });

    // 9. Directional Agricultural Park Road Signs
    this.createRoadSign(parkGroup, 25.5, 84, '南大门正门 · 示范园中枢 ➔');
    this.createRoadSign(parkGroup, 25.5, 23.5, '园区核心导览 · 1#智能温室');
    this.createRoadSign(parkGroup, -20, 23.5, '3#圆拱 ➔ 8#光伏温室');
    this.createRoadSign(parkGroup, 25.5, -20, '4#育苗中心 · 水肥罐区 ➔');
    this.createRoadSign(parkGroup, 25.5, 50, '5#日光 ➔ 6#鱼菜共生');
    this.createRoadSign(parkGroup, 25.5, 32, '无人机智能机巢 ➔');
    this.createRoadSign(parkGroup, -48, -20, '冷链物流中心 · 分选车间 ➔');
    this.createRoadSign(parkGroup, 66, 20, '7#垂直气雾培 · 通量塔 ➔');
    this.createRoadSign(parkGroup, 25.5, -72, '北大门 · 农机应急通道 ➔');
  }

  // =============================================================
  // PERIMETER SECURITY WALLS & INTEGRATED MAIN ENTRANCE GATE
  // (四周实体安全围墙与建在围墙上的园区正大门)
  // =============================================================
  public static buildPerimeterWallsAndGate(
    scene: THREE.Scene,
    parkGroup: THREE.Group,
    interactiveObjects: THREE.Object3D[]
  ): PerimeterGateSubsystems {
    const wallsAndGateGroup = new THREE.Group();
    wallsAndGateGroup.name = 'Campus_Perimeter_Walls_And_Gate';

    // Materials
    const plinthMat = new THREE.MeshStandardMaterial({
      color: 0x334155, // Solid stone/concrete foundation plinth
      roughness: 0.7,
      metalness: 0.15,
    });
    const pillarMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b, // Architectural dark slate pillar masonry
      roughness: 0.5,
      metalness: 0.2,
    });
    const fenceMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a, // Industrial anti-climb galvanized dark slate steel railing
      roughness: 0.35,
      metalness: 0.75,
    });
    const pillarCapMat = new THREE.MeshStandardMaterial({
      color: 0x475569, // Beveled decorative capstone
      roughness: 0.4,
      metalness: 0.25,
    });
    const lampGlowMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: 0xfbbf24,
      emissiveIntensity: 0.6,
      roughness: 0.2,
    });
    const hedgeMat = new THREE.MeshStandardMaterial({
      color: 0x166534, // Lush dark evergreen privacy hedge shrubs
      roughness: 0.9,
      metalness: 0.05,
    });

    // Wall Boundaries: X in [-92, 92], Z in [-78, 88]
    // -------------------------------------------------------------
    // Helper to generate a straight wall section with concrete base, pillars, security fence & hedge
    // -------------------------------------------------------------
    const buildWallSegment = (
      xStart: number,
      zStart: number,
      xEnd: number,
      zEnd: number
    ) => {
      const dx = xEnd - xStart;
      const dz = zEnd - zStart;
      const length = Math.hypot(dx, dz);
      if (length < 0.5) return;

      const angle = Math.atan2(dx, dz);
      const midX = (xStart + xEnd) / 2;
      const midZ = (zStart + zEnd) / 2;

      const segGroup = new THREE.Group();
      segGroup.position.set(midX, 0, midZ);
      segGroup.rotation.y = angle;

      // 1. Solid Reinforced Concrete Base Plinth (0.45m high, 0.42m thick)
      const plinth = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.45, length), plinthMat);
      plinth.position.y = 0.225;
      plinth.castShadow = true;
      plinth.receiveShadow = true;
      segGroup.add(plinth);

      // 2. High-grade Architectural Security Steel Fencing between pillars (1.8m height)
      const fenceHeight = 1.8;
      const fenceBody = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, fenceHeight, length),
        fenceMat
      );
      fenceBody.position.y = 0.45 + fenceHeight / 2;
      fenceBody.castShadow = true;
      segGroup.add(fenceBody);

      // Top security spike rail
      const spikeRail = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.08, length), pillarMat);
      spikeRail.position.y = 0.45 + fenceHeight + 0.04;
      segGroup.add(spikeRail);

      // 3. Masonry Pillars every 6 meters
      const pillarSpacing = 6.0;
      const numPillars = Math.floor(length / pillarSpacing);
      for (let p = 0; p <= numPillars; p++) {
        const pz = -length / 2 + p * (length / Math.max(1, numPillars));
        // Pillar body (0.65m x 2.45m x 0.65m)
        const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.65, 2.45, 0.65), pillarMat);
        pillar.position.set(0, 1.225, pz);
        pillar.castShadow = true;

        // Pyramidal capstone
        const cap = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.18, 0.78), pillarCapMat);
        cap.position.set(0, 2.45 + 0.09, pz);

        // Amber night accent lamp inset on top of pillar
        const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), lampGlowMat);
        lamp.position.set(0, 2.65, pz);

        segGroup.add(pillar, cap, lamp);
      }

      // 4. Low evergreen landscaping hedge along inside of the wall
      const hedge = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.9, length * 0.98), hedgeMat);
      hedge.position.set(0.65, 0.45, 0);
      segGroup.add(hedge);

      wallsAndGateGroup.add(segGroup);
    };

    // Build the 4 Perimeter Walls (Leaving openings for South Main Gate & North Logistics Gate)
    // 1. West Wall: X = -92, Z from -78 to +88 (Length 166m)
    buildWallSegment(-92, -78, -92, 88);

    // 2. East Wall: X = +92, Z from -78 to +88 (Length 166m)
    buildWallSegment(92, -78, 92, 88);

    // 3. North Wall: Z = -78, X from -92 to +92 (with secondary North Gate at X = 22)
    buildWallSegment(-92, -78, 16, -78); // West half of north wall
    buildWallSegment(28, -78, 92, -78); // East half of north wall

    // 4. South Wall: Z = +88, X from -92 to +92 (with Main Grand Entrance Gate at X = 22, opening from X = 13 to 31)
    buildWallSegment(-92, 88, 13, 88); // West half of south wall
    buildWallSegment(31, 88, 92, 88); // East half of south wall

    // -------------------------------------------------------------
    // 4 CORNER CCTV & SECURITY SURVEILLANCE POSTS
    // -------------------------------------------------------------
    const cornerPositions = [
      [-92, -78],
      [92, -78],
      [-92, 88],
      [92, 88],
    ];
    cornerPositions.forEach(([cx, cz]) => {
      const cornerTower = new THREE.Group();
      cornerTower.position.set(cx, 0, cz);

      // Heavy concrete foundation
      const base = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.6, 1.6), plinthMat);
      base.position.y = 0.3;
      cornerTower.add(base);

      // Galvanized steel surveillance mast (5.5m high)
      const mastMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8, roughness: 0.25 });
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 5.2, 8), mastMat);
      mast.position.y = 2.9;
      cornerTower.add(mast);

      // 360° PTZ HD dome camera & solar telemetry pod
      const pod = new THREE.Mesh(
        new THREE.BoxGeometry(0.45, 0.45, 0.35),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.7 })
      );
      pod.position.set(0, 5.4, 0);

      const dome = new THREE.Mesh(
        new THREE.SphereGeometry(0.16, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.9, roughness: 0.1 })
      );
      dome.position.set(0, 5.15, 0);

      const solar = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.04, 0.6),
        new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.2 })
      );
      solar.position.set(0, 5.75, 0);
      solar.rotation.x = 0.35;

      cornerTower.add(pod, dome, solar);
      wallsAndGateGroup.add(cornerTower);
    });

    // -------------------------------------------------------------
    // NORTH LOGISTICS & EMERGENCY GATE (北侧农机与物流备用门: X = 22, Z = -78)
    // -------------------------------------------------------------
    const northGateGroup = new THREE.Group();
    northGateGroup.position.set(22, 0, -78);

    // Industrial portal gantry
    const nGantryMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6, roughness: 0.4 });
    const nPillarL = new THREE.Mesh(new THREE.BoxGeometry(0.8, 4.8, 0.8), nGantryMat);
    nPillarL.position.set(-5.5, 2.4, 0);
    const nPillarR = new THREE.Mesh(new THREE.BoxGeometry(0.8, 4.8, 0.8), nGantryMat);
    nPillarR.position.set(5.5, 2.4, 0);
    const nBeam = new THREE.Mesh(new THREE.BoxGeometry(12.2, 0.8, 0.9), nGantryMat);
    nBeam.position.set(0, 4.8, 0);
    northGateGroup.add(nPillarL, nPillarR, nBeam);

    // Height clearance & warning signage
    const nSignCanvas = document.createElement('canvas');
    nSignCanvas.width = 512;
    nSignCanvas.height = 96;
    const nCtx = nSignCanvas.getContext('2d');
    if (nCtx) {
      nCtx.fillStyle = '#0f172a';
      nCtx.fillRect(0, 0, 512, 96);
      nCtx.strokeStyle = '#eab308';
      nCtx.lineWidth = 6;
      nCtx.strokeRect(4, 4, 504, 88);
      nCtx.fillStyle = '#eab308';
      nCtx.font = 'bold 30px "PingFang SC", sans-serif';
      nCtx.textAlign = 'center';
      nCtx.textBaseline = 'middle';
      nCtx.fillText('农机重载物流通道 · 限高4.5M', 256, 48);
    }
    const nSignTex = new THREE.CanvasTexture(nSignCanvas);
    const nSignMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(8.5, 0.7),
      new THREE.MeshBasicMaterial({ map: nSignTex })
    );
    nSignMesh.position.set(0, 4.8, -0.48);
    nSignMesh.rotation.y = Math.PI;
    northGateGroup.add(nSignMesh);

    // Sliding metal security gate leaves
    const gateLeafMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.4 });
    const leafL = new THREE.Mesh(new THREE.BoxGeometry(5.2, 2.6, 0.1), gateLeafMat);
    leafL.position.set(-2.7, 1.3, 0);
    const leafR = new THREE.Mesh(new THREE.BoxGeometry(5.2, 2.6, 0.1), gateLeafMat);
    leafR.position.set(2.7, 1.3, 0);
    northGateGroup.add(leafL, leafR);

    wallsAndGateGroup.add(northGateGroup);

    // =============================================================
    // =============================================================
    // GRAND MAIN ENTRANCE GATE ON SOUTH PERIMETER WALL
    // (建在南围墙上的园区正大门 · 科技龙门架牌楼 + 门卫保卫室 + 智能道闸)
    // Position: X = 22, Z = +88 (Directly integrated into South Wall!)
    // =============================================================
    // =============================================================
    const mainGateGroup = new THREE.Group();
    mainGateGroup.position.set(22, 0, 88);
    mainGateGroup.name = 'Perimeter_Main_Entrance_Gate';

    // -------------------------------------------------------------
    // 1. GRAND ARCHITECTURAL PORTAL ARCHWAY (科技门头龙门牌楼)
    // -------------------------------------------------------------
    const archMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b, // Modern dark anthracite metal framing
      metalness: 0.7,
      roughness: 0.3,
    });
    const titaniumMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8, // Brushed titanium composite cladding
      metalness: 0.85,
      roughness: 0.25,
    });
    const cyanTrimMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // Agri-tech blue fascia
      roughness: 0.2,
      metalness: 0.4,
    });

    // Left Giant Pylon (X = -8.5 rel to gate center, i.e. X = 13.5)
    const leftPylon = new THREE.Mesh(new THREE.BoxGeometry(1.6, 6.4, 2.6), archMat);
    leftPylon.position.set(-8.5, 3.2, 0);
    leftPylon.castShadow = true;

    // Right Giant Pylon (X = +8.5 rel to gate center, i.e. X = 30.5)
    const rightPylon = new THREE.Mesh(new THREE.BoxGeometry(1.6, 6.4, 2.6), archMat);
    rightPylon.position.set(8.5, 3.2, 0);
    rightPylon.castShadow = true;

    // Overhead Massive Lintel Beam (Clearance 4.8m underneath for all high-cube trucks)
    const lintelBeam = new THREE.Mesh(new THREE.BoxGeometry(18.6, 1.4, 2.8), archMat);
    lintelBeam.position.set(0, 5.7, 0);
    lintelBeam.castShadow = true;

    // Architectural Decorative Cladding Caps
    const topCanopy = new THREE.Mesh(new THREE.BoxGeometry(19.2, 0.25, 3.4), cyanTrimMat);
    topCanopy.position.set(0, 6.45, 0);

    const leftClad = new THREE.Mesh(new THREE.BoxGeometry(1.7, 6.45, 0.4), titaniumMat);
    leftClad.position.set(-8.5, 3.2, 1.32);
    const rightClad = new THREE.Mesh(new THREE.BoxGeometry(1.7, 6.45, 0.4), titaniumMat);
    rightClad.position.set(8.5, 3.2, 1.32);

    mainGateGroup.add(leftPylon, rightPylon, lintelBeam, topCanopy, leftClad, rightClad);

    // -------------------------------------------------------------
    // 2. ILLUMINATED GATE SIGNBOARD (示范园正门发光字牌匾)
    // -------------------------------------------------------------
    // South Face (facing approaching traffic from outside the park)
    const signCanvasS = document.createElement('canvas');
    signCanvasS.width = 1024;
    signCanvasS.height = 256;
    const sCtx = signCanvasS.getContext('2d');
    if (sCtx) {
      sCtx.fillStyle = '#0a101d';
      sCtx.fillRect(0, 0, 1024, 256);

      // Gold & cyan decorative border
      sCtx.strokeStyle = '#38bdf8';
      sCtx.lineWidth = 8;
      sCtx.strokeRect(10, 10, 1004, 236);

      sCtx.strokeStyle = '#f59e0b';
      sCtx.lineWidth = 3;
      sCtx.strokeRect(18, 18, 988, 220);

      // Main park title
      sCtx.fillStyle = '#f8fafc';
      sCtx.font = 'bold 54px "PingFang SC", "Microsoft YaHei", sans-serif';
      sCtx.textAlign = 'center';
      sCtx.textBaseline = 'middle';
      sCtx.shadowColor = '#38bdf8';
      sCtx.shadowBlur = 12;
      sCtx.fillText('国家现代农业产业科技示范园', 512, 100);

      // Subtitle
      sCtx.shadowBlur = 0;
      sCtx.fillStyle = '#38bdf8';
      sCtx.font = 'bold 24px monospace';
      sCtx.fillText('NATIONAL MODERN AGRI-TECH DEMONSTRATION PARK', 512, 160);

      sCtx.fillStyle = '#10b981';
      sCtx.font = 'bold 20px "PingFang SC", sans-serif';
      sCtx.fillText('● 智能车牌识别出入管控系统 · 规范通行', 512, 202);
    }
    const signTexS = new THREE.CanvasTexture(signCanvasS);
    const signMeshS = new THREE.Mesh(
      new THREE.PlaneGeometry(16.5, 1.25),
      new THREE.MeshBasicMaterial({ map: signTexS })
    );
    signMeshS.position.set(0, 5.7, 1.42);
    mainGateGroup.add(signMeshS);

    // North Face (facing vehicles exiting the park from inside)
    const signCanvasN = document.createElement('canvas');
    signCanvasN.width = 1024;
    signCanvasN.height = 160;
    const nCtx2 = signCanvasN.getContext('2d');
    if (nCtx2) {
      nCtx2.fillStyle = '#0a101d';
      nCtx2.fillRect(0, 0, 1024, 160);
      nCtx2.strokeStyle = '#38bdf8';
      nCtx2.lineWidth = 6;
      nCtx2.strokeRect(8, 8, 1008, 144);
      nCtx2.fillStyle = '#f8fafc';
      nCtx2.font = 'bold 44px "PingFang SC", sans-serif';
      nCtx2.textAlign = 'center';
      nCtx2.textBaseline = 'middle';
      nCtx2.fillText('科技兴农 · 数字孪生 · 安全生产', 512, 80);
    }
    const signTexN = new THREE.CanvasTexture(signCanvasN);
    const signMeshN = new THREE.Mesh(
      new THREE.PlaneGeometry(16.5, 1.25),
      new THREE.MeshBasicMaterial({ map: signTexN })
    );
    signMeshN.position.set(0, 5.7, -1.42);
    signMeshN.rotation.y = Math.PI;
    mainGateGroup.add(signMeshN);

    // -------------------------------------------------------------
    // 3. SECURITY GUARDHOUSE & PASS OFFICE (门卫值班保卫室)
    // Built right on the south wall at X = -7.5 (i.e. world X = 14.5, Z = 88)
    // -------------------------------------------------------------
    const guardhouse = new THREE.Group();
    guardhouse.position.set(-7.5, 0, 0);

    // Concrete base foundation
    const ghFoundation = new THREE.Mesh(
      new THREE.BoxGeometry(5.2, 0.3, 3.8),
      new THREE.MeshStandardMaterial({ color: 0xcfd8dc, roughness: 0.8 })
    );
    ghFoundation.position.y = 0.15;
    guardhouse.add(ghFoundation);

    // Office building body (5.0m wide, 3.2m tall, 3.5m deep)
    const ghBody = new THREE.Mesh(
      new THREE.BoxGeometry(5.0, 3.2, 3.5),
      new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.4 })
    );
    ghBody.position.y = 1.75;
    ghBody.castShadow = true;
    guardhouse.add(ghBody);

    // Sloped blue solar roof
    const ghRoof = new THREE.Mesh(
      new THREE.BoxGeometry(5.4, 0.25, 4.0),
      new THREE.MeshStandardMaterial({ color: 0x1d4ed8, metalness: 0.8, roughness: 0.2 })
    );
    ghRoof.position.set(0, 3.45, 0);
    ghRoof.rotation.x = -0.12;
    guardhouse.add(ghRoof);

    // Blue fascia trim
    const ghFascia = new THREE.Mesh(
      new THREE.BoxGeometry(5.2, 0.35, 3.7),
      cyanTrimMat
    );
    ghFascia.position.set(0, 3.2, 0);
    guardhouse.add(ghFascia);

    // Observation Security Windows (facing roadway at +X)
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.55,
      roughness: 0.1,
      metalness: 0.2,
    });
    // Window facing driveway
    const winEast = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.4, 2.2), glassMat);
    winEast.position.set(2.54, 1.9, 0);
    guardhouse.add(winEast);

    // Security pass counter window (facing south/outside)
    const winSouth = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 0.08), glassMat);
    winSouth.position.set(0.8, 1.8, 1.78);
    guardhouse.add(winSouth);

    // Pass office door
    const doorMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 2.2, 0.08),
      new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6 })
    );
    doorMesh.position.set(-1.2, 1.25, 1.78);
    guardhouse.add(doorMesh);

    // Air conditioner condenser unit on wall
    const acUnit = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.65, 0.35),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.5 })
    );
    acUnit.position.set(-1.8, 2.3, -1.8);
    guardhouse.add(acUnit);

    // Guardhouse identification plaque
    const ghSign = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 0.45, 0.06),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3 })
    );
    ghSign.position.set(0, 3.0, 1.8);
    guardhouse.add(ghSign);

    mainGateGroup.add(guardhouse);

    // -------------------------------------------------------------
    // 4. PEDESTRIAN & STAFF TURNSTILE ACCESS GATE (人行出入闸机)
    // Positioned at X = -10.5 (rel to center)
    // -------------------------------------------------------------
    const turnstileGroup = new THREE.Group();
    turnstileGroup.position.set(-10.5, 0, 0);

    const turnstileMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.85, roughness: 0.2 });
    const tBoxL = new THREE.Mesh(new THREE.BoxGeometry(0.28, 1.05, 1.4), turnstileMat);
    tBoxL.position.set(-0.65, 0.52, 0);
    const tBoxR = new THREE.Mesh(new THREE.BoxGeometry(0.28, 1.05, 1.4), turnstileMat);
    tBoxR.position.set(0.65, 0.52, 0);

    // Turnstile rotating arms
    const tArm = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.8), turnstileMat);
    tArm.rotation.z = Math.PI / 4;
    tArm.position.set(0, 0.65, 0);

    // Card reader badge post
    const badgePost = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.2), turnstileMat);
    badgePost.position.set(0.65, 0.6, 0.8);
    const badgeHead = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.14, 0.06),
      new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x10b981, emissiveIntensity: 0.8 })
    );
    badgeHead.position.set(0.65, 1.25, 0.8);

    turnstileGroup.add(tBoxL, tBoxR, tArm, badgePost, badgeHead);
    mainGateGroup.add(turnstileGroup);

    // -------------------------------------------------------------
    // 5. ROADWAY CENTER SAFETY ISLAND & BOLLARDS (中央安全隔离岛)
    // -------------------------------------------------------------
    const hazardStripeMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4 });
    const islandMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.6 });
    const island = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.22, 7.8), islandMat);
    island.position.set(0, 0.11, 0);
    mainGateGroup.add(island);

    // Hazard striped ends on safety island
    const islandHazardFront = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.24, 0.2), hazardStripeMat);
    islandHazardFront.position.set(0, 0.12, 3.9);
    const islandHazardRear = islandHazardFront.clone();
    islandHazardRear.position.set(0, 0.12, -3.9);
    mainGateGroup.add(islandHazardFront, islandHazardRear);

    // 4 Safety Bollards along center island
    [-2.5, -0.8, 0.8, 2.5].forEach((bz) => {
      const bollard = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 0.9, 12),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4 })
      );
      bollard.position.set(0, 0.55, bz);
      mainGateGroup.add(bollard);
    });

    // -------------------------------------------------------------
    // 6. INBOUND INTELLIGENT BOOM BARRIER (入园车道道闸: X = -1.8, Z = 0)
    // -------------------------------------------------------------
    const barrierHousingMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b, // High visibility security yellow/orange
      metalness: 0.5,
      roughness: 0.35,
    });
    const barrierBaseMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.7 });

    // Barrier Pedestal Base
    const inBarrierPost = new THREE.Mesh(new THREE.BoxGeometry(0.42, 1.15, 0.42), barrierHousingMat);
    inBarrierPost.position.set(-3.6, 0.58, 0);
    const inBarrierBase = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.15, 0.48), barrierBaseMat);
    inBarrierBase.position.set(-3.6, 0.08, 0);
    mainGateGroup.add(inBarrierPost, inBarrierBase);

    // Traffic Signal Indicator Light on Barrier Box (Red = closed, Green = raised)
    const signalMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xef4444,
      emissiveIntensity: 1.2,
      roughness: 0.2,
    });
    const signalLight = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 16), signalMat);
    signalLight.position.set(-3.6, 1.25, 0);
    mainGateGroup.add(signalLight);

    // Animated Boom Barrier Arm Pivot
    const barrierPivot = new THREE.Group();
    // Pivot positioned at top of housing (-3.6, 1.05, 0)
    barrierPivot.position.set(-3.6, 1.05, 0);

    // Boom arm extending across the inbound lane in +X direction towards center island (length 3.4m)
    const armGroup = new THREE.Group();
    const stripeColors = [0xef4444, 0xffffff, 0xef4444, 0xffffff, 0xef4444, 0xffffff, 0xef4444];
    const segLen = 3.3 / stripeColors.length;
    stripeColors.forEach((col, idx) => {
      const segMat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.4 });
      const seg = new THREE.Mesh(new THREE.BoxGeometry(segLen, 0.09, 0.05), segMat);
      seg.position.set(idx * segLen + segLen / 2, 0, 0);
      armGroup.add(seg);
    });

    // Rubber safety bumper cushion under arm
    const bumper = new THREE.Mesh(
      new THREE.BoxGeometry(3.3, 0.02, 0.05),
      new THREE.MeshStandardMaterial({ color: 0x1e293b })
    );
    bumper.position.set(1.65, -0.05, 0);
    armGroup.add(bumper);

    barrierPivot.add(armGroup);
    mainGateGroup.add(barrierPivot);

    // -------------------------------------------------------------
    // 7. INBOUND ALPR LICENSE PLATE CAMERA & LED INFO SCREEN
    // -------------------------------------------------------------
    const alprPole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 2.2, 8),
      new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8 })
    );
    alprPole.position.set(-3.6, 1.1, 1.4);

    // High-speed capture camera head
    const camHead = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.12, 0.26),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9 })
    );
    camHead.position.set(-3.6, 2.0, 1.4);
    camHead.rotation.x = -0.25; // Aiming towards approaching vehicles from south
    mainGateGroup.add(alprPole, camHead);

    // Electronic LED Display Canvas (Live Gate Clearance Status)
    const ledCanvas = document.createElement('canvas');
    ledCanvas.width = 256;
    ledCanvas.height = 128;
    const lCtx = ledCanvas.getContext('2d');
    if (lCtx) {
      lCtx.fillStyle = '#050a14';
      lCtx.fillRect(0, 0, 256, 128);
      lCtx.fillStyle = '#10b981';
      lCtx.font = 'bold 20px monospace';
      lCtx.fillText('AUTO-ALPR OK', 16, 34);
      lCtx.fillStyle = '#38bdf8';
      lCtx.font = 'bold 24px "PingFang SC", sans-serif';
      lCtx.fillText('苏E·A886F', 16, 70);
      lCtx.fillStyle = '#f59e0b';
      lCtx.font = '16px "PingFang SC", sans-serif';
      lCtx.fillText('冷链白名单 · 自动抬杆', 16, 102);
    }
    const ledTex = new THREE.CanvasTexture(ledCanvas);
    const ledScreenMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.72, 0.42),
      new THREE.MeshBasicMaterial({ map: ledTex })
    );
    ledScreenMesh.position.set(-3.6, 1.4, 1.4);
    mainGateGroup.add(ledScreenMesh);

    // -------------------------------------------------------------
    // 8. OUTBOUND BARRIER & ALPR CAMERA (出园车道道闸: X = +1.8)
    // -------------------------------------------------------------
    const outBarrierPost = new THREE.Mesh(new THREE.BoxGeometry(0.42, 1.15, 0.42), barrierHousingMat);
    outBarrierPost.position.set(3.6, 0.58, 0);
    const outBarrierBase = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.15, 0.48), barrierBaseMat);
    outBarrierBase.position.set(3.6, 0.08, 0);
    mainGateGroup.add(outBarrierPost, outBarrierBase);

    // Outbound barrier arm (-X towards center island)
    const outArmGroup = new THREE.Group();
    stripeColors.forEach((col, idx) => {
      const segMat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.4 });
      const seg = new THREE.Mesh(new THREE.BoxGeometry(segLen, 0.09, 0.05), segMat);
      seg.position.set(-(idx * segLen + segLen / 2), 0, 0);
      outArmGroup.add(seg);
    });
    outArmGroup.position.set(3.6, 1.05, 0);
    mainGateGroup.add(outArmGroup);

    // Outbound camera
    const outAlprPole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 2.2, 8),
      new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8 })
    );
    outAlprPole.position.set(3.6, 1.1, -1.4);
    const outCamHead = camHead.clone();
    outCamHead.position.set(3.6, 2.0, -1.4);
    outCamHead.rotation.x = 0.25;
    mainGateGroup.add(outAlprPole, outCamHead);

    // -------------------------------------------------------------
    // 9. DEDICATED HIT BOX FOR GATE FACILITY INTERACTION
    // -------------------------------------------------------------
    const gateHit = new THREE.Mesh(
      new THREE.BoxGeometry(22, 6.8, 8.0),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    gateHit.position.set(0, 3.4, 0);
    gateHit.userData = {
      id: 'facility_entrance_gate',
      type: 'gate',
      name: '园区主大门 · 智能车牌识别出入道闸',
    };
    mainGateGroup.add(gateHit);
    interactiveObjects.push(gateHit);

    wallsAndGateGroup.add(mainGateGroup);
    parkGroup.add(wallsAndGateGroup);

    return {
      barrierPivot,
      signalLight,
    };
  }

  // -------------------------------------------------------------
  // ROAD MARKINGS & STREET FURNITURE HELPERS
  // -------------------------------------------------------------
  private static createHatchedBox(
    group: THREE.Group,
    x: number,
    z: number,
    width: number,
    length: number
  ) {
    const hatchedMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.5,
      transparent: true,
      opacity: 0.85,
    });
    const boxBorder = new THREE.Mesh(new THREE.PlaneGeometry(width, length), hatchedMat);
    boxBorder.rotation.x = -Math.PI / 2;
    boxBorder.position.set(x, 0.066, z);

    // Subtle inner cut to create realistic border
    const innerAsphalt = new THREE.Mesh(
      new THREE.PlaneGeometry(width - 0.5, length - 0.5),
      new THREE.MeshStandardMaterial({ color: 0x1a2332, roughness: 0.82 })
    );
    innerAsphalt.rotation.x = -Math.PI / 2;
    innerAsphalt.position.set(x, 0.067, z);

    // Diagonal yellow stripe lattice
    const stripes = 6;
    for (let s = 0; s < stripes; s++) {
      const diag = new THREE.Mesh(new THREE.PlaneGeometry(0.14, Math.hypot(width, length) * 0.7), hatchedMat);
      diag.rotation.x = -Math.PI / 2;
      diag.rotation.z = Math.PI / 4;
      diag.position.set(x + (s - (stripes - 1) / 2) * 1.1, 0.068, z);
      group.add(diag);
    }

    group.add(boxBorder, innerAsphalt);
  }

  private static createStopLine(
    group: THREE.Group,
    mat: THREE.Material,
    x: number,
    z: number,
    width: number
  ) {
    // Solid thick white stop line
    const stopLine = new THREE.Mesh(new THREE.PlaneGeometry(width, 0.42), mat);
    stopLine.rotation.x = -Math.PI / 2;
    stopLine.position.set(x, 0.067, z);
    group.add(stopLine);
  }

  private static createRoadArrow(
    group: THREE.Group,
    mat: THREE.Material,
    x: number,
    z: number,
    rotY: number
  ) {
    const arrowGroup = new THREE.Group();
    arrowGroup.position.set(x, 0.068, z);
    arrowGroup.rotation.y = rotY;

    // Stem
    const stem = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 2.2), mat);
    stem.rotation.x = -Math.PI / 2;
    stem.position.z = 0.5;

    // Arrowhead
    const headL = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.9), mat);
    headL.rotation.x = -Math.PI / 2;
    headL.rotation.z = Math.PI / 4;
    headL.position.set(-0.25, 0, -0.6);

    const headR = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.9), mat);
    headR.rotation.x = -Math.PI / 2;
    headR.rotation.z = -Math.PI / 4;
    headR.position.set(0.25, 0, -0.6);

    arrowGroup.add(stem, headL, headR);
    group.add(arrowGroup);
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
  // ECOLOGICAL RESERVOIR/POND, FOUNTAINS & WATER TELEMETRY BUOY
  // (生态蓄水灌溉河塘、增氧喷泉水景、锦鲤群与水质监测浮标)
  // -------------------------------------------------------------
  public static buildPondAndWaterStation(
    scene: THREE.Scene,
    parkGroup: THREE.Group,
    interactiveObjects: THREE.Object3D[]
  ): ParkSubsystems {
    const pondCenter = new THREE.Vector3(42, 0, 44);
    const pondWidth = 38;
    const pondLength = 30;

    // 1. TRUE EXCAVATED SUNKEN POND BASIN (真实凹陷沉水池底与生态驳岸)
    // A. Sunken Pond Bed Floor at y = -1.6m (1.6米深蓄水池底)
    const bedGeo = new THREE.PlaneGeometry(34, 26);
    const bedMat = new THREE.MeshStandardMaterial({
      color: 0x0c3b32, // Deep natural aquatic gravel & silt bed
      roughness: 0.95,
      metalness: 0.05,
    });
    const bedMesh = new THREE.Mesh(bedGeo, bedMat);
    bedMesh.rotation.x = -Math.PI / 2;
    bedMesh.position.set(pondCenter.x, -1.6, pondCenter.z);
    bedMesh.receiveShadow = true;
    parkGroup.add(bedMesh);

    // B. Sloping Embankments (四面生态护坡驳岸从地面高度缓坡下切到水底)
    const bankMat = new THREE.MeshStandardMaterial({
      color: 0x5a6a7c, // River stones & natural riprap embankment
      roughness: 0.9,
    });

    // North Slope
    const northBank = new THREE.Mesh(new THREE.PlaneGeometry(38, 2.7), bankMat);
    northBank.position.set(pondCenter.x, -0.78, pondCenter.z - 14.0);
    northBank.rotation.x = Math.atan2(1.68, 2.0); // Sloping down to bed
    parkGroup.add(northBank);

    // South Slope
    const southBank = new THREE.Mesh(new THREE.PlaneGeometry(38, 2.7), bankMat);
    southBank.position.set(pondCenter.x, -0.78, pondCenter.z + 14.0);
    southBank.rotation.x = -Math.atan2(1.68, 2.0);
    parkGroup.add(southBank);

    // West Slope
    const westBank = new THREE.Mesh(new THREE.PlaneGeometry(2.7, 30), bankMat);
    westBank.position.set(pondCenter.x - 18.0, -0.78, pondCenter.z);
    westBank.rotation.z = -Math.atan2(1.68, 2.0);
    parkGroup.add(westBank);

    // East Slope
    const eastBank = new THREE.Mesh(new THREE.PlaneGeometry(2.7, 30), bankMat);
    eastBank.position.set(pondCenter.x + 18.0, -0.78, pondCenter.z);
    eastBank.rotation.z = Math.atan2(1.68, 2.0);
    parkGroup.add(eastBank);

    // Natural landscape boulders and decorative river pebbles along the shoreline
    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0x788898,
      roughness: 0.85,
    });
    for (let i = 0; i < 48; i++) {
      const angle = (i / 48) * Math.PI * 2;
      const rx = (pondWidth / 2 - 0.5) * Math.cos(angle) + (Math.random() - 0.5) * 1.5;
      const rz = (pondLength / 2 - 0.5) * Math.sin(angle) + (Math.random() - 0.5) * 1.5;
      const size = 0.5 + Math.random() * 0.7;
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(size, 0), stoneMat);
      rock.position.set(pondCenter.x + rx, 0.05 + Math.random() * 0.1, pondCenter.z + rz);
      rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      rock.castShadow = true;
      rock.receiveShadow = true;
      parkGroup.add(rock);
    }

    // 2. VIBRANT, CRYSTAL CLEAR WATER SURFACE (MeshPhysicalMaterial + Caustics)
    // At y = -0.12m (Sunken 12cm below ground, 1.48m of crystal clear visible water depth)
    const waterTex = this.createWaterTexture();
    const waterGeo = new THREE.PlaneGeometry(pondWidth - 0.6, pondLength - 0.6, 64, 48);
    const waterMat = new THREE.MeshPhysicalMaterial({
      map: waterTex,
      color: 0x0284c7, // Radiant sky-lit turquoise & cerulean aquatic blue
      roughness: 0.03, // Glassy specular reflections
      metalness: 0.16,
      transmission: 0.68, // Translucent clear water reveals fish and depths
      transparent: true,
      opacity: 0.90,
      ior: 1.333, // Real physical water refractive index
      reflectivity: 0.95,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      depthWrite: true,
    });
    const waterMesh = new THREE.Mesh(waterGeo, waterMat);
    waterMesh.rotation.x = -Math.PI / 2;
    waterMesh.position.set(pondCenter.x, -0.12, pondCenter.z);
    waterMesh.receiveShadow = true;
    parkGroup.add(waterMesh);

    // 3. FLOATING AERATION FOUNTAINS (2座漂浮式生态增氧水景曝气喷泉)
    const fountainMeshList: THREE.Group[] = [];
    const aeratorPositions = [
      new THREE.Vector3(35, -0.12, 40),
      new THREE.Vector3(49, -0.12, 48),
    ];

    aeratorPositions.forEach((pos, idx) => {
      const aeratorGroup = new THREE.Group();
      aeratorGroup.position.copy(pos);

      // Yellow buoyant floating ring
      const floatRing = new THREE.Mesh(
        new THREE.TorusGeometry(1.2, 0.22, 12, 24),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4 })
      );
      floatRing.rotation.x = Math.PI / 2;
      floatRing.position.y = 0.08;
      aeratorGroup.add(floatRing);

      // Stainless central motor & fountain nozzle
      const motor = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.4, 0.6, 12),
        new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.8, roughness: 0.2 })
      );
      motor.position.y = 0.25;
      aeratorGroup.add(motor);

      const nozzle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.18, 0.4, 12),
        new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.1 })
      );
      nozzle.position.y = 0.65;
      aeratorGroup.add(nozzle);

      // Concentric water ripple foam rings
      for (let r = 1; r <= 2; r++) {
        const ripple = new THREE.Mesh(
          new THREE.RingGeometry(1.4 * r, 1.4 * r + 0.18, 32),
          new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.45 / r,
            side: THREE.DoubleSide,
          })
        );
        ripple.rotation.x = -Math.PI / 2;
        ripple.position.y = 0.02;
        aeratorGroup.add(ripple);
      }

      parkGroup.add(aeratorGroup);
      fountainMeshList.push(aeratorGroup);
    });

    // Animated Fountain Water Spray Particle System (300 particles arching up and splashing)
    const particleCount = 300;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const isF1 = i < particleCount / 2;
      const origin = isF1 ? aeratorPositions[0] : aeratorPositions[1];
      particlePositions[i * 3] = origin.x;
      particlePositions[i * 3 + 1] = origin.y + 0.6;
      particlePositions[i * 3 + 2] = origin.z;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xf0fdf4,
      size: 0.26,
      transparent: true,
      opacity: 0.85,
    });
    const fountainParticles = new THREE.Points(particleGeo, particleMat);
    parkGroup.add(fountainParticles);

    // 4. SUBMERGED SWIMMING KOI FISH (水下游弋锦鲤鱼群)
    const fishList: KoiFishActor[] = [];
    const koiColors = [
      { body: 0xea580c, fin: 0xffffff }, // Kohaku (Red & White)
      { body: 0xf59e0b, fin: 0xfef08a }, // Yamabuki Ogon (Golden Yellow)
      { body: 0xdc2626, fin: 0x1e293b }, // Showa (Crimson & Black)
      { body: 0xffffff, fin: 0xea580c }, // Tancho
      { body: 0xea580c, fin: 0xffffff },
      { body: 0xf59e0b, fin: 0xffffff },
    ];

    koiColors.forEach((colorScheme, idx) => {
      const fishGroup = new THREE.Group();
      const fishMat = new THREE.MeshStandardMaterial({
        color: colorScheme.body,
        roughness: 0.35,
        metalness: 0.1,
      });
      const finMat = new THREE.MeshStandardMaterial({
        color: colorScheme.fin,
        transparent: true,
        opacity: 0.85,
        roughness: 0.4,
      });

      // Streamlined Koi Body
      const body = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.9, 8), fishMat);
      body.rotation.x = Math.PI / 2;
      fishGroup.add(body);

      // Pectoral fins
      const finL = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.02, 0.14), finMat);
      finL.position.set(-0.16, 0, 0.15);
      finL.rotation.y = -0.35;
      const finR = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.02, 0.14), finMat);
      finR.position.set(0.16, 0, 0.15);
      finR.rotation.y = 0.35;
      fishGroup.add(finL, finR);

      // Dorsal Fin
      const dorsal = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.16, 0.35), finMat);
      dorsal.position.set(0, 0.12, -0.05);
      fishGroup.add(dorsal);

      // Articulated Tail Fin
      const tail = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.26, 0.3), finMat);
      tail.position.set(0, 0, -0.52);
      fishGroup.add(tail);

      fishGroup.position.set(pondCenter.x, -0.48, pondCenter.z);
      parkGroup.add(fishGroup);

      fishList.push({
        mesh: fishGroup,
        orbitCenter: new THREE.Vector3(
          pondCenter.x + (idx % 2 === 0 ? -4 : 5),
          -0.48,
          pondCenter.z + (idx % 3 === 0 ? -3 : 4)
        ),
        radiusX: 5.5 + (idx % 3) * 2.2,
        radiusZ: 4.5 + (idx % 2) * 2.0,
        speed: 0.6 + idx * 0.12,
        phase: (idx / koiColors.length) * Math.PI * 2,
        tail,
      });
    });

    // 5. WATER LILIES & BLOOMING LOTUS BLOSSOMS (水面睡莲与荷花)
    const lilyMat = new THREE.MeshStandardMaterial({
      color: 0x166534, // Emerald green water lily pad
      roughness: 0.5,
    });
    const lotusPetalMat = new THREE.MeshStandardMaterial({
      color: 0xf472b6, // Delicate blooming pink lotus petals
      roughness: 0.4,
    });
    const lotusCoreMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15, // Golden stamen
      roughness: 0.3,
    });

    for (let i = 0; i < 22; i++) {
      const lx = pondCenter.x + (Math.random() - 0.5) * (pondWidth - 10);
      const lz = pondCenter.z + (Math.random() - 0.5) * (pondLength - 10);

      // Lily pad with notch
      const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.02, 14), lilyMat);
      pad.position.set(lx, -0.11, lz);
      pad.rotation.y = Math.random() * Math.PI * 2;
      parkGroup.add(pad);

      // Every 3rd pad has a blooming lotus blossom
      if (i % 3 === 0) {
        const lotusGroup = new THREE.Group();
        lotusGroup.position.set(lx, -0.09, lz);

        // Petals radiating in 2 tiers
        for (let p = 0; p < 8; p++) {
          const petal = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.22, 5), lotusPetalMat);
          const pAngle = (p / 8) * Math.PI * 2;
          petal.position.set(Math.cos(pAngle) * 0.12, 0.08, Math.sin(pAngle) * 0.12);
          petal.rotation.x = Math.sin(pAngle) * 0.5;
          petal.rotation.z = -Math.cos(pAngle) * 0.5;
          lotusGroup.add(petal);
        }
        // Center stamen
        const core = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.08, 8), lotusCoreMat);
        core.position.y = 0.08;
        lotusGroup.add(core);

        parkGroup.add(lotusGroup);
      }
    }

    // 6. SHORELINE WEEPING WILLOWS & REED GRASS (池畔垂柳与亲水芦苇)
    // 3 Weeping willows along the lake banks
    this.createWillowTree(parkGroup, pondCenter.x - 17, 0, pondCenter.z + 13);
    this.createWillowTree(parkGroup, pondCenter.x + 16, 0, pondCenter.z - 12);
    this.createWillowTree(parkGroup, pondCenter.x + 17, 0, pondCenter.z + 12);

    // Reed grass clumps
    const reedMat = new THREE.MeshStandardMaterial({ color: 0x4d7c0f, roughness: 0.8 });
    const cattailMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
    for (let r = 0; r < 36; r++) {
      const angle = (r / 36) * Math.PI * 2;
      const qx = (pondWidth / 2 - 1.2) * Math.cos(angle) + (Math.random() - 0.5) * 0.8;
      const qz = (pondLength / 2 - 1.2) * Math.sin(angle) + (Math.random() - 0.5) * 0.8;
      // Stems
      for (let s = 0; s < 3; s++) {
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 1.2 + Math.random() * 0.6, 6), reedMat);
        stem.position.set(pondCenter.x + qx + (Math.random() - 0.5) * 0.4, 0.2, pondCenter.z + qz + (Math.random() - 0.5) * 0.4);
        stem.rotation.z = (Math.random() - 0.5) * 0.2;
        parkGroup.add(stem);

        if (s === 0) {
          const cattail = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.25, 8), cattailMat);
          cattail.position.copy(stem.position);
          cattail.position.y += 0.5;
          parkGroup.add(cattail);
        }
      }
    }

    // 7. WOODEN INSPECTION PIER / DOCK (观水平台与监测码头)
    // Matches existing coordinates (pondCenter.x - 14 = 28, pondCenter.z - 8 = 36)
    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x854d0e,
      roughness: 0.75,
    });
    const pierGeo = new THREE.BoxGeometry(4.5, 0.2, 10);
    const pier = new THREE.Mesh(pierGeo, woodMat);
    pier.position.set(pondCenter.x - 14, 0.15, pondCenter.z - 8);
    pier.receiveShadow = true;
    parkGroup.add(pier);

    // Timber floor plank grooves
    for (let pl = -4; pl <= 4; pl++) {
      const groove = new THREE.Mesh(
        new THREE.BoxGeometry(4.4, 0.02, 0.04),
        new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 })
      );
      groove.position.set(pondCenter.x - 14, 0.26, pondCenter.z - 8 + pl * 1.0);
      parkGroup.add(groove);
    }

    // Pier guardrails
    const railMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.6 });
    const rail1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.8, 10), railMat);
    rail1.position.set(pondCenter.x - 14 - 2.1, 0.65, pondCenter.z - 8);
    const rail2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.8, 10), railMat);
    rail2.position.set(pondCenter.x - 14 + 2.1, 0.65, pondCenter.z - 8);
    parkGroup.add(rail1, rail2);

    // 8. SOLAR TELEMETRY BUOY (生态水质水温水位智能浮标站)
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

    // 9. Pond Water Intake Pumping Station (河塘生态提水灌溉泵站)
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
      fountainParticles,
      fountainMeshList,
      fishList,
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

  // -------------------------------------------------------------
  // OPEN FARMLAND DEMO: Raised Soil Furrows with Crops & Drip Lines
  // (高标准露天有机蔬菜起垄栽培示范区)
  // -------------------------------------------------------------
  public static createVegetableDemoField(
    parent: THREE.Group,
    centerX: number,
    centerZ: number,
    width: number,
    length: number
  ) {
    const fieldGroup = new THREE.Group();
    fieldGroup.position.set(centerX, 0, centerZ);

    // Rich dark loam soil base
    const soilMat = new THREE.MeshStandardMaterial({
      color: 0x3e2817,
      roughness: 0.95,
    });
    const soilBase = new THREE.Mesh(new THREE.PlaneGeometry(width, length), soilMat);
    soilBase.rotation.x = -Math.PI / 2;
    soilBase.position.y = 0.01;
    soilBase.receiveShadow = true;
    fieldGroup.add(soilBase);

    // 12 Parallel Raised Soil Furrow Ridges (起垄泥土)
    const ridgeCount = 12;
    const ridgeSpacing = width / (ridgeCount + 1);
    const ridgeMat = new THREE.MeshStandardMaterial({
      color: 0x4a321e,
      roughness: 0.9,
    });
    const cropMat1 = new THREE.MeshStandardMaterial({ color: 0x4ade80, roughness: 0.6 }); // Bright lettuce
    const cropMat2 = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.6 }); // Fresh cabbage
    const cropMat3 = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.6 }); // Broccoli
    const pipeMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 }); // Black drip tape

    for (let i = 0; i < ridgeCount; i++) {
      const rx = -width / 2 + (i + 1) * ridgeSpacing;
      // Soil Ridge Mound
      const ridge = new THREE.Mesh(
        new THREE.CylinderGeometry(0.55, 0.75, length - 4, 8),
        ridgeMat
      );
      ridge.rotation.x = Math.PI / 2;
      ridge.position.set(rx, 0.18, 0);
      ridge.receiveShadow = true;
      fieldGroup.add(ridge);

      // Black Drip Irrigation Tube running along top of ridge
      const dripTube = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, length - 4, 6),
        pipeMat
      );
      dripTube.rotation.x = Math.PI / 2;
      dripTube.position.set(rx, 0.38, 0);
      fieldGroup.add(dripTube);

      // Neat rows of crops planted along each ridge
      const plantsPerRidge = 16;
      const cropMat = i % 3 === 0 ? cropMat1 : i % 3 === 1 ? cropMat2 : cropMat3;
      for (let p = 0; p < plantsPerRidge; p++) {
        const pz = -(length - 8) / 2 + (p / (plantsPerRidge - 1)) * (length - 8);
        const plant = new THREE.Mesh(new THREE.DodecahedronGeometry(0.28 + Math.random() * 0.08, 0), cropMat);
        plant.position.set(rx, 0.42, pz);
        plant.castShadow = true;
        fieldGroup.add(plant);
      }
    }

    // Modern Solar Pest Trap Lamp
    const lampMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.6 });
    const pestLamp = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.5, 8), lampMat);
    pestLamp.position.set(0, 1.75, -length / 2 + 2);
    const lampTop = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.08, 0.6), lampMat);
    lampTop.position.set(0, 3.5, -length / 2 + 2);
    const purpleLight = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xa855f7 })
    );
    purpleLight.position.set(0, 3.2, -length / 2 + 2);
    fieldGroup.add(pestLamp, lampTop, purpleLight);

    // Demonstration Area Signboard
    this.createRoadSign(fieldGroup, 0, length / 2 - 2, '露天高标准有机蔬菜起垄栽培示范田');

    parent.add(fieldGroup);
  }

  // -------------------------------------------------------------
  // ECOLOGICAL HIGH-DENSITY DWARF FRUIT TREE ORCHARD & PERGOLA
  // (生态矮化密植果树示范区与攀爬果蔬长廊)
  // -------------------------------------------------------------
  public static createFruitTreeOrchard(
    parent: THREE.Group,
    centerX: number,
    centerZ: number,
    width: number,
    length: number
  ) {
    const orchardGroup = new THREE.Group();
    orchardGroup.position.set(centerX, 0, centerZ);

    // 16 Fruit Trees in 4x4 Grid
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const tx = -width / 2 + 5 + col * (width / 4);
        const tz = -length / 2 + 8 + row * (length / 4.5);
        this.createFruitTree(orchardGroup, tx, 0, tz, col % 2 === 0);
      }
    }

    // Fruit Pergola Trellis (葡萄与瓜果立体攀爬廊架)
    const pergolaMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.8 });
    const pergolaGroup = new THREE.Group();
    pergolaGroup.position.set(0, 0, length / 2 - 10);
    // 8 posts
    for (let px = -5; px <= 5; px += 5) {
      for (let pz = -6; pz <= 6; pz += 4) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.8, 0.18), pergolaMat);
        post.position.set(px, 1.4, pz);
        pergolaGroup.add(post);
      }
    }
    // Overhead rafters
    for (let rz = -6.5; rz <= 6.5; rz += 1.3) {
      const rafter = new THREE.Mesh(new THREE.BoxGeometry(11, 0.1, 0.1), pergolaMat);
      rafter.position.set(0, 2.85, rz);
      pergolaGroup.add(rafter);
    }
    // Climbing foliage vine clusters on top
    const vineMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.6 });
    for (let v = 0; v < 14; v++) {
      const vx = (Math.random() - 0.5) * 9.5;
      const vz = (Math.random() - 0.5) * 11;
      const vine = new THREE.Mesh(new THREE.DodecahedronGeometry(0.65 + Math.random() * 0.4, 0), vineMat);
      vine.position.set(vx, 2.95, vz);
      pergolaGroup.add(vine);
    }
    orchardGroup.add(pergolaGroup);

    this.createRoadSign(orchardGroup, 0, length / 2 - 2, '现代矮化密植生态果园与立体展示区');
    parent.add(orchardGroup);
  }

  // -------------------------------------------------------------
  // CENTRAL SCENIC LAWN & FLOWERBED PLAZA
  // (中央迎宾生态花坛、景观草坪与休闲汀步)
  // -------------------------------------------------------------
  public static createCentralScenicPlaza(parent: THREE.Group) {
    const plazaGroup = new THREE.Group();
    plazaGroup.position.set(13.5, 0, -2);

    // Decorative Raised Circular Floral Display (中央环形迎宾花坛)
    const curbMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.5 });
    const flowerRingMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.7 });
    const ringCurb = new THREE.Mesh(new THREE.TorusGeometry(3.6, 0.22, 8, 32), curbMat);
    ringCurb.rotation.x = Math.PI / 2;
    ringCurb.position.y = 0.18;
    plazaGroup.add(ringCurb);

    // Inner soil
    const bed = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.6, 0.25, 32), flowerRingMat);
    bed.position.y = 0.12;
    plazaGroup.add(bed);

    // Blossom Clusters: Lavender Purple, Calendula Yellow, Scarlet Sage
    const flowerColors = [0x8b5cf6, 0xf59e0b, 0xef4444, 0xec4899];
    for (let f = 0; f < 32; f++) {
      const angle = (f / 32) * Math.PI * 2;
      const dist = 0.8 + Math.random() * 2.2;
      const col = flowerColors[f % flowerColors.length];
      const flMat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.4 });
      const bloom = new THREE.Mesh(new THREE.DodecahedronGeometry(0.32, 0), flMat);
      bloom.position.set(Math.cos(angle) * dist, 0.32, Math.sin(angle) * dist);
      plazaGroup.add(bloom);
    }

    // 4 Ornamental Spherical Boxwood Topiary Bushes (造型球状黄杨灌木)
    const boxwoodMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.45 });
    [[-5, -6], [-5, 6], [5, -6], [5, 6]].forEach(([bx, bz]) => {
      const bush = new THREE.Mesh(new THREE.SphereGeometry(0.85, 14, 14), boxwoodMat);
      bush.position.set(bx, 0.75, bz);
      bush.castShadow = true;
      plazaGroup.add(bush);
    });

    // Garden Slate Stepping Path (自然石质景观汀步)
    const paverMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.8 });
    for (let s = 0; s < 12; s++) {
      const sz = -12 + s * 2.2;
      const paver = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.06, 1.2), paverMat);
      paver.position.set(-1.2 + Math.sin(s * 0.8) * 0.4, 0.04, sz);
      paver.receiveShadow = true;
      plazaGroup.add(paver);
    }

    parent.add(plazaGroup);
  }

  // -------------------------------------------------------------
  // CAMPUS FORESTRY: Avenue Shade Trees & Perimeter Windbreak
  // (园区林荫大道行道树与外围生态防风林带)
  // -------------------------------------------------------------
  public static createCampusForestry(parent: THREE.Group) {
    // 1. Central Avenue Broadleaf Trees (沿中央主干道两侧行道树)
    const avenueTreeZs = [-95, -75, -50, -22, 6, 45, 68];
    avenueTreeZs.forEach((tz) => {
      // West side of avenue (X = 15.5)
      this.createBroadleafTree(parent, 15.5, 0, tz);
      // East side of avenue (X = 28.5)
      this.createBroadleafTree(parent, 28.5, 0, tz);
    });

    // 2. Perimeter Shelterbelt Windbreak Evergreens (四周防风隔离林)
    // North Boundary (Z = -120)
    for (let x = -120; x <= 120; x += 30) {
      this.createPineTree(parent, x, 0, -120);
    }
    // South Boundary (Z = 120)
    for (let x = -120; x <= 120; x += 30) {
      if (Math.abs(x - 22) > 15) { // Skip entrance road opening
        this.createPineTree(parent, x, 0, 120);
      }
    }
    // West Boundary (X = -120)
    for (let z = -100; z <= 100; z += 28) {
      this.createPineTree(parent, -120, 0, z);
    }
    // East Boundary (X = 120)
    for (let z = -100; z <= 100; z += 28) {
      this.createPineTree(parent, 120, 0, z);
    }
  }

  // -------------------------------------------------------------
  // TREE MODEL GENERATORS: Broadleaf, Pine, Willow, Fruit
  // -------------------------------------------------------------
  public static createBroadleafTree(parent: THREE.Group, x: number, y: number, z: number) {
    const treeGroup = new THREE.Group();
    treeGroup.position.set(x, y, z);

    // Tree curb planter
    const planterMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.7 });
    const planter = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.14, 2.4), planterMat);
    planter.position.y = 0.07;
    treeGroup.add(planter);

    // Trunk
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 0.9 });
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.35, 3.6, 8), woodMat);
    trunk.position.y = 1.8;
    trunk.castShadow = true;
    treeGroup.add(trunk);

    // Lush Layered Foliage Crown
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.6 });
    const leafMat2 = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.6 });
    const c1 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.9, 1), leafMat);
    c1.position.set(0, 4.2, 0);
    c1.castShadow = true;
    const c2 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.5, 1), leafMat2);
    c2.position.set(0.6, 5.0, 0.5);
    c2.castShadow = true;
    const c3 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.4, 1), leafMat);
    c3.position.set(-0.6, 4.8, -0.4);
    c3.castShadow = true;
    treeGroup.add(c1, c2, c3);

    parent.add(treeGroup);
  }

  public static createPineTree(parent: THREE.Group, x: number, y: number, z: number) {
    const treeGroup = new THREE.Group();
    treeGroup.position.set(x, y, z);

    // Trunk
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 });
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.32, 2.8, 8), trunkMat);
    trunk.position.y = 1.4;
    trunk.castShadow = true;
    treeGroup.add(trunk);

    // 3 Conical Evergreen Tiers
    const pineMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.7 });
    for (let tier = 0; tier < 3; tier++) {
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(2.4 - tier * 0.5, 2.4 - tier * 0.3, 8),
        pineMat
      );
      cone.position.y = 3.0 + tier * 1.5;
      cone.castShadow = true;
      treeGroup.add(cone);
    }

    parent.add(treeGroup);
  }

  public static createWillowTree(parent: THREE.Group, x: number, y: number, z: number) {
    const willowGroup = new THREE.Group();
    willowGroup.position.set(x, y, z);

    // Gnarled leaning trunk
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x422006, roughness: 0.85 });
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.45, 3.2, 8), trunkMat);
    trunk.position.set(0, 1.6, 0);
    trunk.rotation.z = 0.12;
    trunk.castShadow = true;
    willowGroup.add(trunk);

    // Weeping canopy clusters
    const willowMat = new THREE.MeshStandardMaterial({ color: 0x4ade80, roughness: 0.55 });
    const centerCanopy = new THREE.Mesh(new THREE.SphereGeometry(2.2, 10, 10), willowMat);
    centerCanopy.position.set(0.3, 4.0, 0);
    centerCanopy.scale.set(1.2, 0.8, 1.2);
    centerCanopy.castShadow = true;
    willowGroup.add(centerCanopy);

    // Drooping willow fronds dipping toward water
    for (let fr = 0; fr < 8; fr++) {
      const angle = (fr / 8) * Math.PI * 2;
      const frond = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.3, 2.2, 6), willowMat);
      frond.position.set(Math.cos(angle) * 1.8 + 0.3, 2.6, Math.sin(angle) * 1.8);
      frond.castShadow = true;
      willowGroup.add(frond);
    }

    parent.add(willowGroup);
  }

  public static createFruitTree(parent: THREE.Group, x: number, y: number, z: number, isApple: boolean) {
    const treeGroup = new THREE.Group();
    treeGroup.position.set(x, y, z);

    // Trunk
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x582f0e, roughness: 0.9 });
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 2.2, 8), trunkMat);
    trunk.position.y = 1.1;
    trunk.castShadow = true;
    treeGroup.add(trunk);

    // Foliage crown
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.55 });
    const crown = new THREE.Mesh(new THREE.DodecahedronGeometry(1.4, 1), leafMat);
    crown.position.y = 2.6;
    crown.castShadow = true;
    treeGroup.add(crown);

    // Hanging Fruits (Red Apples or Golden Oranges)
    const fruitColor = isApple ? 0xef4444 : 0xf59e0b;
    const fruitMat = new THREE.MeshStandardMaterial({ color: fruitColor, roughness: 0.3 });
    for (let f = 0; f < 12; f++) {
      const fa = (f / 12) * Math.PI * 2;
      const fruit = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), fruitMat);
      fruit.position.set(
        Math.cos(fa) * 1.1 + (Math.random() - 0.5) * 0.3,
        2.2 + (Math.random() - 0.5) * 0.6,
        Math.sin(fa) * 1.1 + (Math.random() - 0.5) * 0.3
      );
      treeGroup.add(fruit);
    }

    parent.add(treeGroup);
  }

  // -------------------------------------------------------------
  // POND DYNAMIC ANIMATION RUNTIME ENGINE
  // (水波动态起伏、曝气喷泉粒子轨迹、锦鲤游弋尾巴摆动、浮标浮沉)
  // -------------------------------------------------------------
  public static updatePond(subsystems: ParkSubsystems, elapsedTime: number) {
    // 1. Water waves vertex deformation & dynamic normal recalculation
    if (subsystems.waterMesh) {
      const posAttr = subsystems.waterMesh.geometry.attributes.position;
      const count = posAttr.count;
      for (let i = 0; i < count; i++) {
        const u = posAttr.getX(i);
        const v = posAttr.getY(i);
        const wave =
          Math.sin(u * 0.42 + elapsedTime * 2.6) * 0.07 +
          Math.cos(v * 0.48 + elapsedTime * 2.0) * 0.05 +
          Math.sin((u + v) * 0.28 + elapsedTime * 1.7) * 0.035;
        posAttr.setZ(i, wave);
      }
      posAttr.needsUpdate = true;
      subsystems.waterMesh.geometry.computeVertexNormals();
    }

    // 2. Buoy Bobbing & Beacon Pulse
    if (subsystems.buoy) {
      subsystems.buoy.position.y = -0.1 + Math.sin(elapsedTime * 2.2) * 0.045;
      subsystems.buoy.rotation.z = Math.sin(elapsedTime * 1.6) * 0.03;
      subsystems.buoy.rotation.x = Math.cos(elapsedTime * 1.8) * 0.03;
    }
    if (subsystems.beaconLight) {
      subsystems.beaconLight.intensity = Math.sin(elapsedTime * 5.0) > 0 ? 1.8 : 0.2;
    }

    // 3. Floating Aerator Fountain Spray Particles
    if (subsystems.fountainParticles) {
      const pos = subsystems.fountainParticles.geometry.attributes.position;
      const count = pos.count;
      for (let i = 0; i < count; i++) {
        const isF1 = i < count / 2;
        const originX = isF1 ? 35 : 49;
        const originZ = isF1 ? 40 : 48;
        const seed = i * 0.137;
        const t = (elapsedTime * 2.2 + seed) % 1.0; // Life progress: 0 to 1
        const angle = (i % 32) * ((Math.PI * 2) / 32) + seed;
        const spreadRadius = t * 2.8;
        const px = originX + Math.cos(angle) * spreadRadius;
        const pz = originZ + Math.sin(angle) * spreadRadius;
        // Parabolic arc height
        const py = -0.12 + Math.sin(t * Math.PI) * 2.2 - t * 0.4;
        pos.setXYZ(i, px, py, pz);
      }
      pos.needsUpdate = true;
    }

    // 4. Submerged Living Swimming Koi Fish
    if (subsystems.fishList) {
      for (const fish of subsystems.fishList) {
        const angle = fish.phase + elapsedTime * fish.speed;
        const x = fish.orbitCenter.x + Math.cos(angle) * fish.radiusX;
        const z = fish.orbitCenter.z + Math.sin(angle) * fish.radiusZ;
        const dx = -Math.sin(angle) * fish.radiusX;
        const dz = Math.cos(angle) * fish.radiusZ;
        const yaw = Math.atan2(dx, dz) + Math.PI / 2;

        fish.mesh.position.set(x, -0.48 + Math.sin(elapsedTime * 2.5 + fish.phase) * 0.03, z);
        fish.mesh.rotation.y = yaw;
        fish.tail.rotation.y = Math.sin(elapsedTime * 8.5 + fish.phase) * 0.45;
      }
    }
  }
}
