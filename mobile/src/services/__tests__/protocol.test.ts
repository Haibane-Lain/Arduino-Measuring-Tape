import {
  decodeBase64Ascii,
  encodeAsciiBase64,
  parseFrame,
  ProtocolParser,
} from '@/services/protocol';

describe('parseFrame', () => {
  it('parses a distance frame', () => {
    expect(parseFrame('DIST:127.1')).toEqual({ type: 'distance', valueCm: 127.1 });
  });

  it('parses the no-echo frame case-insensitively', () => {
    expect(parseFrame('dist:err\r')).toEqual({ type: 'no-echo' });
  });

  it('ignores a malformed distance instead of inventing a value', () => {
    expect(parseFrame('DIST:not-a-number')).toEqual({
      type: 'unknown',
      raw: 'DIST:not-a-number',
    });
    expect(parseFrame('DIST:-4')).toEqual({ type: 'unknown', raw: 'DIST:-4' });
  });

  it('classifies control frames', () => {
    expect(parseFrame('INFO:MEASURING_TAPE_V2')).toMatchObject({ type: 'info' });
    expect(parseFrame('PONG')).toEqual({ type: 'pong' });
    expect(parseFrame('OK:CAL=1.5')).toMatchObject({ type: 'ok' });
    expect(parseFrame('ERR:UNKNOWN')).toMatchObject({ type: 'error' });
    expect(parseFrame('something else')).toMatchObject({ type: 'unknown' });
  });

  it('ignores blank lines', () => {
    expect(parseFrame('')).toBeNull();
    expect(parseFrame('  \r\n')).toBeNull();
  });
});

describe('ProtocolParser', () => {
  it('waits for a newline before emitting a frame', () => {
    const parser = new ProtocolParser();
    expect(parser.push('DIST:12')).toEqual([]);
    expect(parser.push('.3\n')).toEqual([{ type: 'distance', valueCm: 12.3 }]);
  });

  it('handles multiple frames in one notification', () => {
    const parser = new ProtocolParser();
    expect(parser.push('DIST:10\nDIST:ERR\nPONG\n')).toEqual([
      { type: 'distance', valueCm: 10 },
      { type: 'no-echo' },
      { type: 'pong' },
    ]);
  });

  it('handles CRLF framing', () => {
    const parser = new ProtocolParser();
    expect(parser.push('DIST:44.5\r\n')).toEqual([{ type: 'distance', valueCm: 44.5 }]);
  });

  it('resets its buffer', () => {
    const parser = new ProtocolParser();
    parser.push('DIST:10');
    parser.reset();
    expect(parser.push('DIST:20\n')).toEqual([{ type: 'distance', valueCm: 20 }]);
  });
});

describe('base64 helpers', () => {
  it('round-trips an ASCII command', () => {
    const command = 'PING\n';
    expect(decodeBase64Ascii(encodeAsciiBase64(command))).toBe(command);
  });

  it('handles an empty value', () => {
    expect(decodeBase64Ascii('')).toBe('');
  });
});
