export class Vector {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  times(other: number | Vector) {
    if (typeof other === "number") return new Vector(this.x * other, this.y * other);
    else return new Vector(this.x * other.x, this.y * other.y);
  }
}

export default class Player {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  physicsScaling = 50;
  gravity = -9.81 * this.physicsScaling;
  position: Vector;
  velocity = new Vector(0, 0);
  acceleration = new Vector(0, this.gravity);
  width: number;
  height: number;
  targetFps = 60;
  currentTimeStep = 1 / this.targetFps;
  launchVelocity = new Vector(1, 5).times(this.physicsScaling);
  initialPosition: Vector;
  onGround: boolean;
  initialVelocity = new Vector(0, 0);
  updateDisplayValues: Function;

  private lastCallTime = performance.now();
  private lastFpsUpdate = performance.now();
  private fps = 0;
  private animationFrameId = 0;

  constructor(
    canvas: HTMLCanvasElement,
    x?: number,
    y?: number,
    width?: number,
    height?: number,
    updateMotionValues?: Function,
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.ctx.translate(0, this.canvas.height);
    this.ctx.scale(1, -1);

    this.position = new Vector(x ?? 0, y ?? 0);
    this.onGround = false;
    this.initialPosition = this.position;
    this.width = width ?? 10;
    this.height = height ?? 10;
    this.updateDisplayValues = updateMotionValues ?? (() => {});

    this.createUniformAccelMotion();
  }

  draw() {
    const dt = this.currentTimeStep;
    const a = this.acceleration;
    const vi = this.initialVelocity;
    const di = this.initialPosition;

    const v = new Vector(vi.x, vi.y + a.y * dt);
    const d = new Vector(di.x + vi.x * dt, di.y + ((vi.y + v.y) * dt) / 2);

    if (d.y <= 0) {
      this.position = new Vector(d.x, 0);
      this.onGround = true;
    } else if (d.x <= 0) {
      this.position = new Vector(0, d.y);
      this.velocity = new Vector(-1 * v.x, v.y);
    } else if (d.x >= this.canvas.width) {
      this.position = new Vector(this.canvas.width, d.y);
      this.velocity = new Vector(-1 * v.x, v.y);
    } else {
      this.position = d;
      this.velocity = v;
      this.currentTimeStep += 1 / this.targetFps;
    }

    const now = performance.now();
    const delta = now - this.lastCallTime;
    const deltaFps = now - this.lastFpsUpdate;
    if (deltaFps >= 500) {
      this.fps = 1000 / delta;
      this.lastFpsUpdate = now;
    }
    if (!isFinite(this.fps)) this.fps = 0;
    this.lastCallTime = now;
    this.updateDisplayValues(this.position, this.velocity, this.acceleration, this.fps);

    this.ctx.clearRect(0, 0, 800, 600);
    this.ctx.fillStyle = "green";
    this.ctx.fillRect(this.position.x, this.position.y, this.width, this.height);

    this.animationFrameId = window.requestAnimationFrame(() => this.draw());
  }

  createUniformAccelMotion() {
    this.cancelMotion();
    this.animationFrameId = window.requestAnimationFrame(() => this.draw());
  }

  cancelMotion() {
    window.cancelAnimationFrame(this.animationFrameId);
    this.velocity = this.velocity.times(0);
    this.currentTimeStep = 1 / this.targetFps;
  }

  jump(direction?: "left" | "right") {
    if (this.onGround) {
      this.initialPosition = this.position;
      switch (direction) {
        case "left": {
          this.initialVelocity = new Vector(-1 * this.launchVelocity.x, this.launchVelocity.y);
          break;
        }
        case "right": {
          this.initialVelocity = new Vector(this.launchVelocity.x, this.launchVelocity.y);
          break;
        }
        default: {
          this.initialVelocity = new Vector(0, this.launchVelocity.y);
        }
      }
      this.createUniformAccelMotion();
      this.onGround = false;
    }
  }
}
