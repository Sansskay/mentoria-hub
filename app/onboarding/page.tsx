'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const GRADES = [
  { value: 8, label: '8 класс', emoji: '👦' },
  { value: 9, label: '9 класс', emoji: '👨‍🎓' },
  { value: 10, label: '10 класс', emoji: '🧑‍🎓' },
  { value: 11, label: '11 класс', emoji: '👩‍🏫' },
]

const INTERESTS = [
  { id: 'stem', label: 'STEM / Наука', emoji: '🔬' },
  { id: 'business', label: 'Бизнес', emoji: '💼' },
  { id: 'programming', label: 'Программирование', emoji: '💻' },
  { id: 'languages', label: 'Языки', emoji: '🗣️' },
  { id: 'social', label: 'Социальное влияние', emoji: '🌍' },
  { id: 'finance', label: 'Финансы', emoji: '💰' },
]

const GOALS = [
  { id: 'university', label: 'Поступить в топ-университет', emoji: '🎓' },
  { id: 'olympiad', label: 'Выиграть олимпиаду', emoji: '🏆' },
  { id: 'startup', label: 'Запустить стартап', emoji: '🚀' },
  { id: 'scholarship', label: 'Получить стипендию', emoji: '💵' },
  { id: 'skills', label: 'Развить навыки', emoji: '📚' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [showSuccess, setShowSuccess] = useState(false)
  const [user, setUser] = useState<any>(null)

  const [name, setName] = useState('')
  const [grade, setGrade] = useState<number | null>(null)
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [selectedGoals, setSelectedGoals] = useState<string[]>([])

  // Проверяем авторизацию
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/auth/login')
        return
      }

      setUser(session.user)
      setChecking(false)
    }
    checkAuth()
  }, [router])

  // Сохранение профиля
  const saveProfile = async () => {
    if (!user) return

    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      full_name: name,
      grade: grade,
      interests: selectedInterests,
      goals: selectedGoals,
    })

    if (error) {
      console.error('Ошибка:', error)
      alert('Ошибка: ' + error.message)
      return
    }

    setShowSuccess(true)

    setTimeout(() => {
      router.push('/dashboard')
    }, 2000)
  }

  const validateStep = () => {
    switch (step) {
      case 1: return name.trim().length >= 2
      case 2: return grade !== null
      case 3: return selectedInterests.length > 0
      case 4: return selectedGoals.length > 0
      default: return true
    }
  }

  const handleNext = async () => {
    if (!validateStep()) return

    if (step < 4) {
      setStep(step + 1)
    } else {
      setLoading(true)
      await saveProfile()
      setLoading(false)
    }
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const toggleInterest = (id: string) => {
    setSelectedInterests(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const toggleGoal = (id: string) => {
    setSelectedGoals(prev =>
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    )
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f9fafb' }}>
        <p style={{ color: '#6b7280' }}>Загрузка...</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #eef2ff, #e0e7ff)' }}>

      {/* Анимация завершения */}
      {showSuccess && (
        <div style={{
          position: 'fixed', inset: 0, display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 50, background: 'rgba(255,255,255,0.95)'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 96, height: 96, borderRadius: '50%', background: '#22c55e',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
            }}>
              <span style={{ fontSize: 48 }}>✅</span>
            </div>
            <h2 style={{ fontSize: 28, fontWeight: 'bold', color: '#111827', marginBottom: 8 }}>
              Профиль создан!
            </h2>
            <p style={{ color: '#6b7280' }}>Находим лучшие возможности...</p>
          </div>
        </div>
      )}

      {/* Прогресс */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 16px 16px' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {[1, 2, 3, 4].map(s => (
            <div key={s} style={{ flex: 1 }}>
              <div style={{
                height: 6, borderRadius: 999,
                background: step >= s ? '#6366f1' : '#e5e7eb',
                transition: 'background 0.3s'
              }} />
            </div>
          ))}
        </div>
        <p style={{ textAlign: 'center', fontSize: 14, color: '#9ca3af', marginTop: 8 }}>
          Шаг {Math.min(step, 4)} из 4
        </p>
      </div>

      {/* Контент */}
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 16px 32px' }}>
        <div style={{
          background: 'white', borderRadius: 24,
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
          padding: '40px 32px'
        }}>

          {/* Заголовок */}
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h1 style={{ fontSize: 28, fontWeight: 'bold', color: '#111827', marginBottom: 12 }}>
              {step === 1 && 'Добро пожаловать! 👋'}
              {step === 2 && 'В каком ты классе?'}
              {step === 3 && 'Что тебе интересно?'}
              {step === 4 && 'Какие у тебя цели?'}
            </h1>
            <p style={{ color: '#6b7280', fontSize: 16 }}>
              {step === 1 && 'Расскажи о себе чтобы мы подобрали лучшее'}
              {step === 2 && 'Выбери свой класс'}
              {step === 3 && 'Можно выбрать несколько'}
              {step === 4 && 'Мы создадим персонализированный план'}
            </p>
          </div>

          {/* ===== ШАГ 1: Имя ===== */}
          {step === 1 && (
            <input
              type="text"
              placeholder="Как тебя зовут?"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleNext()}
              autoFocus
              style={{
                width: '100%',
                padding: '16px 24px',
                fontSize: 20,
                border: '2px solid #e5e7eb',
                borderRadius: 16,
                outline: 'none',
                color: '#111827',
                backgroundColor: 'white',
                boxSizing: 'border-box',
              }}
            />
          )}

          {/* ===== ШАГ 2: Класс ===== */}
          {step === 2 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              {GRADES.map((g) => (
                <button
                  key={g.value}
                  onClick={() => setGrade(g.value)}
                  style={{
                    padding: '24px 16px',
                    borderRadius: 16,
                    border: `2px solid ${grade === g.value ? '#6366f1' : '#e5e7eb'}`,
                    background: grade === g.value ? '#eef2ff' : 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    transform: grade === g.value ? 'scale(1.05)' : 'scale(1)',
                    boxShadow: grade === g.value ? '0 4px 12px rgba(99,102,241,0.2)' : 'none',
                  }}
                >
                  <div style={{ fontSize: 36, marginBottom: 12 }}>{g.emoji}</div>
                  <div style={{ fontWeight: 'bold', color: '#111827', fontSize: 14 }}>
                    {g.label}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* ===== ШАГ 3: Интересы ===== */}
          {step === 3 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
              {INTERESTS.map((interest) => {
                const isSelected = selectedInterests.includes(interest.id)
                return (
                  <button
                    key={interest.id}
                    onClick={() => toggleInterest(interest.id)}
                    style={{
                      padding: '20px',
                      borderRadius: 16,
                      border: `2px solid ${isSelected ? '#6366f1' : '#e5e7eb'}`,
                      background: isSelected ? '#eef2ff' : 'white',
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      transition: 'all 0.2s',
                      boxShadow: isSelected ? '0 4px 12px rgba(99,102,241,0.2)' : 'none',
                    }}
                  >
                    <span style={{ fontSize: 28 }}>{interest.emoji}</span>
                    <span style={{ fontWeight: 500, color: '#111827', fontSize: 15 }}>
                      {interest.label}
                    </span>
                    {isSelected && <span style={{ marginLeft: 'auto' }}>✅</span>}
                  </button>
                )
              })}
            </div>
          )}

          {/* ===== ШАГ 4: Цели ===== */}
          {step === 4 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
              {GOALS.map((goal) => {
                const isSelected = selectedGoals.includes(goal.id)
                return (
                  <button
                    key={goal.id}
                    onClick={() => toggleGoal(goal.id)}
                    style={{
                      padding: '20px',
                      borderRadius: 16,
                      border: `2px solid ${isSelected ? '#ec4899' : '#e5e7eb'}`,
                      background: isSelected ? '#fdf2f8' : 'white',
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      transition: 'all 0.2s',
                      boxShadow: isSelected ? '0 4px 12px rgba(236,72,153,0.2)' : 'none',
                    }}
                  >
                    <span style={{ fontSize: 32 }}>{goal.emoji}</span>
                    <span style={{ fontWeight: 500, color: '#111827', fontSize: 15 }}>
                      {goal.label}
                    </span>
                    {isSelected && <span style={{ marginLeft: 'auto' }}>✅</span>}
                  </button>
                )
              })}
            </div>
          )}

          {/* Кнопки */}
          <div style={{ display: 'flex', gap: 16, marginTop: 40 }}>
            <button
              onClick={handleBack}
              disabled={step === 1 || loading}
              style={{
                padding: '12px 24px',
                borderRadius: 12,
                fontWeight: 500,
                border: 'none',
                cursor: step === 1 || loading ? 'not-allowed' : 'pointer',
                opacity: step === 1 || loading ? 0.4 : 1,
                background: '#f3f4f6',
                color: '#374151',
                fontSize: 15,
              }}
            >
              ← Назад
            </button>

            <button
              onClick={handleNext}
              disabled={loading || !validateStep()}
              style={{
                flex: 1,
                padding: '12px 32px',
                borderRadius: 12,
                fontWeight: 'bold',
                color: 'white',
                fontSize: 16,
                border: 'none',
                background: loading ? '#9ca3af' : !validateStep() ? '#d1d5db' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                cursor: loading || !validateStep() ? 'not-allowed' : 'pointer',
                opacity: loading || !validateStep() ? 0.7 : 1,
                transition: 'all 0.2s',
              }}
            >
              {loading ? (
                'Создаю...'
              ) : step === 4 ? (
                'Завершить ✓'
              ) : (
                'Далее →'
              )}
            </button>
          </div>

        </div>
      </div>

      <div style={{ textAlign: 'center', paddingBottom: 32 }}>
        <a href="/" style={{ fontSize: 14, color: '#9ca3af' }}>
          ← Вернуться на главную
        </a>
      </div>
    </div>
  )
}