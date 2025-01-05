import * as types from './types.js'
import { Constraints, ParserResult, parse } from './parser.js'

const UNIX_TIME = /^\d{5,}$/

export function edtf(...args: [string | number | ParserResult] | [string, Partial<Constraints>]) {
  if (!args.length)
    return new types.Date()

  if (args.length === 1) {
    switch (typeof args[0]) {
    case 'object':
      return new (types[args[0].type] || types.Date)(args[0])
    case 'number':
      return new types.Date(args[0])
    case 'string':
      if ((UNIX_TIME).test(args[0]))
        return new types.Date(Number(args[0]))
    }
  }

  let res = parse(...args as [string, Partial<Constraints>])
  return new types[res.type](res)
}
