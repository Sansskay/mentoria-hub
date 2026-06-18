'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!email || !password) {
      setError('Заполни все поля')
      setLoading(false)
      return
    }

    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    })

    if (loginError) {
      if (loginError.message.includes('Invalid login')) {
        setError('Неверный email или пароль')
      } else if (loginError.message.includes('Email not confirmed')) {
        setError('Подтверди email или войди через Google')
      } else {
        setError('Ошибка: ' + loginError.message)
      }
      setLoading(false)
      return
    }

    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .single()

      if (!profile) {
        router.push('/onboarding')
      } else {
        router.push('/dashboard')
      }
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 
                    flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <Link href="/"
                className="text-3xl font-bold text-indigo-600 hover:opacity-80">
            Mentoria Hub
          </Link>
          <p className="text-gray-500 mt-2">Рады видеть тебя снова!</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Вход</h2>

          <form onSubmit={handleLogin} className="space-y-4">

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                placeholder="твой@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl
                           focus:border-indigo-500 focus:outline-none
                           text-gray-900 bg-white"
                style={{ color: '#111827' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Пароль
              </label>
              <input
                type="password"
                placeholder="Твой пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl
                           focus:border-indigo-500 focus:outline-none
                           text-gray-900 bg-white"
                style={{ color: '#111827' }}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 
                              px-4 py-3 rounded-xl text-sm">
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-white text-lg
                         bg-gradient-to-r from-indigo-600 to-purple-600 
                         hover:shadow-lg transition-all disabled:opacity-50"
            >
              {loading ? 'Входим...' : 'Войти →'}
            </button>

          </form>

          <p className="text-center text-gray-500 mt-6 text-sm">
            Нет аккаунта?{' '}
            <Link href="/auth/register"
                  className="text-indigo-600 font-medium hover:underline">
              Зарегистрироваться
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
