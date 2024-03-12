import { Form } from "@remix-run/react"

export async function action() {


  return new Response("Not Implemented", { status: 501 })
}

export default function Login() {
  return (
    <div className="md:container md:mx-auto p-4">
      <div className="flex flex-col justify-around max-w-lg">
        <h1 className="text-3xl font-sans font-extrabold">Login</h1>
        <Form>
          <input type="text" name="username" />
          <input type="password" name="password" />
          <button type="submit">Login</button>
        </Form>
      </div>
    </div >
  )
}