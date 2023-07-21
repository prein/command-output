const { spawn } = require('child_process')
const { Transform } = require('stream')
const { Buffer } = require('buffer')
const process = require('process')

const core = require('@actions/core')

// Default shell invocation used by GitHub Action 'run:'
const shellArgs = {
  bash: ['--noprofile', '--norc', '-eo', 'pipefail', '-c'],
  sh: ['-e', '-c'],
  python: ['-c'],
  pwsh: ['-command', '.'],
  powershell: ['-command', '.']
}

class RecordStream extends Transform {
  constructor () {
    super()
    this._data = Buffer.from([])
  }

  get output () {
    return this._data
  }

  _transform (chunk, encoding, callback) {
    this._data = Buffer.concat([this._data, chunk])
    callback(null, chunk)
  }
}

function run (command, shell, outputTimeout) {
  return new Promise((resolve, reject) => {
    const outRec = new RecordStream()
    const errRec = new RecordStream()

    const args = shellArgs[shell]

    if (!args) {
      return reject(new Error(`Option "shell" must be one of: ${Object.keys(shellArgs).join(', ')}.`))
    }

    // Execute the command
    const cmd = spawn(shell, [...args, command])

    let timer

    // Record stream output and pass it through main process
    cmd.stdout.pipe(outRec).pipe(process.stdout)
    cmd.stderr.pipe(errRec).pipe(process.stderr)

    // Track output activity and set the timeout
    outRec.on('data', (data) => {
      clearTimeout(timer) // Reset the timer on each data event
      timer = setTimeout(() => {
        console.log('Killing the command process...')
        reject(new Error(`Command timed out due to no output for ${outputTimeout} seconds`))
        cmd.kill()
      }, outputTimeout * 1000)
    })

    cmd.on('error', (error) => {
      clearTimeout(timer) // Clear the timeout when an error occurs
      reject(error)
    })

    cmd.on('exit', code => {
      clearTimeout(timer) // Clear the timeout when the process exits

      core.setOutput('stdout', outRec.output.toString())
      core.setOutput('stderr', errRec.output.toString())

      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`Process completed with exit code ${code}.`))
      }
    })
  })
}

run(core.getInput('run'), core.getInput('shell'), core.getInput('no_output_timeout'))
  .catch(error => core.setFailed(error.message))
