const { spawnSync } = require('node:child_process')
const { readFile, writeFile } = require('node:fs/promises')
const { join, resolve } = require('node:path')
const assert = require('assert/strict')

const ESM_HOOK = ['-r', 'esm']

const files = [
  {
    file: './basic.test.js',
    hook: ESM_HOOK,
    expected: `import { test } from 'uvu'
import { inlineSnapshot } from '../src/index.js'

test('simple', async () => {
  await inlineSnapshot(JSON.stringify({ a: 1 }),\`{"a":1}\`)
})

test.run()
`,
  },
]

;(async function run() {
  for (const d of files) {
    const testFilePath = resolve(join(__dirname, d.file))
    const originalContent = await readFile(testFilePath, 'utf8')

    const proc = spawnSync('node', d.hook.concat(testFilePath))
    if (proc.stderr.length > 0) {
      console.error(String(proc.stderr))
    }

    const currentContent = await readFile(testFilePath, 'utf8')
    try {
      assert.equal(currentContent, d.expected)
    } finally {
      await writeFile(testFilePath, originalContent, 'utf8')
    }
  }
  console.log('Testing Complete')
})()
