let counter = 0;

export function generateRequestId(): string {
  counter += 1;
  const timestamp = Date.now().toString(36);
  const seq = counter.toString(36).padStart(4, '0');
  return `req_${timestamp}_${seq}`;
}

export function resetRequestIdCounter(): void {
  counter = 0;
}
