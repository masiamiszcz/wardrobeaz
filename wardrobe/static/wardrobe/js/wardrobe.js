console.log('Initializing main Three.js scene...');

// =======================
// INICJALIZACJA SCENY, KAMERY I RENDERERA
// =======================
const scene = new THREE.Scene();  
scene.background = new THREE.Color(0x1a1a1a);
const camera = new THREE.PerspectiveCamera(
  75, 
  window.innerWidth / window.innerHeight, 
  0.1, 
  1000
);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('canvas-container').appendChild(renderer.domElement);

// Tablica przechowująca wszystkie klikalne kule
const clickableSpheres = [];
// Zmienna dla aktualnie animowanej kuli
let currentAnimatingSphere = null;

// =======================
// TWORZENIE KULI Z PLUSIKIEM, FUNKCJA
// =======================
function addPlusSphere(position = new THREE.Vector3(0, 0, 0), posType = undefined, lastElement_x_end = null) {

  const sphereRadius = 0.25/2;
  const sphereGeometry = new THREE.SphereGeometry(sphereRadius, 16, 16);
  const sphereMaterial = new THREE.MeshBasicMaterial({
    color: 0xaaaaaa,
    transparent: true,
    opacity: 0.2,
    side: THREE.DoubleSide
  });
  const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
  sphere.position.copy(position);
  scene.add(sphere);

  // Dodajemy sprite z plusem do kuli
  function createPlusSprite(size) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 20;
    // Pozioma linia
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
    // Pionowa linia
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ 
      map: texture, 
      transparent: true, 
      depthTest: false 
    });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(size, size, 1);
    return sprite;
  }
  const plusSize = 0.2; // 0.32 m
  const plusSprite = createPlusSprite(plusSize);
  plusSprite.position.set(0, 0, 0);
  sphere.add(plusSprite);

  // Dodaj kulę do tablicy klikalnych obiektów
  clickableSpheres.push({sphere: sphere, pos: posType, lastElement_x_end: lastElement_x_end});
  return sphere;
}

addPlusSphere(new THREE.Vector3(0, 0, 0));

// ====================================
// INTERAKCJE – RAYCASTER, EVENTY MYSZY
// ====================================
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

let isAnimating = false;
let animationPhase = ''; // 'growing' lub 'shrinking'
let animationStartTime = 0;
const growDuration = 100;   // czas trwania powiększenia (w ms)
const shrinkDuration = 300; // czas trwania zmniejszania (w ms)


let specificSphere;
function onMouseClick(event) {
  // Obliczamy pozycję myszy w NDC
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  // Sprawdzamy wszystkie klikalne kule
  const spheres = clickableSpheres.map(obj => obj.sphere);
  const intersects = raycaster.intersectObjects(spheres);
  if (intersects.length > 0 && !isAnimating) {
    isAnimating = true;
    animationPhase = 'growing';
    animationStartTime = performance.now();
    // Ustawiamy aktualnie animowaną kulę na tę, którą kliknięto
    currentAnimatingSphere = intersects[0].object;
    const entry = clickableSpheres.find(entry => entry.sphere === currentAnimatingSphere);
    specificSphere = entry;
  }
}
window.addEventListener('click', onMouseClick, false);

// Obsługa ruchu myszy – zmiana kursora, jeśli najedziemy na kulę
function onMouseMove(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const spheres = clickableSpheres.map(obj => obj.sphere);
  const intersects = raycaster.intersectObjects(spheres);
  document.body.style.cursor = (intersects.length > 0) ? "pointer" : "default";
}
window.addEventListener('mousemove', onMouseMove, false);


//=================================
// Dostosowanie formularza do kuli 
//=================================

function adjustModalOptions() {
  const btnWis = document.querySelector(".btn-wiszaca");
  const btnDol = document.querySelector(".btn-dolna");
  const btnWys = document.querySelector(".btn-wysoka");

  if (specificSphere.pos === "down" || specificSphere.pos === "high") {
    // Dla kuli "down" pokazujemy przyciski dla szafki dolnej i wysokiej, ukrywamy szafkę wiszącą
    btnWis.classList.toggle("hidden", true);
    btnDol.classList.toggle("hidden", false);
    btnWys.classList.toggle("hidden", false);
  } else if (specificSphere.pos === "up") {
    // Dla kuli "up" pokazujemy tylko przycisk dla szafki wiszącej, ukrywamy pozostałe
    btnWis.classList.toggle("hidden", false);
    btnDol.classList.toggle("hidden", true);
    btnWys.classList.toggle("hidden", true);
  } else {
    // Jeśli typ nie został określony – pokazujemy wszystkie przyciski
    btnWis.classList.toggle("hidden", false);
    btnDol.classList.toggle("hidden", false);
    btnWys.classList.toggle("hidden", false);
  }
}


// ============================
// FUNCKJA TWORZACA NOWE PLUSY
// ============================

function addNewCabinetPluses() {
  const eldolna = getLastCabinetforCabinet("dolna", 250, 250);
  const elwiszaca = getLastCabinetforCabinet("wiszaca", 250, 250);
  const EleDolna = eldolna ? eldolna.clone() : null;
  const EleWiszaca = elwiszaca ? elwiszaca.clone() : null;
  let EleDolna_x_start;
  let EleDolna_x_end;
  let EleWiszaca_x_end;
  if(eldolna){
  EleDolna_x_start = EleDolna.position.x - EleDolna.userData.dimensions.width/2;
  EleDolna_x_end = EleDolna.position.x + EleDolna.userData.dimensions.width/2;
  }
  if(elwiszaca){
  EleWiszaca_x_end = EleWiszaca.position.x + EleWiszaca.userData.dimensions.width/2;
  }


  let dolnaVector = new THREE.Vector3(0, 0, 0);
  let wiszacaVector = new THREE.Vector3(0, 0, 0);
  let wysokaVector = new THREE.Vector3(0, 0, 0);
  if(eldolna && eldolna.userData.elementType === "wysoka") {
    dolnaVector = new THREE.Vector3(eldolna.position.x + eldolna.userData.dimensions.width/2 + 0.3, 0.5, 0);
    wiszacaVector = new THREE.Vector3(eldolna.position.x + eldolna.userData.dimensions.width/2 + 0.3, (wallHeight-360)/1000, 0);
    wysokaVector = new THREE.Vector3(eldolna.position.x - eldolna.userData.dimensions.width/2 + 0.3, eldolna.position.y + eldolna.userData.dimensions.height + 0.15, 0);
  }else{
    if(eldolna === null) {
      dolnaVector = new THREE.Vector3(0.3, 0.5, 0);
    }else{
      let posDolna = eldolna.clone();
      posDolna.position.x = posDolna.position.x + (posDolna.userData.dimensions.width / 2) + 0.3;
      posDolna.position.y = posDolna.position.y + posDolna.userData.dimensions.height/2;

      dolnaVector = posDolna.position.clone();
    }
    if(elwiszaca === null) {
      wiszacaVector = new THREE.Vector3(0.3, (wallHeight-360)/1000, 0);
    }else{
      let posWiszaca = elwiszaca.clone();
      posWiszaca.position.x = posWiszaca.position.x + (posWiszaca.userData.dimensions.width / 2) + 0.3;
      posWiszaca.position.y = posWiszaca.position.y + posWiszaca.userData.dimensions.height/2;

      wiszacaVector = posWiszaca.position.clone();
    }
  }

  let lastIsWysokaAndSpace = false;
  let cabinetList = getLatestCabinets();
  if(cabinetList.lower && cabinetList.hanging){
  if((cabinetList.lower.position.x > cabinetList.hanging.position.x )&& cabinetList.lower.userData.elementType === "wysoka"){
    lastIsWysokaAndSpace = true;
  }else{
    lastIsWysokaAndSpace = false;
  }}

  if(lastIsWysokaAndSpace) {
    addUniquePlusSphere(dolnaVector, "down", EleDolna_x_end);
    addUniquePlusSphere(wiszacaVector, "up", EleDolna_x_end);
    addUniquePlusSphere(wysokaVector, "high", EleDolna_x_start);

  }else{
  addUniquePlusSphere(dolnaVector, "down", EleDolna_x_end);
  addUniquePlusSphere(wiszacaVector, "up", EleWiszaca_x_end);
  }
  // (Opcjonalnie) Zamykamy modal, jeżeli chcesz, by po dodaniu elementu formularz zniknął:
  const modalContainer = document.getElementById("modal-container");
  if (modalContainer) {
    modalContainer.classList.add("hidden");
  }
}


// ================================================
// Funkcja sprawdzająca dostepność pozycji dla kuli 
// ===============================================

function addUniquePlusSphere(position, posType, lastElement_x_end, threshold = 0.025) {
  // Sprawdź, czy już istnieje kula w pobliżu zadanej pozycji

  for (let i = 0; i < clickableSpheres.length; i++) {
    let obj = clickableSpheres[i];
    if (obj.sphere.position.distanceTo(position) < threshold) {
      // Kula już istnieje, zwróć ją i nie dodawaj nowej
      return obj.sphere;
    }
  }
  console.log(clickableSpheres);
  // Jeśli nie znaleziono, dodaj nową kulę
  return addPlusSphere(position, posType, lastElement_x_end);
}


// =======================
// OŚWIETLENIE SCENY
// =======================
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);
const frontLight = new THREE.PointLight(0xffffff, 0.5);
frontLight.position.set(0, 2, 4);
scene.add(frontLight);
const leftLight = new THREE.PointLight(0xffffff, 0.3);
leftLight.position.set(-4, 2, 0);
scene.add(leftLight);

// =======================
// KONTROLKI ORBIT CONTROLS
// =======================
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// =======================
// ANIMACJA GŁÓWNEJ SCENY
// =======================
camera.position.set(0, 2, 5);
function animateMain() {
  requestAnimationFrame(animateMain);
  controls.update();
  
  if (isAnimating && currentAnimatingSphere) {
    const currentTime = performance.now();
    
    if (animationPhase === 'growing') {
      const elapsed = currentTime - animationStartTime;
      let factor = 1 + 0.2 * Math.min(1, elapsed / growDuration);
      currentAnimatingSphere.scale.set(factor, factor, factor);
      if (elapsed >= growDuration) {
        animationPhase = 'shrinking';
        animationStartTime = currentTime;
      }
    } else if (animationPhase === 'shrinking') {
      const elapsed = currentTime - animationStartTime;
      let factor = Math.max(0, 1.2 * (1 - elapsed / shrinkDuration));
      currentAnimatingSphere.scale.set(factor, factor, factor);
      if (elapsed >= shrinkDuration) {
        isAnimating = false;
        currentAnimatingSphere.scale.set(0, 0, 0);
        // Usunięcie animowanej kuli z tablicy clickableSpheres
        const index = clickableSpheres.indexOf(currentAnimatingSphere);
        if (index > -1) {
          clickableSpheres.splice(index, 1);
        }
        openModal();
        currentAnimatingSphere = null;
      }
    }
  }
  renderer.render(scene, camera);
}
animateMain();

// ====================
// Definicja materiałow
// ====================
const textureLoader = new THREE.TextureLoader();
const materials = {
  wood: {
    "0481_BS": new THREE.MeshPhongMaterial({
      map: textureLoader.load('/materials/0481_BS.jpg'),
      shininess: 30,
      specular: 0x222222
    }),
    "K003_PW": new THREE.MeshPhongMaterial({
      map: textureLoader.load('/materials/K003_PW.jpg'),
      shininess: 30,
      specular: 0x222222
    })
  }
};


// =============================
// Definicje zmiennych i stałych 
// =============================

let currentWardrobeMaterial = materials.wood.K003_PW;
let currentWardrobeType = null; // np. "korpus_uni", "korpus_uni_blat", etc.
let currentIncludeBackPanel = true;
let wardrobeDimensions = { width: 0.6, height: 0.9, depth: 0.510 };

let legsEnabled = false;
let selectedLegHeight = 0.1; // 100 mm

const PANEL_THICKNESS = 0.018;
let firstElementDepth = null;

let wallHeight = 2100;      // domyślnie 2100 mm
let wallOffset = 50;         // domyślnie 50 mm
let defaultGap = 450;       // domyślnie 450 mm (przerwa między szafkami)
const MIN_GAP = 350;
const MAX_WALL_HEIGHT = 2500;

const addedElements = {}; //Lista obiektów sceny


// ==================================
// Funckja tworzaca obiekt w three.js
// ==================================

function createWardrobe(dimensions, includeBackPanel = true, wardrobeType = null) {
  const panelHeight = dimensions.height - (legsEnabled ? selectedLegHeight : 0);
  const panelsGroup = new THREE.Group();
  
  // Dolny panel
  const bottomPanelWidth = dimensions.width - 2 * PANEL_THICKNESS;
  const bottomGeometry = new THREE.BoxGeometry(bottomPanelWidth, PANEL_THICKNESS, dimensions.depth);
  const bottomPanel = new THREE.Mesh(bottomGeometry, currentWardrobeMaterial.clone());
  bottomPanel.position.set(0, PANEL_THICKNESS / 2, 0);
  addEdges(bottomPanel);
  panelsGroup.add(bottomPanel);
  
  // Górny panel
  let topPanelDepth = dimensions.depth;
  let topPanelZOffset = 0;
  if (wardrobeType && wardrobeType.includes("blat")) {
    topPanelDepth = dimensions.depth + 0.02;
    topPanelZOffset = 0.01;
  }
  let topPanelWidth = dimensions.width;
  if (!(wardrobeType && wardrobeType.includes("blat"))) {
    topPanelWidth = dimensions.width - 2 * PANEL_THICKNESS;
  }
  const topGeometry = new THREE.BoxGeometry(topPanelWidth, PANEL_THICKNESS, topPanelDepth);
  const topPanel = new THREE.Mesh(topGeometry, currentWardrobeMaterial.clone());
  topPanel.position.set(0, panelHeight - PANEL_THICKNESS / 2, topPanelZOffset);
  addEdges(topPanel);
  panelsGroup.add(topPanel);
  
  // Panele boczne
  let sidePanelHeight, sidePanelY;
  if (wardrobeType && wardrobeType.includes("blat")) {
    sidePanelHeight = panelHeight - PANEL_THICKNESS;
    sidePanelY = panelHeight / 2 - PANEL_THICKNESS / 2;
  } else {
    sidePanelHeight = panelHeight;
    sidePanelY = panelHeight / 2;
  }
  const leftSideGeometry = new THREE.BoxGeometry(PANEL_THICKNESS, sidePanelHeight, dimensions.depth);
  const leftSidePanel = new THREE.Mesh(leftSideGeometry, currentWardrobeMaterial.clone());
  leftSidePanel.position.set(-dimensions.width / 2 + PANEL_THICKNESS / 2, sidePanelY, 0);
  addEdges(leftSidePanel);
  panelsGroup.add(leftSidePanel);
  
  const rightSideGeometry = new THREE.BoxGeometry(PANEL_THICKNESS, sidePanelHeight, dimensions.depth);
  const rightSidePanel = new THREE.Mesh(rightSideGeometry, currentWardrobeMaterial.clone());
  rightSidePanel.position.set(dimensions.width / 2 - PANEL_THICKNESS / 2, sidePanelY, 0);
  addEdges(rightSidePanel);
  panelsGroup.add(rightSidePanel);
  
  // Panel tylny
  let backMaterial;
  if (wardrobeType && wardrobeType.includes("pelne_plecy")) {
    backMaterial = includeBackPanel
    ? currentWardrobeMaterial.clone()
    : new THREE.MeshPhongMaterial({ color: 0xffffff, shininess: 30, specular: 0x222222 });
  } else {
    backMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff, shininess: 30, specular: 0x222222 });
  }
  const backGeometry = new THREE.BoxGeometry(
    dimensions.width - 2 * PANEL_THICKNESS,
    panelHeight - 2 * PANEL_THICKNESS,
    PANEL_THICKNESS
  );
  const backPanel = new THREE.Mesh(backGeometry, backMaterial);
  backPanel.position.set(0, panelHeight / 2, -dimensions.depth / 2 + PANEL_THICKNESS / 2);
  panelsGroup.add(backPanel);
  return panelsGroup;
}


//===============================================
// Funkcja dodająca krawędzie do obiektu three.js
//===============================================

function addEdges(mesh) {
  const edges = new THREE.EdgesGeometry(mesh.geometry);
  const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x000000 }));
  mesh.add(line);
}


//===========================================
// Funkcja dodająca nóżki do obiektu three.js
//===========================================

let legsGroup = null; // Przechowujemy grupę nóg globalnie, by nie dodawać ich wielokrotnie
let legModelTemplate = null; // Przechowujemy wczytany model nóg, by nie ładować go wielokrotnie

function addLegs(panelsGroup, dimensions) {
  let wardrobeParent = new THREE.Group();

  if (legsEnabled) {
    panelsGroup.position.y = selectedLegHeight;
    wardrobeParent.add(panelsGroup);

    // Jeśli nogi już istnieją, zmieniamy tylko ich pozycję
    if (legsGroup) {
      legsGroup.children.forEach((leg, index) => {
        const positions = calculateLegPositions(dimensions);
        leg.position.copy(positions[index]);
      });
    } else {
      legsGroup = new THREE.Group();

      const legFileName = 'media/' + (selectedLegHeight * 1000) + "mm.dae";
      const loader = new THREE.ColladaLoader();

      loader.load(legFileName, function(collada) {
        legModelTemplate = collada.scene;

        const positions = calculateLegPositions(dimensions);
        positions.forEach(pos => {
          const legClone = legModelTemplate.clone();
          legClone.position.copy(pos);
          legsGroup.add(legClone);
        });

        wardrobeParent.add(legsGroup);
      });
    }
    wardrobeParent.add(legsGroup);
  } else {
    wardrobeParent = panelsGroup;
  }
  
  return wardrobeParent;
}

function calculateLegPositions(dimensions) {
  const halfWidth = dimensions.width / 2;
  const halfDepth = dimensions.depth / 2;
  const offsetSide = 0.05;
  const offsetBack = 0.05;
  const offsetFront = 0.07;

  return [
    new THREE.Vector3(-halfWidth + offsetSide, 0, halfDepth - offsetFront),
    new THREE.Vector3(halfWidth - offsetSide, 0, halfDepth - offsetFront),
    new THREE.Vector3(-halfWidth + offsetSide, 0, -halfDepth + offsetBack),
    new THREE.Vector3(halfWidth - offsetSide, 0, -halfDepth + offsetBack)
  ];
}



// =======================
// OBSŁUGA ZMIANY ROZMIARU OKNA
// =======================

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});


console.log('Scene initialization complete.');


window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});


// =====================================
// Funkcja otwierająca modal (formularz)
// =====================================

function openModal() {
  adjustModalOptions();
  const modalContainer = document.getElementById("modal-container");
  const modalStep1 = document.getElementById("modal-step-1");
  const modalStep2 = document.getElementById("modal-step-2");
  if (modalStep1) {
    modalContainer.classList.remove("hidden");
    modalStep1.classList.remove("hidden");
    modalStep2.classList.add("hidden");
  }
}


// =======================
// MODAL – KONFIGURACJA ELEMENTU
// =======================

let modalPreviewScene, modalPreviewCamera, modalPreviewRenderer, modalPreviewWardrobe;
let modalOrbit;
let modalIsRotating = false;
let modalAnimationId;

let modalType = null;         // "wiszaca", "wysoka", "dolna"
let modalCabinetType = null;  // np. "korpus_uni", "korpus_uni_blat", etc.
let modalMaterial = null;     // np. "k003_pw", "o481_bs"
let modalCabinetName = null;  // pobierana z atrybutu alt

const typeMapping = {
  "wiszaca": "korpus_uni",
  "wysoka": "korpus_uni", 
  "dolna": "korpus_uni"
};

const modalContainer = document.getElementById("modal-container");
const modalStep1 = document.getElementById("modal-step-1");
const modalStep2 = document.getElementById("modal-step-2");

document.getElementById("openModalBtn").addEventListener("click", function() {
  modalContainer.classList.remove("hidden");
  modalStep1.classList.remove("hidden");
  modalStep2.classList.add("hidden");
});

document.getElementById("modalCloseBtn").addEventListener("click", function() {
  modalContainer.classList.add("hidden");
  cancelAnimationFrame(modalAnimationId);
  document.getElementById("modal-preview-container").innerHTML = "";
});

  let defaultMax = 1200;
  let x_start, x_end;
  let actualModalType;
  // WYBÓR TYPU SZAFKI (KROK 1)
  document.querySelectorAll(".type-btn").forEach(btn => {

    btn.addEventListener("click", function() {
      modalType = this.getAttribute("data-type");
      const legsToggle = document.getElementById("modalLegsToggle");
      const legsToggleContainer = document.querySelector(".modalLegsToggle");
      legsToggle.checked = false;

      document.querySelector("#modalWidth").min = 250;
      document.querySelector("#modalHeight").min = 250;
      
      if (modalType === "dolna") {
        actualModalType = modalType;
        legsToggleContainer.classList.remove("hidden");
        legsToggle.checked = true;
        
        let modalWidthValue = 600;
        let modalHeightValue = 900;

        let maxWidthValue = UpdateCabinetMaxWidth(actualModalType, modalHeightValue);

        modalWidthValue > maxWidthValue ? modalWidthValue = maxWidthValue : modalWidthValue;


        document.querySelector("#modalWidth").value = modalWidthValue;
        document.querySelector("#modalWidthValue").textContent = modalWidthValue + " mm";

        let maxHeightValue = UpdateCabinetMaxHeight(actualModalType, modalWidthValue);
        modalHeightValue > maxHeightValue ? modalHeightValue = maxHeightValue : modalHeightValue;

        document.querySelector("#modalHeight").value = modalHeightValue;
        document.querySelector("#modalHeightValue").textContent = modalHeightValue + " mm";
        
        document.querySelector("#modalDepth").value = 510;
        document.querySelector("#modalDepthValue").textContent = "510 mm";


      } else if (modalType === "wiszaca") {
        actualModalType = modalType;
        legsToggle.checked = false;
        legsToggleContainer.classList.add("hidden");

        let modalWidthValue = 600;
        let modalHeightValue = 700;

        let maxWidthValue = UpdateCabinetMaxWidth(actualModalType, modalHeightValue);

        modalWidthValue > maxWidthValue ? modalWidthValue = maxWidthValue : modalWidthValue;

        
        document.querySelector("#modalWidth").value = modalWidthValue;
        document.querySelector("#modalWidthValue").textContent = modalWidthValue + " mm";

        let maxHeightValue = UpdateCabinetMaxHeight(actualModalType, modalWidthValue);
        modalHeightValue > maxHeightValue ? modalHeightValue = maxHeightValue : modalHeightValue;

        document.querySelector("#modalHeight").value = modalHeightValue;
        document.querySelector("#modalHeightValue").textContent = modalHeightValue + " mm";
        
        document.querySelector("#modalDepth").value = 350;
        document.querySelector("#modalDepthValue").textContent = "350 mm";

      } else if (modalType === "wysoka") {
        actualModalType = modalType;
        legsToggleContainer.classList.remove("hidden");
        legsToggle.checked = true;

        let modalWidthValue = 600;
        let modalHeightValue = 1600;

        let maxWidthValue = UpdateCabinetMaxWidth(actualModalType, modalHeightValue);

        modalWidthValue > maxWidthValue ? modalWidthValue = maxWidthValue : modalWidthValue;

        document.querySelector("#modalWidth").value = modalWidthValue;
        document.querySelector("#modalWidthValue").textContent = modalWidthValue + " mm";

        let maxHeightValue = UpdateCabinetMaxHeight(actualModalType, modalWidthValue);
        modalHeightValue > maxHeightValue ? modalHeightValue = maxHeightValue : modalHeightValue;

        document.querySelector("#modalHeight").min = 1200;
        document.querySelector("#modalHeight").value = modalHeightValue;
        document.querySelector("#modalHeightValue").textContent = modalHeightValue + " mm";
        
        document.querySelector("#modalDepth").value = 510;
        document.querySelector("#modalDepthValue").textContent = "510 mm";

      }
      modalStep1.classList.add("hidden");
      modalStep2.classList.remove("hidden"); 
      initModalPreview();
      updateModalPreview();
      animateModalPreview();
    });
  });

// Obsługa wyboru rodzaju szafki – miniaturki (krok 2, lewa kolumna)
document.querySelectorAll(".cabinet-thumb").forEach(img => {
  img.addEventListener("click", function() {
    document.querySelectorAll(".cabinet-thumb").forEach(b => b.classList.remove("selected"));
    this.classList.add("selected");
    modalCabinetType = this.getAttribute("data-type");
    modalCabinetName = this.getAttribute("alt");
    updateModalPreview();
    animateModalPreview();
  });
});

// Obsługa wyboru materiału (krok 2, prawa kolumna)
document.querySelectorAll(".material-thumb").forEach(img => {
  img.addEventListener("click", function() {
    document.querySelectorAll(".material-thumb").forEach(i => i.classList.remove("selected"));
    this.classList.add("selected");
    modalMaterial = this.getAttribute("data-material");
    updateModalPreview();
    animateModalPreview();
  });
});

function initModalPreview() {
  const container = document.getElementById("modal-preview-container");
  container.innerHTML = "";
  modalPreviewScene = new THREE.Scene();
  modalPreviewScene.background = new THREE.Color(0x1a1a1a);
  modalPreviewCamera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
  modalPreviewRenderer = new THREE.WebGLRenderer({ antialias: true });
  modalPreviewRenderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(modalPreviewRenderer.domElement);

  modalPreviewCamera.position.set(0, 1, 2);
  modalPreviewCamera.lookAt(new THREE.Vector3(0, 0, 0));

  modalOrbit = new THREE.OrbitControls(modalPreviewCamera, modalPreviewRenderer.domElement);
  modalOrbit.enableDamping = true;
  modalOrbit.dampingFactor = 0.05;

  const amb = new THREE.AmbientLight(0xffffff, 0.6);
  modalPreviewScene.add(amb);
  const dir = new THREE.DirectionalLight(0xffffff, 0.8);
  dir.position.set(5, 5, 5);
  modalPreviewScene.add(dir);
}

function updateModalPreview() {
  const widthVal = parseFloat(document.getElementById("modalWidth").value);
  const rawHeightVal = parseFloat(document.getElementById("modalHeight").value);
  const depthVal = parseFloat(document.getElementById("modalDepth").value);

  let finalHeightVal = rawHeightVal;

  const modalDims = {
    width: widthVal / 1000,
    height: finalHeightVal / 1000,
    depth: depthVal / 1000
  };

  const legsToggle = document.getElementById("modalLegsToggle").checked;
  legsEnabled = legsToggle;
  if (legsToggle) {
    const legsHeightStr = document.getElementById("modalLegsHeight").value;
    selectedLegHeight = parseInt(legsHeightStr) / 1000;
  }

  currentWardrobeType = modalCabinetType 
    ? modalCabinetType 
    : (typeMapping[modalType] || "korpus_uni");

  currentIncludeBackPanel = (currentWardrobeType.indexOf("pelne_plecy") !== -1);

  currentWardrobeMaterial = materials.wood[modalMaterial]
    ? materials.wood[modalMaterial].clone()
    : materials.wood.K003_PW.clone();

  wardrobeDimensions = modalDims;

  if (modalPreviewWardrobe) {
    modalPreviewScene.remove(modalPreviewWardrobe);
  }
  modalPreviewWardrobe = createWardrobe(wardrobeDimensions, currentIncludeBackPanel, currentWardrobeType);
  let wardrobeFinal = addLegs(modalPreviewWardrobe, wardrobeDimensions);
  modalPreviewScene.add(wardrobeFinal);
}

document.getElementById("modalWidth").addEventListener("input", function() {
  document.querySelector("#modalWidthValue").textContent = this.value + " mm";
  let modalWidthValue = this.value;
  let maxheg = UpdateCabinetMaxHeight(actualModalType, modalWidthValue);
  updateModalPreview();
});
document.getElementById("modalHeight").addEventListener("input", function() {
  document.getElementById("modalHeightValue").textContent = this.value + " mm";
  let modalHeightValue = this.value;
  UpdateCabinetMaxWidth(actualModalType, modalHeightValue);
  updateModalPreview();
});
document.getElementById("modalDepth").addEventListener("input", function() {
  document.getElementById("modalDepthValue").textContent = this.value + " mm";
  updateModalPreview();
});
document.getElementById("modalLegsToggle").addEventListener("change", function() {
  document.getElementById("modalLegsHeightContainer").style.display = this.checked ? "block" : "none";
  updateModalPreview();
});
document.getElementById("modalLegsHeight").addEventListener("change", function() {
  updateModalPreview();
});
document.getElementById("modalRotationSpeed").addEventListener("input", function() {
  // Aktualizacja prędkości obrotu
});
document.getElementById("modalToggleRotation").addEventListener("click", function() {
  modalIsRotating = !modalIsRotating;
  this.textContent = modalIsRotating ? "Wyłącz obrót automatyczny" : "Włącz obrót automatyczny";
});

function animateModalPreview() {
  modalAnimationId = requestAnimationFrame(animateModalPreview);
  modalOrbit.update();
  if (modalPreviewWardrobe && modalIsRotating) {
    const rotSpeed = parseFloat(document.getElementById("modalRotationSpeed").value);
    modalPreviewWardrobe.rotation.y += rotSpeed;
  }
  modalPreviewRenderer.render(modalPreviewScene, modalPreviewCamera);
}


//===============================================
// Funkcja zwracająca największą głebokość szafki
//===============================================

function getCabinetMaxDepth() {
  let maxDepth = 0;
  Object.values(addedElements).forEach(el => {
    const d = el.userData.dimensions.depth;
    if(d > maxDepth) { maxDepth = d; }
  });
  return maxDepth;
}


//================================================================================
// Wyrównanie szafek od tyłu – wzgledem największej głębokości i offsetu od ściany
//================================================================================

function updateCabinetsZAlignment() {
  const cabinetMaxDepth = getCabinetMaxDepth();
  getAllCabinets("dolna").forEach(el => {
    el.position.z = parseFloat((-cabinetMaxDepth/2 + (el.userData.dimensions.depth)/2 + wallOffset/1000).toFixed(4));
  });
  getAllCabinets("wysoka").forEach(el => {
    el.position.z =  parseFloat((-cabinetMaxDepth/2 + (el.userData.dimensions.depth)/2 + wallOffset/1000).toFixed(4));
  });
  getAllCabinets("wiszaca").forEach(el => {
    el.position.z =  parseFloat((-cabinetMaxDepth/2 + (el.userData.dimensions.depth)/2).toFixed(4));
  });
}
  

// =====================================================
// Funckja zwracająca pierwszą szafkę - o najmniejszym x
// =====================================================
function getFirstCabinet() {
  let first = null;
  for (const key in addedElements) {
    const el = addedElements[key];
    if (first === null || el.position.x < first.position.x) {
      first = el;
    }
  }
  return first;
}


//=====================================================
// Funckja zwracająca wszystkie szafki okreslonego typu
//=====================================================

function getAllCabinets(cabinetType) {
  let cabinets = [];
  for (const key in addedElements) {
    const el = addedElements[key];
    if (el.userData.elementType === cabinetType) {
      cabinets.push(el);
    }
  }
  return cabinets;
}


//=====================================================
// Funckja zwracająca najwyższą szafkę okreslonego typu
//=====================================================

function getHighestCabinet(cabinetType) {
  let highest = null;
  getAllCabinets(cabinetType).forEach(el => {
    if (!highest || el.userData.dimensions.height > highest.userData.dimensions.height) {
      highest = el;
    }
  });
  return highest;
}


//============================================================================
// Podstawowa funckja, zwracająca ostatnią szafkę dla okreslonego typu  szafki
//============================================================================

function getLastCabinetforCabinet(cabinetType, width, height){
  let cabinets = getLatestCabinets();
  const cabinetMapping = {
    "dolna" : cabinets.lower,
    "wysoka" : cabinets.lower? cabinets.lower : cabinets.hanging,
    "wiszaca" : cabinets.hanging
  }
  let last = cabinetMapping[cabinetType];
  if(!last){
    return null;
  }
  let cab_wid = GetALLCabinetsInElWidth((last.position.x + last.userData.dimensions.width/2)*1000, (last.position.x + last.userData.dimensions.width/2)*1000 + width)

  let cabinetsInRange;
  if(cabinetType ==="wiszaca"){
    cabinetsInRange = getCabinetsInElHeight((last.position.y + last.userData.dimensions.height)*1000 - height, (last.position.y + last.userData.dimensions.height)*1000, cab_wid);
  }else{
    cabinetsInRange = getCabinetsInElHeight((last.position.y)*1000, last.position.y*1000 + height, cab_wid);
  }

  if(cabinetsInRange.length > 0){
    let newlast = cabinetsInRange.reduce((maxEl, el) =>
    (el.position.x+el.userData.dimensions.width/2) > (maxEl.position.x+maxEl.userData.dimensions.width/2) ? el : maxEl);
    return newlast;
  }else{
     return last;
  }
}


//========================================
// Funkcja zwracająca dwie ostatnie szafki
//========================================

function getLatestCabinets() {
  let lastHanging = null;
  for (const key in addedElements) {
    const el = addedElements[key];
    if (el.userData.elementType === "wiszaca" || (el.userData.elementType === "wysoka"& el.userData.dimensions.height > 1600)) {
      if (!lastHanging || el.position.x > lastHanging.position.x) {
        lastHanging = el;
      }
    }
  }
  let lastLower = null;
  for (const key in addedElements) {
    const el = addedElements[key];
    if (el.userData.elementType === "dolna" || el.userData.elementType === "wysoka") {
      if (!lastLower || el.position.x > lastLower.position.x) {
        lastLower = el;
      }
    }
  }
  return { hanging: lastHanging, lower: lastLower };
}


//==========================================
// Sprawdzanie czy są szafki w przedziale X-X
//==========================================

function GetALLCabinetsInElWidth(xStart, xEnd) {
    const eps = 0.01;
    const cabinetsInElWidth = [];
    for (const key in addedElements) {
      const el = addedElements[key];
      //console.log("pozycja sprawdzanego elementu w X : x, width/2, szafka docelowa: xstart, xend " + el.position.x*1000, el.userData.dimensions.width/2*1000, xStart, xEnd);
      if (((el.position.x - el.userData.dimensions.width/2)*1000 >= (xStart+eps) && (el.position.x-el.userData.dimensions.width/2)*1000<= (xEnd-eps)) || 
      ((el.position.x + el.userData.dimensions.width/2)*1000 >= (xStart+eps) && (el.position.x + el.userData.dimensions.width/2)*1000 <= (xEnd-eps)) ||
      ((el.position.x - el.userData.dimensions.width/2)*1000 <= (xStart+eps) && (el.position.x + el.userData.dimensions.width/2)*1000 >= (xEnd-eps))) {
        cabinetsInElWidth.push(el);
      }
    } 
      return cabinetsInElWidth;
    }


//==========================================
// Sprawdzanie czy są szafki w przedziale Y-Y
//==========================================
function GetALLCabinetsInElHeight(yStart, yEnd) {
  const eps = 0.01;
  const allCabinetsinElHeight = [];
  for(const key in addedElements){
    const el = addedElements[key];
    if(((el.position.y)*1000 >= (yStart+eps) && (el.position.y)*1000 <= (yEnd-eps)) ||
    ((el.position.y + el.userData.dimensions.height)*1000 >= (yStart+eps) && (el.position.y + el.userData.dimensions.height)*1000 <= (yEnd-eps)) ||
    ((el.position.y)*1000 <= (yStart+eps) && (el.position.y + el.userData.dimensions.height)*1000 >= (yEnd-eps))){
      allCabinetsinElHeight.push(el);
  }
  }
  return allCabinetsinElHeight;
}



//========================================================================
// Sprawdzanie czy są szafki w przedziale Y-Y, dla szafek w przedziale X-X
//========================================================================

function getCabinetsInElHeight(yStart, yEnd, cabinetsInElWidth=[]) {
    const eps = 0.01;
    const cabinetsInRange = [];
    
    cabinetsInElWidth.forEach(el => { 
        if (((el.position.y)*1000 >= (yStart+eps) && (el.position.y)*1000 <= (yEnd-eps)) ||
        ((el.position.y + el.userData.dimensions.height)*1000 >= (yStart+eps) && (el.position.y + el.userData.dimensions.height)*1000 <= (yEnd-eps)) ||
        ((el.position.y)*1000 <= (yStart+eps) && (el.position.y + el.userData.dimensions.height)*1000 >= (yEnd-eps))) {


            cabinetsInRange.push(el);
        }
    });  
    return cabinetsInRange;
}


//=========================================================
// Update max wysokości szafki, dla szafek w przedziale X-X
//=========================================================
// function updateCabinetMaxHeight(cabinetType, x_start, x_end){
//   cabinetType ==="wysoka" ? defaultMax = document.getElementById("wallHeight").value : defaultMax = 1200;
//   const cabinetsInElWidth = GetALLCabinetsInElWidth(x_start, x_end);
//   const maxExistingCabinetEl = cabinetsInElWidth.length > 0 ? 
//       cabinetsInElWidth.reduce((maxEl, el) =>
//           el.userData.dimensions.height > maxEl.userData.dimensions.height ? el : maxEl
//       ) : undefined;
//     if (maxExistingCabinetEl) {
//       const maxExistingCabinetHeight = Math.round(maxExistingCabinetEl.userData.dimensions.height * 1000);
//       if(maxExistingCabinetEl.userData.elementType === "wysoka"){
//         const maxHeight = (wallHeight - maxExistingCabinetHeight) > defaultMax ? defaultMax : wallHeight - maxExistingCabinetHeight;
//         document.getElementById("modalHeight").max = maxHeight.toString();
//         return maxHeight;
//       }else{
//           const maxHeight = (wallHeight - (maxExistingCabinetHeight + MIN_GAP) > defaultMax) 
//             ? defaultMax 
//             : wallHeight - (maxExistingCabinetHeight + MIN_GAP);
//           document.getElementById("modalHeight").max = maxHeight.toString();
//           return maxHeight;
//         }
//     } else {
//         document.getElementById("modalHeight").max = defaultMax.toString();
//         return defaultMax;
//       }
// }


//======================================
// aktualizacja max szerokosci
//======================================

function UpdateCabinetMaxWidth(modalType, height){
    let lastEL_x_end = specificSphere.lastElement_x_end ? specificSphere.lastElement_x_end : 0;
    let minimalGap = 350;
    defaultMax = 1200;
    if(modalType === "wiszaca")
    {
      let allCabinetsinHeight = GetALLCabinetsInElHeight(wallHeight-height-minimalGap, wallHeight);
      allCabinetsinHeight = allCabinetsinHeight.filter(el => 
        el.position.x + el.userData.dimensions.width / 2 > lastEL_x_end
      );      
      if(allCabinetsinHeight.length === 0){
        document.querySelector("#modalWidth").max = defaultMax;
        return defaultMax;
      }else {
       let minElX = allCabinetsinHeight.reduce((minElX, el) =>
          el.position.x-(el.userData.dimensions.width/2) < minElX.position.x-(minElX.userData.dimensions.width/2) ? el : minElX);
        let maxWidth = (minElX.position.x -(minElX.userData.dimensions.width/2) - lastEL_x_end)*1000;
        maxWidth>defaultMax?maxWidth = defaultMax : maxWidth;
        document.querySelector("#modalWidth").max = maxWidth;
        return maxWidth;
      }
    }else if(modalType==="dolna"){
      let allCabinetsinHeight = GetALLCabinetsInElHeight(0, +height+minimalGap);
      allCabinetsinHeight = allCabinetsinHeight.filter(el => 
        el.position.x + el.userData.dimensions.width / 2 > lastEL_x_end
      );
      if(allCabinetsinHeight.length === 0){
        document.querySelector("#modalWidth").max = defaultMax;
        return defaultMax;
      }else {
        let minElX = allCabinetsinHeight.reduce((minElX, el) =>
          el.position.x-(el.userData.dimensions.width/2) < minElX.position.x-(minElX.userData.dimensions.width/2) ? el : minElX);
        let maxWidth = (minElX.position.x -(minElX.userData.dimensions.width/2) - lastEL_x_end)*1000;
        maxWidth>defaultMax?maxWidth = defaultMax : maxWidth;
        document.querySelector("#modalWidth").max = maxWidth;
        return maxWidth;
      }
    }else if(modalType==="wysoka"){
      let allCabinetsinHeight = GetALLCabinetsInElHeight(0, height);
      allCabinetsinHeight = allCabinetsinHeight.filter(el => 
        el.position.x + el.userData.dimensions.width / 2 > lastEL_x_end
      );
      if(allCabinetsinHeight.length === 0){
        document.querySelector("#modalWidth").max = defaultMax;
        return defaultMax;
      }else {
        let minElX = allCabinetsinHeight.reduce((minElX, el) =>
          el.position.x-(el.userData.dimensions.width/2) < minElX.position.x-(minElX.userData.dimensions.width/2) ? el : minElX);
        let maxWidth = (minElX.position.x -(minElX.userData.dimensions.width/2) - lastEL_x_end)*1000;
        maxWidth>defaultMax?maxWidth = defaultMax : maxWidth;
        document.querySelector("#modalWidth").max = maxWidth;
        return maxWidth;
      }
    }
  }


//======================================
// aktualizacja max wysokosci
//======================================

function UpdateCabinetMaxHeight(modalType, width){
  let lastEL_x_end = specificSphere.lastElement_x_end ? specificSphere.lastElement_x_end : 0;
  let minimalGap = 350;
  defaultMax = 1200;
  if(modalType === "wiszaca"){ 
        let cabinetsInWidth = GetALLCabinetsInElWidth(lastEL_x_end*1000, lastEL_x_end*1000 + width);
        if(cabinetsInWidth.length === 0){
          document.querySelector("#modalHeight").max = defaultMax;
          return defaultMax;
        }else{
          let maxWysokaCab = cabinetsInWidth.reduce((maxH, el) =>
            el.userData.elementType === "wysoka" ? el.userData.dimensions.height > maxH.userData.dimensions.height ? el : maxH : maxH);
          let maxDolnaCab = cabinetsInWidth.reduce((maxH, el) =>
            el.userData.elementType === "dolna" ? el.userData.dimensions.height > maxH.userData.dimensions.height ? el : maxH : maxH);
          let maxHeight = maxWysokaCab.userData.dimensions.height*1000> maxDolnaCab.userData.dimensions.height*1000+minimalGap ? wallHeight-(maxWysokaCab.userData.dimensions.height*1000) : wallHeight-(maxDolnaCab.userData.dimensions.height*1000)-minimalGap;
          document.querySelector("#modalHeight").max = maxHeight;  
          return maxHeight;
        }}else if(modalType === "dolna"){
          let cabinetsInWidth = GetALLCabinetsInElWidth(lastEL_x_end*1000, lastEL_x_end*1000 + width);
          if(cabinetsInWidth.length === 0){
            document.querySelector("#modalHeight").max = defaultMax;
            return defaultMax;
          }else{
            // console.log(cabinetsInWidth);
          let maxWiszacaCab = cabinetsInWidth.reduce((maxH, el) =>
            el.userData.elementType === "wiszaca" ? el.userData.dimensions.height > maxH.userData.dimensions.height ? el : maxH : maxH);
          // console.log(maxWiszacaCab.userData.dimensions.height*1000);
          let maxHeigh = wallHeight - maxWiszacaCab.userData.dimensions.height*1000 - minimalGap;
          document.querySelector("#modalHeight").max = maxHeigh;
          return maxHeigh;
        }}else if(modalType === "wysoka"){
          let cabinetsInWidth = GetALLCabinetsInElWidth(lastEL_x_end*1000, lastEL_x_end*1000 + width);
          if(cabinetsInWidth.length === 0){
            document.querySelector("#modalHeight").max = wallHeight;
            return wallHeight;
          }else{
          let maxWiszacaCab = cabinetsInWidth.reduce((maxH, el) =>
            el.userData.elementType === "wiszaca" ? el.userData.dimensions.height > maxH.userData.dimensions.height ? el : maxH : maxH);
          let maxHeigh = wallHeight - maxWiszacaCab.userData.dimensions.height*1000;
          document.querySelector("#modalHeight").max = maxHeigh;
          return maxHeigh;
        }

  }
}



function addOffsetFromWall(){
  //TODO
}


//=====================================================
// Dodawanie elementów do listy i aktualizacja sliderów
//=====================================================

const elementListEl = document.getElementById("elementList");

function addElementToList(id) {
  const elementData = addedElements[id].userData;
  const dimensions = elementData.dimensions;
  const dimsStr = `${Math.round(dimensions.width * 1000)}x${Math.round(dimensions.height * 1000)}x${Math.round(dimensions.depth * 1000)} mm`;
  let legStr = "";
  if (elementData.legsEnabled) {
    legStr = `, nożki: ${Math.round(elementData.legHeight * 1000)} mm`;
  }
  const li = document.createElement("li");
  li.dataset.id = id;
  li.innerHTML = `<input type="checkbox"> ${id}. [${elementData.elementType}] ${elementData.name} (${elementData.idname}) – ${dimsStr}${legStr}`;
  elementListEl.appendChild(li);
  document.getElementById("elementListContainer").classList.remove("hidden");

  updateWallHeightSlider();
  updateWallOffsetSlider();
}


//=============================================
// Obsługa przycisku "Dodaj element do projektu"
//=============================================

let elementCounter = 1;
document.getElementById("modalAddElementBtn").addEventListener("click", function() {
  const newWardrobe = createWardrobe(wardrobeDimensions, currentIncludeBackPanel, currentWardrobeType);
  newWardrobe.rotation.y = 0;

  const legsActive = document.getElementById("modalLegsToggle").checked;

  //Element Listy
  newWardrobe.userData = {
    id: elementCounter,
    elementType: modalType,
    name: modalCabinetName || (modalCabinetType ? modalCabinetType : (typeMapping[modalType] || "korpus_uni")),
    idname: modalCabinetType || (typeMapping[modalType] || "korpus_uni"),
    dimensions: Object.assign({}, wardrobeDimensions),
    legsEnabled: legsActive,
    hide_nogi: legsActive ? 0 : 1,
    legHeight: legsActive ? selectedLegHeight : 0,
    offset: { x: 0, y: 0, z: 0 },
    panelThickness: PANEL_THICKNESS,
    material: modalMaterial || "K003_PW"
  };
//===============================================================
// Pozycjonowanie – ustawiamy nowe X tak, aby pierwsza szafka (dolna lub wisząca) zaczynała od tej samej linii (od lewego boku)
//===============================================================
  let newX = 0;
  const cabinetWidth = wardrobeDimensions.width;
  const cabinetHeight = wardrobeDimensions.height;
  console.log(specificSphere.lastElement_x_end);
  const lastCabinet_x_end = specificSphere.lastElement_x_end;
  if(lastCabinet_x_end){
      newX = lastCabinet_x_end + (cabinetWidth / 2);
    } else { 
      const firstCabinet = getFirstCabinet(); 
      if (firstCabinet) {
        if(firstCabinet.userData.elementType ==="wysoka")
        {
          if(wallHeight/1000 - firstCabinet.userData.dimensions.height  < cabinetHeight)
            {
              newX = firstCabinet.position.x + (firstCabinet.userData.dimensions.width / 2) + (cabinetWidth / 2);
            }else{  
              newX = cabinetWidth / 2;
            }
        } else{
        newX = firstCabinet.position.x - (firstCabinet.userData.dimensions.width / 2) + (cabinetWidth / 2);
        }
      } else {
        newX = cabinetWidth / 2;
      }
    }
      
  newWardrobe.position.set(newX, 0, 0);

  scene.add(newWardrobe);
  addedElements[elementCounter] = newWardrobe;
  addElementToList(elementCounter++);

  // Po dodaniu szafki, wyrównujemy wszystkie szafki od tyłu
  updateCabinetsZAlignment();

  cancelAnimationFrame(modalAnimationId);
  document.getElementById("modal-preview-container").innerHTML = "";
  modalContainer.classList.add("hidden");
  modalType = null;
  modalCabinetType = null;
  modalMaterial = null;
  legsGroup=null;
  addNewCabinetPluses();
});

// =======================
// FUNKCJE I OBSŁUGA MENU EDYCJI ŚCIANY MEBLI
// =======================

  function updateWallHeightSlider() {
    const wallHeightContainer = document.getElementById("wallHeightContainer");
    const wallOffsetContainer = document.getElementById("wallOffsetContainer");
    
    // Obliczamy maksymalne wartości wysokości dla dolnych i wiszących szafek (w mm)
    let maxLower = 0;
    let maxHanging = 0;
    let maxHigh = 0;
    getAllCabinets('wysoka').forEach(el => {
        let h = Math.round(el.userData.dimensions.height * 1000);
        if (h > maxHigh) maxHigh = h;});

    getAllCabinets('dolna').forEach(el => {
        let h = Math.round(el.userData.dimensions.height * 1000);
        if (h > maxLower) maxLower = h;});

    getAllCabinets('wiszaca').forEach(el => {
        let h = Math.round(el.userData.dimensions.height * 1000);
        if (h > maxHanging) maxHanging = h;});

  
  // Jeśli mamy zarówno dolne, jak i wiszące, minimalna wysokość = maxLower + maxHanging + MIN_GAP.
  let minWallHeight;
  if (maxLower > 0 && maxHanging > 0) {
    Lower_hanging_gap = maxLower + maxHanging + MIN_GAP;
    minWallHeight = Math.max(Lower_hanging_gap, maxHigh);

    minWallHeight>MAX_WALL_HEIGHT ? minWallHeight=2500 : minWallHeight;
  } else if (maxHanging > 0) {
    minWallHeight = maxHanging;
  } else {
    minWallHeight = maxLower;
  }
  
  const wallSlider = document.getElementById("wallHeight");
  wallSlider.min = minWallHeight;
  wallSlider.max = MAX_WALL_HEIGHT;
  wallHeightContainer
  // Ustaw domyślną wartość ściany na 2100 mm, chyba że minimalna wartość jest większa
  wallSlider.value = Math.max(2100, minWallHeight);
  
  wallHeight = parseInt(wallSlider.value);
  document.getElementById("wallHeightValue").textContent = wallHeight + " mm";
  wallHeightContainer.classList.remove("hidden");
  wallOffsetContainer.classList.remove("hidden");
  
  // Aktualizujemy pozycję każdej wiszącej szafki, aby jej górna krawędź była na poziomie ściany
  Object.values(addedElements).forEach(el => {
    if (el.userData.elementType === "wiszaca") {
      const hangHeight = Math.round(el.userData.dimensions.height * 1000);
      el.position.y = (wallHeight - hangHeight) / 1000;
    }
  });
}


//======================================================
// Nasłuchiwanie zmiany wartości suwaka wysokości ściany
//======================================================

document.getElementById("wallHeight").addEventListener("input", function() {
  wallHeight = parseInt(this.value);
  document.getElementById("wallHeightValue").textContent = wallHeight + " mm";
  Object.values(addedElements).forEach(el => {
    if (el.userData.elementType === "wiszaca") {
      const hangHeight = Math.round(el.userData.dimensions.height * 1000);
      el.position.y = (wallHeight - hangHeight) / 1000;
    }
  });
});


//=================================================
// Nasłuchiwanie zmiany suwaka odsunięcia od ściany
//=================================================

function updateWallOffsetSlider(){
  document.getElementById("wallOffset").addEventListener("input", function() {
    wallOffset = parseInt(this.value);
    document.getElementById("wallOffsetValue").textContent = wallOffset + " mm";
    updateCabinetsZAlignment();
});
}


// ========================================
// USUWANIE ELEMENTÓW – MODAL POTWIERDZENIA
// ========================================
const deleteModal = document.getElementById("deleteModal");
const deleteElementListEl = document.getElementById("deleteElementList");

document.getElementById("deleteSelectedBtn").addEventListener("click", function() {
  deleteElementListEl.innerHTML = "";
  const selectedItems = [];
  document.querySelectorAll("#elementList li").forEach(li => {
    const checkbox = li.querySelector("input[type='checkbox']");
    if (checkbox && checkbox.checked) {
      selectedItems.push(li.dataset.id);
      const liClone = li.cloneNode(true);
      deleteElementListEl.appendChild(liClone);
    }
  });
  if (selectedItems.length === 0) {
    return;
  }
  deleteModal.classList.remove("hidden");
});

document.getElementById("deleteCancelBtn").addEventListener("click", function() {
  deleteModal.classList.add("hidden");
});

document.getElementById("deleteConfirmBtn").addEventListener("click", function() {
  document.querySelectorAll("#elementList li").forEach(li => {
    const checkbox = li.querySelector("input[type='checkbox']");
    if (checkbox && checkbox.checked) {
      const id = li.dataset.id;
      if (addedElements[id]) {
        scene.remove(addedElements[id]);
        delete addedElements[id];
      }
      li.remove();
    }
  });

  const remainingLis = document.querySelectorAll("#elementList li");
  let newAddedElements = {};
  let newIndex = 1;

  remainingLis.forEach(li => {
    let oldId = li.dataset.id;
    let elementData = addedElements[oldId].userData;
    const dims = elementData.dimensions;
    const dimsStr = `${Math.round(dims.width * 1000)}x${Math.round(dims.height * 1000)}x${Math.round(dims.depth * 1000)} mm`;
    const legStr = `nożki: ${Math.round(elementData.legHeight * 1000)} mm`;
    li.dataset.id = newIndex;
    li.innerHTML = `<input type="checkbox"> ${newIndex}. [${elementData.elementType}] ${elementData.name} (${elementData.idname}) – ${dimsStr}, ${legStr}`;

    addedElements[oldId].userData.id = newIndex;
    newAddedElements[newIndex] = addedElements[oldId];
    newIndex++;
  });

  for (const key in addedElements) {
    delete addedElements[key];
  }
  Object.assign(addedElements, newAddedElements);
  elementCounter = remainingLis.length + 1;

  deleteModal.classList.add("hidden");
  if (!elementListEl.hasChildNodes()) {
    document.getElementById("elementListContainer").classList.add("hidden");
  }
});



// =================================================
// ZAPISYWANIE SCENY DO PLIKU, PRZESYŁANIE NA BACKEND
// =================================================

document.getElementById("SaveButton").addEventListener("click", function () {
  console.log("Kliknięto przycisk zapisu.");
  console.log("wczytanie listy");
  console.log(addedElements.toString());
  SendListToBackEnd();
});

function SendListToBackEnd(){
  
  const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
  let added_elements = [];
  for (const key in addedElements) {
    let eltolist = {};
    let eltoenc = addedElements[key];
    eltolist = { 
      key: key,
      userData: eltoenc.userData, 
      position: eltoenc.position, 
      scale: eltoenc.scale, 
      wallOffset: wallOffset
    };
    added_elements.push(eltolist);
  }
  let data = {
    added_elements: added_elements 
  };

  fetch('/process_list/', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken,
    },
    body: JSON.stringify(data)
})
.then(response => {
  if(response.ok) console.log("Lista wyslana. "+ response);
});
}