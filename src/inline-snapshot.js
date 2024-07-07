import { readFile, writeFile } from 'fs/promises'
import MagicString from 'magic-string'
import { snapshot } from 'uvu/assert'
import { parse } from 'acorn-loose'

const METHOD_PARAM_GROUPING_RGX = /inlineSnapshot(\(\s*(.+)\s*(\)|(.+\s*\))))/
const METHOD_NAME = 'inlineSnapshot'

const fileMap = new Map()
const mStringMap = new Map()

const shouldUpdate = () => process.env.UVU_SNAPSHOTS === '1'
export async function inlineSnapshot(actualResult, expected) {
  if (!expected || shouldUpdate()) {
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
  /**@type {import("magic-string").default}*/
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
      let matched = x.match(METHOD_PARAM_GROUPING_RGX)
      if (!matched) {
        // can be a single line partial statment
        const tempText = lineSplits.slice(i, 10).join('\n')
        matched = tempText.match(METHOD_PARAM_GROUPING_RGX)
        if (!matched) {
          break
        }
      }

      let ast
      try {
        ast = parse(matched[0], {
          ecmaVersion: 2020,
        })
      } catch {
        ast = undefined
      }

      if (!ast) {
        break
      }

      /**@type {import("acorn").CallExpression|false}*/
      let callExpression
      if (ast.body && ast.body.length > 0) {
        callExpression = getCallExpression(ast)
      }

      if (callExpression === false) {
        break
      }

      const callExprStart = replaceFrom + callExpression.start
      const callExprEnd = replaceFrom + callExpression.end
      const args = callExpression.arguments
      const ogArgPosition = replaceFrom + args[0].start
      const ogArgEnd = replaceFrom + args[0].end
      const firstArg = mStr.slice(ogArgPosition, ogArgEnd)

      if (args.length === 2) {
        const start = args[1].start
        const end = args[1].end
        mStr.update(
          replaceFrom,
          replaceFrom + start,
          `${METHOD_NAME}(${firstArg},`
        )
        mStr.update(
          replaceFrom + start,
          replaceFrom + end,
          `\`${actualResult}\``
        )
      } else if (args.length == 1) {
        mStr.overwrite(
          callExprStart,
          callExprEnd,
          `${METHOD_NAME}(${firstArg},\`${actualResult}\`)`
        )
      }

      break
    }
    startIndex += x.length + '\n'.length
  }
  await writeFile(sanitizedFilePath, mStr.toString(), 'utf8')
}

/**
 * @param {import("acorn").Program} astProgram
 */
function getCallExpression(astProgram) {
  const baseExpression = astProgram.body.find(d => {
    return d.type == 'ExpressionStatement'
  })

  if (
    baseExpression.type === 'ExpressionStatement' &&
    baseExpression.expression.type === 'CallExpression'
  ) {
    return baseExpression.expression
  }

  return false
}
