import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { Form, Link, useActionData } from '@remix-run/react'

import { action } from '#app/root'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import React from 'react'
import { HoneypotInputs } from 'remix-utils/honeypot/react'
import z from 'zod'
import { ErrorList, Field } from './forms'
import { Button } from './ui/button'
import { StatusButton } from './ui/status-button'
import { useIsPending } from '#app/utils/misc'

const title = z.string({ required_error: 'Title is required' }).min(3).max(100)
const TrackSchema = z.object({ title })

interface NewTrackFormProps {
	setModalOpen: React.Dispatch<React.SetStateAction<boolean>>
	onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
}

export default function NewTrackForm({ setModalOpen, onSubmit }: NewTrackFormProps) {
	const actionData = useActionData<typeof action>()
	const isPending = useIsPending()
	const [form, fields] = useForm({
		id: 'new-track-form',
		constraint: getZodConstraint(TrackSchema),
		lastResult: actionData?.result,
		onValidate({ formData }) {
			const result = parseWithZod(formData, { schema: TrackSchema })
			return result
		},
		shouldRevalidate: 'onBlur',
		onSubmit(event) {
			console.log('form onSubmit event', event)
			onSubmit(event)
			setModalOpen(false)
		},
	})
	return (
		<Form method="POST" {...getFormProps(form)}>
			<HoneypotInputs />
			<Field
				labelProps={{
					htmlFor: fields.title.id,
					children: 'Title',
				}}
				inputProps={{
					...getInputProps(fields.title, { type: 'text' }),
					autoFocus: true,
					autoComplete: 'off',
				}}
				errors={fields.title.errors}
			/>
			<ErrorList errors={form.errors} id={form.errorId} />
			<div className="grid w-full grid-cols-2 gap-6">
				<Button variant="secondary" asChild>
					<Link to="..">Cancel</Link>
				</Button>
				<StatusButton status={isPending ? 'pending' : form.status ?? 'idle'} type="submit" disabled={isPending}>
					Submit
				</StatusButton>
			</div>
		</Form>
	)
}
