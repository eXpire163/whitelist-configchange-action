//import {wait} from '../src/wait'
//import { validateChange } from '../src/validation'
// import * as process from 'process'
// import * as cp from 'child_process'
// import * as path from 'path'
import {expect, test} from '@jest/globals'
import {load} from 'js-yaml'

import {validate} from '../src/main'


import { readFile } from "fs/promises";

test('validation', () => {
    const filepath = "data/sub/subbed/config.yaml"
    const yaml = load(await readFile(filepath, "utf8"))

    const filepathChanged = "data/sub/subbed/configChanged.yaml"
    const yamlChanged = load(await readFile(filepathChanged, "utf8"))



}
// test('throws invalid number', async () => {
//   const input = parseInt('foo', 10)
//   await expect(wait(input)).rejects.toThrow('milliseconds not a number')
// })

// test('wait 500 ms', async () => {
//   const start = new Date()
//   await wait(500)
//   const end = new Date()
//   const delta = Math.abs(end.getTime() - start.getTime())
//   expect(delta).toBeGreaterThan(450)
// })

// shows how the runner will run a javascript action with env / stdout protocol
// test('test runs', () => {
//   process.env['INPUT_MILLISECONDS'] = '500'
//   const np = process.execPath
//   const ip = path.join(__dirname, '..', 'lib', 'main.js')
//   const options: cp.ExecFileSyncOptions = {
//     env: process.env
//   }
//   console.log(cp.execFileSync(np, [ip], options).toString())
// })

// test('validationPass', async () => {

//   const data = {
//     foo: 1,
//     bar: "abc"
//   }
//   const schema = {
//     type: "object",
//     properties: {
//       foo: { type: "integer" },
//       bar: { type: "string" }
//     },
//     required: ["foo"],
//     additionalProperties: false
//   }

//   const result = validateChange(data, schema)

//   expect(result).toBeTruthy()
// })

// test('validationFail', async () => {

//   const data = {
//     foo: "bar"
//   }
//   const schema = {
//     type: "object",
//     properties: {
//       foo: { type: "integer" },
//       bar: { type: "string" }
//     },
//     required: ["foo"],
//     additionalProperties: false
//   }

//   const result = await validateChange(data, schema)

//   expect(result).toBeFalsy()
// })
