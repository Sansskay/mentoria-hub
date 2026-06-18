'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function CoursePage() {
  const { id } = useParams()
  const router = useRouter()
  const [course, setCourse] = useState<any>(null)
  const [lessons, setLessons] = useState<any[]>([])
  const [completedLessons, setCompletedLessons] = useState<string[]>([])
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      // Получаем пользователя
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      // Получаем курс
      const { data: courseData } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .single()
      setCourse(courseData)

      // Получаем уроки
      const { data: lessonsData } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', id)
        .order('order_index')
      setLessons(lessonsData || [])

      if (user) {
        // Проверяем запись
        const { data: enrollment } = await supabase
          .from('enrollments')
          .select('id')
          .eq('user_id', user.id)
          .eq('course_id', id)
          .single()
        setIsEnrolled(!!enrollment)

        // Получаем прогресс
        const { data: progress } = await supabase
          .from('user_progress')
          .select('lesson_id')
          .eq('user_id', user.id)
          .eq('course_id', id)
          .eq('completed', true)
        setCompletedLessons(progress?.map(p => p.lesson_id) || [])
      }

      setLoading(false)
    }
    loadData()
  }, [id])

  const handleEnroll = async () => {
    if (!user) {
      router.push('/auth/login')
      return
    }
    await supabase.from('enrollments').insert({
      user_id: user.id,
      course_id: id
    })
    setIsEnrolled(true)
  }

  const progressPercent = lessons.length > 0
    ? Math.round((completedLessons.length / lessons.length) * 100)
    : 0

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-indigo-600 
                      border-t-transparent rounded-full animate-spin"/>
    </div>
  )

  if (!course) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Курс не найден</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Шапка курса */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <Link href="/courses" 
                className="text-indigo-200 hover:text-white text-sm mb-4 block">
            ← Назад к курсам
          </Link>
          <h1 className="text-3xl font-bold mb-3">{course.title}</h1>
          <p className="text-indigo-100 mb-6">{course.description}</p>
          
          <div className="flex flex-wrap gap-3 mb-6">
            <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
              📚 {lessons.length} уроков
            </span>
            <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
              ⏱ {course.duration_hours} часов
            </span>
          </div>

          {/* Прогресс бар */}
          {isEnrolled && (
            <div className="bg-white/10 rounded-2xl p-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Твой прогресс</span>
                <span className="font-bold">{progressPercent}%</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-3">
                <div
                  className="bg-white rounded-full h-3 transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-indigo-200 text-xs mt-2">
                {completedLessons.length} из {lessons.length} уроков завершено
              </p>
            </div>
          )}

          {/* Кнопка записи */}
          {!isEnrolled && (
            <button
              onClick={handleEnroll}
              className="bg-white text-indigo-600 font-bold px-8 py-3 
                         rounded-xl hover:bg-indigo-50 transition-colors"
            >
              🚀 Записаться на курс — Бесплатно
            </button>
          )}
        </div>
      </div>

      {/* Список уроков */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Содержание курса
        </h2>

        <div className="space-y-3">
          {lessons.map((lesson, index) => {
            const isCompleted = completedLessons.includes(lesson.id)
            const isLocked = !isEnrolled && index > 0
            const isFirst = index === 0

            return (
              <div key={lesson.id}
                   className={`bg-white rounded-xl border p-5 flex items-center gap-4
                               ${isLocked ? 'opacity-60' : 'hover:border-indigo-200 cursor-pointer'}
                               ${isCompleted ? 'border-green-200 bg-green-50' : 'border-gray-100'}`}>
                
                {/* Статус иконка */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center
                                 flex-shrink-0 text-lg
                                 ${isCompleted ? 'bg-green-500 text-white' :
                                   isLocked ? 'bg-gray-200 text-gray-400' :
                                   'bg-indigo-100 text-indigo-600'}`}>
                  {isCompleted ? '✅' : isLocked ? '🔒' : `${index + 1}`}
                </div>

                <div className="flex-1">
                  <h3 className={`font-medium ${isCompleted ? 'text-green-800' : 'text-gray-900'}`}>
                    {lesson.title}
                  </h3>
                  <div className="flex gap-3 mt-1">
                    <span className="text-xs text-gray-500">
                      ⏱ {lesson.duration_minutes} минут
                    </span>
                    {lesson.has_quiz && (
                      <span className="text-xs text-purple-600">
                        📝 Есть тест
                      </span>
                    )}
                    {isCompleted && (
                      <span className="text-xs text-green-600 font-medium">
                        Завершён
                      </span>
                    )}
                  </div>
                </div>

                {/* Кнопка урока */}
                {!isLocked && (
                  <Link
                    href={`/courses/${id}/lesson/${lesson.id}`}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                                ${isCompleted 
                                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                  : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                  >
                    {isCompleted ? 'Повторить' : isFirst ? 'Начать' : 'Продолжить'}
                  </Link>
                )}
              </div>
            )
          })}
        </div>

        {/* Сертификат */}
        {progressPercent === 100 && (
          <div className="mt-8 bg-gradient-to-r from-yellow-400 to-orange-400 
                          rounded-2xl p-6 text-center text-white">
            <div className="text-5xl mb-3">🏆</div>
            <h3 className="text-2xl font-bold mb-2">Курс завершён!</h3>
            <p className="mb-4">Поздравляем! Ты прошёл курс "{course.title}"</p>
            <button className="bg-white text-orange-600 font-bold px-6 py-2 
                               rounded-xl hover:bg-orange-50">
              📜 Получить сертификат
            </button>
          </div>
        )}
      </div>
    </div>
  )
}