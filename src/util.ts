import { Bitmask } from './bitmask.js'
const { assign } = Object


export function num(data: number | string | string[] ) {
  return Number(Array.isArray(data) ? data.join('') : data)
}

export function join(data: any[]) {
  return data.join('')
}

export function zero() { return 0 }

export function nothing() { return null }

export function pick<T>(...args: T[]) {
  return args.length === 1 ?
    data => data[args[0]] :
    data => concat(data, args)
}

export function pluck(...args) {
  return data => args.map(i => data[i])
}

export function concat<T>(data: T[], idx = data.keys()) {
  return Array.from(idx)
    .reduce((memo, i) => data[i] !== null ? memo.concat(data[i]) : memo, [] as T[])
}

export function merge(...args) {
  if (typeof args[args.length - 1] === 'object')
    var extra = args.pop()

  return data => assign(args.reduce((a, i) => assign(a, data[i]), {}), extra)
}

export function interval(level) {
  return data => ({
    values: [data[0], data[2]],
    type: 'Interval',
    level
  })
}

export function masked(type = 'unspecified', symbol = 'X') {
  return (data, _, reject) => {
    data = data.join('')

    let negative = data.startsWith('-')
    let mask = data.replace(/-/g, '')

    if (mask.indexOf(symbol) === -1) return reject

    let values = Bitmask.values(mask, 0)

    if (negative) values[0] = -values[0]

    return {
      values, [type]: Bitmask.compute(mask)
    }
  }
}

export function date(values, level = 0, extra = null) {
  return assign({
    type: 'Date',
    level,
    values: Bitmask.normalize(values.map(Number))
  }, extra)
}

export function year(values, level = 1, extra = null) {
  return assign({
    type: 'Year',
    level,
    values: values.map(Number)
  }, extra)
}

export function century(value, level = 0) {
  return {
    type: 'Century',
    level,
    values: [value]
  }
}

export function decade(value, level = 2) {
  return {
    type: 'Decade',
    level,
    values: [value]
  }
}

export function datetime(data) {
  let offset = data[3]
  if (offset == null) offset = new Date().getTimezoneOffset()

  return {
    values: Bitmask.normalize(data[0].map(Number)).concat(data[2]),
    offset,
    type: 'Date',
    level: 0
  }
}

export function season(data, level = 1) {
  return {
    type: 'Season',
    level,
    values: [Number(data[0]), Number(data[2])]
  }
}

export function list(data) {
  return assign({ values: data[1], level: 2 }, data[0], data[2])
}

export function qualify([parts], _, reject) {
  let q = {
    uncertain: new Bitmask(), approximate: new Bitmask()
  }

  let values = parts
    .map(([lhs, part, rhs], idx) => {
      for (let ua in lhs) q[ua].qualify(idx * 2)
      for (let ua in rhs) q[ua].qualify(1 + idx * 2)
      return part
    })

  return (!q.uncertain.value && !q.approximate.value) ?
    reject : {
      ...date(values, 2),
      uncertain: q.uncertain.value,
      approximate: q.approximate.value
    }
}
