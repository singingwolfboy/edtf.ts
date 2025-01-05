export function assert(value: any, message?: string) {
  return equal(!!value, true, message ||
    `expected "${value}" to be ok`)
}

export function equal<T>(actual: T, expected: T, message?: string) {
  // eslint-disable-next-line eqeqeq
  if (actual == expected)
    return true

  if (Number.isNaN(actual) && Number.isNaN(expected))
    return true

  throw new Error(message ||
    `expected "${actual}" to equal "${expected}"`)
}

assert.equal = equal

export default assert
