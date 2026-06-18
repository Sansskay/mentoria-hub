'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function CoursesPage() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCourses = async () => {
      const { data } = await supabase
        .from('courses')
        .select('*, lessons(count)')
        .eq('is_active', true)
      
      setCourses(data || [])
      setLoading(false)
    }
    fetchCourses()
  }, [])

  const levelColors = {
    beginner: 'bg-green-100 text-green-700',
    intermediate: 'bg-yellow-100 text-yellow-700',
    advanced: 'bg-red-100 text-red-700',
  }

  const levelNames = {
    beginner: 'Начинающий',
    intermediate: 'Средний',
    advanced: 'Продвинутый',
  }

  const subjectEmojis = {
    english: '🇬🇧',
    math: '🔢',
    university_prep: '🎓',
    physics: '⚡',
    biology: '🧬',
    programming: '💻',
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-indigo-600 
                        border-t-transparent rounded-full animate-spin mx-auto mb-4"/>
        <p className="text-gray-600">Загружаем курсы...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Шапка */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">📚 Курсы Mentoria</h1>
          <p className="text-indigo-100 text-lg">
            Учись в своём темпе — без живых занятий
          </p>
          <div className="mt-6 flex gap-4">
            <div className="bg-white/20 rounded-xl px-4 py-2 text-sm">
              ✅ {courses.length} курсов доступно
            </div>
            <div className="bg-white/20 rounded-xl px-4 py-2 text-sm">
              🎯 Прогресс отслеживается
            </div>
            <div className="bg-white/20 rounded-xl px-4 py-2 text-sm">
              📜 Сертификат по завершении
            </div>
          </div>
        </div>
      </div>

      {/* Список курсов */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course: any) => (
            <div key={course.id} 
                 className="bg-white rounded-2xl shadow-sm border border-gray-100 
                            hover:shadow-md transition-all duration-200 overflow-hidden">
              
              {/* Цветная шапка карточки */}
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-6">
                <div className="text-5xl mb-2">
                  {subjectEmojis[course.subject] || '📖'}
                </div>
                <h3 className="text-white font-bold text-xl leading-tight">
                  {course.title}
                </h3>
              </div>

              <div className="p-6 flex flex-col gap-4">
                <p className="text-gray-600 text-sm">
                  {course.description}
                </p>

                {/* Теги */}
                <div className="flex flex-wrap gap-2">
                  <span className={`text-xs px-3 py-1 rounded-full font-medium
                                   ${levelColors[course.level] || 'bg-gray-100 text-gray-600'}`}>
                    {levelNames[course.level] || course.level}
                  </span>
                  <span className="text-xs px-3 py-1 rounded-full bg-blue-50 text-blue-600">
                    ⏱ {course.duration_hours} часов
                  </span>
                </div>

                {/* Кнопка */}
                <Link href={`/courses/${course.id}`}
                      className="mt-auto bg-indigo-600 hover:bg-indigo-700 
                                 text-white text-center py-3 rounded-xl 
                                 font-medium transition-colors text-sm">
                  Начать курс →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}