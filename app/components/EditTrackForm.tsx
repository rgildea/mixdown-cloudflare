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

function EditTrackForm({ track, onCancelButtonClicked, onSubmitButtonClicked }: EditTrackFormProps) {
	const isPending = useIsPending()
	const actionData = useActionData<typeof action>()

	const [form, fields] = useForm({
		id: 'edit-track',
		constraint: getZodConstraint(TrackSchema),
		lastResult: actionData,
		defaultValue: track as TrackWithVersions,
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
			<div className="text-s h-2 font-semibold text-orange-500">{actionData?.status === 'success' && 'Success!'}</div>

			<Field
				labelProps={{ htmlFor: fields.title.id, children: 'Title' }}
				inputProps={{
					...getInputProps(fields.title, { type: 'text' }),
					autoComplete: 'name',
					defaultValue: fields.title.initialValue,
				}}
				errors={fields.title.errors}
			/>

			{/* <div>
                <input
            className="text-md w-full border-b-2 bg-card focus-visible:placeholder-transparent focus-visible:outline-none"
            defaultValue={fields.title.initialValue?.toString()}
            placeholder="Title"
            {...getInputProps(fields.title, { type: 'text' })}
        /> <div id={fields.title.errorId} className="mt-1 h-1 text-xs font-semibold text-input-invalid">
            {fields.title.errors}
        </div>  */}

			<Field
				labelProps={{ htmlFor: fields.description.id, children: 'Description' }}
				inputProps={{
					...getInputProps(fields.description, { type: 'text' }),
					autoComplete: 'description',
				}}
				errors={fields.description.errors}
			/>

			{/* <div>
        <input
            className="text-md w-full border-b-2 bg-card focus-visible:placeholder-transparent focus-visible:outline-none"
            placeholder="Description"
            {...getInputProps(fields.description, { type: 'text' })}
        />
        <div id={fields.description.errorId} className="mt-1 h-1 text-xs font-semibold text-input-invalid">
            {fields.description.errors}
        </div>
    </div> */}
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
