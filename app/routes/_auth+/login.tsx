import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '~/components/ui/card'

import { Button } from '~/components/ui/button'

import { Form, useActionData } from '@remix-run/react'
import { z } from 'zod'
import { ActionFunctionArgs } from '@remix-run/cloudflare'
import { EmailSchema, PasswordSchema } from '~/utils/user-validation'

const schema = z.object(
  {
    email: EmailSchema,
    password: PasswordSchema,
  },
  { required_error: 'Please fill in the required field' },
)

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData()

  // Construct an object using `Object.fromEntries`
  const payload = Object.fromEntries(formData)

  // Then parse it with zod
  const result = schema.safeParse(payload)

  // Return the error to the client if the data is not valid
  if (!result.success) {
    const error = result.error.flatten()

    return {
      payload,
      formErrors: error.formErrors,
      fieldErrors: error.fieldErrors,
    }
  }

  // We will skip the implementation as it is not important to the tutorial
  // const message = await sendMessage(result.data);

  // // Return a form error if the message is not sent
  // if (!message.sent) {
  //   return {
  //     payload,
  //     formErrors: ['Failed to send the message. Please try again later.'],
  //     fieldErrors: {},
  //   };
}

export default function LoginPage() {
  const result = useActionData<typeof action>()
  return (
    <div className="container h-full min-h-screen bg-slate-50">
      <Card className="mx-auto  w-full max-w-md text-card-foreground ">
        <CardHeader>
          <CardTitle className="text-4xl font-extrabold">
            Welcome Back!
          </CardTitle>
          <CardDescription>Please enter your login details.</CardDescription>
        </CardHeader>
        <Form method="POST">
          <CardContent className="flex flex-col space-y-8">
            <div>{result?.formErrors}</div>
            {/* <label className="text-card-foreground" htmlFor="username">
              Username
            </label> */}
            <input
              className="text-md border-b-2 focus-visible:placeholder-transparent focus-visible:outline-none"
              name="username"
              placeholder="email"
              type="text"
            />
            {/* <label
              className="text-card-foreground"
              htmlFor="password">
              Password
            </label> */}
            <input
              className="text-md border-b-2"
              name="password"
              placeholder="password"
              type="password"
            />
          </CardContent>
        </Form>
        <CardFooter>
          <Button type="submit" variant="outline">Submit</Button>
        </CardFooter>
      </Card>
    </div>
  )
}
