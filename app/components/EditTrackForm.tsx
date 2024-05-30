import { FormMetadata, getFormProps, getInputProps } from '@conform-to/react'
import { Field } from './forms'
import { Form } from '@remix-run/react'
import z from 'zod'
import { TrackWithVersions } from '#app/utils/track.server'
import { StatusButton } from './ui/status-button'

export const TrackSchema = z.object({
	title: z.string({ required_error: 'Title is required' }).min(3).max(100),
	description: z.string({ required_error: 'Description is required' }).min(3).max(500),
})

interface EditTrackFormProps {
	track: TrackWithVersions
	actionData: any //ReturnType<typeof action> // Replace 'any' with the actual type if known
	isPending: boolean
	form: FormMetadata<TrackWithVersions>
	fields: any
}

function EditTrackForm({ track, actionData, isPending, form, fields }: EditTrackFormProps) {
	console.log('rending form for', track)

	return (
		<Form method="post" {...getFormProps(form)} onSubmit={form.onSubmit}>
			<div id={form.errorId} className="text-s h-2 font-semibold text-input-invalid">
				{form.errors}
			</div>
			<div className="text-s h-2 font-semibold text-orange-500">
				{actionData?.result?.status === 'success' && 'Success!'}
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
		</Form>
	)
}

export default EditTrackForm
