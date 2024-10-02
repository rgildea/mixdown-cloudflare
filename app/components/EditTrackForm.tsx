import { action } from '#app/routes/tracks+/$id'
import { useIsPending } from '#app/utils/misc'
import { TrackWithVersions } from '#app/utils/track.server'
import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { Form, useActionData } from '@remix-run/react'
import z from 'zod'
import { Field } from './forms'
import { Button } from './ui/button'
import { StatusButton } from './ui/status-button'

export const TrackSchema = z.object({
	title: z.string({ required_error: 'Title is required' }).min(3).max(100),
	description: z.string().min(3).max(500).optional(),
})

interface EditTrackFormProps {
	track: TrackWithVersions
	onCancelButtonClicked: () => void
	onSubmitButtonClicked?: () => void
}

const EditTrackForm = ({ track, onCancelButtonClicked, onSubmitButtonClicked }: EditTrackFormProps) => {
	const isPending = useIsPending()
	const actionData = useActionData<typeof action>()

	const [form, fields] = useForm({
		id: 'edit-track',
		constraint: getZodConstraint(TrackSchema),
		lastResult: actionData?.result,
		defaultValue: track,

		onValidate({ formData }) {
			return parseWithZod(formData, { schema: TrackSchema })
		},
		shouldRevalidate: 'onBlur',
		shouldValidate: 'onBlur',
		onSubmit() {
			onSubmitButtonClicked?.()
		},
	})

	return (
		<Form method="post" {...getFormProps(form)}>
			<div id={form.errorId} className="text-s h-2 font-semibold text-input-invalid">
				{form.errors}
			</div>
			<div className="text-s h-2 font-semibold text-orange-500">
				{actionData?.result.status === 'success' && 'Success!'}
			</div>

			<Field
				labelProps={{ htmlFor: fields.title.id, children: 'Title' }}
				inputProps={{
					...getInputProps(fields.title, { type: 'text' }),
					autoComplete: 'name',
					defaultValue: fields.title.initialValue,
				}}
				errors={fields.title.errors}
			/>
			<StatusButton
				className="w-full"
				status={isPending ? 'pending' : form.status ?? 'idle'}
				type="submit"
				disabled={isPending}
			>
				Save
			</StatusButton>
			<Button onClick={onCancelButtonClicked} className="mt-1 flex w-full justify-center gap-4" variant="ghost">
				Cancel
			</Button>
		</Form>
	)
}

export default EditTrackForm
