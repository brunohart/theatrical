export function encodeCursor(offset: number, pageSize: number): string {
  const payload = JSON.stringify({ o: offset, p: pageSize });
  return Buffer.from(payload).toString('base64url');
}

export function decodeCursor(cursor: string): { offset: number; pageSize: number } | null {
  try {
    const payload = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
    if (typeof payload.o === 'number' && typeof payload.p === 'number') {
      return { offset: payload.o, pageSize: payload.p };
    }
    return null;
  } catch {
    return null;
  }
}
