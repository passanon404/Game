import React, { useRef, useState, useEffect, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { GamePhase, ControlConfig, PlayerStats, EnemyState, BossState, FireballState, PotionState } from '../types';

interface GameCanvasProps {
  phase: GamePhase;
  setPhase: (phase: GamePhase) => void;
  controls: ControlConfig;
  stats: PlayerStats;
  setStats: React.Dispatch<React.SetStateAction<PlayerStats>>;
  boss: BossState | null;
  setBoss: React.Dispatch<React.SetStateAction<BossState | null>>;
}

// Global keyboard input reference to avoid React rendering lags
const keysPressed: { [key: string]: boolean } = {};

// Direct window listeners for high performance
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', (e) => {
    keysPressed[e.code] = true;
  });
  window.addEventListener('keyup', (e) => {
    keysPressed[e.code] = false;
  });
}

// -------------------------------------------------------------
// GROUND COMPONENT (Tiled textured plane)
// -------------------------------------------------------------
function Ground() {
  const texture = useTexture('https://res.cloudinary.com/dsucg33fv/image/upload/v1782439980/ground_d1kjrx.png');
  
  // Apply tiling as requested ("ทำ tiling เล็กหน่อย")
  useMemo(() => {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(20, 20);
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
  }, [texture]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
      <planeGeometry args={[60, 60]} />
      <meshBasicMaterial map={texture} />
    </mesh>
  );
}

// -------------------------------------------------------------
// GAME LOOP AND SIMULATION ENGINE
// -------------------------------------------------------------
interface GameEngineProps {
  controls: ControlConfig;
  stats: PlayerStats;
  setStats: React.Dispatch<React.SetStateAction<PlayerStats>>;
  boss: BossState | null;
  setBoss: React.Dispatch<React.SetStateAction<BossState | null>>;
  setPhase: (phase: GamePhase) => void;
}

function GameEngine({ controls, stats, setStats, boss, setBoss, setPhase }: GameEngineProps) {
  const { camera, scene } = useThree();

  // Load Sprites textures
  const playerTex = useTexture('https://raw.githubusercontent.com/banyapon/banyapon.github.io/refs/heads/main/studio/images/player.png');
  const enemyTex = useTexture('https://raw.githubusercontent.com/banyapon/banyapon.github.io/refs/heads/main/studio/images/enemy.png');
  const potionTex = useTexture('https://raw.githubusercontent.com/banyapon/banyapon.github.io/refs/heads/main/studio/images/potion.png');
  const bossTex = useTexture('https://res.cloudinary.com/dsucg33fv/image/upload/v1782709455/boss_e8jti1.png');

  // Clone textures so each can animate independently
  const pTexture = useMemo(() => {
    const t = playerTex.clone();
    t.needsUpdate = true;
    t.minFilter = THREE.NearestFilter;
    t.magFilter = THREE.NearestFilter;
    return t;
  }, [playerTex]);

  const eTexture = useMemo(() => {
    const t = enemyTex.clone();
    t.needsUpdate = true;
    t.minFilter = THREE.NearestFilter;
    t.magFilter = THREE.NearestFilter;
    return t;
  }, [enemyTex]);

  const bTexture = useMemo(() => {
    const t = bossTex.clone();
    t.needsUpdate = true;
    t.minFilter = THREE.NearestFilter;
    t.magFilter = THREE.NearestFilter;
    return t;
  }, [bossTex]);

  // Game references
  const playerRef = useRef<THREE.Sprite>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const hitBoxRef = useRef<THREE.Mesh>(null);

  // Simulation state stored in useRef for fast reading/writing in frames
  const sim = useRef({
    player: {
      pos: new THREE.Vector3(0, 0.7, 0),
      facingDir: new THREE.Vector3(0, 0, 1),
      facingLeft: false,
      isAttacking: false,
      attackTimer: 0,
      attackId: 0,
      immunityTimer: 0,
      skillCooldown: 0,
      // For walking animations
      animFrame: 0,
      animTimer: 0,
      animRow: 0, // 0: Idle, 1: Walk, 2: Attack, 3: Dance
    },
    enemies: [] as EnemyState[],
    potions: [] as PotionState[],
    fireballs: [] as FireballState[],
    boss: null as BossState | null,
    ring: {
      active: false,
      scale: 0.1,
      maxScale: 6.0,
      timer: 0,
    },
    hitbox: {
      active: false,
      pos: new THREE.Vector3(),
      timer: 0,
    },
    spawnTimer: 0,
    kills: 0,
    warpActive: false,
    warpPos: new THREE.Vector3(0, 0, 0),
  });

  // Local React states for rendering non-player dynamic elements
  const [enemies, setEnemies] = useState<EnemyState[]>([]);
  const [potions, setPotions] = useState<PotionState[]>([]);
  const [fireballs, setFireballs] = useState<FireballState[]>([]);
  const [warpPortal, setWarpPortal] = useState<{ active: boolean; pos: [number, number, number] }>({ active: false, pos: [0, 0, 0] });

  // Initialize Game positions and clear inputs
  useEffect(() => {
    // Spawn 2 initial potions
    sim.current.potions = [
      { id: 'p1', position: [Math.random() * 20 - 10, 0.5, Math.random() * 20 - 10], collected: false },
      { id: 'p2', position: [Math.random() * 20 - 10, 0.5, Math.random() * 20 - 10], collected: false },
    ];
    setPotions([...sim.current.potions]);
    
    // Reset keys
    Object.keys(keysPressed).forEach(k => keysPressed[k] = false);
  }, []);

  // Sync state stats up to HUD once a while or on critical changes
  const updateStatsReact = () => {
    setStats((prev) => ({
      ...prev,
      kills: sim.current.kills,
      skillCooldown: sim.current.player.skillCooldown,
    }));
  };

  // -------------------------------------------------------------
  // ANIMATION SPRITESHEET HELPER
  // -------------------------------------------------------------
  const updateTextureCoords = (texture: THREE.Texture, col: number, row: number, cols: number, rows: number) => {
    const sizeX = 1 / cols;
    const sizeY = 1 / rows;
    texture.repeat.set(sizeX, sizeY);
    texture.offset.set(col * sizeX, (rows - 1 - row) * sizeY);
  };

  // -------------------------------------------------------------
  // CORE FRAME LOOP
  // -------------------------------------------------------------
  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1); // Cap dt to prevent weird physics jumps

    // 1. Immunity frame blinking
    if (sim.current.player.immunityTimer > 0) {
      sim.current.player.immunityTimer -= dt;
      if (playerRef.current) {
        // Simple blinking
        playerRef.current.visible = Math.floor(state.clock.elapsedTime * 15) % 2 === 0;
      }
    } else {
      if (playerRef.current) playerRef.current.visible = true;
    }

    // 2. Skill cooldown timer
    if (sim.current.player.skillCooldown > 0) {
      sim.current.player.skillCooldown = Math.max(0, sim.current.player.skillCooldown - dt * 1000);
      updateStatsReact();
    }

    // -------------------------------------------------------------
    // PLAYER CONTROLS & MOVEMENT
    // -------------------------------------------------------------
    let dx = 0;
    let dz = 0;

    // Movement mappings based on either WASD / Arrows
    if (keysPressed[controls.moveUp] || keysPressed['ArrowUp']) dz -= 1;
    if (keysPressed[controls.moveDown] || keysPressed['ArrowDown']) dz += 1;
    if (keysPressed[controls.moveLeft] || keysPressed['ArrowLeft']) dx -= 1;
    if (keysPressed[controls.moveRight] || keysPressed['ArrowRight']) dx += 1;

    const isMoving = dx !== 0 || dz !== 0;

    // Attack Trigger (P Key)
    if (keysPressed[controls.attack] && !sim.current.player.isAttacking) {
      sim.current.player.isAttacking = true;
      sim.current.player.attackTimer = 0.25; // 0.25s duration
      sim.current.player.animRow = 2; // Attack Animation
      sim.current.player.animFrame = 0;
      sim.current.player.animTimer = 0;
      sim.current.player.attackId++;

      // Deploy visual hitbox in front
      sim.current.hitbox.active = true;
      sim.current.hitbox.timer = 0.15;
      sim.current.hitbox.pos.copy(sim.current.player.pos).addScaledVector(sim.current.player.facingDir, 1.4);
      if (hitBoxRef.current) {
        hitBoxRef.current.position.copy(sim.current.hitbox.pos);
        hitBoxRef.current.visible = true;
      }

      // Check hits immediately
      sim.current.enemies.forEach((enemy) => {
        if (enemy.isDead) return;
        const enemyPos = new THREE.Vector3(...enemy.position);
        const dist = enemyPos.distanceTo(sim.current.hitbox.pos);
        if (dist < 1.8) {
          handleEnemyDamage(enemy);
        }
      });

      // Check if boss can be hit
      if (sim.current.boss && sim.current.boss.health > 0) {
        const bossPos = new THREE.Vector3(...sim.current.boss.position);
        const dist = bossPos.distanceTo(sim.current.hitbox.pos);
        if (dist < 2.5) {
          handleBossDamage();
        }
      }
    }

    // Skill Trigger (O Key - Ring Expand)
    if (keysPressed[controls.skill] && sim.current.player.skillCooldown === 0 && !sim.current.ring.active) {
      sim.current.player.skillCooldown = stats.skillMaxCooldown;
      sim.current.ring.active = true;
      sim.current.ring.scale = 0.1;
      sim.current.ring.timer = 0.6; // duration 0.6s
      sim.current.player.animRow = 3; // Dance/Skill trigger row
      sim.current.player.animFrame = 0;
      sim.current.player.animTimer = 0;
      
      // Update HUD stats
      updateStatsReact();
    }

    // Update Hitbox timer
    if (sim.current.hitbox.active) {
      sim.current.hitbox.timer -= dt;
      if (sim.current.hitbox.timer <= 0) {
        sim.current.hitbox.active = false;
        if (hitBoxRef.current) hitBoxRef.current.visible = false;
      }
    }

    // Expanding Ring Skill logic
    if (sim.current.ring.active) {
      sim.current.ring.timer -= dt;
      sim.current.ring.scale += dt * 10.0; // Grows up to ~6.0
      
      if (ringRef.current) {
        ringRef.current.scale.set(sim.current.ring.scale, sim.current.ring.scale, 1);
        ringRef.current.visible = true;
      }

      // Damage enemies in ring path
      sim.current.enemies.forEach((enemy) => {
        if (enemy.isDead) return;
        const enemyPos = new THREE.Vector3(...enemy.position);
        const dist = enemyPos.distanceTo(sim.current.player.pos);
        if (dist <= sim.current.ring.scale + 0.5 && dist >= sim.current.ring.scale - 1.2) {
          // Double-damage or instant defeat for standard enemies
          handleEnemyDamage(enemy);
        }
      });

      // Damage boss in ring path
      if (sim.current.boss && sim.current.boss.health > 0) {
        const bossPos = new THREE.Vector3(...sim.current.boss.position);
        const dist = bossPos.distanceTo(sim.current.player.pos);
        if (dist <= sim.current.ring.scale + 0.8) {
          handleBossDamage();
        }
      }

      if (sim.current.ring.timer <= 0) {
        sim.current.ring.active = false;
        if (ringRef.current) ringRef.current.visible = false;
      }
    }

    // Resolve Player movement if not locked in heavy animation (like Skill)
    if (!sim.current.ring.active) {
      if (sim.current.player.isAttacking) {
        sim.current.player.attackTimer -= dt;
        if (sim.current.player.attackTimer <= 0) {
          sim.current.player.isAttacking = false;
          sim.current.player.animRow = 0;
        }
      }

      if (isMoving && !sim.current.player.isAttacking) {
        const move = new THREE.Vector3(dx, 0, dz).normalize();
        sim.current.player.facingDir.copy(move);
        sim.current.player.pos.addScaledVector(move, dt * 5.0); // Player Speed: 5.0
        
        // Boundaries
        sim.current.player.pos.x = Math.max(-28, Math.min(28, sim.current.player.pos.x));
        sim.current.player.pos.z = Math.max(-28, Math.min(28, sim.current.player.pos.z));

        sim.current.player.facingLeft = dx < 0 ? true : dx > 0 ? false : sim.current.player.facingLeft;
        sim.current.player.animRow = 1; // Walk Animation
      } else if (!sim.current.player.isAttacking) {
        sim.current.player.animRow = 0; // Idle Animation
      }
    }

    // Update Player position ref
    if (playerRef.current) {
      playerRef.current.position.copy(sim.current.player.pos);
      // Horizontal Mirroring
      playerRef.current.scale.x = sim.current.player.facingLeft ? -1.3 : 1.3;
      playerRef.current.scale.y = 1.3;
    }

    // Player Spritesheet Animation Cycle
    sim.current.player.animTimer += dt;
    const frameSpeed = sim.current.player.isAttacking ? 0.05 : 0.15; // "เล่น Animation ไวขึ้น" when attack
    if (sim.current.player.animTimer >= frameSpeed) {
      sim.current.player.animTimer = 0;
      sim.current.player.animFrame = (sim.current.player.animFrame + 1) % 4;
    }
    updateTextureCoords(pTexture, sim.current.player.animFrame, sim.current.player.animRow, 4, 4);

    // -------------------------------------------------------------
    // ENEMY AI, PHYSICS AND SPAWNING
    // -------------------------------------------------------------
    sim.current.spawnTimer += dt;
    const spawnInterval = sim.current.kills >= 10 ? 2.5 : 1.5; // Spawn slightly slower when boss is alive
    if (sim.current.spawnTimer >= spawnInterval) {
      sim.current.spawnTimer = 0;
      spawnEnemy();
    }

    // Process all enemies
    const updatedEnemies = sim.current.enemies.map((enemy) => {
      if (enemy.isDead) return enemy;

      const ePos = new THREE.Vector3(...enemy.position);

      // Handle custom knockback physics
      if (enemy.isKnockback) {
        enemy.knockbackTimer -= dt;
        const kbDir = new THREE.Vector3(...enemy.knockbackDirection);
        ePos.addScaledVector(kbDir, enemy.knockbackForce * dt);
        enemy.knockbackForce = Math.max(0, enemy.knockbackForce - dt * 15.0); // friction
        
        if (enemy.knockbackTimer <= 0) {
          enemy.isKnockback = false;
        }
      } else {
        // Normal pathfinding towards player
        const toPlayer = new THREE.Vector3().copy(sim.current.player.pos).sub(ePos);
        toPlayer.y = 0; // maintain 2D flat movement
        const dist = toPlayer.length();

        if (dist > 0.8) {
          toPlayer.normalize();
          ePos.addScaledVector(toPlayer, enemy.speed * dt);
          enemy.facingLeft = toPlayer.x < 0;
          enemy.animRow = 1; // Walk
        } else {
          // Inside Attack Radius! Trigger attack
          enemy.animRow = 0; // Attack stand
          // Hit player!
          if (sim.current.player.immunityTimer <= 0) {
            damagePlayer();
          }
        }
      }

      // Handle color flashing
      if (enemy.flashTimer > 0) {
        enemy.flashTimer -= dt;
        if (enemy.flashTimer <= 0) {
          enemy.flashColor = 'none';
        }
      }

      // Sync position
      enemy.position = [ePos.x, ePos.y, ePos.z];

      // Enemy walking animation
      enemy.animFrame = (Math.floor(state.clock.elapsedTime * 6) + (enemy.id.charCodeAt(0) % 4)) % 4;

      return enemy;
    }).filter((enemy) => {
      // Clean up dead/flyout enemies
      if (enemy.isDead) return false;
      // If fly out of bounds upwards, mark dead
      if (enemy.position[1] > 15) {
        sim.current.kills++;
        updateStatsReact();
        return false;
      }
      return true;
    });

    sim.current.enemies = updatedEnemies;
    setEnemies(updatedEnemies);

    // -------------------------------------------------------------
    // POTIONS COLLECTION
    // -------------------------------------------------------------
    const updatedPotions = sim.current.potions.map((pot) => {
      if (pot.collected) return pot;
      const pPos = new THREE.Vector3(...pot.position);
      const dist = pPos.distanceTo(sim.current.player.pos);
      if (dist < 1.3) {
        pot.collected = true;
        // heal player
        setStats((prev) => ({
          ...prev,
          health: Math.min(prev.maxHealth, prev.health + 1)
        }));
      }
      return pot;
    }).filter(pot => !pot.collected);

    sim.current.potions = updatedPotions;
    setPotions(updatedPotions);

    // -------------------------------------------------------------
    // BOSS ACTIONS & STATE MACHINE
    // -------------------------------------------------------------
    if (sim.current.kills >= 10 && !sim.current.boss && !sim.current.warpActive) {
      // Spawn Boss
      sim.current.boss = {
        position: [0, 3.0, -12], // starts flying above
        health: 15,
        maxHealth: 15,
        state: 'idle',
        timer: 3.0,
        targetPos: [0, 3.0, -12],
        scale: 1.8,
        facingLeft: false,
        animFrame: 0,
        animRow: 0,
      };
      setBoss(sim.current.boss);
    }

    if (sim.current.boss) {
      const boss = sim.current.boss;
      const bPos = new THREE.Vector3(...boss.position);
      boss.timer -= dt;

      // Anim loop
      boss.animFrame = Math.floor(state.clock.elapsedTime * 5) % 4;

      if (boss.state === 'idle') {
        // Floating motion
        bPos.y = 2.8 + Math.sin(state.clock.elapsedTime * 3) * 0.4;
        
        // Face player
        boss.facingLeft = sim.current.player.pos.x < bPos.x;

        if (boss.timer <= 0) {
          // Random transition to Dash or Charging fireballs
          const roll = Math.random();
          if (roll < 0.45) {
            boss.state = 'dash';
            boss.timer = 1.2;
            // Pick random target location close or far from player
            const angle = Math.random() * Math.PI * 2;
            const dist = 5.0 + Math.random() * 8.0;
            boss.targetPos = [
              sim.current.player.pos.x + Math.cos(angle) * dist,
              2.5,
              sim.current.player.pos.z + Math.sin(angle) * dist
            ];
          } else {
            boss.state = 'charging';
            boss.timer = 1.6; // 1.6s charge up time
          }
        }
      } else if (boss.state === 'dash') {
        const target = new THREE.Vector3(...boss.targetPos);
        bPos.lerp(target, dt * 4.0); // Dash speed
        boss.facingLeft = target.x < bPos.x;

        if (boss.timer <= 0) {
          boss.state = 'idle';
          boss.timer = 2.0;
        }
      } else if (boss.state === 'charging') {
        // Grow/Shrink scaling step effect ("ขยายย่อ เป็น step บอก")
        const pulse = Math.floor(state.clock.elapsedTime * 10) % 2 === 0;
        boss.scale = pulse ? 2.4 : 1.4;
        boss.animRow = 1; // Attack row

        if (boss.timer <= 0) {
          boss.state = 'shoot';
          boss.scale = 1.8;
          // Spawn 4 fireballs flying high
          spawnFireballs(bPos);
          boss.timer = 0.5;
        }
      } else if (boss.state === 'shoot') {
        if (boss.timer <= 0) {
          boss.state = 'cooldown';
          boss.timer = 2.0; // rest
          boss.animRow = 0;
        }
      } else if (boss.state === 'cooldown') {
        bPos.y = 2.5 + Math.sin(state.clock.elapsedTime * 2) * 0.2;
        if (boss.timer <= 0) {
          boss.state = 'idle';
          boss.timer = 2.5;
        }
      }

      // Constrain Boss inside the boundaries
      bPos.x = Math.max(-25, Math.min(25, bPos.x));
      bPos.z = Math.max(-25, Math.min(25, bPos.z));

      boss.position = [bPos.x, bPos.y, bPos.z];
      setBoss({ ...boss });
    }

    // -------------------------------------------------------------
    // FIREBALL WEATHER EFFECTS
    // -------------------------------------------------------------
    const activeFireballs = sim.current.fireballs.map((f) => {
      f.progress += dt * f.speed;
      
      const start = new THREE.Vector3(...f.startPos);
      const target = new THREE.Vector3(...f.targetPos);

      // Arc interpolation
      const current = new THREE.Vector3().lerpVectors(start, target, f.progress);
      // Parabolic arc height
      const height = Math.sin(f.progress * Math.PI) * 5.0;
      current.y += height;

      f.currentPos = [current.x, current.y, current.z];

      // Check collision when reaching target
      if (f.progress >= 0.98) {
        // Hit player check
        const dist = target.distanceTo(sim.current.player.pos);
        if (dist < 1.6 && sim.current.player.immunityTimer <= 0) {
          damagePlayer();
        }
        // Spawn small splash dust particles or simple sound indicator if we had one
        f.progress = 2.0; // flag for deletion
      }

      return f;
    }).filter(f => f.progress < 1.0);

    sim.current.fireballs = activeFireballs;
    setFireballs(activeFireballs);

    // -------------------------------------------------------------
    // WARP PORTAL COLLISION CHECK
    // -------------------------------------------------------------
    if (sim.current.warpActive) {
      const dist = sim.current.warpPos.distanceTo(sim.current.player.pos);
      if (dist < 1.4) {
        // Clear Game
        setPhase('CLEAR');
      }
    }

    // -------------------------------------------------------------
    // SMOOTH FOLLOW CAMERA
    // -------------------------------------------------------------
    const cameraIdealPos = new THREE.Vector3(
      sim.current.player.pos.x,
      sim.current.player.pos.y + 7.5,
      sim.current.player.pos.z + 9.5
    );
    camera.position.lerp(cameraIdealPos, 0.08);
    camera.lookAt(sim.current.player.pos);
  });

  // -------------------------------------------------------------
  // HELPER EVENT TRIGGERS
  // -------------------------------------------------------------
  const spawnEnemy = () => {
    // Generate position on a ring around the player
    const angle = Math.random() * Math.PI * 2;
    const distance = 18 + Math.random() * 5; // just outside screen view
    const x = sim.current.player.pos.x + Math.cos(angle) * distance;
    const z = sim.current.player.pos.z + Math.sin(angle) * distance;

    const newEnemy: EnemyState = {
      id: 'e_' + Math.random().toString(36).substr(2, 9),
      position: [x, 0.7, z],
      health: 2, // 2-hit standard enemy
      maxHealth: 2,
      speed: 1.8 + Math.random() * 1.2, // dynamic walk speeds
      isKnockback: false,
      knockbackDirection: [0, 0, 0],
      knockbackForce: 0,
      knockbackTimer: 0,
      flashColor: 'none',
      flashTimer: 0,
      isDead: false,
      spawnTime: Date.now(),
      facingLeft: false,
      animFrame: 0,
      animRow: 1, // Start walking
    };

    sim.current.enemies.push(newEnemy);
  };

  const spawnFireballs = (bossPos: THREE.Vector3) => {
    // Spawn 3 fireballs targeted around player's current location
    const fireballsToSpawn: FireballState[] = [];
    for (let i = 0; i < 3; i++) {
      const offsetAngle = Math.random() * Math.PI * 2;
      const offsetDist = Math.random() * 3.5;
      const targetX = sim.current.player.pos.x + Math.cos(offsetAngle) * offsetDist;
      const targetZ = sim.current.player.pos.z + Math.sin(offsetAngle) * offsetDist;

      fireballsToSpawn.push({
        id: 'f_' + Math.random().toString(36).substr(2, 9),
        startPos: [bossPos.x, bossPos.y, bossPos.z],
        targetPos: [targetX, 0.1, targetZ],
        currentPos: [bossPos.x, bossPos.y, bossPos.z],
        progress: 0,
        speed: 0.4 + Math.random() * 0.15, // speed factor (takes ~2 seconds)
        radius: 0.8,
      });
    }

    sim.current.fireballs.push(...fireballsToSpawn);
    setFireballs([...sim.current.fireballs]);
  };

  const handleEnemyDamage = (enemy: EnemyState) => {
    enemy.health--;
    
    // Calculate knockback direction: from player to enemy
    const ePos = new THREE.Vector3(...enemy.position);
    const knockDir = new THREE.Vector3().copy(ePos).sub(sim.current.player.pos).normalize();
    // Maintain flat vector
    knockDir.y = 0.1; 

    if (enemy.health > 0) {
      // First hit: "ครั้งแรกให้กระเด็นไปข้างหลัง" + flash red
      enemy.isKnockback = true;
      enemy.knockbackDirection = [knockDir.x, knockDir.y, knockDir.z];
      enemy.knockbackForce = 12.0;
      enemy.knockbackTimer = 0.25;
      enemy.flashColor = 'red';
      enemy.flashTimer = 0.3;
    } else {
      // Second hit: "ครั้งสองให้กระเด็นออกจากฉากไป หรือ กระพริบสีขาวรัวๆ แล้วหายไป"
      // We trigger a high launching trajectory physics
      enemy.isKnockback = true;
      enemy.knockbackDirection = [knockDir.x * 0.4, 3.5, knockDir.z * 0.4]; // flies UP
      enemy.knockbackForce = 18.0;
      enemy.knockbackTimer = 0.8;
      enemy.flashColor = 'white';
      enemy.flashTimer = 0.8;
      
      // Spawn a random health potion when enemies are cleared
      if (Math.random() < 0.28) {
        sim.current.potions.push({
          id: 'pot_' + Date.now() + Math.random(),
          position: [ePos.x, 0.5, ePos.z],
          collected: false
        });
        setPotions([...sim.current.potions]);
      }
    }
  };

  const handleBossDamage = () => {
    if (!sim.current.boss) return;
    const boss = sim.current.boss;
    boss.health--;
    
    // flash boss red
    boss.scale = 2.1; // briefly inflate
    
    // Apply minor camera shake or hit stun
    if (boss.health <= 0) {
      // Defeated!
      sim.current.boss = null;
      setBoss(null);
      
      // Spawn Warp Gate Portal in center
      sim.current.warpActive = true;
      sim.current.warpPos.set(0, 0.8, 0);
      setWarpPortal({ active: true, pos: [0, 0.8, 0] });
    }
  };

  const damagePlayer = () => {
    setStats((prev) => {
      const newHp = prev.health - 1;
      if (newHp <= 0) {
        setPhase('GAMEOVER');
      }
      return {
        ...prev,
        health: newHp
      };
    });

    // Immunity trigger
    sim.current.player.immunityTimer = 1.5; // 1.5s immunity
  };

  return (
    <group>
      {/* Lights */}
      <ambientLight intensity={1.5} />
      <directionalLight position={[10, 15, 10]} intensity={1.0} castShadow />

      {/* 50x50 Plane */}
      <Ground />

      {/* Player Sprite */}
      <sprite ref={playerRef} position={[0, 0.7, 0]} scale={[1.3, 1.3, 1.3]}>
        <spriteMaterial map={pTexture} color="#ffffff" transparent />
      </sprite>

      {/* Hitbox visual cue */}
      <mesh ref={hitBoxRef} visible={false}>
        <sphereGeometry args={[1.0, 16, 16]} />
        <meshBasicMaterial color="#ef4444" transparent opacity={0.3} wireframe />
      </mesh>

      {/* Expanding Ring Skill Mesh */}
      <mesh ref={ringRef} visible={false} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <ringGeometry args={[0.9, 1.0, 32]} />
        <meshBasicMaterial color="#22d3ee" side={THREE.DoubleSide} transparent opacity={0.8} />
      </mesh>

      {/* Enemies rendering */}
      {enemies.map((enemy) => {
        // Decide tint color depending on flash state
        let tint = '#ffffff';
        if (enemy.flashColor === 'red') tint = '#ef4444';
        if (enemy.flashColor === 'white') tint = '#ffffff';

        // Apply visual scales based on frame
        return (
          <EnemySprite 
            key={enemy.id} 
            enemy={enemy} 
            baseTexture={eTexture} 
            tint={tint} 
          />
        );
      })}

      {/* Potions rendering */}
      {potions.map((pot) => (
        <sprite key={pot.id} position={pot.position} scale={[0.8, 0.8, 1]}>
          <spriteMaterial map={potionTex} transparent />
        </sprite>
      ))}

      {/* Fireballs rendering */}
      {fireballs.map((fb) => (
        <group key={fb.id}>
          {/* Falling glowing meteor sprite or sphere */}
          <mesh position={fb.currentPos}>
            <sphereGeometry args={[0.4, 8, 8]} />
            <meshBasicMaterial color="#f97316" />
          </mesh>
          
          {/* Ground landing shadow/warning ring */}
          <mesh position={[fb.targetPos[0], 0.02, fb.targetPos[2]]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.8, 0.9, 16]} />
            <meshBasicMaterial color="#ef4444" side={THREE.DoubleSide} transparent opacity={0.6} />
          </mesh>
        </group>
      ))}

      {/* Boss rendering */}
      {boss && boss.health > 0 && (
        <BossSprite boss={boss} bTexture={bTexture} />
      )}

      {/* Warp portal gate */}
      {warpPortal.active && (
        <WarpGate position={warpPortal.pos} />
      )}
    </group>
  );
}

// -------------------------------------------------------------
// SEPARATE DYNAMIC RENDER COMPONENTS TO ASSURE HIGH EFFICIENCY
// -------------------------------------------------------------
interface EnemySpriteProps {
  enemy: EnemyState;
  baseTexture: THREE.Texture;
  tint: string;
}

function EnemySprite({ enemy, baseTexture, tint }: EnemySpriteProps) {
  const spriteRef = useRef<THREE.Sprite>(null);

  // Clone texture so each enemy sprite handles independent spritesheet offsets
  const uniqueTex = useMemo(() => {
    const t = baseTexture.clone();
    t.needsUpdate = true;
    return t;
  }, [baseTexture]);

  useEffect(() => {
    // Rows: 2, Cols: 4
    const sizeX = 0.25;
    const sizeY = 0.5;
    uniqueTex.repeat.set(sizeX, sizeY);
    uniqueTex.offset.set(enemy.animFrame * sizeX, (1 - enemy.animRow) * sizeY);
  }, [enemy.animFrame, enemy.animRow, uniqueTex]);

  useFrame(() => {
    if (spriteRef.current) {
      spriteRef.current.position.set(...enemy.position);
      // Flip sprite based on facing direction
      spriteRef.current.scale.set(enemy.facingLeft ? -1.2 : 1.2, 1.2, 1.2);
    }
  });

  return (
    <sprite ref={spriteRef}>
      <spriteMaterial 
        map={uniqueTex} 
        color={tint} 
        transparent 
        toneMapped={false}
      />
    </sprite>
  );
}

interface BossSpriteProps {
  boss: BossState;
  bTexture: THREE.Texture;
}

function BossSprite({ boss, bTexture }: BossSpriteProps) {
  const spriteRef = useRef<THREE.Sprite>(null);

  const uniqueTex = useMemo(() => {
    const t = bTexture.clone();
    t.needsUpdate = true;
    return t;
  }, [bTexture]);

  useEffect(() => {
    // 2 rows, 4 columns
    const sizeX = 0.25;
    const sizeY = 0.5;
    uniqueTex.repeat.set(sizeX, sizeY);
    uniqueTex.offset.set(boss.animFrame * sizeX, (1 - boss.animRow) * sizeY);
  }, [boss.animFrame, boss.animRow, uniqueTex]);

  useFrame(() => {
    if (spriteRef.current) {
      spriteRef.current.position.set(...boss.position);
      spriteRef.current.scale.set(boss.facingLeft ? -boss.scale : boss.scale, boss.scale, boss.scale);
    }
  });

  return (
    <sprite ref={spriteRef}>
      <spriteMaterial map={uniqueTex} transparent />
    </sprite>
  );
}

function WarpGate({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 2.0;
    }
  });

  return (
    <group position={position}>
      {/* Glowing inner cylinder */}
      <mesh ref={meshRef}>
        <cylinderGeometry args={[0.8, 1.0, 2.5, 16, 1, true]} />
        <meshBasicMaterial color="#06b6d4" transparent opacity={0.4} side={THREE.DoubleSide} wireframe />
      </mesh>
      
      {/* Floating particles ring */}
      <mesh position={[0, -0.7, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.7, 1.1, 32]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.8} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// -------------------------------------------------------------
// MAIN CANVAS CONTAINER WITH RETRO LOADING FALLBACK
// -------------------------------------------------------------
export default function GameCanvas({ phase, setPhase, controls, stats, setStats, boss, setBoss }: GameCanvasProps) {
  if (phase !== 'PLAYING') return null;

  return (
    <div className="w-full h-full relative bg-slate-950">
      
      <Suspense fallback={
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 font-sans z-50">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,24,38,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(18,24,38,0.15)_1px,transparent_1px)] bg-[size:32px_32px] opacity-40"></div>
          <div className="w-64 space-y-3 text-center z-10 animate-pulse">
            <span className="text-sm font-bold font-mono tracking-widest text-amber-500 uppercase">
              LOADING DUNGEON ASSETS
            </span>
            <div className="w-full h-2 bg-slate-900 border border-slate-800 rounded-full overflow-hidden p-0.5">
              <div className="h-full bg-amber-500 rounded-full animate-progress-bar w-3/4"></div>
            </div>
            <p className="text-[10px] font-mono text-slate-500">
              Generating tiled grounds and retro sprite billboards...
            </p>
          </div>
        </div>
      }>
        <Canvas 
          shadows
          camera={{ fov: 45, near: 0.1, far: 100, position: [0, 8, 10] }}
          className="w-full h-full"
        >
          {/* Scene background color */}
          <color attach="background" args={['#020617']} />
          <fog attach="fog" args={['#020617', 15, 30]} />

          <GameEngine 
            controls={controls} 
            stats={stats} 
            setStats={setStats} 
            boss={boss} 
            setBoss={setBoss} 
            setPhase={setPhase} 
          />
        </Canvas>
      </Suspense>

    </div>
  );
}
