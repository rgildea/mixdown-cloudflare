import dotenv from 'dotenv'
import { afterAll, beforeAll, beforeEach, MockInstance, vi } from 'vitest'

// Load environment variables from .dev.vars
dotenv.config({ path: '.dev.vars' })

beforeAll(() => {
	console.log('Global setup before all tests')
	// Add any setup logic for each test here
})

afterAll(() => {
	console.log('Global teardown after all tests')
	// Add any teardown logic for each test here
})
export let consoleError: MockInstance<typeof console.error>

beforeEach(() => {
	const originalConsoleError = console.error
	consoleError = vi.spyOn(console, 'error')
	consoleError.mockImplementation((...args: Parameters<typeof console.error>) => {
		originalConsoleError(...args)
		throw new Error('Console error was called. Call consoleError.mockImplementation(() => {}) if this is expected.')
	})
})
