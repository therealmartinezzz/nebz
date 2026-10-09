// Mikrofon bloklarını 16 kHz mono, little-endian PCM16 formatına çevirir.
class PcmCapture extends AudioWorkletProcessor {
  constructor() {
    super();
    this.samples = new Int16Array(1600);
    this.offset = 0;
    this.phase = 0;
    this.sum = 0;
    this.count = 0;
    this.energy = 0;
  }
  process(inputs) {
    const channel = inputs[0]?.[0];
    if (!channel) return true;
    for (const sample of channel) {
      this.sum += sample;
      this.count++;
      this.phase += 16000;
      if (this.phase < sampleRate) continue;
      this.phase -= sampleRate;
      const value = Math.max(-1, Math.min(1, this.sum / this.count));
      this.sum = 0;
      this.count = 0;
      this.energy += value * value;
      this.samples[this.offset++] = Math.round(value < 0 ? value * 32768 : value * 32767);
      if (this.offset === this.samples.length) {
        const buffer = new ArrayBuffer(this.samples.length * 2);
        const view = new DataView(buffer);
        for (let i = 0; i < this.samples.length; i++) view.setInt16(i * 2, this.samples[i], true);
        this.port.postMessage({ buffer, level: Math.sqrt(this.energy / this.samples.length) }, [buffer]);
        this.offset = 0;
        this.energy = 0;
      }
    }
    return true;
  }
}
registerProcessor("pcm-capture", PcmCapture);
