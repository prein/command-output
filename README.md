# Timed output run

A `run` step drop-in replacement / wrapper that stores command output and monitors it for inactivity. Allows aborting the step when no activity (step does not produce any log output) for a certain amount of time is detected.

Use this action to automatically abort hung steps after a configurable timeout period to save credits and developers time

Compared to [setting a built in timeout for job or step](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idtimeout-minutes), the action only aborts a build when nothing is written to log for the amount of time set in `no_output_timeout` parameter.

## Inputs

### `run`

**Required** The command to run.

### `shell`

The shell used to run command.

### `no_output_timeout`

Amount of time after which to kill the process (seconds)

## Outputs

### `stdout`

The output of the command written to stdout.

### `stderr`

The output of the command written to stderr.

## Example usage

#### Fail the step after 5s of inactivity

```yaml
steps:
  - name: sleep to timeout
    uses: prein/timed-output-run/.github/actions/timed-output-run@main
    with:
      run: |
        echo "sleeping for 30s but failing after 5s"
        sleep 30
      shell: bash
      no_output_timeout: 5
    timeout-minutes: 1  # built in timeout - doesn't kick in
```
