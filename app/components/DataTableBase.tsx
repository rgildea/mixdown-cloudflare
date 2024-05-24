import { Icon } from '#app/components/ui/icon'
import DataTable, { TableProps, createTheme } from 'react-data-table-component'
import { ClientOnly } from 'remix-utils/client-only'
const sortIcon = <Icon className="text-body-md" name="chevron-down" />
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
			default: '#ECEFEF',
		},
		context: {
			background: '#cb4b16',
			text: '#FFFFFF',
		},
		divider: {
			default: '#144c5a',
		},
		highlightOnHover: {
			default: 'rgba(252, 103, 54)',
		},
		button: {
			default: '#2aa198',
			hover: 'rgba(0, 0, 0, 0.705)',
			focus: 'rgba(255,255,255,.12)',
			disabled: 'rgba(255, 255, 255, .34)',
		},
		sortFocus: {
			default: '#2aa198',
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
						pagination
						paginationPerPage={10}
						paginationRowsPerPageOptions={[5, 10, 20]}
						fixedHeader
						sortIcon={sortIcon}
						dense
						{...props}
					/>
				)
			}}
		</ClientOnly>
	)
}

export default DataTableBase
