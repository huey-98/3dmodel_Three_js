import * as THREE from 'three';
import { viewMesh } from './resources.js';

// 手部近景建造器：手掌、手指关节、指向姿态与小臂。
export function addFinger(parent, x, y, z, lengths, width, mat) {
  const joints = [];
  let prev = null;
  let prevLen = 0;
  for (let i = 0; i < lengths.length; i++) {
    const len = lengths[i];
    const pivot = new THREE.Group();
    if (i === 0) pivot.position.set(x, y, z);
    else pivot.position.z = prevLen;
    (prev || parent).add(pivot);
    if (i === 0) {
      const knuckle = viewMesh(new THREE.SphereGeometry(width * 0.56, 8, 6), mat);
      pivot.add(knuckle);
    }
    const seg = viewMesh(new THREE.BoxGeometry(width, width * 0.9, len * 0.86), mat);
    seg.position.z = len * 0.46;
    pivot.add(seg);
    const cap = viewMesh(new THREE.SphereGeometry(width * 0.46, 8, 6), mat);
    cap.scale.z = 0.75;
    cap.position.z = len * 0.9;
    pivot.add(cap);
    joints.push(pivot);
    prev = pivot;
    prevLen = len;
  }
  return joints;
}

// 手掌朝局部 -Y，手指朝局部 +Z。side 决定拇指在哪一侧。
export function buildHand(leather, cloth, side) {
  const s = side === 'right' ? 1 : -1;
  const root = new THREE.Group();
  const palm = viewMesh(new THREE.BoxGeometry(0.086, 0.03, 0.09), leather);
  palm.position.set(0, 0, 0.012);
  root.add(palm);
  const heel = viewMesh(new THREE.BoxGeometry(0.078, 0.034, 0.034), leather);
  heel.position.set(0, -0.002, -0.036);
  root.add(heel);
  const cuff = viewMesh(new THREE.BoxGeometry(0.072, 0.04, 0.028), cloth);
  cuff.position.set(0, -0.004, -0.055);
  root.add(cuff);

  const fingers = [
    { x: 0.032, z: 0.05, w: 0.015, lens: [0.03, 0.022, 0.016] },
    { x: 0.011, z: 0.056, w: 0.016, lens: [0.034, 0.024, 0.018] },
    { x: -0.011, z: 0.052, w: 0.015, lens: [0.032, 0.022, 0.016] },
    { x: -0.031, z: 0.044, w: 0.013, lens: [0.026, 0.018, 0.014] },
  ].map((spec) => addFinger(root, spec.x * s, 0.01, spec.z, spec.lens, spec.w, leather));

  const thumb = addFinger(root, -0.04 * s, -0.006, 0.014, [0.028, 0.022], 0.018, leather);
  thumb[0].rotation.y = -0.65 * s;
  thumb[0].rotation.z = 0.4 * s;

  function pose({ curl = 0.72, trigger = 0, thumbCurl = 0.5, index = null }) {
    fingers.forEach((joints, i) => {
      const pinky = i === 0;
      let c = curl + (pinky ? 0.08 : 0);
      if (i === 3 && index != null) c = index + trigger * 0.75;
      joints[0].rotation.x = 0.12 + c * 1.05;
      joints[1].rotation.x = 0.16 + c * 0.95;
      joints[2].rotation.x = 0.1 + c * 0.62;
    });
    thumb[0].rotation.x = 0.12 + thumbCurl * 0.65;
    thumb[1].rotation.x = 0.18 + thumbCurl * 0.75;
  }

  pose({});
  return { group: root, pose };
}

// 手指沿 fingerDir，手背沿 backDir。两者不必正交，手背会投到手指的垂直面上。
export function pointHand(group, fingerDir, backDir) {
  const z = fingerDir.clone().normalize();
  const y = backDir.clone().addScaledVector(z, -backDir.dot(z)).normalize();
  const x = new THREE.Vector3().crossVectors(y, z).normalize();
  group.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
}

// 前臂从手腕沿 away 延伸。away 在手的父级空间里，朝向画面下方，这样手臂留在画面里。
export function addArm(hand, cloth, away, length = 0.32) {
  const arm = new THREE.Group();
  arm.position.set(0, 0, -0.062);
  const forearm = viewMesh(new THREE.BoxGeometry(0.064, 0.058, length), cloth);
  forearm.position.set(0, 0, -length / 2);
  arm.add(forearm);
  const elbow = viewMesh(new THREE.BoxGeometry(0.068, 0.062, 0.046), cloth);
  elbow.position.set(0, 0, -length - 0.01);
  arm.add(elbow);
  hand.add(arm);
  const z = away.clone().negate().normalize();
  const up = Math.abs(z.y) > 0.82 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
  const y = up.clone().addScaledVector(z, -up.dot(z)).normalize();
  const x = new THREE.Vector3().crossVectors(y, z).normalize();
  const parentQ = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
  arm.quaternion.copy(hand.quaternion).invert().multiply(parentQ);
  return arm;
}
