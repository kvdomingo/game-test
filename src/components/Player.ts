export class Vector {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  add(other: number | Vector, subtract?: boolean) {
    if (typeof other === "number") {
      other = subtract ? -1 * other : other;
      return new Vector(this.x + other, this.y + other);
    } else {
      other = subtract ? other.times(-1) : other;
      return new Vector(this.x + other.x, this.y + other.y);
    }
  }

  minus(other: number | Vector) {
    return this.add(other, true);
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
  radius: number;
  targetFps = 60;
  currentTimeStep = 1 / this.targetFps;
  launchVelocity = new Vector(2, 7).times(this.physicsScaling);
  initialPosition: Vector;
  onGround: boolean;
  initialVelocity = new Vector(0, 0);
  updateDisplayValues: Function;

  private lastCallTime = performance.now();
  private lastFpsUpdate = performance.now();
  private fps = 0;
  private animationFrameId = 0;

  constructor(canvas: HTMLCanvasElement, x: number, y: number, radius: number, updateMotionValues?: Function) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.ctx.translate(0, this.canvas.height);
    this.ctx.scale(1, -1);

    this.position = new Vector(x ?? 0, y ?? 0);
    this.onGround = false;
    this.initialPosition = this.position;
    this.radius = radius;
    this.updateDisplayValues = updateMotionValues ?? (() => {});

    this.createUniformAccelMotion();
  }

  draw() {
    const dt = this.currentTimeStep;
    const a = this.acceleration;
    const vi = this.initialVelocity;
    const si = this.initialPosition;

    const v = this.velocity;
    const s = this.position;

    const dv = a.times(dt).add(vi).minus(v);
    const ds = a
      .times((1 / 2) * dt ** 2)
      .add(vi.times(dt))
      .add(si)
      .minus(s);

    const vn = v.add(dv);
    const sn = s.add(ds);

    if (sn.y - this.radius < 0) {
      // hit ground
      this.position = new Vector(sn.x, this.radius);
      this.velocity = this.velocity.times(0);
      this.onGround = true;
    } else if (sn.x - this.radius < 0) {
      // hit left wall
      this.position = new Vector(this.radius, sn.y);
      this.initialPosition = new Vector(0 - (si.x - 2 * this.radius), si.y);
      this.bounceOffWall(vn);
    } else if (sn.x + this.radius > this.canvas.width) {
      // hit right wall
      this.position = new Vector(this.canvas.width - this.radius, sn.y);
      this.initialPosition = new Vector(this.canvas.width + si.x + this.radius, si.y);
      this.bounceOffWall(vn);
    } else {
      this.position = sn;
      this.velocity = vn;
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

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.beginPath();
    this.ctx.arc(this.position.x, this.position.y, this.radius, 0, 2 * Math.PI, true);
    this.ctx.fillStyle = "green";
    this.ctx.fill();
    this.ctx.closePath();

    this.ctx.beginPath();
    this.ctx.arc(this.position.x, this.position.y, 3, 0, 2 * Math.PI, true);
    this.ctx.fillStyle = "black";
    this.ctx.fill();
    this.ctx.closePath();

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

  bounceOffWall(currentVelocity: Vector) {
    this.velocity = new Vector(-currentVelocity.x, currentVelocity.y);
    this.initialVelocity = new Vector(-this.initialVelocity.x, this.initialVelocity.y);
    this.currentTimeStep += 1 / this.targetFps;
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
