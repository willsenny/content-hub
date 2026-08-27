import crypto from 'crypto';

export interface PromptRecord {
  round: number;
  prompt: string;
  output?: string;
  feedback?: string;
}

export function sha256(content: string): string {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

export function serializePromptLog(records: PromptRecord[]): string {
  return JSON.stringify(records, null, 2);
}

export function parsePromptLog(json: string | null): PromptRecord[] {
  if (!json) return [];
  try {
    return JSON.parse(json);
  } catch {
    return [];
  }
}