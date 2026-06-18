'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

// Список админ email — добавь свои!
const ADMIN_EMAILS = [
  'admin@mentoria.com',
  'mentoriaorganization@gmail.com',
]

interface Opportunity {
  id: string
  title: string
  category: string
  direction: string
  format: string
  deadline: string
  description: string
  requirements: string
  min_grade: number
  max_grade: number
  apply_url: string
  tags: string[]
  is_active: boolean
}

interface Course {
  id: string
  title: string
  subject: string
  level: string
  description: string
  duration_hours: number
  tags: string[]
  is_active: boolean
}

const EMPTY_OPP: Partial<Opportunity> = {
  title: '', category: 'Олимпиада', direction: 'STEM',
  format: 'Онлайн', deadline: '', description: '',
  requirements: '', min_grade: 8, max_grade: 11,
  apply_url: '', tags: [], is_active: true
}

const EMPTY_COURSE: Partial<Course> = {
  title: '', subject: 'math', level: 'beginner',
  description: '', duration_hours: 10,
  tags: [], is_active: true
}

export default function AdminPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [activeTab, setActiveTab] = useState<'opportunities' | 'courses' | 'stats'>('opportunities')

  // Данные
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [userCount, setUserCount] = useState(0)
  const [loading, setLoading] = useState(true)

  // Формы
  const [showOppForm, setShowOppForm] = useState(false)
  const [showCourseForm, setShowCourseForm] = useState(false)
  const [editingOpp, setEditingOpp] = useState<Opportunity | null>(null)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [oppForm, setOppForm] = useState<Partial<Opportunity>>(EMPTY_OPP)
  const [courseForm, setCourseForm] = useState<Partial<Course>>(EMPTY_COURSE)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // Проверяем что это админ
  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.push('/auth/login')
        return
      }

      // Временно разрешаем всем для MVP
      // В продакшне раскомментируй проверку email:
      // if (!ADMIN_EMAILS.includes(session.user.email || '')) {
      //   router.push('/')
      //   return
      // }

      setChecking(false)
      loadData()
    }
    checkAdmin()
  }, [router])

  const loadData = async () => {
    setLoading(true)

    const { data: opps } = await supabase
      .from('opportunities')
      .select('*')
      .order('created_at', { ascending: false })

    const { data: coursesData } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false })

    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    setOpportunities(opps || [])
    setCourses(coursesData || [])
    setUserCount(count || 0)
    setLoading(false)
  }

  // ============ ВОЗМОЖНОСТИ ============

  const openOppForm = (opp?: Opportunity) => {
    if (opp) {
      setEditingOpp(opp)
      setOppForm(opp)
    } else {
      setEditingOpp(null)
      setOppForm(EMPTY_OPP)
    }
    setShowOppForm(true)
  }

  const saveOpportunity = async () => {
    if (!oppForm.title || !oppForm.deadline) {
      alert('Заполни название и дедлайн!')
      return
    }

    setSaving(true)

    const data = {
      title: oppForm.title,
      category: oppForm.category,
      direction: oppForm.direction,
      format: oppForm.format,
      deadline: oppForm.deadline,
      description: oppForm.description,
      requirements: oppForm.requirements,
      min_grade: oppForm.min_grade,
      max_grade: oppForm.max_grade,
      apply_url: oppForm.apply_url,
      tags: typeof oppForm.tags === 'string'
        ? (oppForm.tags as string).split(',').map((t: string) => t.trim())
        : oppForm.tags,
      is_active: oppForm.is_active,
    }

    if (editingOpp) {
      await supabase
        .from('opportunities')
        .update(data)
        .eq('id', editingOpp.id)
    } else {
      await supabase
        .from('opportunities')
        .insert(data)
    }

    setSaving(false)
    setShowOppForm(false)
    loadData()
  }

  const deleteOpportunity = async (id: string) => {
    await supabase.from('opportunities').delete().eq('id', id)
    setDeleteConfirm(null)
    loadData()
  }

  const toggleOppActive = async (opp: Opportunity) => {
    await supabase
      .from('opportunities')
      .update({ is_active: !opp.is_active })
      .eq('id', opp.id)
    loadData()
  }

  // ============ КУРСЫ ============

  const openCourseForm = (course?: Course) => {
    if (course) {
      setEditingCourse(course)
      setCourseForm(course)
    } else {
      setEditingCourse(null)
      setCourseForm(EMPTY_COURSE)
    }
    setShowCourseForm(true)
  }

  const saveCourse = async () => {
    if (!courseForm.title) {
      alert('Заполни название курса!')
      return
    }

    setSaving(true)

    const data = {
      title: courseForm.title,
      subject: courseForm.subject,
      level: courseForm.level,
      description: courseForm.description,
      duration_hours: courseForm.duration_hours,
      tags: typeof courseForm.tags === 'string'
        ? (courseForm.tags as string).split(',').map((t: string) => t.trim())
        : courseForm.tags,
      is_active: courseForm.is_active,
    }

    if (editingCourse) {
      await supabase
        .from('courses')
        .update(data)
        .eq('id', editingCourse.id)
    } else {
      await supabase
        .from('courses')
        .insert(data)
    }

    setSaving(false)
    setShowCourseForm(false)
    loadData()
  }

  const deleteCourse = async (id: string) => {
    await supabase.from('courses').delete().eq('id', id)
    setDeleteConfirm(null)
    loadData()
  }

  const toggleCourseActive = async (course: Course) => {
    await supabase
      .from('courses')
      .update({ is_active: !course.is_active })
      .eq('id', course.id)
    loadData()
  }

  if (checking) return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center'
    }}>
      <p style={{ color: '#6b7280' }}>Проверяем доступ...</p>
    </div>
  )

  const inputStyle = {
    width: '100%', padding: '10px 14px',
    border: '2px solid #e5e7eb', borderRadius: 10,
    fontSize: 14, color: '#111827',
    backgroundColor: 'white', outline: 'none',
    boxSizing: 'border-box' as const,
    fontFamily: 'Inter, sans-serif'
  }

  const labelStyle = {
    display: 'block' as const, fontSize: 13,
    fontWeight: 600 as const, color: '#374151', marginBottom: 6
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: 'Inter, sans-serif' }}>

      {/* Модальное окно подтверждения удаления */}
      {deleteConfirm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: 'white', borderRadius: 20, padding: 32,
            maxWidth: 400, width: '90%', textAlign: 'center'
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🗑️</div>
            <h3 style={{ fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 8 }}>
              Удалить?
            </h3>
            <p style={{ color: '#6b7280', marginBottom: 24 }}>
              Это действие нельзя отменить
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setDeleteConfirm(null)}
                style={{
                  flex: 1, padding: '10px', borderRadius: 10,
                  border: '2px solid #e5e7eb', background: 'white',
                  color: '#374151', cursor: 'pointer', fontWeight: 600
                }}
              >
                Отмена
              </button>
              <button
                onClick={() => {
                  if (activeTab === 'opportunities') {
                    deleteOpportunity(deleteConfirm)
                  } else {
                    deleteCourse(deleteConfirm)
                  }
                }}
                style={{
                  flex: 1, padding: '10px', borderRadius: 10,
                  border: 'none', background: '#ef4444',
                  color: 'white', cursor: 'pointer', fontWeight: 600
                }}
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Форма возможности */}
      {showOppForm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          zIndex: 100, display: 'flex', alignItems: 'center',
          justifyContent: 'center', padding: 16
        }}>
          <div style={{
            background: 'white', borderRadius: 24,
            maxWidth: 700, width: '100%',
            maxHeight: '90vh', overflowY: 'auto',
            padding: 32
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontSize: 22, fontWeight: 'bold', color: '#111827' }}>
                {editingOpp ? '✏️ Редактировать' : '➕ Добавить возможность'}
              </h2>
              <button
                onClick={() => setShowOppForm(false)}
                style={{
                  background: '#f3f4f6', border: 'none',
                  width: 36, height: 36, borderRadius: '50%',
                  cursor: 'pointer', fontSize: 16
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

              {/* Название */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Название *</label>
                <input
                  type="text"
                  placeholder="Название возможности"
                  value={oppForm.title || ''}
                  onChange={e => setOppForm({ ...oppForm, title: e.target.value })}
                  style={inputStyle}
                />
              </div>

              {/* Категория */}
              <div>
                <label style={labelStyle}>Категория</label>
                <select
                  value={oppForm.category || 'Олимпиада'}
                  onChange={e => setOppForm({ ...oppForm, category: e.target.value })}
                  style={inputStyle}
                >
                  {['Олимпиада', 'Хакатон', 'Стипендия', 'Летняя школа',
                    'Стартап-программа', 'Конкурс', 'Волонтёрство'].map(c => (
                    <option key={c} value={c} style={{ color: '#111827' }}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Направление */}
              <div>
                <label style={labelStyle}>Направление</label>
                <select
                  value={oppForm.direction || 'STEM'}
                  onChange={e => setOppForm({ ...oppForm, direction: e.target.value })}
                  style={inputStyle}
                >
                  {['STEM', 'Business', 'Social', 'Programming', 'Science', 'Finance'].map(d => (
                    <option key={d} value={d} style={{ color: '#111827' }}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Формат */}
              <div>
                <label style={labelStyle}>Формат</label>
                <select
                  value={oppForm.format || 'Онлайн'}
                  onChange={e => setOppForm({ ...oppForm, format: e.target.value })}
                  style={inputStyle}
                >
                  {['Онлайн', 'Очно', 'Гибрид'].map(f => (
                    <option key={f} value={f} style={{ color: '#111827' }}>{f}</option>
                  ))}
                </select>
              </div>

              {/* Дедлайн */}
              <div>
                <label style={labelStyle}>Дедлайн *</label>
                <input
                  type="date"
                  value={oppForm.deadline || ''}
                  onChange={e => setOppForm({ ...oppForm, deadline: e.target.value })}
                  style={inputStyle}
                />
              </div>

              {/* Мин класс */}
              <div>
                <label style={labelStyle}>Мин. класс</label>
                <select
                  value={oppForm.min_grade || 8}
                  onChange={e => setOppForm({ ...oppForm, min_grade: parseInt(e.target.value) })}
                  style={inputStyle}
                >
                  {[8, 9, 10, 11].map(g => (
                    <option key={g} value={g} style={{ color: '#111827' }}>{g} класс</option>
                  ))}
                </select>
              </div>

              {/* Макс класс */}
              <div>
                <label style={labelStyle}>Макс. класс</label>
                <select
                  value={oppForm.max_grade || 11}
                  onChange={e => setOppForm({ ...oppForm, max_grade: parseInt(e.target.value) })}
                  style={inputStyle}
                >
                  {[8, 9, 10, 11].map(g => (
                    <option key={g} value={g} style={{ color: '#111827' }}>{g} класс</option>
                  ))}
                </select>
              </div>

              {/* Ссылка */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Ссылка для заявки</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={oppForm.apply_url || ''}
                  onChange={e => setOppForm({ ...oppForm, apply_url: e.target.value })}
                  style={inputStyle}
                />
              </div>

              {/* Описание */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Описание</label>
                <textarea
                  placeholder="Описание возможности..."
                  value={oppForm.description || ''}
                  onChange={e => setOppForm({ ...oppForm, description: e.target.value })}
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>

              {/* Требования */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Требования</label>
                <textarea
                  placeholder="Требования к участникам..."
                  value={oppForm.requirements || ''}
                  onChange={e => setOppForm({ ...oppForm, requirements: e.target.value })}
                  rows={2}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>

              {/* Теги */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>
                  Теги (через запятую)
                </label>
                <input
                  type="text"
                  placeholder="math, stem, olympiad"
                  value={Array.isArray(oppForm.tags)
                    ? oppForm.tags.join(', ')
                    : oppForm.tags || ''}
                  onChange={e => setOppForm({ ...oppForm, tags: e.target.value as any })}
                  style={inputStyle}
                />
              </div>

            </div>

            {/* Кнопки */}
            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button
                onClick={() => setShowOppForm(false)}
                style={{
                  flex: 1, padding: '12px', borderRadius: 12,
                  border: '2px solid #e5e7eb', background: 'white',
                  color: '#374151', cursor: 'pointer', fontWeight: 600
                }}
              >
                Отмена
              </button>
              <button
                onClick={saveOpportunity}
                disabled={saving}
                style={{
                  flex: 2, padding: '12px', borderRadius: 12,
                  border: 'none',
                  background: saving ? '#9ca3af' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: 'white', cursor: saving ? 'wait' : 'pointer',
                  fontWeight: 700, fontSize: 15
                }}
              >
                {saving ? 'Сохраняем...' : editingOpp ? '✅ Сохранить' : '➕ Добавить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Форма курса */}
      {showCourseForm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          zIndex: 100, display: 'flex', alignItems: 'center',
          justifyContent: 'center', padding: 16
        }}>
          <div style={{
            background: 'white', borderRadius: 24,
            maxWidth: 600, width: '100%',
            maxHeight: '90vh', overflowY: 'auto',
            padding: 32
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontSize: 22, fontWeight: 'bold', color: '#111827' }}>
                {editingCourse ? '✏️ Редактировать курс' : '➕ Добавить курс'}
              </h2>
              <button
                onClick={() => setShowCourseForm(false)}
                style={{
                  background: '#f3f4f6', border: 'none',
                  width: 36, height: 36, borderRadius: '50%',
                  cursor: 'pointer', fontSize: 16
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              <div>
                <label style={labelStyle}>Название курса *</label>
                <input
                  type="text"
                  placeholder="Название курса"
                  value={courseForm.title || ''}
                  onChange={e => setCourseForm({ ...courseForm, title: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Предмет</label>
                  <select
                    value={courseForm.subject || 'math'}
                    onChange={e => setCourseForm({ ...courseForm, subject: e.target.value })}
                    style={inputStyle}
                  >
                    {[
                      { value: 'math', label: '🔢 Математика' },
                      { value: 'english', label: '🇬🇧 Английский' },
                      { value: 'physics', label: '⚡ Физика' },
                      { value: 'biology', label: '🧬 Биология' },
                      { value: 'programming', label: '💻 Программирование' },
                      { value: 'university_prep', label: '🎓 Поступление' },
                    ].map(s => (
                      <option key={s.value} value={s.value} style={{ color: '#111827' }}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Уровень</label>
                  <select
                    value={courseForm.level || 'beginner'}
                    onChange={e => setCourseForm({ ...courseForm, level: e.target.value })}
                    style={inputStyle}
                  >
                    {[
                      { value: 'beginner', label: '🟢 Начинающий' },
                      { value: 'intermediate', label: '🟡 Средний' },
                      { value: 'advanced', label: '🔴 Продвинутый' },
                    ].map(l => (
                      <option key={l.value} value={l.value} style={{ color: '#111827' }}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Длительность (часов)</label>
                <input
                  type="number"
                  min={1}
                  value={courseForm.duration_hours || 10}
                  onChange={e => setCourseForm({ ...courseForm, duration_hours: parseInt(e.target.value) })}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Описание</label>
                <textarea
                  placeholder="Описание курса..."
                  value={courseForm.description || ''}
                  onChange={e => setCourseForm({ ...courseForm, description: e.target.value })}
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>

              <div>
                <label style={labelStyle}>Теги (через запятую)</label>
                <input
                  type="text"
                  placeholder="math, olympiad, stem"
                  value={Array.isArray(courseForm.tags)
                    ? courseForm.tags.join(', ')
                    : courseForm.tags || ''}
                  onChange={e => setCourseForm({ ...courseForm, tags: e.target.value as any })}
                  style={inputStyle}
                />
              </div>

            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button
                onClick={() => setShowCourseForm(false)}
                style={{
                  flex: 1, padding: '12px', borderRadius: 12,
                  border: '2px solid #e5e7eb', background: 'white',
                  color: '#374151', cursor: 'pointer', fontWeight: 600
                }}
              >
                Отмена
              </button>
              <button
                onClick={saveCourse}
                disabled={saving}
                style={{
                  flex: 2, padding: '12px', borderRadius: 12,
                  border: 'none',
                  background: saving ? '#9ca3af' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: 'white', cursor: saving ? 'wait' : 'pointer',
                  fontWeight: 700, fontSize: 15
                }}
              >
                {saving ? 'Сохраняем...' : editingCourse ? '✅ Сохранить' : '➕ Добавить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== ШАПКА АДМИНКИ ===== */}
      <div style={{
        background: 'linear-gradient(135deg, #1e1b4b, #312e81)',
        padding: '24px 32px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div>
          <h1 style={{ color: 'white', fontSize: 24, fontWeight: 'bold' }}>
            ⚙️ Mentoria Admin
          </h1>
          <p style={{ color: '#a5b4fc', fontSize: 14, marginTop: 4 }}>
            Панель управления платформой
          </p>
        </div>
        <button
          onClick={() => router.push('/')}
          style={{
            background: 'rgba(255,255,255,0.1)', border: 'none',
            color: 'white', padding: '8px 16px', borderRadius: 10,
            cursor: 'pointer', fontSize: 14
          }}
        >
          ← На сайт
        </button>
      </div>

      {/* ===== ТАБЫ ===== */}
      <div style={{
        background: 'white', borderBottom: '1px solid #e5e7eb',
        padding: '0 32px', display: 'flex', gap: 4
      }}>
        {[
          { id: 'opportunities', label: '🎯 Возможности', count: opportunities.length },
          { id: 'courses', label: '📚 Курсы', count: courses.length },
          { id: 'stats', label: '📊 Статистика', count: null },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: '16px 20px', border: 'none', background: 'none',
              cursor: 'pointer', fontSize: 14, fontWeight: 600,
              color: activeTab === tab.id ? '#6366f1' : '#6b7280',
              borderBottom: `2px solid ${activeTab === tab.id ? '#6366f1' : 'transparent'}`,
              display: 'flex', alignItems: 'center', gap: 8
            }}
          >
            {tab.label}
            {tab.count !== null && (
              <span style={{
                background: activeTab === tab.id ? '#6366f1' : '#e5e7eb',
                color: activeTab === tab.id ? 'white' : '#374151',
                fontSize: 11, padding: '2px 8px', borderRadius: 999, fontWeight: 700
              }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>

        {/* ===== СТАТИСТИКА ===== */}
        {activeTab === 'stats' && (
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 'bold', color: '#111827', marginBottom: 24 }}>
              📊 Статистика платформы
            </h2>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20
            }}>
              {[
                { label: 'Пользователей', value: userCount, emoji: '👥', color: '#6366f1' },
                { label: 'Возможностей', value: opportunities.length, emoji: '🎯', color: '#22c55e' },
                { label: 'Активных', value: opportunities.filter(o => o.is_active).length, emoji: '✅', color: '#3b82f6' },
                { label: 'Курсов', value: courses.length, emoji: '📚', color: '#f97316' },
              ].map(stat => (
                <div key={stat.label} style={{
                  background: 'white', borderRadius: 20, padding: 24,
                  border: '1px solid #e5e7eb', textAlign: 'center',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>{stat.emoji}</div>
                  <div style={{
                    fontSize: 36, fontWeight: 'bold',
                    color: stat.color, marginBottom: 4
                  }}>
                    {stat.value}
                  </div>
                  <div style={{ color: '#6b7280', fontSize: 14 }}>{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Последние возможности */}
            <div style={{ marginTop: 32 }}>
              <h3 style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 16 }}>
                🕐 Последние добавленные
              </h3>
              <div style={{
                background: 'white', borderRadius: 16,
                border: '1px solid #e5e7eb', overflow: 'hidden'
              }}>
                {opportunities.slice(0, 5).map((opp, i) => (
                  <div key={opp.id} style={{
                    padding: '16px 20px',
                    borderBottom: i < 4 ? '1px solid #f3f4f6' : 'none',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                    <div>
                      <p style={{ fontWeight: 600, color: '#111827', fontSize: 14 }}>
                        {opp.title}
                      </p>
                      <p style={{ color: '#9ca3af', fontSize: 12 }}>
                        {opp.category} · {opp.direction}
                      </p>
                    </div>
                    <span style={{
                      background: opp.is_active ? '#dcfce7' : '#fee2e2',
                      color: opp.is_active ? '#16a34a' : '#dc2626',
                      fontSize: 12, padding: '4px 10px', borderRadius: 999, fontWeight: 600
                    }}>
                      {opp.is_active ? 'Активна' : 'Скрыта'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===== ВОЗМОЖНОСТИ ===== */}
        {activeTab === 'opportunities' && (
          <div>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: 24
            }}>
              <h2 style={{ fontSize: 22, fontWeight: 'bold', color: '#111827' }}>
                🎯 Возможности ({opportunities.length})
              </h2>
              <button
                onClick={() => openOppForm()}
                style={{
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: 'white', border: 'none',
                  padding: '10px 20px', borderRadius: 12,
                  cursor: 'pointer', fontWeight: 700, fontSize: 14
                }}
              >
                ➕ Добавить возможность
              </button>
            </div>

            {loading ? (
              <p style={{ color: '#6b7280', textAlign: 'center', padding: 40 }}>
                Загрузка...
              </p>
            ) : (
              <div style={{
                background: 'white', borderRadius: 16,
                border: '1px solid #e5e7eb', overflow: 'hidden'
              }}>
                {/* Заголовок таблицы */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr 1fr 120px',
                  padding: '12px 20px',
                  background: '#f9fafb',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  {['Название', 'Категория', 'Дедлайн', 'Статус', 'Действия'].map(h => (
                    <span key={h} style={{
                      fontSize: 12, fontWeight: 700,
                      color: '#6b7280', textTransform: 'uppercase'
                    }}>
                      {h}
                    </span>
                  ))}
                </div>

                {opportunities.map((opp, i) => (
                  <div
                    key={opp.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 1fr 1fr 1fr 120px',
                      padding: '16px 20px', alignItems: 'center',
                      borderBottom: i < opportunities.length - 1
                        ? '1px solid #f3f4f6' : 'none',
                      background: opp.is_active ? 'white' : '#fafafa'
                    }}
                  >
                    <div>
                      <p style={{
                        fontWeight: 600, color: '#111827',
                        fontSize: 14, marginBottom: 2
                      }}>
                        {opp.title}
                      </p>
                      <p style={{ color: '#9ca3af', fontSize: 12 }}>
                        {opp.direction} · {opp.format}
                      </p>
                    </div>

                    <span style={{
                      fontSize: 12, color: '#374151',
                      background: '#f3f4f6',
                      padding: '3px 8px', borderRadius: 999,
                      display: 'inline-block'
                    }}>
                      {opp.category}
                    </span>

                    <span style={{
                      fontSize: 13, color: '#374151', fontWeight: 500
                    }}>
                      {new Date(opp.deadline).toLocaleDateString('ru-RU', {
                        day: 'numeric', month: 'short'
                      })}
                    </span>

                    <button
                      onClick={() => toggleOppActive(opp)}
                      style={{
                        background: opp.is_active ? '#dcfce7' : '#fee2e2',
                        color: opp.is_active ? '#16a34a' : '#dc2626',
                        border: 'none', padding: '4px 12px',
                        borderRadius: 999, cursor: 'pointer',
                        fontSize: 12, fontWeight: 700
                      }}
                    >
                      {opp.is_active ? '✅ Активна' : '❌ Скрыта'}
                    </button>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => openOppForm(opp)}
                        style={{
                          background: '#eef2ff', color: '#6366f1',
                          border: 'none', padding: '6px 12px',
                          borderRadius: 8, cursor: 'pointer',
                          fontSize: 13, fontWeight: 600
                        }}
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(opp.id)}
                        style={{
                          background: '#fef2f2', color: '#ef4444',
                          border: 'none', padding: '6px 12px',
                          borderRadius: 8, cursor: 'pointer',
                          fontSize: 13, fontWeight: 600
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== КУРСЫ ===== */}
        {activeTab === 'courses' && (
          <div>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: 24
            }}>
              <h2 style={{ fontSize: 22, fontWeight: 'bold', color: '#111827' }}>
                📚 Курсы ({courses.length})
              </h2>
              <button
                onClick={() => openCourseForm()}
                style={{
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: 'white', border: 'none',
                  padding: '10px 20px', borderRadius: 12,
                  cursor: 'pointer', fontWeight: 700, fontSize: 14
                }}
              >
                ➕ Добавить курс
              </button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 20
            }}>
              {courses.map(course => (
                <div key={course.id} style={{
                  background: 'white', borderRadius: 16,
                  border: '1px solid #e5e7eb',
                  overflow: 'hidden',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  opacity: course.is_active ? 1 : 0.6
                }}>
                  <div style={{
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    padding: 20
                  }}>
                    <h3 style={{
                      color: 'white', fontWeight: 'bold', fontSize: 16
                    }}>
                      {course.title}
                    </h3>
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 4 }}>
                      {course.subject} · {course.level} · {course.duration_hours}ч
                    </p>
                  </div>
                  <div style={{ padding: 16 }}>
                    <p style={{
                      color: '#6b7280', fontSize: 13,
                      lineHeight: 1.5, marginBottom: 16
                    }}>
                      {course.description || 'Нет описания'}
                    </p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => toggleCourseActive(course)}
                        style={{
                          flex: 1, padding: '8px',
                          background: course.is_active ? '#dcfce7' : '#fee2e2',
                          color: course.is_active ? '#16a34a' : '#dc2626',
                          border: 'none', borderRadius: 8,
                          cursor: 'pointer', fontSize: 12, fontWeight: 600
                        }}
                      >
                        {course.is_active ? '✅ Активен' : '❌ Скрыт'}
                      </button>
                      <button
                        onClick={() => openCourseForm(course)}
                        style={{
                          padding: '8px 16px', background: '#eef2ff',
                          color: '#6366f1', border: 'none',
                          borderRadius: 8, cursor: 'pointer', fontSize: 13
                        }}
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(course.id)}
                        style={{
                          padding: '8px 16px', background: '#fef2f2',
                          color: '#ef4444', border: 'none',
                          borderRadius: 8, cursor: 'pointer', fontSize: 13
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}