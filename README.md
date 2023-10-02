# uvu-inline-snapshot

### Installation

```sh
npm i uvu uvu-inline-snapshot
```

### Usage

```js
const { test } = require('uvu')
const { inlineSnapshot } = require('uvu-inline-snapshot')

const add = (x,y) => x + y

test("example 1",()=>{
    await inlineSnapshot(add(1,2),"")
})

test.run()

// --------------------
// will be converted to 
const { test } = require('uvu')
const { inlineSnapshot } = require('uvu-inline-snapshot')

const add = (x,y) => x + y

test("example 1",()=>{
    await inlineSnapshot(add(1,2),"3") // Filled for you
})

test.run()
```

## License
[MIT](/LICENSE)