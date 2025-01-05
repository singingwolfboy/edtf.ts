import nearley from 'nearley'
import grammar from './grammar'
import type { EDTFType } from './types';

export interface Constraints {
  level: 0 | 1 | 2;
  types: EDTFType[];
  seasonIntervals: boolean;
}

export interface ParserResult {
  level: 0 | 1 | 2;
  type: EDTFType;
  values: number[];
  uncertain?: number;
  approximate?: number;
  unspecified?: number;
  significant?: number;
}

export const defaults: Constraints = {
  level: 2,
  types: [],
  seasonIntervals: false
}

function byLevel(a: ParserResult, b: ParserResult) {
  return a.level < b.level ? -1 : a.level > b.level ? 1 : 0
}

function limit(results: ParserResult[], constraints: Partial<Constraints> = {}) {
  if (!results.length) return results

  let {
    level,
    types,
    seasonIntervals
  } = { ...defaults, ...constraints }


  return results.filter(res => {
    if (seasonIntervals && isSeasonInterval(res))
      return true

    if (res.level > level)
      return false
    if (types.length && !types.includes(res.type))
      return false

    return true
  })
}

function isSeasonInterval({ type, values }) {
  return type === 'Interval' && values[0].type === 'Season'
}

function best(results: ParserResult[]) {
  if (results.length < 2) return results[0]

  // If there are multiple results, pick the first
  // one on the lowest level!
  return results.sort(byLevel)[0]
}

export function parse(input: string, constraints: Partial<Constraints> = {}) {
  try {
    let nep = parser()
    let res = best(limit(nep.feed(input).results, constraints))

    if (!res) throw new Error('edtf: No possible parsings (@EOS)')

    return res

  } catch (error) {
    error.message += ` for "${input}"`
    throw error
  }
}

export function parser() {
  return new nearley.Parser(grammar.ParserRules, grammar.ParserStart)
}
