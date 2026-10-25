import { fromByteArray, toByteArray } from 'base64-js';

/**
 * Line-buffered parser for the ESP32 BLE protocol.
 *
 * BLE notifications can be fragmented or coalesced, so the transport pushes
 * raw decoded chunks into one parser instance and only handles complete lines.
 */

export type DeviceFrame =
  | { type: 'distance'; valueCm: number }
  | { type: 'no-echo' }
  | { type: 'info'; raw: string }
  | { type: 'pong' }
  | { type: 'ok'; raw: string }
  | { type: 'error'; raw: string }
  | { type: 'unknown'; raw: string };

const MAX_BUFFER_LENGTH = 4096;

/** Decode the base64 value of a BLE characteristic as ASCII/UTF-8 bytes. */
export function decodeBase64Ascii(value: string): string {
  if (!value) {
    return '';
  }

  const bytes = toByteArray(value);
  let result = '';
  for (let index = 0; index < bytes.length; index += 1) {
    result += String.fromCharCode(bytes[index]);
  }
  return result;
}

/** Encode a short ASCII command for a BLE write. */
export function encodeAsciiBase64(value: string): string {
  const bytes = new Uint8Array(value.length);
  for (let index = 0; index < value.length; index += 1) {
    bytes[index] = value.charCodeAt(index) & 0xff;
  }
  return fromByteArray(bytes);
}

/** Parse one complete line. Returns null for blank lines. */
export function parseFrame(rawLine: string): DeviceFrame | null {
  const line = rawLine.replace(/\r/g, '').trim();
  if (line.length === 0) {
    return null;
  }

  const upper = line.toUpperCase();

  if (upper === 'DIST:ERR') {
    return { type: 'no-echo' };
  }

  if (upper.startsWith('DIST:')) {
    const value = Number(line.slice(5));
    if (!Number.isFinite(value) || value <= 0) {
      return { type: 'unknown', raw: line };
    }
    return { type: 'distance', valueCm: value };
  }

  if (upper.startsWith('INFO:')) {
    return { type: 'info', raw: line };
  }

  if (upper === 'PONG') {
    return { type: 'pong' };
  }

  if (upper.startsWith('OK:')) {
    return { type: 'ok', raw: line };
  }

  if (upper.startsWith('ERR:')) {
    return { type: 'error', raw: line };
  }

  return { type: 'unknown', raw: line };
}

/** Stateful parser that tolerates partial and coalesced lines. */
export class ProtocolParser {
  private buffer = '';

  push(chunk: string): DeviceFrame[] {
    this.buffer += chunk;

    if (this.buffer.length > MAX_BUFFER_LENGTH) {
      // A device should never send a line this long. Drop the corrupt buffer
      // rather than growing memory indefinitely.
      this.buffer = '';
      return [];
    }

    const frames: DeviceFrame[] = [];
    let newline = this.buffer.indexOf('\n');

    while (newline >= 0) {
      const line = this.buffer.slice(0, newline);
      this.buffer = this.buffer.slice(newline + 1);
      const frame = parseFrame(line);
      if (frame) {
        frames.push(frame);
      }
      newline = this.buffer.indexOf('\n');
    }

    return frames;
  }

  reset() {
    this.buffer = '';
  }
}
