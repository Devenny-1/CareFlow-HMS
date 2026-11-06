import '../config/env.js'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const scriptDirectory = fileURLToPath(new URL('.', import.meta.url))
const scripts = ['seedDepartments.js', 'seedAdmin.js']

for (const script of scripts) {
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [`${scriptDirectory}${script}`], { stdio: 'inherit', env: process.env })
    child.once('error', reject)
    child.once('exit', (code) => code === 0 ? resolve() : reject(new Error(`${script} exited with code ${code}`)))
  })
}
