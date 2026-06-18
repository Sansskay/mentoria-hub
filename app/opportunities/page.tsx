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
  score?: number
}

interface Profile {
  grade: number
  interests: string[]
  goals: string[]
}

function getDaysLeft(deadline: string): number {
  const diff = new Date(deadline).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

// ============================================
// ДВИЖОК РЕКОМЕНДАЦИЙ
// ============================================
function calculateScore(opp: Opportunity, profile: Profile): number {
  let score = 0

  // Совпадение класса
  if (opp.min_grade <= profile.grade && opp.max_grade >= profile.grade) {
    score += 5
  } else {
    return -1 // Не подходит по классу
  }

  // Совпадение интересов с направлением
  profile.interests?.forEach(interest => {
    if (opp.direction?.toLowerCase() === interest.toLowerCase()) score += 10
    if (opp.tags?.some(tag => tag.toLowerCase() === interest.toLowerCase())) score += 5
  })

  // Совпадение целей с тегами
  profile.goals?.forEach(goal => {
    if (opp.tags?.some(tag => tag.toLowerCase() === goal.toLowerCase())) score += 8
    if (goal === 'university' && opp.tags?.includes('university')) score += 5
    if (goal === 'olympiad' && opp.category === 'Олимпиада') score += 8
    if (goal === 'scholarship' && opp.category === 'Стипендия') score += 8
    if (goal === 'startup' && opp.direction === 'Business') score += 6
  })

  // Срочность дедлайна
  const days = getDaysLeft(opp.deadline)
  if (days > 0 && days <= 14) score += 4
  else if (days > 0 && days <= 30) score += 2

  return score
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
  const [recommended, setRecommended] = useState<Opportunity[]>([])
  const [savedIds, setSavedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null)
  const [activeTab, setActiveTab] = useState<'all' | 'recommended' | 'saved'>('all')

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

      // Загружаем профиль пользователя
      if (session?.user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('grade, interests, goals')
          .eq('id', session.user.id)
          .single()

        if (profileData) setProfile(profileData)

        // Загружаем сохранённые
        const { data: saved } = await supabase
          .from('saved_opportunities')
          .select('opportunity_id')
          .eq('user_id', session.user.id)
        setSavedIds(saved?.map((s: any) => s.opportunity_id) || [])
      }

      // Загружаем возможности
      const { data: opps } = await supabase
        .from('opportunities')
        .select('*')
        .eq('is_active', true)
        .order('deadline', { ascending: true })

      setOpportunities(opps || [])
      setFiltered(opps || [])

      setLoading(false)
    }
    loadData()
  }, [])

  // Считаем рекомендации когда загрузился профиль и возможности
  useEffect(() => {
    if (!profile || opportunities.length === 0) return

    const scored = opportunities
      .map(opp => ({
        ...opp,
        score: calculateScore(opp, profile)
      }))
      .filter(opp => opp.score > 0)
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 6)

    setRecommended(scored)
  }, [profile, opportunities])

  // Фильтры
  useEffect(() => {
    let result = [...opportunities]

    if (search.trim()) {
      result = result.filter(opp =>
        opp.title.toLowerCase().includes(search.toLowerCase()) ||
        opp.description?.toLowerCase().includes(search.toLowerCase()) ||
        opp.tags?.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
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
      await supabase.from('saved_opportunities').delete()
        .eq('user_id', user.id).eq('opportunity_id', oppId)
      setSavedIds(prev => prev.filter(id => id !== oppId))
    } else {
      await supabase.from('saved_opportunities')
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

  // Что показывать в зависимости от таба
  const displayList = activeTab === 'recommended'
    ? recommended
    : activeTab === 'saved'
      ? opportunities.filter(o => savedIds.includes(o.id))
      : filtered

  if (loading) return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center'
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

  // Карточка возможности
  const OppCard = ({ opp }: { opp: Opportunity }) => {
    const daysLeft = getDaysLeft(opp.deadline)
    const isSaved = savedIds.includes(opp.id)
    const dirColor = DIRECTION_COLORS[opp.direction] || '#6366f1'
    const isRecommended = recommended.some(r => r.id === opp.id)

    return (
      <div style={{
        background: 'white', borderRadius: 20,
        border: `1px solid ${isRecommended && activeTab === 'all' ? '#c7d2fe' : '#e5e7eb'}`,
        overflow: 'hidden', display: 'flex', flexDirection: 'column',
        boxShadow: isRecommended && activeTab === 'all'
          ? '0 0 0 2px #e0e7ff' : '0 1px 3px rgba(0,0,0,0.06)',
        position: 'relative'
      }}>

        {/* Значок рекомендации */}
        {isRecommended && activeTab === 'all' && (
          <div style={{
            position: 'absolute', top: 12, right: 48,
            background: '#6366f1', color: 'white',
            fontSize: 10, fontWeight: 700,
            padding: '2px 8px', borderRadius: 999,
            zIndex: 1
          }}>
            ⭐ Для тебя
          </div>
        )}

        {/* Скор рекомендации */}
        {activeTab === 'recommended' && opp.score && (
          <div style={{
            position: 'absolute', top: 12, left: 12,
            background: '#6366f1', color: 'white',
            fontSize: 11, fontWeight: 700,
            padding: '3px 10px', borderRadius: 999, zIndex: 1
          }}>
            ⭐ {opp.score} баллов
          </div>
        )}

        <div style={{ height: 5, background: dirColor }} />

        <div style={{
          padding: 20, flex: 1,
          display: 'flex', flexDirection: 'column', gap: 12
        }}>

          {/* Заголовок */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1, marginRight: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <span style={{ fontSize: 18 }}>{CATEGORY_EMOJI[opp.category] || '📋'}</span>
                <span style={{
                  fontSize: 11, fontWeight: 600,
                  padding: '2px 8px', borderRadius: 999,
                  background: `${dirColor}20`, color: dirColor
                }}>
                  {opp.direction}
                </span>
              </div>
              <h3 style={{
                fontSize: 15, fontWeight: 'bold',
                color: '#111827', lineHeight: 1.4, margin: 0
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
            lineHeight: 1.6, margin: 0,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical' as any,
          }}>
            {opp.description}
          </p>

          {/* Теги */}
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
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
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
                flex: 1, padding: '10px', borderRadius: 12,
                border: '2px solid #e5e7eb', background: 'white',
                color: '#374151', cursor: 'pointer', fontSize: 13, fontWeight: 600
              }}
            >
              Подробнее
            </button>
            <a
              href={opp.apply_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                flex: 1, padding: '10px', borderRadius: 12,
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: 'white', border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 600, textDecoration: 'none',
                textAlign: 'center', display: 'flex',
                alignItems: 'center', justifyContent: 'center'
              }}
            >
              Подать →
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: 'Inter, sans-serif' }}>

      {/* Модальное окно */}
      {selectedOpp && (
        <div
          onClick={() => setSelectedOpp(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            zIndex: 100, display: 'flex', alignItems: 'center',
            justifyContent: 'center', padding: 16
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'white', borderRadius: 24, maxWidth: 600,
              width: '100%', maxHeight: '90vh', overflowY: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}
          >
            <div style={{
              background: `linear-gradient(135deg, ${DIRECTION_COLORS[selectedOpp.direction] || '#6366f1'}, #8b5cf6)`,
              padding: 32, borderRadius: '24px 24px 0 0'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <span style={{
                    background: 'rgba(255,255,255,0.2)', color: 'white',
                    padding: '4px 12px', borderRadius: 999, fontSize: 13
                  }}>
                    {CATEGORY_EMOJI[selectedOpp.category]} {selectedOpp.category}
                  </span>
                  <h2 style={{ color: 'white', fontSize: 22, fontWeight: 'bold', marginTop: 12 }}>
                    {selectedOpp.title}
                  </h2>
                </div>
                <button onClick={() => setSelectedOpp(null)} style={{
                  background: 'rgba(255,255,255,0.2)', border: 'none',
                  color: 'white', width: 36, height: 36, borderRadius: '50%',
                  cursor: 'pointer', fontSize: 16, flexShrink: 0
                }}>✕</button>
              </div>
            </div>

            <div style={{ padding: 32 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
                {[
                  { label: 'Направление', value: selectedOpp.direction },
                  { label: 'Формат', value: selectedOpp.format },
                  { label: 'Классы', value: `${selectedOpp.min_grade}–${selectedOpp.max_grade} класс` },
                  { label: 'Дедлайн', value: `${getDaysLeft(selectedOpp.deadline)} дней` },
                ].map(item => (
                  <div key={item.label} style={{ background: '#f9fafb', borderRadius: 12, padding: 16 }}>
                    <p style={{ fontSize: 12, color: '#9ca3af', margin: '0 0 4px' }}>{item.label}</p>
                    <p style={{ fontWeight: 600, color: '#111827', margin: 0 }}>{item.value}</p>
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: 20 }}>
                <h3 style={{ color: '#111827', marginBottom: 8 }}>📋 Описание</h3>
                <p style={{ color: '#374151', lineHeight: 1.7, margin: 0 }}>{selectedOpp.description}</p>
              </div>

              {selectedOpp.requirements && (
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ color: '#111827', marginBottom: 8 }}>✅ Требования</h3>
                  <p style={{ color: '#374151', lineHeight: 1.7, margin: 0 }}>{selectedOpp.requirements}</p>
                </div>
              )}

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={() => toggleSave(selectedOpp.id)}
                  style={{
                    flex: 1, padding: '12px', borderRadius: 12,
                    border: `2px solid ${savedIds.includes(selectedOpp.id) ? '#ef4444' : '#e5e7eb'}`,
                    background: savedIds.includes(selectedOpp.id) ? '#fef2f2' : 'white',
                    color: savedIds.includes(selectedOpp.id) ? '#ef4444' : '#374151',
                    cursor: 'pointer', fontWeight: 600
                  }}
                >
                  {savedIds.includes(selectedOpp.id) ? '❤️ Сохранено' : '🤍 Сохранить'}
                </button>
                <a
                  href={selectedOpp.apply_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    flex: 1, padding: '12px', borderRadius: 12,
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    color: 'white', border: 'none', cursor: 'pointer',
                    fontWeight: 600, textDecoration: 'none', textAlign: 'center',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
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
          <button onClick={() => router.push('/')} style={{
            background: 'rgba(255,255,255,0.15)', border: 'none',
            color: 'white', padding: '6px 16px', borderRadius: 8,
            cursor: 'pointer', marginBottom: 20, fontSize: 14
          }}>← На главную</button>

          <h1 style={{ fontSize: 36, fontWeight: 'bold', marginBottom: 12 }}>
            🎯 Каталог возможностей
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16, marginBottom: 24 }}>
            {profile
              ? `Рекомендации для ${profile.grade} класса на основе твоих интересов`
              : 'Олимпиады, стипендии, хакатоны, летние школы и многое другое'}
          </p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ background: 'rgba(255,255,255,0.15)', padding: '6px 16px', borderRadius: 999, fontSize: 13 }}>
              📋 {opportunities.length} возможностей
            </div>
            {profile && (
              <div style={{ background: 'rgba(255,255,255,0.15)', padding: '6px 16px', borderRadius: 999, fontSize: 13 }}>
                ⭐ {recommended.length} рекомендаций для тебя
              </div>
            )}
            <div style={{ background: 'rgba(255,255,255,0.15)', padding: '6px 16px', borderRadius: 999, fontSize: 13 }}>
              ❤️ {savedIds.length} сохранено
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px' }}>

        {/* Табы */}
        <div style={{
          display: 'flex', gap: 4, marginBottom: 24,
          background: 'white', borderRadius: 16, padding: 6,
          border: '1px solid #e5e7eb', width: 'fit-content'
        }}>
          {[
            { id: 'all', label: `Все (${filtered.length})` },
            { id: 'recommended', label: `⭐ Для тебя (${recommended.length})` },
            { id: 'saved', label: `❤️ Сохранённые (${savedIds.length})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '8px 20px', borderRadius: 12, border: 'none',
                cursor: 'pointer', fontSize: 14, fontWeight: 600,
                background: activeTab === tab.id ? '#6366f1' : 'transparent',
                color: activeTab === tab.id ? 'white' : '#6b7280',
                transition: 'all 0.2s'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Блок рекомендаций — показываем только на табе "Все" */}
        {activeTab === 'all' && profile && recommended.length > 0 && (
          <div style={{
            background: 'linear-gradient(135deg, #eef2ff, #faf5ff)',
            borderRadius: 20, padding: 24, marginBottom: 24,
            border: '1px solid #c7d2fe'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 'bold', color: '#4338ca', margin: 0 }}>
                  ⭐ Рекомендуем для тебя
                </h2>
                <p style={{ color: '#6366f1', fontSize: 13, margin: '4px 0 0' }}>
                  На основе твоих интересов: {profile.interests?.join(', ')}
                </p>
              </div>
              <button
                onClick={() => setActiveTab('recommended')}
                style={{
                  background: '#6366f1', color: 'white', border: 'none',
                  padding: '8px 16px', borderRadius: 10, cursor: 'pointer',
                  fontSize: 13, fontWeight: 600
                }}
              >
                Все →
              </button>
            </div>

            <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
              {recommended.slice(0, 3).map(opp => (
                <div
                  key={opp.id}
                  onClick={() => setSelectedOpp(opp)}
                  style={{
                    background: 'white', borderRadius: 16, padding: 16,
                    minWidth: 260, cursor: 'pointer', flexShrink: 0,
                    border: '1px solid #c7d2fe',
                    boxShadow: '0 2px 8px rgba(99,102,241,0.1)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{
                      background: `${DIRECTION_COLORS[opp.direction] || '#6366f1'}20`,
                      color: DIRECTION_COLORS[opp.direction] || '#6366f1',
                      fontSize: 11, padding: '2px 8px', borderRadius: 999, fontWeight: 600
                    }}>
                      {opp.direction}
                    </span>
                    <span style={{ fontSize: 11, color: '#9ca3af' }}>
                      ⭐ {opp.score} балл
                    </span>
                  </div>
                  <h4 style={{ fontSize: 14, fontWeight: 'bold', color: '#111827', margin: '0 0 8px' }}>
                    {opp.title}
                  </h4>
                  <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 10px' }}>
                    📅 {getDaysLeft(opp.deadline)} дней осталось
                  </p>
                  <button
                    onClick={e => { e.stopPropagation(); toggleSave(opp.id) }}
                    style={{
                      background: savedIds.includes(opp.id) ? '#fef2f2' : '#eef2ff',
                      color: savedIds.includes(opp.id) ? '#ef4444' : '#6366f1',
                      border: 'none', padding: '6px 12px', borderRadius: 8,
                      cursor: 'pointer', fontSize: 12, fontWeight: 600, width: '100%'
                    }}
                  >
                    {savedIds.includes(opp.id) ? '❤️ Сохранено' : '🤍 Сохранить'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Поиск и фильтры — только на табе "Все" */}
        {activeTab === 'all' && (
          <>
            <div style={{ position: 'relative', marginBottom: 16 }}>
              <span style={{
                position: 'absolute', left: 16, top: '50%',
                transform: 'translateY(-50%)', fontSize: 18
              }}>🔍</span>
              <input
                type="text"
                placeholder="Поиск по названию, теме..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%', padding: '14px 16px 14px 48px',
                  fontSize: 15, border: '2px solid #e5e7eb',
                  borderRadius: 16, outline: 'none',
                  color: '#111827', backgroundColor: 'white',
                  boxSizing: 'border-box' as const
                }}
              />
            </div>

            <div style={{
              background: 'white', borderRadius: 20,
              border: '1px solid #e5e7eb', padding: 20, marginBottom: 24
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <h3 style={{ fontWeight: 'bold', color: '#111827', margin: 0 }}>🎛️ Фильтры</h3>
                <button onClick={resetFilters} style={{
                  background: 'none', border: 'none', color: '#ef4444',
                  cursor: 'pointer', fontSize: 13, fontWeight: 500
                }}>
                  Сбросить
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                {[
                  {
                    label: 'Категория', value: category, set: setCategory,
                    opts: ['Все', 'Олимпиада', 'Хакатон', 'Стипендия', 'Летняя школа', 'Стартап-программа', 'Конкурс', 'Волонтёрство']
                  },
                  {
                    label: 'Направление', value: direction, set: setDirection,
                    opts: ['Все', 'STEM', 'Business', 'Social', 'Programming', 'Science', 'Finance']
                  },
                  {
                    label: 'Формат', value: format, set: setFormat,
                    opts: ['Все', 'Онлайн', 'Очно', 'Гибрид']
                  },
                  {
                    label: 'Класс', value: grade, set: setGrade,
                    opts: ['Все', '8', '9', '10', '11']
                  },
                ].map(f => (
                  <div key={f.label}>
                    <label style={{ display: 'block', fontSize: 12, color: '#6b7280', fontWeight: 500, marginBottom: 6 }}>
                      {f.label}
                    </label>
                    <select
                      value={f.value}
                      onChange={e => f.set(e.target.value)}
                      style={{
                        width: '100%', padding: '8px 12px',
                        border: '2px solid #e5e7eb', borderRadius: 10,
                        fontSize: 13, color: '#111827', backgroundColor: 'white',
                        cursor: 'pointer', outline: 'none'
                      }}
                    >
                      {f.opts.map(opt => (
                        <option key={opt} value={opt} style={{ color: '#111827' }}>
                          {opt === 'Все' && f.label === 'Класс' ? 'Все классы' :
                            opt !== 'Все' && f.label === 'Класс' ? `${opt} класс` : opt}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Счётчик */}
        <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 20 }}>
          {activeTab === 'recommended' && `⭐ ${displayList.length} рекомендаций на основе твоего профиля`}
          {activeTab === 'saved' && `❤️ ${displayList.length} сохранённых возможностей`}
          {activeTab === 'all' && `Найдено: `}
          {activeTab === 'all' && <strong style={{ color: '#111827' }}>{displayList.length}</strong>}
          {activeTab === 'all' && ` возможностей`}
        </p>

        {/* Пусто */}
        {displayList.length === 0 && (
          <div style={{
            background: 'white', borderRadius: 20, padding: '60px 24px',
            textAlign: 'center', border: '1px solid #e5e7eb'
          }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>
              {activeTab === 'recommended' ? '🎯' : activeTab === 'saved' ? '❤️' : '🔍'}
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 8 }}>
              {activeTab === 'recommended' ? 'Нет рекомендаций' :
                activeTab === 'saved' ? 'Нет сохранённых' : 'Ничего не найдено'}
            </h3>
            <p style={{ color: '#6b7280', marginBottom: 20 }}>
              {activeTab === 'recommended' ? 'Заполни профиль чтобы получить рекомендации' :
                activeTab === 'saved' ? 'Нажимай ❤️ чтобы сохранять возможности' :
                  'Попробуй изменить фильтры'}
            </p>
            {activeTab === 'all' && (
              <button onClick={resetFilters} style={{
                background: '#6366f1', color: 'white', border: 'none',
                padding: '10px 24px', borderRadius: 10, cursor: 'pointer', fontWeight: 600
              }}>
                Сбросить фильтры
              </button>
            )}
          </div>
        )}

        {/* Карточки */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {displayList.map(opp => <OppCard key={opp.id} opp={opp} />)}
        </div>

      </div>
    </div>
  )
}