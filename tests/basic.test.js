import { test } from 'uvu'
import { inlineSnapshot } from '../src/index.js'

test('simple', async () => {
  await inlineSnapshot(JSON.stringify({ a: 1 }))
})

test.run()
