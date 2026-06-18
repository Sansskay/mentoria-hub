'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

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
}

function getDaysLeft(deadline: string): number {
  const diff = new Date(deadline).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

const DIRECTION_COLORS: Record<string, string> = {
  STEM: '#3b82f6',
  Business: '#22c55e',
  Social: '#a855f7',
  Programming: '#f97316',
  Science: '#06b6d4',
  Finance: '#eab308',
}

const CATEGORY_EMOJI: Record<string, string> = {
  'Олимпиада': '🏆',
  'Хакатон': '💻',
  'Стипендия': '💵',
  'Летняя школа': '☀️',
  'Стартап-программа': '🚀',
  'Конкурс': '🥇',
  'Волонтёрство': '🤝',
}

export default function OpportunitiesPage() {
  const router = useRouter()
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [filtered, setFiltered] = useState<Opportunity[]>([])
  const [savedIds, setSavedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null)

  // Фильтры
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Все')
  const [direction, setDirection] = useState('Все')
  const [format, setFormat] = useState('Все')
  const [grade, setGrade] = useState('Все')

  useEffect(() => {
    const loadData = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)

      const { data: opps } = await supabase
        .from('opportunities')
        .select('*')
        .eq('is_active', true)
        .order('deadline', { ascending: true })

      setOpportunities(opps || [])
      setFiltered(opps || [])

      if (session?.user) {
        const { data: saved } = await supabase
          .from('saved_opportunities')
          .select('opportunity_id')
          .eq('user_id', session.user.id)
        setSavedIds(saved?.map((s: any) => s.opportunity_id) || [])
      }

      setLoading(false)
    }
    loadData()
  }, [])

  useEffect(() => {
    let result = [...opportunities]

    if (search.trim()) {
      result = result.filter(opp =>
        opp.title.toLowerCase().includes(search.toLowerCase()) ||
        opp.description?.toLowerCase().includes(search.toLowerCase())
      )
    }
    if (category !== 'Все') result = result.filter(o => o.category === category)
    if (direction !== 'Все') result = result.filter(o => o.direction === direction)
    if (format !== 'Все') result = result.filter(o => o.format === format)
    if (grade !== 'Все') {
      const g = parseInt(grade)
      result = result.filter(o => o.min_grade <= g && o.max_grade >= g)
    }

    setFiltered(result)
  }, [search, category, direction, format, grade, opportunities])

  const toggleSave = async (oppId: string) => {
    if (!user) { router.push('/auth/login'); return }

    const isSaved = savedIds.includes(oppId)
    if (isSaved) {
      await supabase
        .from('saved_opportunities')
        .delete()
        .eq('user_id', user.id)
        .eq('opportunity_id', oppId)
      setSavedIds(prev => prev.filter(id => id !== oppId))
    } else {
      await supabase
        .from('saved_opportunities')
        .insert({ user_id: user.id, opportunity_id: oppId })
      setSavedIds(prev => [...prev, oppId])
    }
  }

  const resetFilters = () => {
    setSearch('')
    setCategory('Все')
    setDirection('Все')
    setFormat('Все')
    setGrade('Все')
  }

  if (loading) return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: '#f9fafb'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 48, height: 48, border: '4px solid #6366f1',
          borderTopColor: 'transparent', borderRadius: '50%',
          animation: 'spin 1s linear infinite', margin: '0 auto 16px'
        }} />
        <p style={{ color: '#6b7280' }}>Загружаем возможности...</p>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: 'Inter, sans-serif' }}>

      {/* Модальное окно */}
      {selectedOpp && (
        <div
          onClick={() => setSelectedOpp(null)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 100, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            padding: 16
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'white', borderRadius: 24,
              maxWidth: 600, width: '100%',
              maxHeight: '90vh', overflowY: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}
          >
            {/* Шапка модального */}
            <div style={{
              background: `linear-gradient(135deg, ${DIRECTION_COLORS[selectedOpp.direction] || '#6366f1'}, #8b5cf6)`,
              padding: 32, borderRadius: '24px 24px 0 0'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start'
              }}>
                <div>
                  <span style={{
                    background: 'rgba(255,255,255,0.2)',
                    color: 'white', padding: '4px 12px',
                    borderRadius: 999, fontSize: 13
                  }}>
                    {CATEGORY_EMOJI[selectedOpp.category]} {selectedOpp.category}
                  </span>
                  <h2 style={{
                    color: 'white', fontSize: 22,
                    fontWeight: 'bold', marginTop: 12,
                    lineHeight: 1.3
                  }}>
                    {selectedOpp.title}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedOpp(null)}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    border: 'none', color: 'white',
                    width: 36, height: 36, borderRadius: '50%',
                    cursor: 'pointer', fontSize: 18,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Контент модального */}
            <div style={{ padding: 32 }}>
              {/* Метаданные */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12, marginBottom: 24
              }}>
                {[
                  { label: 'Направление', value: selectedOpp.direction },
                  { label: 'Формат', value: selectedOpp.format },
                  { label: 'Классы', value: `${selectedOpp.min_grade}–${selectedOpp.max_grade} класс` },
                  {
                    label: 'Дедлайн',
                    value: `${getDaysLeft(selectedOpp.deadline)} дней (${new Date(selectedOpp.deadline).toLocaleDateString('ru-RU')})`
                  },
                ].map(item => (
                  <div key={item.label} style={{
                    background: '#f9fafb', borderRadius: 12, padding: 16
                  }}>
                    <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>
                      {item.label}
                    </p>
                    <p style={{ fontWeight: 600, color: '#111827', fontSize: 14 }}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Описание */}
              <div style={{ marginBottom: 20 }}>
                <h3 style={{
                  fontWeight: 'bold', color: '#111827',
                  marginBottom: 8, fontSize: 16
                }}>
                  📋 Описание
                </h3>
                <p style={{ color: '#374151', lineHeight: 1.7, fontSize: 14 }}>
                  {selectedOpp.description}
                </p>
              </div>

              {/* Требования */}
              {selectedOpp.requirements && (
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{
                    fontWeight: 'bold', color: '#111827',
                    marginBottom: 8, fontSize: 16
                  }}>
                    ✅ Требования
                  </h3>
                  <p style={{ color: '#374151', lineHeight: 1.7, fontSize: 14 }}>
                    {selectedOpp.requirements}
                  </p>
                </div>
              )}

              {/* Кнопки */}
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={() => toggleSave(selectedOpp.id)}
                  style={{
                    flex: 1, padding: '12px 20px', borderRadius: 12,
                    border: `2px solid ${savedIds.includes(selectedOpp.id) ? '#ef4444' : '#e5e7eb'}`,
                    background: savedIds.includes(selectedOpp.id) ? '#fef2f2' : 'white',
                    color: savedIds.includes(selectedOpp.id) ? '#ef4444' : '#374151',
                    cursor: 'pointer', fontWeight: 600, fontSize: 14
                  }}
                >
                  {savedIds.includes(selectedOpp.id) ? '❤️ Сохранено' : '🤍 Сохранить'}
                </button>
                <a
                  href={selectedOpp.apply_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    flex: 1, padding: '12px 20px', borderRadius: 12,
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    color: 'white', border: 'none', cursor: 'pointer',
                    fontWeight: 600, fontSize: 14, textDecoration: 'none',
                    textAlign: 'center', display: 'block'
                  }}
                >
                  Подать заявку →
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Шапка */}
      <div style={{
        background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
        padding: '56px 24px', color: 'white'
      }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          {/* Кнопка назад */}
          <button
            onClick={() => router.push('/')}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: 'none', color: 'white',
              padding: '6px 16px', borderRadius: 8,
              cursor: 'pointer', fontSize: 14,
              marginBottom: 20
            }}
          >
            ← На главную
          </button>
          <h1 style={{ fontSize: 36, fontWeight: 'bold', marginBottom: 12 }}>
            🎯 Каталог возможностей
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16, marginBottom: 24 }}>
            Олимпиады, стипендии, хакатоны, летние школы и многое другое
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {[
              `📋 ${opportunities.length} возможностей`,
              `❤️ ${savedIds.length} сохранено`,
              '🌍 Международные и казахстанские'
            ].map(tag => (
              <div key={tag} style={{
                background: 'rgba(255,255,255,0.15)',
                padding: '6px 16px', borderRadius: 999,
                fontSize: 13, color: 'white'
              }}>
                {tag}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px' }}>

        {/* Поиск */}
        <div style={{ position: 'relative', marginBottom: 24 }}>
          <span style={{
            position: 'absolute', left: 16,
            top: '50%', transform: 'translateY(-50%)',
            fontSize: 18, pointerEvents: 'none'
          }}>
            🔍
          </span>
          <input
            type="text"
            placeholder="Поиск по названию..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '14px 16px 14px 48px',
              fontSize: 15,
              border: '2px solid #e5e7eb',
              borderRadius: 16,
              outline: 'none',
              color: '#111827',
              backgroundColor: 'white',
              boxSizing: 'border-box',
              fontFamily: 'Inter, sans-serif'
            }}
          />
        </div>

        {/* Фильтры */}
        <div style={{
          background: 'white', borderRadius: 20,
          border: '1px solid #e5e7eb',
          padding: 24, marginBottom: 24,
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16
          }}>
            <h3 style={{ fontWeight: 'bold', color: '#111827', fontSize: 15 }}>
              🎛️ Фильтры
            </h3>
            <button
              onClick={resetFilters}
              style={{
                background: 'none', border: 'none',
                color: '#ef4444', cursor: 'pointer',
                fontSize: 13, fontWeight: 500
              }}
            >
              Сбросить
            </button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 12
          }}>
            {[
              {
                label: 'Категория',
                value: category,
                onChange: setCategory,
                options: ['Все', 'Олимпиада', 'Хакатон', 'Стипендия', 'Летняя школа', 'Стартап-программа', 'Конкурс', 'Волонтёрство']
              },
              {
                label: 'Направление',
                value: direction,
                onChange: setDirection,
                options: ['Все', 'STEM', 'Business', 'Social', 'Programming', 'Science', 'Finance']
              },
              {
                label: 'Формат',
                value: format,
                onChange: setFormat,
                options: ['Все', 'Онлайн', 'Очно', 'Гибрид']
              },
              {
                label: 'Класс',
                value: grade,
                onChange: setGrade,
                options: ['Все', '8', '9', '10', '11']
              },
            ].map(filter => (
              <div key={filter.label}>
                <label style={{
                  display: 'block', fontSize: 12,
                  color: '#6b7280', fontWeight: 500, marginBottom: 6
                }}>
                  {filter.label}
                </label>
                <select
                  value={filter.value}
                  onChange={e => filter.onChange(e.target.value)}
                  style={{
                    width: '100%', padding: '8px 12px',
                    border: '2px solid #e5e7eb', borderRadius: 10,
                    fontSize: 13, color: '#111827',
                    backgroundColor: 'white', cursor: 'pointer',
                    outline: 'none', fontFamily: 'Inter, sans-serif'
                  }}
                >
                  {filter.options.map(opt => (
                    <option key={opt} value={opt} style={{ color: '#111827' }}>
                      {opt === 'Все' && filter.label === 'Класс' ? 'Все классы' :
                       opt !== 'Все' && filter.label === 'Класс' ? `${opt} класс` : opt}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {/* Быстрые кнопки */}
          <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['Олимпиада', 'Стипендия', 'Хакатон', 'Летняя школа', 'STEM', 'Business'].map(tag => {
              const isCategory = ['Олимпиада', 'Стипендия', 'Хакатон', 'Летняя школа'].includes(tag)
              const isActive = isCategory ? category === tag : direction === tag
              return (
                <button
                  key={tag}
                  onClick={() => isCategory
                    ? setCategory(category === tag ? 'Все' : tag)
                    : setDirection(direction === tag ? 'Все' : tag)
                  }
                  style={{
                    padding: '6px 14px', borderRadius: 999,
                    border: `1px solid ${isActive ? '#6366f1' : '#e5e7eb'}`,
                    background: isActive ? '#6366f1' : 'white',
                    color: isActive ? 'white' : '#374151',
                    cursor: 'pointer', fontSize: 12, fontWeight: 500
                  }}
                >
                  {CATEGORY_EMOJI[tag] || ''} {tag}
                </button>
              )
            })}
          </div>
        </div>

        {/* Счётчик */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: 20
        }}>
          <p style={{ color: '#6b7280', fontSize: 14 }}>
            Найдено:{' '}
            <span style={{ fontWeight: 'bold', color: '#111827' }}>
              {filtered.length}
            </span>{' '}
            возможностей
          </p>
        </div>

        {/* Пустой результат */}
        {filtered.length === 0 && (
          <div style={{
            background: 'white', borderRadius: 20,
            padding: '60px 24px', textAlign: 'center',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🔍</div>
            <h3 style={{
              fontSize: 20, fontWeight: 'bold',
              color: '#111827', marginBottom: 8
            }}>
              Ничего не найдено
            </h3>
            <p style={{ color: '#6b7280', marginBottom: 20 }}>
              Попробуй изменить фильтры
            </p>
            <button
              onClick={resetFilters}
              style={{
                background: '#6366f1', color: 'white',
                border: 'none', padding: '10px 24px',
                borderRadius: 10, cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Сбросить фильтры
            </button>
          </div>
        )}

        {/* Карточки */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 20
        }}>
          {filtered.map(opp => {
            const daysLeft = getDaysLeft(opp.deadline)
            const isSaved = savedIds.includes(opp.id)
            const dirColor = DIRECTION_COLORS[opp.direction] || '#6366f1'

            return (
              <div
                key={opp.id}
                style={{
                  background: 'white', borderRadius: 20,
                  border: '1px solid #e5e7eb',
                  overflow: 'hidden',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  display: 'flex', flexDirection: 'column'
                }}
              >
                {/* Цветная полоска */}
                <div style={{ height: 5, background: dirColor }} />

                <div style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>

                  {/* Заголовок и сохранить */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, marginRight: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                        <span style={{ fontSize: 18 }}>
                          {CATEGORY_EMOJI[opp.category] || '📋'}
                        </span>
                        <span style={{
                          fontSize: 11, fontWeight: 600,
                          padding: '2px 8px', borderRadius: 999,
                          background: `${dirColor}15`, color: dirColor
                        }}>
                          {opp.direction}
                        </span>
                      </div>
                      <h3 style={{
                        fontSize: 15, fontWeight: 'bold',
                        color: '#111827', lineHeight: 1.4
                      }}>
                        {opp.title}
                      </h3>
                    </div>
                    <button
                      onClick={() => toggleSave(opp.id)}
                      style={{
                        background: isSaved ? '#fef2f2' : '#f9fafb',
                        border: 'none', cursor: 'pointer',
                        width: 36, height: 36, borderRadius: '50%',
                        fontSize: 18, flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}
                    >
                      {isSaved ? '❤️' : '🤍'}
                    </button>
                  </div>

                  {/* Описание */}
                  <p style={{
                    fontSize: 13, color: '#6b7280',
                    lineHeight: 1.6,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {opp.description}
                  </p>

                  {/* Метаданные */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {[opp.category, opp.format, `${opp.min_grade}–${opp.max_grade} кл.`].map(tag => (
                      <span key={tag} style={{
                        background: '#f3f4f6', color: '#374151',
                        fontSize: 11, padding: '3px 8px', borderRadius: 999
                      }}>
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Дедлайн */}
                  <div style={{
                    background: daysLeft <= 0 ? '#f3f4f6' :
                               daysLeft <= 7 ? '#fef2f2' :
                               daysLeft <= 30 ? '#fff7ed' : '#f0fdf4',
                    padding: '8px 12px', borderRadius: 10,
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{
                      fontSize: 13, fontWeight: 600,
                      color: daysLeft <= 0 ? '#9ca3af' :
                             daysLeft <= 7 ? '#ef4444' :
                             daysLeft <= 30 ? '#f97316' : '#22c55e'
                    }}>
                      📅 {daysLeft <= 0 ? 'Истёк' :
                          daysLeft === 0 ? 'Сегодня!' :
                          `${daysLeft} дней`}
                    </span>
                    <span style={{ fontSize: 11, color: '#9ca3af' }}>
                      {new Date(opp.deadline).toLocaleDateString('ru-RU', {
                        day: 'numeric', month: 'short'
                      })}
                    </span>
                  </div>

                  {/* Кнопки */}
                  <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                    <button
                      onClick={() => setSelectedOpp(opp)}
                      style={{
                        flex: 1, padding: '10px 12px', borderRadius: 12,
                        border: '2px solid #e5e7eb', background: 'white',
                        color: '#374151', cursor: 'pointer',
                        fontSize: 13, fontWeight: 600
                      }}
                    >
                      Подробнее
                    </button>
                    <a
                      href={opp.apply_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        flex: 1, padding: '10px 12px', borderRadius: 12,
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        color: 'white', border: 'none',
                        cursor: 'pointer', fontSize: 13, fontWeight: 600,
                        textDecoration: 'none', textAlign: 'center',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}
                    >
                      Подать →
                    </a>
                  </div>

                </div>
              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}