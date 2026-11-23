// 武器数值、射程与时序常量：调手感只改这里。
import * as THREE from 'three';
import { MAP_SCALE } from '../constants.js';

export const RANGE = 48 * MAP_SCALE;
export const KNIFE_REACH = 2.1;
export const KNIFE_TIME = 0.48;
export const KNIFE_HIT = 0.2;
export const RIFLE_MUZZLE_Z = 0.9;
export const RIFLE_ROLL = THREE.MathUtils.degToRad(2);
export const PISTOL_MUZZLE_Z = 0.415;
export const WEAPONS = {
  rifle: { label: '步枪', mag: 30, reserve: 90, auto: true, gap: 0.09, reload: 1.65, flame: 1, recoil: 0.028 },
  pistol: { label: '手枪', mag: 12, reserve: 36, auto: false, gap: 0.2, reload: 1.3, flame: 0.62, recoil: 0.018 },
  knife: { label: '匕首', auto: false, gap: 0.48 },
};

export const FLAME_LEN = 0.4;
export const HOLE_LIFE = 3;
export const TRACER_SPEED = 120;
