'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (fullName.trim().length < 2) {
      setError('Введи имя (минимум 2 буквы)')
      return
    }
    if (password.length < 6) {
      setError('Пароль минимум 6 символов')
      return
    }

    setLoading(true)

    console.log('Регистрируем:', email)

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email,
      password: password,
    })

    console.log('Результат регистрации:', { data, error: signUpError })

    if (signUpError) {
      console.error('Ошибка регистрации:', signUpError)
      setError('Ошибка: ' + signUpError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      console.log('Регистрация успешна, переходим на онбординг')
      router.push('/onboarding')
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
          <p className="text-gray-500 mt-2">Создай аккаунт бесплатно</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Регистрация</h2>

          <form onSubmit={handleRegister} className="space-y-4">

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Имя
              </label>
              <input
                type="text"
                placeholder="Как тебя зовут?"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl
                           focus:border-indigo-500 focus:outline-none
                           text-gray-900 bg-white"
                style={{ color: '#111827' }}
              />
            </div>

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
                placeholder="Минимум 6 символов"
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
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white border-t-transparent 
                                   rounded-full animate-spin" />
                  Создаём аккаунт...
                </span>
              ) : (
                'Создать аккаунт →'
              )}
            </button>

          </form>

          <p className="text-center text-gray-500 mt-6 text-sm">
            Уже есть аккаунт?{' '}
            <Link href="/auth/login"
                  className="text-indigo-600 font-medium hover:underline">
              Войти
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}