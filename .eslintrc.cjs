/** @type {import('eslint').Linter.Config} */
module.exports = {
	extends: ['eslint:recommended', 'prettier'],
	env: {
		browser: true,
		commonjs: true,
		es6: true,
	},
	overrides: [
		// React
		{
			files: ['**/*.{js,jsx,ts,tsx}'],
			plugins: ['react', 'jsx-a11y'],
			extends: [
				'plugin:react/recommended',
				'plugin:react/jsx-runtime',
				'plugin:react-hooks/recommended',
				'plugin:jsx-a11y/recommended',
			],
			settings: {
				react: {
					version: 'detect',
				},
				formComponents: ['Form'],
				linkComponents: [
					{ name: 'Link', linkAttribute: 'to' },
					{ name: 'NavLink', linkAttribute: 'to' },
				],
				'import/resolver': {
					typescript: {},
				},
			},
		},

		// Typescript
		{
			files: ['**/*.{ts,tsx}'],
			plugins: ['@typescript-eslint', 'import'],
			parser: '@typescript-eslint/parser',
			rules: {
				'@typescript-eslint/no-explicit-any': 'off',
				'react/prop-types': 'off',
			},
			settings: {
				'import/internal-regex': '^~/',
				'import/resolver': {
					node: {
						extensions: ['.ts', '.tsx'],
					},
					typescript: {
						alwaysTryTypes: true,
					},
				},
			},
			extends: ['plugin:@typescript-eslint/recommended', 'plugin:import/recommended', 'plugin:import/typescript'],
		},

		// Node
		{
			files: ['.eslintrc.cjs'],
			env: {
				node: true,
			},
		},
	],
}
