#!/usr/bin/env node
import { execSync } from 'child_process'
// just pass the command through to the mixdown-database package
const command = process.argv.slice(2).join(' ')

execSync(`npx @rgildea/mixdown-database ${command}`, { stdio: 'inherit' })
