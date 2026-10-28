import { writeFileSync } from 'node:fs'

const SR = 44100

export function buildSoundtrack(file, duration = 38){
  const n = Math.ceil(SR * duration)
  const L = new Float32Array(n)
  const R = new Float32Array(n)

  let seed = 0x5eed1234
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 4294967296
  }

  const droneFreqs = [73.42, 110.00, 146.83, 220.00]
  const droneAmps  = [0.115, 0.070, 0.048, 0.028]
  for (let i = 0; i < n; i++){
    const t = i / SR
    const lfo = 0.66 + 0.34 * Math.sin(2*Math.PI*0.07*t + 0.5)
    let s = 0
    for (let k = 0; k < droneFreqs.length; k++){
      const f = droneFreqs[k] * (1 + 0.0013 * Math.sin(2*Math.PI*(0.03 + k*0.017)*t))
      s += droneAmps[k] * Math.sin(2*Math.PI*f*t + k*1.7)
    }
    s *= lfo
    L[i] += s
    R[i] += s * (0.96 + 0.04 * Math.sin(2*Math.PI*0.05*t))
  }

  let lpL = 0, lpR = 0
  for (let i = 0; i < n; i++){
    const t = i / SR
    lpL = lpL * 0.995 + (rnd()*2 - 1) * 0.005
    lpR = lpR * 0.995 + (rnd()*2 - 1) * 0.005
    const swell = 0.5 + 0.5 * Math.sin(2*Math.PI*0.04*t + 1.2)
    L[i] += lpL * 0.85 * swell
    R[i] += lpR * 0.85 * swell
  }

  const scale = [146.83, 155.56, 185.00, 196.00, 220.00, 233.08, 261.63, 293.66]
  const notes = [
    [5.2,7],[7.0,5],[8.8,2],[10.6,3],[12.6,7],[14.4,6],
    [16.4,5],[18.2,4],[20.4,7],[23.0,2],[25.6,5],[28.2,6],[31.0,4],[33.2,0]
  ]
  for (const [start, idx] of notes){
    const f = scale[idx]
    const dur = 3.2
    const pan = 0.5 + 0.22 * Math.sin(idx*1.7)
    const i0 = Math.floor(start*SR)
    const i1 = Math.min(n, Math.floor((start+dur)*SR))
    for (let i = i0; i < i1; i++){
      const t = i/SR - start
      const atk = Math.min(1, t/0.004)
      const dec = Math.exp(-t*1.55)
      let s = 0
      for (let h = 1; h <= 6; h++){
        s += Math.sin(2*Math.PI*f*h*t + h*0.7) / (h*1.5) * Math.exp(-t*(0.9 + h*0.5))
      }
      s *= atk * dec * 0.085
      L[i] += s * (1 - pan)
      R[i] += s * pan
      const j = i + Math.floor(0.27*SR)
      if (j < n){
        L[j] += s * 0.28 * (1 - pan)
        R[j] += s * 0.28 * pan
      }
    }
  }

  for (let bt = 8; bt < 33; bt += 2.4){
    const i0 = Math.floor(bt*SR)
    const i1 = Math.min(n, Math.floor((bt + 0.5)*SR))
    for (let i = i0; i < i1; i++){
      const t = i/SR - bt
      const env = Math.exp(-t*16)
      const s = Math.sin(2*Math.PI*57*t) * env * 0.15
             + (rnd()*2 - 1) * Math.exp(-t*60) * 0.03
      L[i] += s
      R[i] += s * 0.95
    }
  }

  let peak = 0
  for (let i = 0; i < n; i++){
    const t = i/SR
    let f = 1
    if (t < 2.5) f *= t/2.5
    if (t > duration - 4) f *= Math.max(0, (duration - t)/4)
    f = f*f*(3 - 2*f)
    const l = Math.tanh(L[i] * 1.2) * f
    const r = Math.tanh(R[i] * 1.2) * f
    L[i] = l; R[i] = r
    peak = Math.max(peak, Math.abs(l), Math.abs(r))
  }
  const gain = peak > 0 ? 0.85/peak : 1

  const buf = Buffer.alloc(44 + n*4)
  buf.write('RIFF', 0)
  buf.writeUInt32LE(36 + n*4, 4)
  buf.write('WAVE', 8)
  buf.write('fmt ', 12)
  buf.writeUInt32LE(16, 16)
  buf.writeUInt16LE(1, 20)
  buf.writeUInt16LE(2, 22)
  buf.writeUInt32LE(SR, 24)
  buf.writeUInt32LE(SR*4, 28)
  buf.writeUInt16LE(4, 32)
  buf.writeUInt16LE(16, 34)
  buf.write('data', 36)
  buf.writeUInt32LE(n*4, 40)

  let o = 44
  for (let i = 0; i < n; i++){
    const l = Math.max(-32768, Math.min(32767, Math.round(L[i]*gain*32767)))
    const r = Math.max(-32768, Math.min(32767, Math.round(R[i]*gain*32767)))
    buf.writeInt16LE(l, o); o += 2
    buf.writeInt16LE(r, o); o += 2
  }
  writeFileSync(file, buf)
  return { file, seconds: n/SR, peak }
}
