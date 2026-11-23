// 敌人枪声：按距离衰减的方波提示音。
export function createCombatAudio() {
  let audio = null;
  function toneShot(distance) {
    const gain = Math.max(0.02, 0.24 * (1 - Math.min(1, distance / 40)));
    try {
      if (!audio) audio = new AudioContext();
      if (audio.state === 'suspended') audio.resume();
      const t = audio.currentTime;
      const osc = audio.createOscillator();
      const amp = audio.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(160, t);
      osc.frequency.exponentialRampToValueAtTime(70, t + 0.07);
      amp.gain.setValueAtTime(gain, t);
      amp.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      osc.connect(amp).connect(audio.destination);
      osc.start(t);
      osc.stop(t + 0.12);
    } catch {
      // 没有音频设备时静音继续
    }
  }
  return toneShot;
}
