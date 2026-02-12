// Character Asset System
// Each character is a factory function that returns a THREE.Group with standardized attachment points

const CHARACTERS = {
    // Attachment points that game logic expects:
    // - torso (for arm attachment)
    // - leftLegGroup, rightLegGroup (for walk animation)
    // - leftArmGroup, rightArmGroup (for walk animation)
    // - fireballOrigin (Vector3 position where spells cast from)

    chicken: () => {
        const chicken = new THREE.Group();
        
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0xff8800 });
        const headMat = new THREE.MeshStandardMaterial({ color: 0xffaa00 });
        const legMat = new THREE.MeshStandardMaterial({ color: 0xccaa00 });

        // Rotund chicken body
        const body = new THREE.Mesh(
            new THREE.SphereGeometry(0.6, 8, 8),
            bodyMat
        );
        body.scale.set(1, 0.8, 1.2); // Elongated for chicken shape
        body.position.y = 1.5;
        body.castShadow = true;
        chicken.attach(body);

        // Head (smaller, rounder)
        const head = new THREE.Mesh(
            new THREE.SphereGeometry(0.3, 8, 8),
            headMat
        );
        head.position.set(0, 2.2, 0.8);
        chicken.add(head);

        // Comb on top of head
        const comb = new THREE.Mesh(
            new THREE.ConeGeometry(0.15, 0.4, 4),
            new THREE.MeshStandardMaterial({ color: 0xff3333 })
        );
        comb.position.set(0, 2.6, 0.8);
        comb.rotation.z = 0.3;
        chicken.add(comb);

        // Beak
        const beak = new THREE.Mesh(
            new THREE.ConeGeometry(0.1, 0.3, 4),
            new THREE.MeshStandardMaterial({ color: 0xffcc00 })
        );
        beak.position.set(0, 2.0, 1.1);
        beak.rotation.z = Math.PI / 2;
        chicken.add(beak);

        // Wings (simplified, attached to body for flapping animation potential)
        const wingMat = new THREE.MeshStandardMaterial({ color: 0xff7700 });
        const lWing = new THREE.Mesh(
            new THREE.BoxGeometry(0.2, 0.6, 0.4),
            wingMat
        );
        lWing.position.set(-0.5, 1.8, 0);
        lWing.rotation.z = 0.3;
        lWing.castShadow = true;
        chicken.add(lWing);

        const rWing = lWing.clone();
        rWing.position.x = 0.5;
        rWing.rotation.z = -0.3;
        chicken.add(rWing);

        // Legs
        const legGeo = new THREE.BoxGeometry(0.15, 0.8, 0.15);
        
        const lLeg = new THREE.Group();
        lLeg.position.set(-0.3, 0.9, 0);
        const lLegMesh = new THREE.Mesh(legGeo, legMat);
        lLegMesh.position.y = -0.4;
        lLegMesh.castShadow = true;
        lLeg.add(lLegMesh);
        chicken.add(lLeg);

        const rLeg = new THREE.Group();
        rLeg.position.set(0.3, 0.9, 0);
        const rLegMesh = new THREE.Mesh(legGeo, legMat);
        rLegMesh.position.y = -0.4;
        rLegMesh.castShadow = true;
        rLeg.add(rLegMesh);
        chicken.add(rLeg);

        // Feet
        const footGeo = new THREE.BoxGeometry(0.25, 0.1, 0.3);
        const lFoot = new THREE.Mesh(footGeo, legMat);
        lFoot.position.set(-0.3, 0.1, 0);
        lFoot.castShadow = true;
        chicken.add(lFoot);

        const rFoot = lFoot.clone();
        rFoot.position.x = 0.3;
        chicken.add(rFoot);

        // Store animation groups
        chicken.leftLegGroup = lLeg;
        chicken.rightLegGroup = rLeg;
        chicken.leftArmGroup = lWing; // Wings animate like arms for walk cycle
        chicken.rightArmGroup = rWing;
        chicken.torso = body; // For attachment compatibility
        chicken.fireballOrigin = new THREE.Vector3(0, 2.0, 1.2); // From beak

        return chicken;
    },

    warrior: () => {
        // Original Witcher-style character
        const player = new THREE.Group();
        const armMat = new THREE.MeshStandardMaterial({ color: 0x22222a });
        const skinMat = new THREE.MeshStandardMaterial({ color: 0xd4a574 });
        const hairMat = new THREE.MeshStandardMaterial({ color: 0xe0e0e0 });

        const torso = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.3, 0.5), armMat);
        torso.position.y = 2.15;
        torso.castShadow = true;
        player.add(torso);

        const head = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.5, 0.5), skinMat);
        head.position.y = 1;
        torso.add(head);

        const hair = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.6), hairMat);
        hair.position.set(0, 0.1, 0.05);
        head.add(hair);
        const pony = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.4, 0.2), hairMat);
        pony.position.set(0, -0.3, 0.35);
        pony.rotation.x = 0.2;
        hair.add(pony);

        // Swords
        const s1 = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, 1.6, 0.08),
            new THREE.MeshStandardMaterial({ color: 0x443322 })
        );
        s1.position.set(-0.15, 0.2, -0.3);
        s1.rotation.z = -0.4;
        torso.add(s1);
        const s2 = s1.clone();
        s2.position.set(0.15, 0.2, -0.3);
        s2.rotation.z = 0.4;
        torso.add(s2);

        // Limbs
        const legGeo = new THREE.BoxGeometry(0.38, 1.3, 0.38);
        const lLeg = new THREE.Group();
        lLeg.position.set(-0.25, 1.5, 0);
        const lMesh = new THREE.Mesh(legGeo, armMat);
        lMesh.position.y = -0.65;
        lLeg.add(lMesh);
        player.add(lLeg);

        const rLeg = new THREE.Group();
        rLeg.position.set(0.25, 1.5, 0);
        const rMesh = new THREE.Mesh(legGeo, armMat);
        rMesh.position.y = -0.65;
        rLeg.add(rMesh);
        player.add(rLeg);

        const armGeo = new THREE.BoxGeometry(0.32, 1.1, 0.32);
        const lArm = new THREE.Group();
        lArm.position.set(-0.65, 0.5, 0);
        const laMesh = new THREE.Mesh(armGeo, armMat);
        laMesh.position.y = -0.4;
        lArm.add(laMesh);
        torso.add(lArm);

        const rArm = new THREE.Group();
        rArm.position.set(0.65, 0.5, 0);
        const raMesh = new THREE.Mesh(armGeo, armMat);
        raMesh.position.y = -0.4;
        rArm.add(raMesh);
        torso.add(rArm);

        player.leftLegGroup = lLeg;
        player.rightLegGroup = rLeg;
        player.leftArmGroup = lArm;
        player.rightArmGroup = rArm;
        player.torso = torso;
        player.fireballOrigin = new THREE.Vector3(0, 2.5, 0); // From hand area

        return player;
    },

    wizard: () => {
        // Pointy-hatted spellcaster
        const wizard = new THREE.Group();
        const robeMat = new THREE.MeshStandardMaterial({ color: 0x4444dd });
        const skinMat = new THREE.MeshStandardMaterial({ color: 0xd4a574 });
        const hatMat = new THREE.MeshStandardMaterial({ color: 0x222244 });

        // Robe body (cone shape)
        const robe = new THREE.Mesh(
            new THREE.ConeGeometry(0.7, 1.4, 8),
            robeMat
        );
        robe.position.y = 1.5;
        robe.castShadow = true;
        wizard.add(robe);

        // Head
        const head = new THREE.Mesh(
            new THREE.SphereGeometry(0.35, 8, 8),
            skinMat
        );
        head.position.y = 2.4;
        wizard.add(head);

        // Pointy hat
        const hat = new THREE.Mesh(
            new THREE.ConeGeometry(0.5, 1.0, 8),
            hatMat
        );
        hat.position.y = 3.3;
        wizard.add(hat);

        // Staff
        const staffMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
        const shaft = new THREE.Mesh(
            new THREE.CylinderGeometry(0.08, 0.08, 2.0, 6),
            staffMat
        );
        shaft.position.set(0.5, 1.5, 0);
        shaft.castShadow = true;
        wizard.add(shaft);

        const orb = new THREE.Mesh(
            new THREE.SphereGeometry(0.25, 8, 8),
            new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0xffff00 })
        );
        orb.position.set(0.5, 3.2, 0);
        wizard.add(orb);

        // Sleeves as arm indicators
        const sleeveGeo = new THREE.BoxGeometry(0.25, 0.9, 0.25);
        const lSleeve = new THREE.Group();
        lSleeve.position.set(-0.5, 2.0, 0);
        const lSleeveM = new THREE.Mesh(sleeveGeo, robeMat);
        lSleeveM.position.y = -0.4;
        lSleeve.add(lSleeveM);
        wizard.add(lSleeve);

        const rSleeve = new THREE.Group();
        rSleeve.position.set(0.5, 2.0, 0);
        const rSleeveM = new THREE.Mesh(sleeveGeo, robeMat);
        rSleeveM.position.y = -0.4;
        rSleeve.add(rSleeveM);
        wizard.add(rSleeve);

        // Legs hidden under robe but still animate
        const lLeg = new THREE.Group();
        lLeg.position.set(-0.25, 0.9, 0);
        const lLegM = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.0, 0.2), skinMat);
        lLegM.position.y = -0.5;
        lLeg.add(lLegM);
        wizard.add(lLeg);

        const rLeg = new THREE.Group();
        rLeg.position.set(0.25, 0.9, 0);
        const rLegM = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.0, 0.2), skinMat);
        rLegM.position.y = -0.5;
        rLeg.add(rLegM);
        wizard.add(rLeg);

        wizard.leftLegGroup = lLeg;
        wizard.rightLegGroup = rLeg;
        wizard.leftArmGroup = lSleeve;
        wizard.rightArmGroup = rSleeve;
        wizard.torso = robe;
        wizard.fireballOrigin = new THREE.Vector3(0.5, 3.2, 0); // From staff orb

        return wizard;
    }
};
