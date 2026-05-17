const FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

export class Spinner {
  private interval: NodeJS.Timeout | null = null;
  private frameIndex = 0;

  start(message: string): void {
    this.frameIndex = 0;
    process.stdout.write(`${FRAMES[0]} ${message}`);
    this.interval = setInterval(() => {
      this.frameIndex = (this.frameIndex + 1) % FRAMES.length;
      process.stdout.write(`\r${FRAMES[this.frameIndex]} ${message}`);
    }, 80);
  }

  stop(finalMessage?: string): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    process.stdout.write(`\r${finalMessage ?? '✓'}\n`);
  }
}
