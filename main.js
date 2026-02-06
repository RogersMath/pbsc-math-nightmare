// --- CONFIGURATION ---
const config = {
    moveSpeed: 0.2,
    rotSpeed: 0.05,
    cameraDist: 10,      // Further back
    cameraHeight: 8,     // Higher up to see over player
    fireballSpeed: 1.2,
    skeletonSpeed: 0.075,
    skeletonSpawnRate: 150, // frames
    fogColor: 0x050505
};

const state = {
    hp: 100,
    score: 0,
    isGameOver: false,
    frameCount: 0,
    
    // Math State
    currentProblem: { txt: "2 + 2", ans: 4 },
    currentInput: ""
};

// Input state
let keys = { w: false, a: false, s: false, d: false };

// Three.js Globals
let scene, camera, renderer, player;
let playerParts = {}; 
let walkCycle = 0;
let skeletons = [];
let fireballs = [];

// --- INIT ---
function init() {
    // 1. Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(config.fogColor);
    scene.fog = new THREE.Fog(config.fogColor, 10, 60);

    // 2. Camera (Steeper angle)
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);

    // 3. Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0x404050, 0.5); 
    scene.add(ambientLight);

    const moonLight = new THREE.DirectionalLight(0x99ccff, 0.5);
    moonLight.position.set(-20, 60, -20);
    moonLight.castShadow = true;
    moonLight.shadow.mapSize.width = 2048;
    moonLight.shadow.mapSize.height = 2048;
    scene.add(moonLight);

    // Player torch
    const playerLight = new THREE.PointLight(0xffaa55, 0.8, 18);
    playerLight.position.set(0, 4, 0);
    scene.add(playerLight);

    // 5. Build World
    createEnvironment();
    createCharacter();
    
    // 6. Generate first math problem
    generateMathProblem();

    // 7. Events
    window.addEventListener('resize', onResize);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.getElementById('restart-btn').addEventListener('click', resetGame);

    // 8. Start Loop
    animate();
}

// --- MATH SYSTEM ---
function generateMathProblem() {
    const ops = ['+', '-'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let n1, n2, ans;

    // Scale difficulty slightly with score
    const range = 10 + Math.floor(state.score / 500) * 5; 

    if (op === '+') {
        n1 = Math.floor(Math.random() * range) + 5;
        n2 = Math.floor(Math.random() * range) + 5;
        ans = n1 + n2;
    } else {
        n1 = Math.floor(Math.random() * range) + 10;
        n2 = Math.floor(Math.random() * (n1 - 2)) + 1; // Ensure positive result
        ans = n1 - n2;
    }

    state.currentProblem = { txt: `${n1} ${op} ${n2}`, ans: ans };
    state.currentInput = "";
    updateMathHUD();
}

function handleMathInput(key) {
    if (state.isGameOver) return;

    // Numbers
    if (key >= '0' && key <= '9') {
        if (state.currentInput.length < 4) {
            state.currentInput += key;
            updateMathHUD();
        }
    }
    // Backspace
    else if (key === 'Backspace') {
        state.currentInput = state.currentInput.slice(0, -1);
        updateMathHUD();
    }
    // Enter / Execute
    else if (key === 'Enter') {
        checkAnswer();
    }
}

function checkAnswer() {
    const val = parseInt(state.currentInput);
    if (val === state.currentProblem.ans) {
        castFireball();
        generateMathProblem();
    } else {
        // Wrong answer visual feedback
        const box = document.getElementById('math-hud');
        box.style.borderColor = 'red';
        setTimeout(() => box.style.borderColor = '#88ccff', 200);
        state.currentInput = "";
        updateMathHUD();
    }
}

function updateMathHUD() {
    document.getElementById('problem-text').textContent = state.currentProblem.txt;
    document.getElementById('input-text').textContent = state.currentInput;
}

// --- GAMEPLAY ACTIONS ---

function resetGame() {
    // Reset State
    state.hp = 100;
    state.score = 0;
    state.isGameOver = false;
    state.frameCount = 0;
    state.currentInput = "";
    keys = { w: false, a: false, s: false, d: false };

    // Clear Entities
    skeletons.forEach(s => scene.remove(s.mesh));
    skeletons = [];
    fireballs.forEach(f => scene.remove(f.mesh));
    fireballs = [];

    // Reset Player Pos
    player.position.set(0, 0, 0);
    player.rotation.set(0, 0, 0);

    // Reset UI
    document.getElementById('game-over').classList.add('hidden');
    document.getElementById('score-display').textContent = "0";
    document.getElementById('hp-bar').style.width = "100%";
    
    generateMathProblem();
}

function castFireball() {
    const ball = new THREE.Mesh(
        new THREE.SphereGeometry(0.4, 8, 8), 
        new THREE.MeshBasicMaterial({ color: 0xffaa00 })
    );
    
    ball.position.copy(player.position);
    ball.position.y += 2.5;
    
    // Shoot forward relative to player
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(player.quaternion);
    ball.position.add(forward.clone().multiplyScalar(1.5));
    
    const light = new THREE.PointLight(0xffaa00, 1, 10);
    ball.add(light);
    
    scene.add(ball);
    
    fireballs.push({ 
        mesh: ball, 
        velocity: forward.multiplyScalar(config.fireballSpeed), 
        life: 100 
    });
}

function spawnSkeleton() {
    const skelGroup = new THREE.Group();
    
    const angle = Math.random() * Math.PI * 2;
    const r = 40 + Math.random() * 10;
    skelGroup.position.set(
        player.position.x + Math.cos(angle) * r,
        0,
        player.position.z + Math.sin(angle) * r
    );

    const boneMat = new THREE.MeshStandardMaterial({ color: 0xcccccc });
    const spine = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.4, 0.3), boneMat);
    spine.position.y = 1.9; spine.castShadow = true;
    skelGroup.add(spine);

    const skull = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.4, 0.35), boneMat);
    skull.position.y = 2.8;
    skelGroup.add(skull);

    // Eyes
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const e1 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.1), eyeMat);
    e1.position.set(-0.1, 2.8, 0.15); skelGroup.add(e1);
    const e2 = e1.clone();
    e2.position.set(0.1, 2.8, 0.15); skelGroup.add(e2);

    scene.add(skelGroup);
    skeletons.push({ mesh: skelGroup });
}

// --- CORE UPDATES ---

function updateGame() {
    if (state.isGameOver) return;
    
    state.frameCount++;
    if (state.frameCount % config.skeletonSpawnRate === 0) spawnSkeleton();

    // 1. Movement
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(player.quaternion);
    
    if (keys.w) player.position.add(forward.clone().multiplyScalar(config.moveSpeed));
    if (keys.s) player.position.add(forward.clone().multiplyScalar(-config.moveSpeed));
    if (keys.a) player.rotation.y += config.rotSpeed;
    if (keys.d) player.rotation.y -= config.rotSpeed;

    animateCharacter();

    // 2. Camera (Chase High)
    const idealOffset = new THREE.Vector3(0, config.cameraHeight, config.cameraDist);
    idealOffset.applyMatrix4(player.matrixWorld);
    camera.position.lerp(idealOffset, 0.08); // Slightly softer follow
    camera.lookAt(player.position.clone().add(new THREE.Vector3(0, 1, 0)));

    // 3. Fireballs
    for (let i = fireballs.length - 1; i >= 0; i--) {
        const fb = fireballs[i];
        fb.mesh.position.add(fb.velocity);
        fb.life--;

        let hit = false;
        for (let j = skeletons.length - 1; j >= 0; j--) {
            const skel = skeletons[j];
            if (fb.mesh.position.distanceTo(skel.mesh.position) < 3.0) {
                // Kill Skeleton
                scene.remove(skel.mesh);
                skeletons.splice(j, 1);
                hit = true;
                
                // Score
                state.score += 100;
                document.getElementById('score-display').textContent = state.score;
                break;
            }
        }

        if (hit || fb.life <= 0) {
            scene.remove(fb.mesh);
            fireballs.splice(i, 1);
        }
    }

    // 4. Skeletons
    for (let i = 0; i < skeletons.length; i++) {
        const skel = skeletons[i].mesh;
        skel.lookAt(player.position);
        skel.translateZ(config.skeletonSpeed);

        if (skel.position.distanceTo(player.position) < 1.5) {
            state.hp -= 1; // Drain HP fast if touching
            document.getElementById('hp-bar').style.width = state.hp + "%";
            
            // Push skeleton back slightly so they don't stack inside player
            skel.translateZ(-0.5);

            if (state.hp <= 0) {
                state.isGameOver = true;
                document.getElementById('final-score').textContent = "Final Score: " + state.score;
                document.getElementById('game-over').classList.remove('hidden');
            }
        }
    }
}

function animateCharacter() {
    const isMoving = keys.w || keys.s;
    if (isMoving) {
        walkCycle += 0.2;
        const angle = Math.sin(walkCycle) * 0.6;
        playerParts.leftLegGroup.rotation.x = angle;
        playerParts.rightLegGroup.rotation.x = -angle;
        playerParts.leftArmGroup.rotation.x = -angle;
        playerParts.rightArmGroup.rotation.x = angle;
    } else {
        playerParts.leftLegGroup.rotation.x *= 0.9;
        playerParts.rightLegGroup.rotation.x *= 0.9;
        playerParts.leftArmGroup.rotation.x *= 0.9;
        playerParts.rightArmGroup.rotation.x *= 0.9;
    }
}

// --- ASSETS & HELPERS ---

function createEnvironment() {
    const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(300, 300),
        new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.9 })
    );
    plane.rotation.x = -Math.PI / 2;
    plane.receiveShadow = true;
    scene.add(plane);

    // Trees
    for (let i = 0; i < 60; i++) {
        const x = (Math.random() - 0.5) * 200;
        const z = (Math.random() - 0.5) * 200;
        if (Math.abs(x) < 10 && Math.abs(z) < 10) continue;

        const tree = new THREE.Group();
        tree.position.set(x, 0, z);
        const trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(0.3, 0.5, 6, 6),
            new THREE.MeshStandardMaterial({ color: 0x111111 })
        );
        trunk.position.y = 3; trunk.castShadow = true;
        tree.add(trunk);
        const branch = new THREE.Mesh(
            new THREE.ConeGeometry(0.2, 4, 4),
            new THREE.MeshStandardMaterial({ color: 0x111111 })
        );
        branch.position.set(0, 4, 0); branch.rotation.z = 0.5;
        tree.add(branch);
        scene.add(tree);
    }
}

function createCharacter() {
    player = new THREE.Group();
    // Reusing the detailed construction from before
    const armMat = new THREE.MeshStandardMaterial({ color: 0x22222a });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xd4a574 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0xe0e0e0 });

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.3, 0.5), armMat);
    torso.position.y = 2.15; torso.castShadow = true;
    playerParts.torso = torso;
    player.add(torso);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.5, 0.5), skinMat);
    head.position.y = 1; torso.add(head);

    const hair = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.6), hairMat);
    hair.position.set(0, 0.1, 0.05); head.add(hair);
    const pony = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.4, 0.2), hairMat);
    pony.position.set(0, -0.3, 0.35); pony.rotation.x = 0.2; hair.add(pony);

    // Swords
    const s1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.6, 0.08), new THREE.MeshStandardMaterial({color:0x443322}));
    s1.position.set(-0.15, 0.2, -0.3); s1.rotation.z = -0.4; torso.add(s1);
    const s2 = s1.clone(); s2.position.set(0.15, 0.2, -0.3); s2.rotation.z = 0.4; torso.add(s2);

    // Limbs
    const legGeo = new THREE.BoxGeometry(0.38, 1.3, 0.38);
    const lLeg = new THREE.Group(); lLeg.position.set(-0.25, 1.5, 0);
    const lMesh = new THREE.Mesh(legGeo, armMat); lMesh.position.y = -0.65;
    lLeg.add(lMesh); player.add(lLeg); playerParts.leftLegGroup = lLeg;

    const rLeg = new THREE.Group(); rLeg.position.set(0.25, 1.5, 0);
    const rMesh = new THREE.Mesh(legGeo, armMat); rMesh.position.y = -0.65;
    rLeg.add(rMesh); player.add(rLeg); playerParts.rightLegGroup = rLeg;

    const armGeo = new THREE.BoxGeometry(0.32, 1.1, 0.32);
    const lArm = new THREE.Group(); lArm.position.set(-0.65, 0.5, 0);
    const laMesh = new THREE.Mesh(armGeo, armMat); laMesh.position.y = -0.4;
    lArm.add(laMesh); torso.add(lArm); playerParts.leftArmGroup = lArm;

    const rArm = new THREE.Group(); rArm.position.set(0.65, 0.5, 0);
    const raMesh = new THREE.Mesh(armGeo, armMat); raMesh.position.y = -0.4;
    rArm.add(raMesh); torso.add(rArm); playerParts.rightArmGroup = rArm;

    scene.add(player);
}

// --- EVENTS ---

function onKeyDown(e) {
    if (state.isGameOver) {
        if (e.key.toLowerCase() === 'r') resetGame();
        return;
    }

    // Math Input (Digits, Backspace, Enter)
    if ((e.key >= '0' && e.key <= '9') || e.key === 'Backspace' || e.key === 'Enter') {
        handleMathInput(e.key);
        return;
    }

    // Movement (WASD / Arrows)
    const k = e.key.toLowerCase();
    if (k === 'w' || k === 'arrowup') keys.w = true;
    if (k === 's' || k === 'arrowdown') keys.s = true;
    if (k === 'a' || k === 'arrowleft') keys.a = true;
    if (k === 'd' || k === 'arrowright') keys.d = true;
}

function onKeyUp(e) {
    const k = e.key.toLowerCase();
    if (k === 'w' || k === 'arrowup') keys.w = false;
    if (k === 's' || k === 'arrowdown') keys.s = false;
    if (k === 'a' || k === 'arrowleft') keys.a = false;
    if (k === 'd' || k === 'arrowright') keys.d = false;
}

function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    updateGame();
    renderer.render(scene, camera);
}

// Start
init();
