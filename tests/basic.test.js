import { test } from 'uvu'
import { inlineSnapshot } from '../src/index.js'

test('simple', async () => {
  await inlineSnapshot(JSON.stringify({ a: 1 }))
})

const add = (a, b) => a + b

test('func exec', async () => {
  await inlineSnapshot(add(1, 2), ``)
})

test.run()
