import { ParserResult, parse } from './parser.js'
import { EDTFType } from './types.js';

export abstract class ExtDateTime {
  abstract values: number[]
  constructor(input: number | string | ExtDateTime | Partial<ParserResult> | undefined) {}

  static get type() {
    return this.name as EDTFType;
  }

  static parse(input: string) {
    return parse(input, { types: [this.type] })
  }

  static from(input: ExtDateTime | string) {
    return (input instanceof this) ? input : new this(input)
  }

  static UTC(...args: Parameters<typeof Date.UTC>) {
    let time = Date.UTC(...args)

    // ECMA Date constructor converts 0-99 to 1900-1999!
    if (args[0] >= 0 && args[0] < 100)
      time = adj(new Date(time))

    return time
  }

  get type() {
    return this.constructor.type
  }

  get edtf() {
    return this.toEDTF()
  }

  get isEDTF() {
    return true
  }

  abstract toEDTF(): string;

  toJSON() {
    return this.toEDTF()
  }

  toString() {
    return this.toEDTF()
  }

  toLocaleString(...args) {
    return this.localize(...args)
  }

  inspect() {
    return this.toEDTF()
  }

  abstract min: number;
  abstract max: number;

  valueOf() {
    return this.min
  }

  [Symbol.toPrimitive](hint: string) {
    return (hint === 'number') ? this.valueOf() : this.toEDTF()
  }


  covers(other: this) {
    return (this.min <= other.min) && (this.max >= other.max)
  }

  compare(other: this) {
    if (other.min == null || other.max == null) return null

    let [a, x, b, y] = [this.min, this.max, other.min, other.max]

    if (a !== b)
      return a < b ? -1 : 1

    if (x !== y)
      return x < y ? -1 : 1

    return 0
  }

  includes(other: this) {
    let covered = this.covers(other)
    if (!covered || !this[Symbol.iterator]) return covered

    for (let cur of this) {
      if (cur.edtf === other.edtf) return true
    }

    return false
  }

  *until(then: this) {
    yield this
    if (this.compare(then)) yield* this.between(then)
  }

  *through(then: this) {
    yield* this.until(then)
    if (this.compare(then)) yield then
  }

  *between(then: this) {
    then = this.constructor.from(then)

    let cur = this
    let dir = this.compare(then)

    if (!dir) return

    for (;;) {
      cur = cur.next(-dir)
      if (cur.compare(then) !== dir) break
      yield cur
    }
  }
}

function adj(date: Date, by = 1900) {
  date.setUTCFullYear(date.getUTCFullYear() - by)
  return date.getTime()
}
