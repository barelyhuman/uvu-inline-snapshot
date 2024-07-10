# uvu-inline-snapshot

> Minimal Inline Snapshot utility for uvu/assert

### Limitations 
- Not tested enough with Typescript to confirm that it works with it. 

### Installation

```sh
npm i uvu uvu-inline-snapshot
```

### Usage

```js
const { test } = require('uvu')
const { inlineSnapshot } = require('uvu-inline-snapshot')

const add = (x, y) => x + y

test('example 1', async () => {
  await inlineSnapshot(add(1, 2), '')
})

test.run()

// --------------------
// will be converted to
const { test } = require('uvu')
const { inlineSnapshot } = require('uvu-inline-snapshot')

const add = (x, y) => x + y

test('example 1', async () => {
  await inlineSnapshot(add(1, 2), '3') // Filled for you
})

test.run()
```

To update multiple snapshots, just run the tests with `UVU_SNAPSHOTS=1` 

```sh
; UVU_SNAPSHOTS=1 uvu 
```

## License

[MIT](/LICENSE)
