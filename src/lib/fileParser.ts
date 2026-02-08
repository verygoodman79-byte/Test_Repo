// ============================================================
// File Parser - Extract text from PDF, TXT, DOCX
// ============================================================
import fs from 'fs';
import path from 'path';
import os from 'os';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const mammoth = require('mammoth');

export async function parseFile(buffer: Buffer, fileType: string): Promise<string> {
  switch (fileType) {
    case 'pdf':
      return parsePdf(buffer);
    case 'txt':
      return parseTxt(buffer);
    case 'docx':
    case 'doc':
      return parseDocx(buffer);
    default:
      throw new Error(`지원하지 않는 파일 형식입니다: ${fileType}`);
  }
}

async function parsePdf(buffer: Buffer): Promise<string> {
  const data = await pdfParse(buffer);
  return data.text;
}

function parseTxt(buffer: Buffer): string {
  return buffer.toString('utf-8');
}

async function parseDocx(buffer: Buffer): Promise<string> {
  // Write buffer to temp file, then read via mammoth (more reliable than passing buffer directly)
  const tmpFile = path.join(os.tmpdir(), `upload_${Date.now()}.docx`);
  try {
    fs.writeFileSync(tmpFile, buffer);
    const result = await mammoth.extractRawText({ path: tmpFile });
    return result.value;
  } finally {
    try { fs.unlinkSync(tmpFile); } catch { /* ignore */ }
  }
}

export function getFileType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  if (ext === 'pdf') return 'pdf';
  if (ext === 'txt') return 'txt';
  if (ext === 'docx' || ext === 'doc') return 'docx';
  return ext;
}
