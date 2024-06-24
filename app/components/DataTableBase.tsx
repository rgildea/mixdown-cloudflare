import { InlineIcon } from '@iconify/react/dist/iconify.js'
import DataTable, { TableProps, createTheme } from 'react-data-table-component'
import { ClientOnly } from 'remix-utils/client-only'
const sortIcon = <InlineIcon className="size-2" icon="mdi:chevron-down" />
// createTheme creates a new theme named solarized that overrides the build in dark theme
createTheme(
	'mixdown',
	{
		headRow: {
			style: {
				border: 'none',
			},
		},
		text: {
			primary: '#0c2c55',
			secondary: '#010202',
		},
		background: {
			default: '#ecefef',
		},
		context: {
			background: '#cb4b16',
			text: '#FFFFFF',
		},
		divider: {
			default: '#ffffff',
		},
		highlightOnHover: {
			default: '#fc6736',
			// default: 'rgba(80, 194, 197, .5)',
			// default: 'rgba(255,	 255, 255, .25)',
			// color: '##FF0000',
		},
		button: {
			default: '#2aa198',
			hover: 'rgba(0, 0, 0, 0.705)',
			focus: 'rgba(255,255,255,.12)',
			disabled: 'rgba(255, 255, 255, .34)',
		},
		sortFocus: {
			// default: '#2aa198',
		},
	},
	'default',
)

function DataTableBase<T>(props: TableProps<T>): JSX.Element {
	return (
		<ClientOnly>
			{() => {
				return (
					<DataTable
						// pagination
						// paginationPerPage={10}
						// paginationRowsPerPageOptions={[5, 10, 20]}
						fixedHeader
						sortIcon={sortIcon}
						{...props}
					/>
				)
			}}
		</ClientOnly>
	)
}

export default DataTableBase
