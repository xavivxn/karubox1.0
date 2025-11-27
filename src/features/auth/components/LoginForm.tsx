'use client'

import { useAuth } from '../hooks/useAuth'
import { LoginHeader } from './LoginHeader'
import { ErrorAlert } from './ErrorAlert'
import { LoginFields } from './LoginFields'
import { LoginButton } from './LoginButton'
import { LoginFooter } from './LoginFooter'
import { DevCredentials } from './DevCredentials'

export default function LoginForm() {
  const {
    email,
    setEmail,
    password,
    setPassword,
    loading,
    error,
    handleLogin
  } = useAuth()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <LoginHeader />
        
        <form onSubmit={handleLogin} className="space-y-6">
          <ErrorAlert message={error} />
          
          <LoginFields
            email={email}
            password={password}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            disabled={loading}
          />
          
          <LoginButton loading={loading} />
        </form>

        <LoginFooter />
        <DevCredentials />
      </div>
    </div>
  )
}
