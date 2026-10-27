/**
 * WAV Audio Header Analyzer & Synthesizer
 * RIFF WAVE 규격을 파싱하여 정확한 재생 시간(초)을 계산하고,
 * 로컬 테스트 및 폴백용 유효 WAV 버퍼를 생성합니다.
 */

export interface WavMetadata {
  durationSeconds: number;
  sampleRate: number;
  channels: number;
  bitsPerSample: number;
  byteRate: number;
  dataSize: number;
}

export function parseWavHeader(buffer: Buffer): WavMetadata | null {
  try {
    if (buffer.length < 44) return null;

    const riff = buffer.toString('ascii', 0, 4);
    const wave = buffer.toString('ascii', 8, 12);
    if (riff !== 'RIFF' || wave !== 'WAVE') return null;

    // fmt 청크 찾기
    let offset = 12;
    let sampleRate = 24000;
    let channels = 1;
    let bitsPerSample = 16;
    let byteRate = 48000;
    let dataSize = 0;

    while (offset < buffer.length - 8) {
      const chunkId = buffer.toString('ascii', offset, offset + 4);
      const chunkSize = buffer.readUInt32LE(offset + 4);

      if (chunkId === 'fmt ') {
        channels = buffer.readUInt16LE(offset + 10);
        sampleRate = buffer.readUInt32LE(offset + 12);
        byteRate = buffer.readUInt32LE(offset + 16);
        bitsPerSample = buffer.readUInt16LE(offset + 22);
      } else if (chunkId === 'data') {
        dataSize = chunkSize;
        break;
      }
      offset += 8 + chunkSize;
    }

    if (byteRate <= 0) byteRate = (sampleRate * channels * bitsPerSample) / 8;
    if (dataSize <= 0) dataSize = buffer.length - 44;

    const durationSeconds = Number((dataSize / byteRate).toFixed(1));

    return {
      durationSeconds: Math.max(1.0, durationSeconds),
      sampleRate,
      channels,
      bitsPerSample,
      byteRate,
      dataSize,
    };
  } catch (err) {
    console.error('Failed to parse WAV header:', err);
    return null;
  }
}

/**
 * 지정된 길이(초)를 가진 표준 PCM WAV 오디오 버퍼 생성
 * (무음 및 부드러운 앰비언트 톤을 포함하여 브라우저에서 즉시 재생 가능)
 */
export function createSyntheticWavBuffer(durationSeconds: number, sampleRate = 24000): Buffer {
  const channels = 1;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const totalSamples = Math.floor(durationSeconds * sampleRate);
  const dataSize = totalSamples * channels * bytesPerSample;
  const fileSize = 44 + dataSize;

  const buffer = Buffer.alloc(fileSize);

  // RIFF Chunk
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(fileSize - 8, 4);
  buffer.write('WAVE', 8);

  // fmt Chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size
  buffer.writeUInt16LE(1, 20);  // AudioFormat (PCM = 1)
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * channels * bytesPerSample, 28); // ByteRate
  buffer.writeUInt16LE(channels * bytesPerSample, 32);              // BlockAlign
  buffer.writeUInt16LE(bitsPerSample, 34);

  // data Chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  // 부드러운 432Hz 톤 + 호흡 노이즈를 미세하게 합성하여 재생 시 살아있는 느낌 연출
  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    // 부드러운 화음 (진폭 0.05로 매우 은은한 배경 사운드)
    const sampleVal = Math.sin(2 * Math.PI * 432 * t) * 0.04 * 32767;
    buffer.writeInt16LE(Math.floor(sampleVal), 44 + i * 2);
  }

  return buffer;
}
