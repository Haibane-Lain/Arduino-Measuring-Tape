#!/usr/bin/env node
/**
 * Regenerates the two short alert tones used by the app.
 * Run from mobile/: node scripts/generate-sounds.mjs
 */
import { Buffer } from 'node:buffer';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const outputDir = join(root, 'assets', 'sounds');
mkdirSync(outputDir, { recursive: true });

const SAMPLE_RATE = 44100;

function envelope(index, total, fadeSamples) {
  if (index < fadeSamples) {
    return index / fadeSamples;
  }
  if (index > total - fadeSamples) {
    return Math.max(0, (total - index) / fadeSamples);
  }
  return 1;
}

function tone(frequency, seconds, amplitude = 0.35, decay = 0) {
  const total = Math.round(SAMPLE_RATE * seconds);
  const samples = new Float32Array(total);
  const fade = Math.round(SAMPLE_RATE * 0.008);

  for (let index = 0; index < total; index += 1) {
    const t = index / SAMPLE_RATE;
    const decayGain = decay > 0 ? Math.exp(-decay * t) : 1;
    samples[index] =
      Math.sin(2 * Math.PI * frequency * t) *
      amplitude *
      decayGain *
      envelope(index, total, fade);
  }
  return samples;
}

function concat(...parts) {
  const length = parts.reduce((sum, part) => sum + part.length, 0);
  const result = new Float32Array(length);
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
}

function silence(seconds) {
  return new Float32Array(Math.round(SAMPLE_RATE * seconds));
}

function writeWav(path, samples) {
  const dataLength = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataLength);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataLength, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataLength, 40);

  for (let index = 0; index < samples.length; index += 1) {
    const clamped = Math.max(-1, Math.min(1, samples[index]));
    buffer.writeInt16LE(Math.round(clamped * 32767), 44 + index * 2);
  }

  writeFileSync(path, buffer);
}

writeWav(join(outputDir, 'beep.wav'), tone(880, 0.14, 0.4, 8));
writeWav(
  join(outputDir, 'chime.wav'),
  concat(
    tone(659.25, 0.28, 0.32, 4),
    silence(0.03),
    tone(880, 0.42, 0.3, 5),
  ),
);

console.log(`Wrote alert sounds to ${outputDir}`);
