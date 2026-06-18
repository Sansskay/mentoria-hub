'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

// Типы
interface Profile {
  id: string
  full_name: string
  grade: number
  interests: string[]
  goals: string[]
}

interface Course {
  id: string
  title: string
  subject: string
  level: string
  duration_hours: number
  tags: string[]
}

interface Opportunity {
  id: string
  title: string
  category: string
  direction: string
  deadline: string
  format: string
  apply_url: string
  min_grade: number
  max_grade: number
  tags: string[]
}

interface Enrollment {
  course_id: string
  courses: Course
}

interface SavedOpp {
  opportunity_id: string
  opportunities: Opportunity
}

// Вспомогательные функции
function getDaysLeft(deadline: string): number {
  const diff = new Date(deadline).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

const SUBJECT_EMOJI: Record<string, string> = {
  english: '🇬🇧',
  math: '🔢',
  university_prep: '🎓',
  physics: '⚡',
  biology: '🧬',
  programming: '💻',
}

const DIRECTION_COLORS: Record<string, string> = {
  STEM: 'bg-blue-100 text-blue-700',
  Business: 'bg-green-100 text-green-700',
  Social: 'bg-purple-100 text-purple-700',
  Programming: 'bg-orange-100 text-orange-700',
  Science: 'bg-cyan-100 text-cyan-700',
  Finance: 'bg-yellow-100 text-yellow-700',
}

export default function DashboardPage() {
  const router = useRouter()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [savedOpps, setSavedOpps] = useState<SavedOpp[]>([])
  const [progress, setProgress] = useState<Record<string, number>>({})
  const [totalLessons, setTotalLessons] = useState<Record<string, number>>({})
  const [recommended, setRecommended] = useState<Opportunity[]>([])
  const [allOpps, setAllOpps] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'saved' | 'deadlines'>('overview')

  useEffect(() => {
    const loadDashboard = async () => {
      // Проверяем авторизацию
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      // Загружаем профиль
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!profileData) {
        router.push('/onboarding')
        return
      }

      setProfile(profileData)

      // Загружаем записи на курсы
      const { data: enrollData } = await supabase
        .from('enrollments')
        .select('course_id, courses(*)')
        .eq('user_id', user.id)

      setEnrollments(enrollData || [])

      // Загружаем прогресс по каждому курсу
      if (enrollData && enrollData.length > 0) {
        for (const enroll of enrollData) {
          const courseId = enroll.course_id

          // Всего уроков в курсе
          const { count: total } = await supabase
            .from('lessons')
            .select('*', { count: 'exact', head: true })
            .eq('course_id', courseId)

          // Завершённых уроков
          const { count: completed } = await supabase
            .from('user_progress')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('course_id', courseId)
            .eq('completed', true)

          setTotalLessons(prev => ({ ...prev, [courseId]: total || 0 }))
          setProgress(prev => ({ ...prev, [courseId]: completed || 0 }))
        }
      }

      // Загружаем сохранённые возможности
      const { data: savedData } = await supabase
        .from('saved_opportunities')
        .select('opportunity_id, opportunities(*)')
        .eq('user_id', user.id)

      setSavedOpps(savedData || [])

      // Загружаем все возможности для рекомендаций
      const { data: oppsData } = await supabase
        .from('opportunities')
        .select('*')
        .eq('is_active', true)
        .gte('deadline', new Date().toISOString())
        .order('deadline', { ascending: true })

      setAllOpps(oppsData || [])

      // Считаем рекомендации
      if (profileData && oppsData) {
        const recs = getRecommendations(profileData, oppsData)
        setRecommended(recs)
      }

      setLoading(false)
    }

    loadDashboard()
  }, [router])

  // Логика рекомендаций
  const getRecommendations = (prof: Profile, opps: Opportunity[]) => {
    return opps
      .filter(opp =>
        opp.min_grade <= prof.grade &&
        opp.max_grade >= prof.grade
      )
      .map(opp => {
        let score = 0
        prof.interests?.forEach(interest => {
          if (opp.tags?.includes(interest)) score += 3
          if (opp.direction?.toLowerCase() === interest) score += 5
        })
        prof.goals?.forEach(goal => {
          if (opp.tags?.includes(goal)) score += 4
        })
        const daysLeft = getDaysLeft(opp.deadline)
        if (daysLeft < 30 && daysLeft > 0) score += 2
        return { ...opp, score }
      })
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 4)
  }

  // Выход из аккаунта
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  // Убрать из сохранённых
  const removeSaved = async (oppId: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from('saved_opportunities')
      .delete()
      .eq('user_id', user.id)
      .eq('opportunity_id', oppId)

    setSavedOpps(prev => prev.filter(s => s.opportunity_id !== oppId))
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent
                        rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Загружаем твой кабинет...</p>
      </div>
    </div>
  )

  // Подсчёт статистики
  const totalCompleted = Object.values(progress).reduce((a, b) => a + b, 0)
  const upcomingDeadlines = savedOpps
    .map(s => s.opportunities)
    .filter(opp => opp && getDaysLeft(opp.deadline) >= 0)
    .sort((a, b) => getDaysLeft(a.deadline) - getDaysLeft(b.deadline))
    .slice(0, 5)

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Шапка */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-indigo-200 text-sm mb-1">Добро пожаловать 👋</p>
              <h1 className="text-3xl font-bold mb-1">
                {profile?.full_name || 'Ученик'}
              </h1>
              <p className="text-indigo-200">
                {profile?.grade} класс
                {profile?.interests?.length
                  ? ` · ${profile.interests.slice(0, 2).join(', ')}`
                  : ''}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 
                         rounded-xl text-sm font-medium transition-colors"
            >
              Выйти
            </button>
          </div>

          {/* Статистика */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {[
              { label: 'Курсов', value: enrollments.length, emoji: '📚' },
              { label: 'Уроков завершено', value: totalCompleted, emoji: '✅' },
              { label: 'Сохранено', value: savedOpps.length, emoji: '❤️' },
              { label: 'Ближайший дедлайн', value: upcomingDeadlines.length > 0
                  ? `${getDaysLeft(upcomingDeadlines[0]?.deadline)} дн.`
                  : 'Нет', emoji: '⏰' },
            ].map(stat => (
              <div key={stat.label}
                   className="bg-white/20 rounded-2xl p-4 text-center">
                <div className="text-2xl mb-1">{stat.emoji}</div>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-indigo-200 text-xs">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Табы */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            {[
              { id: 'overview', label: '🏠 Обзор' },
              { id: 'courses', label: '📚 Мои курсы' },
              { id: 'saved', label: '❤️ Сохранённые' },
              { id: 'deadlines', label: '⏰ Дедлайны' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-5 py-4 text-sm font-medium whitespace-nowrap
                            border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* ========== ТАБ: ОБЗОР ========== */}
        {activeTab === 'overview' && (
          <div className="space-y-8">

            {/* Продолжить обучение */}
            {enrollments.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">
                    📚 Продолжить обучение
                  </h2>
                  <button
                    onClick={() => setActiveTab('courses')}
                    className="text-indigo-600 text-sm font-medium hover:underline"
                  >
                    Все курсы →
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {enrollments.slice(0, 2).map(enroll => {
                    const course = enroll.courses
                    const completed = progress[enroll.course_id] || 0
                    const total = totalLessons[enroll.course_id] || 1
                    const percent = Math.round((completed / total) * 100)

                    return (
                      <div key={enroll.course_id}
                           className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 bg-indigo-100 rounded-xl 
                                          flex items-center justify-center text-2xl">
                            {SUBJECT_EMOJI[course?.subject] || '📖'}
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900">{course?.title}</h3>
                            <p className="text-xs text-gray-500">
                              {completed} из {total} уроков
                            </p>
                          </div>
                        </div>

                        {/* Прогресс */}
                        <div className="mb-4">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Прогресс</span>
                            <span className="font-bold text-indigo-600">{percent}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-indigo-500 to-purple-500 
                                         h-2 rounded-full transition-all duration-500"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>

                        <Link
                          href={`/courses/${enroll.course_id}`}
                          className="block w-full text-center py-2.5 bg-indigo-600 
                                     hover:bg-indigo-700 text-white rounded-xl 
                                     text-sm font-medium transition-colors"
                        >
                          {percent === 0 ? 'Начать →' :
                           percent === 100 ? '✅ Повторить' :
                           'Продолжить →'}
                        </Link>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* Нет курсов */}
            {enrollments.length === 0 && (
              <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
                <div className="text-5xl mb-4">📚</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Ты ещё не записан на курсы
                </h3>
                <p className="text-gray-500 mb-6">
                  Начни учиться прямо сейчас — бесплатно
                </p>
                <Link
                  href="/courses"
                  className="inline-block bg-indigo-600 text-white px-6 py-3 
                             rounded-xl font-medium hover:bg-indigo-700 transition-colors"
                >
                  Смотреть курсы →
                </Link>
                <Link
                  href="/opportunities"
                  className="inline-block bg-purple-600 text-white px-6 py-3 
                             rounded-xl font-medium hover:bg-purple-700 transition-colors"
                >
                  Каталог возможностей →
                </Link>
              </div>
            )}

            {/* Ближайшие дедлайны */}
            {upcomingDeadlines.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">
                    ⏰ Ближайшие дедлайны
                  </h2>
                  <button
                    onClick={() => setActiveTab('deadlines')}
                    className="text-indigo-600 text-sm font-medium hover:underline"
                  >
                    Все →
                  </button>
                </div>
                <div className="space-y-3">
                  {upcomingDeadlines.slice(0, 3).map(opp => {
                    const days = getDaysLeft(opp.deadline)
                    return (
                      <div key={opp.id}
                           className="bg-white rounded-xl p-4 flex items-center gap-4
                                      shadow-sm border border-gray-100">
                        <div className={`w-14 h-14 rounded-xl flex flex-col items-center 
                                         justify-center text-center flex-shrink-0 ${
                          days <= 7 ? 'bg-red-100 text-red-600' :
                          days <= 30 ? 'bg-orange-100 text-orange-600' :
                          'bg-green-100 text-green-600'
                        }`}>
                          <span className="text-xl font-bold leading-none">{days}</span>
                          <span className="text-xs">дней</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{opp.title}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(opp.deadline).toLocaleDateString('ru-RU', {
                              day: 'numeric',
                              month: 'long'
                            })}
                          </p>
                        </div>
                        <a
                          href={opp.apply_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-indigo-50 text-indigo-600 px-3 py-1.5 
                                     rounded-lg text-xs font-medium hover:bg-indigo-100
                                     flex-shrink-0"
                        >
                          Подать →
                        </a>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* Рекомендации */}
            {recommended.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">
                    💡 Рекомендуем для тебя
                  </h2>
                  <Link
                    href="/opportunities"
                    className="text-indigo-600 text-sm font-medium hover:underline"
                  >
                    Все возможности →
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recommended.map(opp => (
                    <div key={opp.id}
                         className="bg-white rounded-2xl p-5 shadow-sm 
                                    border border-gray-100 flex gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                                           ${DIRECTION_COLORS[opp.direction] || 'bg-gray-100'}`}>
                            {opp.direction}
                          </span>
                          <span className={`text-xs font-medium ${
                            getDaysLeft(opp.deadline) <= 14
                              ? 'text-red-500'
                              : 'text-gray-400'
                          }`}>
                            {getDaysLeft(opp.deadline)} дн.
                          </span>
                        </div>
                        <h3 className="font-bold text-gray-900 text-sm leading-tight">
                          {opp.title}
                        </h3>
                      </div>
                      <a
                        href={opp.apply_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="self-center bg-indigo-600 text-white px-3 py-2 
                                   rounded-xl text-xs font-medium hover:bg-indigo-700 
                                   flex-shrink-0 transition-colors"
                      >
                        Подать →
                      </a>
                    </div>
                  ))}
                </div>
              </section>
            )}

          </div>
        )}

        {/* ========== ТАБ: МОИ КУРСЫ ========== */}
        {activeTab === 'courses' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Мои курсы ({enrollments.length})
              </h2>
              <Link
                href="/courses"
                className="bg-indigo-600 text-white px-4 py-2 rounded-xl 
                           text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                + Найти курсы
              </Link>
            </div>

            {enrollments.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center">
                <div className="text-6xl mb-4">📚</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Нет активных курсов
                </h3>
                <p className="text-gray-500 mb-6">
                  Запишись на курс и начни учиться прямо сейчас
                </p>
                <Link
                  href="/courses"
                  className="inline-block bg-indigo-600 text-white px-8 py-3 
                             rounded-xl font-medium hover:bg-indigo-700 transition-colors"
                >
                  Смотреть все курсы →
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {enrollments.map(enroll => {
                  const course = enroll.courses
                  const completed = progress[enroll.course_id] || 0
                  const total = totalLessons[enroll.course_id] || 1
                  const percent = Math.round((completed / total) * 100)

                  return (
                    <div key={enroll.course_id}
                         className="bg-white rounded-2xl shadow-sm border border-gray-100 
                                    overflow-hidden">
                      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-6">
                        <div className="text-4xl mb-2">
                          {SUBJECT_EMOJI[course?.subject] || '📖'}
                        </div>
                        <h3 className="text-white font-bold text-lg">{course?.title}</h3>
                      </div>
                      <div className="p-6 space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-600">
                              {completed} из {total} уроков
                            </span>
                            <span className="font-bold text-indigo-600">{percent}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                              className="bg-gradient-to-r from-indigo-500 to-purple-500 
                                         h-3 rounded-full transition-all"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>

                        {percent === 100 && (
                          <div className="bg-green-50 text-green-700 text-sm 
                                          px-4 py-2 rounded-xl text-center font-medium">
                            🏆 Курс завершён! Получи сертификат
                          </div>
                        )}

                        <Link
                          href={`/courses/${enroll.course_id}`}
                          className="block w-full text-center py-3 bg-indigo-600 
                                     hover:bg-indigo-700 text-white rounded-xl 
                                     font-medium transition-colors"
                        >
                          {percent === 0 ? '🚀 Начать' :
                           percent === 100 ? '🔄 Повторить' :
                           '▶️ Продолжить'}
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ========== ТАБ: СОХРАНЁННЫЕ ========== */}
        {activeTab === 'saved' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Сохранённые ({savedOpps.length})
              </h2>
              <Link
                href="/opportunities"
                className="bg-indigo-600 text-white px-4 py-2 rounded-xl 
                           text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                + Найти возможности
              </Link>
            </div>

            {savedOpps.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center">
                <div className="text-6xl mb-4">❤️</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Нет сохранённых возможностей
                </h3>
                <p className="text-gray-500 mb-6">
                  Нажимай на ❤️ в каталоге чтобы сохранять
                </p>
                <Link
                  href="/opportunities"
                  className="inline-block bg-indigo-600 text-white px-8 py-3 
                             rounded-xl font-medium hover:bg-indigo-700 transition-colors"
                >
                  Открыть каталог →
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedOpps.map(saved => {
                  const opp = saved.opportunities
                  if (!opp) return null
                  const days = getDaysLeft(opp.deadline)

                  return (
                    <div key={saved.opportunity_id}
                         className="bg-white rounded-2xl p-6 shadow-sm 
                                    border border-gray-100 flex flex-col gap-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                                           ${DIRECTION_COLORS[opp.direction] || 'bg-gray-100'}`}>
                            {opp.direction}
                          </span>
                          <h3 className="font-bold text-gray-900 mt-2">{opp.title}</h3>
                        </div>
                        <button
                          onClick={() => removeSaved(saved.opportunity_id)}
                          className="text-red-400 hover:text-red-600 p-1 ml-2"
                          title="Убрать из сохранённых"
                        >
                          ✕
                        </button>
                      </div>

                      <div className={`flex items-center gap-2 text-sm px-3 py-2 
                                       rounded-xl font-medium ${
                        days < 0 ? 'bg-gray-100 text-gray-500' :
                        days <= 7 ? 'bg-red-50 text-red-600' :
                        days <= 30 ? 'bg-orange-50 text-orange-600' :
                        'bg-green-50 text-green-700'
                      }`}>
                        <span>📅</span>
                        <span>
                          {days < 0 ? 'Дедлайн истёк' :
                           days === 0 ? 'Сегодня!' :
                           `Осталось ${days} дней`}
                        </span>
                        <span className="ml-auto text-xs opacity-70">
                          {new Date(opp.deadline).toLocaleDateString('ru-RU', {
                            day: 'numeric',
                            month: 'short'
                          })}
                        </span>
                      </div>

                      <a
                        href={opp.apply_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-center py-2.5 bg-gradient-to-r 
                                   from-indigo-600 to-purple-600 text-white 
                                   rounded-xl text-sm font-medium 
                                   hover:shadow-md transition-all"
                      >
                        Подать заявку →
                      </a>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ========== ТАБ: ДЕДЛАЙНЫ ========== */}
        {activeTab === 'deadlines' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              ⏰ Все дедлайны
            </h2>

            {upcomingDeadlines.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center">
                <div className="text-6xl mb-4">📅</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Нет приближающихся дедлайнов
                </h3>
                <p className="text-gray-500 mb-6">
                  Сохрани возможности чтобы отслеживать дедлайны
                </p>
                <Link
                  href="/opportunities"
                  className="inline-block bg-indigo-600 text-white px-8 py-3 
                             rounded-xl font-medium hover:bg-indigo-700 transition-colors"
                >
                  Найти возможности →
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingDeadlines.map(opp => {
                  const days = getDaysLeft(opp.deadline)
                  return (
                    <div key={opp.id}
                         className="bg-white rounded-2xl p-6 shadow-sm 
                                    border border-gray-100 flex items-center gap-6">
                      {/* Таймер */}
                      <div className={`w-20 h-20 rounded-2xl flex flex-col items-center 
                                       justify-center flex-shrink-0 ${
                        days <= 3 ? 'bg-red-100 text-red-600' :
                        days <= 14 ? 'bg-orange-100 text-orange-600' :
                        'bg-green-100 text-green-600'
                      }`}>
                        <span className="text-3xl font-bold leading-none">{days}</span>
                        <span className="text-xs mt-1">дней</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 text-lg">{opp.title}</h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full
                                           ${DIRECTION_COLORS[opp.direction] || 'bg-gray-100'}`}>
                            {opp.direction}
                          </span>
                          <span className="text-sm text-gray-500">
                            Дедлайн: {new Date(opp.deadline).toLocaleDateString('ru-RU', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </span>
                        </div>

                        {days <= 7 && (
                          <p className="text-red-600 text-sm mt-2 font-medium">
                            🔥 Торопись! Осталось мало времени
                          </p>
                        )}
                      </div>

                      <a
                        href={opp.apply_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white 
                                   px-5 py-3 rounded-xl text-sm font-medium 
                                   flex-shrink-0 transition-colors"
                      >
                        Подать заявку →
                      </a>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}