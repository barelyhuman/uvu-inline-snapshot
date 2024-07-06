import { readFile, writeFile } from 'fs/promises'
import MagicString from 'magic-string'
import { snapshot } from 'uvu/assert'

const METHOD_PARAM_GROUPING_RGX = /(inlineSnapshot)(\((.+)(,(.+))?\n*?\))/
const METHOD_NAME = 'inlineSnapshot'

const fileMap = new Map()
const mStringMap = new Map()

export function inlineSnapshot(actualResult, expected) {
  if (!expected) {
    const stack = new Error().stack
    const stackArr = stack.split('\n')
    return updateSnapshot(stackArr, actualResult)
  }

  return snapshot(String(actualResult), String(expected))
}

async function updateSnapshot(stackArr, actualResult) {
  /** @type string[] */
  let matched
  stackArr.forEach((l, i) => {
    if (l.toLowerCase() === 'error') {
      return false
    }

    if (l.includes('inlineSnapshot')) {
      matched = stackArr[i + 1].match(/\((.+)\)$/)
    }
  })

  if (!matched) {
    return
  }

  const filePath = matched[1]
  const pathSplits = filePath.split(':')
  let lineNumber, col
  pathSplits.reverse().forEach((i, ind) => {
    if (ind === 0 && !isNaN(+i)) {
      col = i
    }
    if (ind === 1 && !isNaN(+i)) {
      lineNumber = i
    }
  })

  const sanitizedFilePath = filePath
    .replace(`:${lineNumber}:${col}`, '')
    .replace('file://', '')

  let fileData
  let mStr

  if (fileMap.has(sanitizedFilePath)) {
    fileData = fileMap.get(sanitizedFilePath)
    mStr = mStringMap.get(sanitizedFilePath)
  } else {
    fileData = await readFile(sanitizedFilePath, 'utf8')
    mStr = new MagicString(fileData)
    fileMap.set(sanitizedFilePath, fileData)
    mStringMap.set(sanitizedFilePath, mStr)
  }

  const lineSplits = fileData.split('\n')
  let startIndex = -1
  for (let i = 0; i < lineSplits.length; i += 1) {
    const x = lineSplits[i]
    // @ts-ignore linenumber will always exist on the stack
    if (i + 1 === +lineNumber) {
      // @ts-ignore col will always exist on the stack
      const replaceFrom = startIndex + +col
      const matched = x.match(METHOD_PARAM_GROUPING_RGX)
      if (!matched) {
        break
      }
      const original = matched[3]
      mStr.update(
        replaceFrom,
        replaceFrom + matched[0].length,
        `${METHOD_NAME}(${original},\`${actualResult}\`)`
      )
      break
    }
    startIndex += x.length + '\n'.length
  }
  await writeFile(sanitizedFilePath, mStr.toString(), 'utf8')
}
