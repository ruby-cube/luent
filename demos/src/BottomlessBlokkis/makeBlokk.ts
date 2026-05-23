export type Rotation = 0 | 1 | 2 | 3

export class Blokk {
  shiftY: number

  constructor(
    public matrix: (0 | 1)[][],
    public shiftX: number,
    public rotation: Rotation
  ) {
    this.shiftY = this.calcInitialShiftY(rotation)
  }

  moveDown() {
    this.shiftY++
  }

  moveRight() {
    this.shiftX++
  }

  moveLeft() {
    this.shiftX--
  }

  rotate() {
    this.rotation =
      ((this.rotation + 1) % 4) as Rotation;
  }

  // # find the edges of the shape within base grid

  get rightEdge() {
    const b = this.getOccupiedBounds(this.rotation)
    return this.shiftX + (b.maxC + 1)
  }

  get leftEdge() {
    const b = this.getOccupiedBounds(this.rotation)
    return this.shiftX + b.minC
  }

  get topEdge() {
    const b = this.getOccupiedBounds(this.rotation)
    return this.shiftY + b.minR
  }

  get bottomEdge() {
    const b = this.getOccupiedBounds(this.rotation)
    return this.shiftY + (b.maxR + 1)
  }

  private calcInitialShiftY(rotation: Rotation) {
    const b = this.getOccupiedBounds(rotation);
    // place so bottom-most filled cell's bottom is at y = 0
    return -(b.maxR + 1);
  }

  private getOccupiedBounds(rotation: Rotation) {
    const { matrix } = this
    const N = matrix.length;
    const stepsMap = [0, 3, 2, 1] as const;
    const steps = stepsMap[rotation];

    let minR = Infinity, maxR = -Infinity, minC = Infinity, maxC = -Infinity;
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (!matrix[r][c]) continue;
        let newR: number, newC: number;
        if (steps === 0) { newR = r; newC = c; }
        else if (steps === 1) { newR = c; newC = (N - 1) - r; }
        else if (steps === 2) { newR = (N - 1) - r; newC = (N - 1) - c; }
        else /* steps === 3 */ { newR = (N - 1) - c; newC = r; }

        if (newR < minR) minR = newR;
        if (newR > maxR) maxR = newR;
        if (newC < minC) minC = newC;
        if (newC > maxC) maxC = newC;
      }
    }

    // If no filled cells, return full bounds
    if (minR === Infinity) return { minR: 0, maxR: N - 1, minC: 0, maxC: N - 1 };
    return { minR, maxR, minC, maxC };
  }
}

export type BlokkModel = Readonly<Blokk>

export function makeBlokk(...args: ConstructorParameters<typeof Blokk>): BlokkModel {
  return new Blokk(...args)
}
