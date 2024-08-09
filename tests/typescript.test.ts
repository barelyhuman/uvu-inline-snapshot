import { test } from 'uvu'
import { inlineSnapshot } from '../src/index.js'

test('simple', async () => {
  await inlineSnapshot(JSON.stringify({ a: 1 }))
})

const add = (a: number, b: number) => a + b

test('func exec', async () => {
  const value: number = add(1, 2)
  await inlineSnapshot(value, ``)
})

test.run()
