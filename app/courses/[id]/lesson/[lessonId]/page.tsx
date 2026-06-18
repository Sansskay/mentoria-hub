'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

// Тестовые вопросы для уроков
const quizData: Record<string, any[]> = {
  default: [
    {
      question: "Что является главным в этом уроке?",
      options: [
        "Понять основную концепцию",
        "Запомнить все детали",
        "Пропустить материал",
        "Ничего из вышеперечисленного"
      ],
      correct: 0
    }
  ],
  english_essay: [
    {
      question: "Сколько основных частей в академическом эссе IELTS?",
      options: ["2 части", "3 части", "4 части", "5 частей"],
      correct: 1
    },
    {
      question: "Что такое 'Thesis statement'?",
      options: [
        "Заключение эссе",
        "Твоя позиция в Introduction",
        "Пример в Body paragraph",
        "Название эссе"
      ],
      correct: 1
    },
    {
      question: "Какая фраза подходит для начала вывода?",
      options: [
        "For example...",
        "However...",
        "In conclusion...",
        "Because..."
      ],
      correct: 2
    }
  ],
  math_numbers: [
    {
      question: "На что делится число 246?",
      options: ["На 3 (сумма цифр 12)", "На 5", "На 4", "На 9"],
      correct: 0
    },
    {
      question: "Чему равен НОД(12, 8)?",
      options: ["2", "4", "6", "8"],
      correct: 1
    }
  ]
}

export default function LessonPage() {
  const { id, lessonId } = useParams()
  const router = useRouter()
  const [lesson, setLesson] = useState<any>(null)
  const [allLessons, setAllLessons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showQuiz, setShowQuiz] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [answers, setAnswers] = useState<boolean[]>([])
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [lessonCompleted, setLessonCompleted] = useState(false)
  const [celebration, setCelebration] = useState(false)

  const questions = quizData.default

  useEffect(() => {
    const loadLesson = async () => {
      const { data: lessonData } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', lessonId)
        .single()
      setLesson(lessonData)

      const { data: lessonsData } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', id)
        .order('order_index')
      setAllLessons(lessonsData || [])

      // Проверяем завершён ли урок
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: progress } = await supabase
          .from('user_progress')
          .select('completed')
          .eq('user_id', user.id)
          .eq('lesson_id', lessonId)
          .single()
        if (progress?.completed) setLessonCompleted(true)
      }

      setLoading(false)
    }
    loadLesson()
  }, [id, lessonId])

  const handleAnswer = (answerIndex: number) => {
    setSelectedAnswer(answerIndex)
  }

  const handleNextQuestion = () => {
    const isCorrect = selectedAnswer === questions[currentQuestion].correct
    const newAnswers = [...answers, isCorrect]
    setAnswers(newAnswers)
    setSelectedAnswer(null)

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      setQuizCompleted(true)
    }
  }

  const handleCompleteLesson = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    await supabase.from('user_progress').upsert({
      user_id: user.id,
      course_id: id,
      lesson_id: lessonId,
      completed: true,
      quiz_score: quizCompleted 
        ? Math.round((answers.filter(Boolean).length / answers.length) * 100) 
        : null,
      completed_at: new Date().toISOString()
    })

    setLessonCompleted(true)
    setCelebration(true)
    setTimeout(() => setCelebration(false), 3000)
  }

  // Следующий и предыдущий урок
  const currentIndex = allLessons.findIndex(l => l.id === lessonId)
  const nextLesson = allLessons[currentIndex + 1]
  const prevLesson = allLessons[currentIndex - 1]

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-indigo-600 
                      border-t-transparent rounded-full animate-spin"/>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Анимация завершения */}
      {celebration && (
        <div className="fixed inset-0 flex items-center justify-center z-50 
                        bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-10 text-center shadow-2xl">
            <div className="text-7xl mb-4 animate-bounce">🎉</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Урок завершён!
            </h2>
            <p className="text-gray-600">Отличная работа! Продолжай в том же духе</p>
          </div>
        </div>
      )}

      {/* Навигационная полоска */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link href={`/courses/${id}`}
                className="text-gray-500 hover:text-gray-700 text-sm flex items-center gap-1">
            ← Назад к курсу
          </Link>
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all"
              style={{ 
                width: `${((currentIndex + 1) / allLessons.length) * 100}%` 
              }}
            />
          </div>
          <span className="text-sm text-gray-500">
            {currentIndex + 1} / {allLessons.length}
          </span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Заголовок урока */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-indigo-600 mb-2">
            <span>Урок {currentIndex + 1}</span>
            {lesson?.has_quiz && <span>· 📝 Есть тест</span>}
            <span>· ⏱ {lesson?.duration_minutes} минут</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{lesson?.title}</h1>
          {lessonCompleted && (
            <span className="inline-block mt-2 bg-green-100 text-green-700 
                             text-sm px-3 py-1 rounded-full">
              ✅ Урок завершён
            </span>
          )}
        </div>

        {/* Видео плейсхолдер */}
        <div className="bg-gradient-to-br from-indigo-900 to-purple-900 
                        rounded-2xl aspect-video flex items-center justify-center mb-8">
          <div className="text-center text-white">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center 
                            justify-center mx-auto mb-4 cursor-pointer 
                            hover:bg-white/30 transition-colors">
              <span className="text-4xl">▶️</span>
            </div>
            <p className="text-white/80 text-sm">Видео урока</p>
            <p className="text-white/60 text-xs mt-1">{lesson?.duration_minutes} минут</p>
          </div>
        </div>

        {/* Контент урока */}
        {!showQuiz && !quizCompleted && (
          <div className="bg-white rounded-2xl p-8 mb-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              📖 Материал урока
            </h2>
            <div className="prose max-w-none text-gray-700 whitespace-pre-line leading-relaxed">
              {lesson?.content}
            </div>

            {/* Кнопки действий */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              {lesson?.has_quiz && !lessonCompleted && (
                <button
                  onClick={() => setShowQuiz(true)}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white 
                             py-3 rounded-xl font-medium transition-colors"
                >
                  📝 Пройти тест
                </button>
              )}
              {(!lesson?.has_quiz || lessonCompleted) && (
                <button
                  onClick={handleCompleteLesson}
                  disabled={lessonCompleted}
                  className={`flex-1 py-3 rounded-xl font-medium transition-colors
                              ${lessonCompleted 
                                ? 'bg-green-100 text-green-700 cursor-not-allowed'
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
                >
                  {lessonCompleted ? '✅ Завершён' : '✅ Завершить урок'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Тест */}
        {showQuiz && !quizCompleted && (
          <div className="bg-white rounded-2xl p-8 mb-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                📝 Мини-тест
              </h2>
              <span className="text-sm text-gray-500">
                {currentQuestion + 1} / {questions.length}
              </span>
            </div>

            {/* Прогресс теста */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all"
                style={{ width: `${((currentQuestion) / questions.length) * 100}%` }}
              />
            </div>

            <h3 className="text-lg font-medium text-gray-900 mb-5">
              {questions[currentQuestion].question}
            </h3>

            <div className="space-y-3 mb-6">
              {questions[currentQuestion].options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswer(index)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all
                              ${selectedAnswer === index
                                ? 'border-indigo-500 bg-indigo-50'
                                : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <span className="font-medium text-gray-600 mr-3">
                    {['A', 'B', 'C', 'D'][index]}.
                  </span>
                  {option}
                </button>
              ))}
            </div>

            <button
              onClick={handleNextQuestion}
              disabled={selectedAnswer === null}
              className={`w-full py-3 rounded-xl font-medium transition-colors
                          ${selectedAnswer !== null
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
            >
              {currentQuestion < questions.length - 1 
                ? 'Следующий вопрос →' 
                : 'Завершить тест'}
            </button>
          </div>
        )}

        {/* Результат теста */}
        {quizCompleted && (
          <div className="bg-white rounded-2xl p-8 mb-6 shadow-sm text-center">
            <div className="text-6xl mb-4">
              {Math.round((answers.filter(Boolean).length / answers.length) * 100) >= 70 
                ? '🎉' : '📚'}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Тест завершён!
            </h2>
            <p className="text-gray-600 mb-2">
              Правильных ответов: {answers.filter(Boolean).length} из {answers.length}
            </p>
            <div className="text-4xl font-bold text-indigo-600 mb-6">
              {Math.round((answers.filter(Boolean).length / answers.length) * 100)}%
            </div>
            <button
              onClick={handleCompleteLesson}
              className="bg-indigo-600 hover:bg-indigo-700 text-white 
                         px-8 py-3 rounded-xl font-medium transition-colors"
            >
              ✅ Завершить урок
            </button>
          </div>
        )}

        {/* Навигация между уроками */}
        <div className="flex gap-3">
          {prevLesson && (
            <Link href={`/courses/${id}/lesson/${prevLesson.id}`}
                  className="flex-1 bg-white border border-gray-200 hover:border-gray-300 
                             text-gray-700 py-3 rounded-xl font-medium text-center 
                             transition-colors text-sm">
              ← {prevLesson.title}
            </Link>
          )}
          {nextLesson && lessonCompleted && (
            <Link href={`/courses/${id}/lesson/${nextLesson.id}`}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white 
                             py-3 rounded-xl font-medium text-center 
                             transition-colors text-sm">
              {nextLesson.title} →
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}