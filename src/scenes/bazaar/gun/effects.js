import * as THREE from 'three';
import {
  viewMesh, noRaycast, xAxis, zAxis, flameGeo, flameMap, tracerGeo,
  holeGeo, holeMap, chipGeo, slashGeo, slashMap,
} from './resources.js';
import { FLAME_LEN, HOLE_LIFE, TRACER_SPEED } from './constants.js';

// 枪口火焰、曳光、弹孔、划痕与火花：特效网格的创建与回收，effects 数组由调用方持有。
export function createGunEffects({ scene, camera, effects }) {
  function addEffect(mesh, life, extra = {}) {
    if (!mesh.parent) scene.add(mesh);
    effects.push({ mesh, life, max: life, ...extra });
  }

  function spawnViewFlame(mark, scale) {
    const align = new THREE.Quaternion().setFromUnitVectors(xAxis, zAxis);
    for (let i = 0; i < 3; i++) {
      const tongue = viewMesh(flameGeo, new THREE.MeshBasicMaterial({
        map: flameMap,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      }));
      const twist = new THREE.Quaternion().setFromAxisAngle(zAxis, i * Math.PI / 3);
      tongue.quaternion.copy(twist).multiply(align);
      tongue.scale.set(scale, scale, 1);
      tongue.position.set(0, 0, FLAME_LEN * scale * 0.45);
      mark.add(tongue);
      addEffect(tongue, 1, { burst: true, frames: 0 });
    }
  }

  function spawnTracer(start, dir, end) {
    const range = Math.max(0.3, start.distanceTo(end));
    const length = Math.min(0.9, range);
    const streak = noRaycast(new THREE.Mesh(tracerGeo, new THREE.MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })));
    streak.scale.set(1, 1, length);
    streak.quaternion.setFromUnitVectors(zAxis, dir);
    const origin = start.clone();
    const flight = dir.clone();
    let traveled = length * 0.5;
    streak.position.copy(origin).addScaledVector(flight, traveled);
    addEffect(streak, 1, {
      tick(item, dt) {
        if (!item.shown) {
          item.shown = true;
          return;
        }
        traveled += TRACER_SPEED * dt;
        const center = Math.min(traveled, Math.max(length * 0.5, range - length * 0.5));
        item.mesh.position.copy(origin).addScaledVector(flight, center);
        if (traveled >= range) item.life = 0;
      },
    });
  }

  function spawnHole(point, normal) {
    const mat = new THREE.MeshBasicMaterial({
      map: holeMap,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -4,
      side: THREE.DoubleSide,
    });
    const hole = noRaycast(new THREE.Mesh(holeGeo, mat));
    const align = new THREE.Quaternion().setFromUnitVectors(zAxis, normal);
    const spin = new THREE.Quaternion().setFromAxisAngle(normal, Math.random() * Math.PI * 2);
    hole.quaternion.copy(align).premultiply(spin);
    hole.position.copy(point).addScaledVector(normal, 0.025);
    hole.scale.setScalar(0.85 + Math.random() * 0.35);
    addEffect(hole, HOLE_LIFE, { hold: true });

    for (let i = 0; i < 5; i++) {
      const chip = noRaycast(new THREE.Mesh(
        chipGeo,
        new THREE.MeshStandardMaterial({
          color: i % 2 ? 0x6a5344 : 0x2a211c,
          roughness: 0.9,
          transparent: true,
        }),
      ));
      chip.position.copy(point).addScaledVector(normal, 0.04);
      chip.rotation.set(Math.random(), Math.random(), Math.random());
      const velocity = normal.clone().multiplyScalar(1.4 + Math.random() * 1.6);
      velocity.x += (Math.random() - 0.5) * 1.8;
      velocity.z += (Math.random() - 0.5) * 1.8;
      addEffect(chip, 0.55, {
        tick(item, dt) {
          velocity.y -= 9 * dt;
          item.mesh.position.addScaledVector(velocity, dt);
          item.mesh.rotation.x += dt * 8;
        },
      });
    }
  }

  function spawnSlash(point, normal) {
    const mat = new THREE.MeshBasicMaterial({
      map: slashMap,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -4,
      side: THREE.DoubleSide,
    });
    const mark = noRaycast(new THREE.Mesh(slashGeo, mat));
    const align = new THREE.Quaternion().setFromUnitVectors(zAxis, normal);
    const spin = new THREE.Quaternion().setFromAxisAngle(normal, Math.random() * Math.PI);
    mark.quaternion.copy(align).premultiply(spin);
    mark.position.copy(point).addScaledVector(normal, 0.02);
    mark.scale.setScalar(0.85 + Math.random() * 0.3);
    addEffect(mark, HOLE_LIFE, { hold: true });
  }

  // 刀砍到敌人的火花。墙面用划痕，敌人身上只闪一下。
  function spawnHitSpark(point) {
    const spark = noRaycast(new THREE.Mesh(
      new THREE.PlaneGeometry(0.34, 0.34),
      new THREE.MeshBasicMaterial({
        map: holeMap,
        color: 0xffd27a,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    ));
    spark.position.copy(point);
    spark.lookAt(camera.position);
    addEffect(spark, 0.26);
  }

  return { addEffect, spawnViewFlame, spawnTracer, spawnHole, spawnSlash, spawnHitSpark };
}
