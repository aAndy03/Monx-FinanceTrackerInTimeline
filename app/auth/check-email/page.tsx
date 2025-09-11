import Link from "next/link"

export default function CheckEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6 bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Check your email</h1>
          <p className="text-sm text-gray-600">
            We've sent you a confirmation link. Please check your email and click the link to activate your account.
          </p>
        </div>

        <div className="text-center">
          <Link href="/auth/login" className="text-blue-600 hover:underline text-sm">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
