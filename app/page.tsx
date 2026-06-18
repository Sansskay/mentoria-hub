'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function HomePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUser(session.user)
      }
    }
    checkUser()
  }, [])

  return (
    <div style={{ minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>

      {/* ===== NAVBAR ===== */}
      <nav style={{
        background: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 64,
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        {/* Логотип */}
        <div
          onClick={() => router.push('/')}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 'bold', fontSize: 16
          }}>M</div>
          <span style={{ fontWeight: 'bold', fontSize: 18, color: '#111827' }}>
            Mentoria Hub
          </span>
        </div>

        {/* Навигация */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => router.push('/opportunities')}
            style={{
              padding: '8px 16px', borderRadius: 8, border: 'none',
              background: 'none', cursor: 'pointer', color: '#374151',
              fontSize: 14, fontWeight: 500
            }}
          >
            Возможности
          </button>
          <button
            onClick={() => router.push('/courses')}
            style={{
              padding: '8px 16px', borderRadius: 8, border: 'none',
              background: 'none', cursor: 'pointer', color: '#374151',
              fontSize: 14, fontWeight: 500
            }}
          >
            Курсы
          </button>

          {user ? (
            <button
              onClick={() => router.push('/dashboard')}
              style={{
                padding: '8px 20px', borderRadius: 10,
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: 'white', border: 'none', cursor: 'pointer',
                fontWeight: 'bold', fontSize: 14
              }}
            >
              Мой кабинет →
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => router.push('/auth/login')}
                style={{
                  padding: '8px 20px', borderRadius: 10,
                  background: 'white', color: '#6366f1',
                  border: '2px solid #6366f1', cursor: 'pointer',
                  fontWeight: 'bold', fontSize: 14
                }}
              >
                Войти
              </button>
              <button
                onClick={() => router.push('/auth/register')}
                style={{
                  padding: '8px 20px', borderRadius: 10,
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: 'white', border: 'none', cursor: 'pointer',
                  fontWeight: 'bold', fontSize: 14
                }}
              >
                Регистрация
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section style={{
        background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #9333ea 100%)',
        padding: '80px 24px',
        textAlign: 'center',
        color: 'white'
      }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <div style={{
            display: 'inline-block',
            background: 'rgba(255,255,255,0.15)',
            padding: '6px 16px', borderRadius: 999,
            fontSize: 14, marginBottom: 24
          }}>
            🎓 Платформа для учеников 8–11 классов
          </div>

          <h1 style={{
            fontSize: 48, fontWeight: 'bold',
            lineHeight: 1.2, marginBottom: 20
          }}>
            Найди свою возможность.{' '}
            <span style={{ color: '#fbbf24' }}>Учись в своём темпе.</span>
          </h1>

          <p style={{
            fontSize: 18, color: 'rgba(255,255,255,0.85)',
            marginBottom: 36, lineHeight: 1.6
          }}>
            Mentoria Hub — одна платформа для поиска олимпиад, стипендий,
            хакатонов и асинхронных курсов от менторов Mentoria
          </p>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => router.push('/opportunities')}
              style={{
                padding: '14px 32px', borderRadius: 12,
                background: 'white', color: '#6366f1',
                border: 'none', cursor: 'pointer',
                fontWeight: 'bold', fontSize: 16,
                boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
              }}
            >
              🎯 Найти возможности
            </button>
            <button
              onClick={() => router.push('/courses')}
              style={{
                padding: '14px 32px', borderRadius: 12,
                background: 'rgba(255,255,255,0.15)',
                color: 'white',
                border: '2px solid rgba(255,255,255,0.4)',
                cursor: 'pointer',
                fontWeight: 'bold', fontSize: 16
              }}
            >
              📚 Начать обучение
            </button>
            {!user && (
              <button
                onClick={() => router.push('/auth/register')}
                style={{
                  padding: '14px 32px', borderRadius: 12,
                  background: '#fbbf24', color: '#111827',
                  border: 'none', cursor: 'pointer',
                  fontWeight: 'bold', fontSize: 16
                }}
              >
                🚀 Присоединиться
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ===== СТАТИСТИКА ===== */}
      <section style={{
        background: 'white',
        padding: '40px 24px',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <div style={{
          maxWidth: 900, margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 24, textAlign: 'center'
        }}>
          {[
            { number: '200+', label: 'Возможностей', emoji: '🎯' },
            { number: '10+', label: 'Курсов', emoji: '📚' },
            { number: '5', label: 'Стран', emoji: '🌍' },
            { number: '8–11', label: 'Классы', emoji: '🎓' },
          ].map(stat => (
            <div key={stat.label}>
              <div style={{ fontSize: 32, marginBottom: 4 }}>{stat.emoji}</div>
              <div style={{
                fontSize: 32, fontWeight: 'bold',
                color: '#6366f1', marginBottom: 4
              }}>
                {stat.number}
              </div>
              <div style={{ color: '#6b7280', fontSize: 14 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== КАК РАБОТАЕТ ===== */}
      <section style={{
        background: '#f9fafb', padding: '64px 24px'
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{
            textAlign: 'center', fontSize: 32,
            fontWeight: 'bold', color: '#111827', marginBottom: 48
          }}>
            Как это работает?
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 32
          }}>
            {[
              {
                step: '1',
                emoji: '👤',
                title: 'Создай профиль',
                desc: 'Укажи класс, интересы и цели. Займёт 2 минуты'
              },
              {
                step: '2',
                emoji: '💡',
                title: 'Получи рекомендации',
                desc: 'Платформа подберёт курсы и возможности именно для тебя'
              },
              {
                step: '3',
                emoji: '🚀',
                title: 'Учись и подавай заявки',
                desc: 'Проходи курсы и участвуй в олимпиадах в удобное время'
              },
            ].map(item => (
              <div key={item.step} style={{
                background: 'white', borderRadius: 20,
                padding: 32, textAlign: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{
                  width: 56, height: 56,
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px',
                  color: 'white', fontWeight: 'bold', fontSize: 20
                }}>
                  {item.step}
                </div>
                <div style={{ fontSize: 40, marginBottom: 16 }}>{item.emoji}</div>
                <h3 style={{
                  fontSize: 18, fontWeight: 'bold',
                  color: '#111827', marginBottom: 8
                }}>
                  {item.title}
                </h3>
                <p style={{ color: '#6b7280', lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== ВОЗМОЖНОСТИ ПРЕВЬЮ ===== */}
      <section style={{ background: 'white', padding: '64px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: 32
          }}>
            <h2 style={{
              fontSize: 28, fontWeight: 'bold', color: '#111827'
            }}>
              🎯 Популярные возможности
            </h2>
            <button
              onClick={() => router.push('/opportunities')}
              style={{
                padding: '8px 20px', borderRadius: 10,
                background: '#eef2ff', color: '#6366f1',
                border: 'none', cursor: 'pointer',
                fontWeight: 600, fontSize: 14
              }}
            >
              Все возможности →
            </button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 20
          }}>
            {[
              {
                title: 'NIS Олимпиада по математике',
                category: 'Олимпиада',
                direction: 'STEM',
                deadline: '15 июля',
                days: 28,
                color: '#3b82f6'
              },
              {
                title: 'MIT Launch Startup Program',
                category: 'Стартап',
                direction: 'Business',
                deadline: '1 августа',
                days: 45,
                color: '#22c55e'
              },
              {
                title: 'FLEX программа обмена в США',
                category: 'Стипендия',
                direction: 'Social',
                deadline: '1 октября',
                days: 75,
                color: '#a855f7'
              },
            ].map(opp => (
              <div
                key={opp.title}
                onClick={() => router.push('/opportunities')}
                style={{
                  background: 'white', borderRadius: 16,
                  border: '1px solid #e5e7eb',
                  overflow: 'hidden', cursor: 'pointer',
                  transition: 'box-shadow 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
                }}
              >
                <div style={{ height: 6, background: opp.color }} />
                <div style={{ padding: 20 }}>
                  <div style={{
                    display: 'inline-block',
                    background: `${opp.color}15`,
                    color: opp.color,
                    padding: '3px 10px', borderRadius: 999,
                    fontSize: 12, fontWeight: 600, marginBottom: 10
                  }}>
                    {opp.direction}
                  </div>
                  <h3 style={{
                    fontSize: 15, fontWeight: 'bold',
                    color: '#111827', marginBottom: 12, lineHeight: 1.4
                  }}>
                    {opp.title}
                  </h3>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{
                      fontSize: 12, color: '#6b7280',
                      background: '#f3f4f6',
                      padding: '3px 10px', borderRadius: 999
                    }}>
                      {opp.category}
                    </span>
                    <span style={{
                      fontSize: 12, fontWeight: 600,
                      color: opp.days < 30 ? '#ef4444' : '#22c55e'
                    }}>
                      📅 {opp.days} дней
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== КУРСЫ ПРЕВЬЮ ===== */}
      <section style={{ background: '#f9fafb', padding: '64px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: 32
          }}>
            <h2 style={{ fontSize: 28, fontWeight: 'bold', color: '#111827' }}>
              📚 Курсы Mentoria
            </h2>
            <button
              onClick={() => router.push('/courses')}
              style={{
                padding: '8px 20px', borderRadius: 10,
                background: '#eef2ff', color: '#6366f1',
                border: 'none', cursor: 'pointer',
                fontWeight: 600, fontSize: 14
              }}
            >
              Все курсы →
            </button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 20
          }}>
            {[
              {
                emoji: '🇬🇧',
                title: 'Английский для академического успеха',
                level: 'Средний',
                lessons: 4,
                hours: 20,
                color: 'linear-gradient(135deg, #3b82f6, #06b6d4)'
              },
              {
                emoji: '🔢',
                title: 'Математика для олимпиад',
                level: 'Продвинутый',
                lessons: 3,
                hours: 25,
                color: 'linear-gradient(135deg, #8b5cf6, #6366f1)'
              },
              {
                emoji: '🎓',
                title: 'Основы поступления в университет',
                level: 'Начинающий',
                lessons: 3,
                hours: 15,
                color: 'linear-gradient(135deg, #22c55e, #10b981)'
              },
            ].map(course => (
              <div
                key={course.title}
                onClick={() => router.push('/courses')}
                style={{
                  background: 'white', borderRadius: 16,
                  border: '1px solid #e5e7eb',
                  overflow: 'hidden', cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
                }}
              >
                <div style={{
                  background: course.color,
                  padding: 24
                }}>
                  <div style={{ fontSize: 40, marginBottom: 8 }}>{course.emoji}</div>
                  <h3 style={{
                    color: 'white', fontWeight: 'bold',
                    fontSize: 15, lineHeight: 1.4
                  }}>
                    {course.title}
                  </h3>
                </div>
                <div style={{ padding: 16 }}>
                  <div style={{
                    display: 'flex', gap: 8, flexWrap: 'wrap'
                  }}>
                    <span style={{
                      background: '#f3f4f6', color: '#374151',
                      padding: '3px 10px', borderRadius: 999, fontSize: 12
                    }}>
                      {course.level}
                    </span>
                    <span style={{
                      background: '#f3f4f6', color: '#374151',
                      padding: '3px 10px', borderRadius: 999, fontSize: 12
                    }}>
                      {course.lessons} урока
                    </span>
                    <span style={{
                      background: '#f3f4f6', color: '#374151',
                      padding: '3px 10px', borderRadius: 999, fontSize: 12
                    }}>
                      ⏱ {course.hours}ч
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section style={{
        background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
        padding: '64px 24px', textAlign: 'center'
      }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{
            fontSize: 36, fontWeight: 'bold',
            color: 'white', marginBottom: 16
          }}>
            Готов начать? 🚀
          </h2>
          <p style={{
            color: 'rgba(255,255,255,0.8)',
            fontSize: 18, marginBottom: 32
          }}>
            Присоединяйся к тысячам учеников которые уже развиваются с Mentoria
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
            <button
              onClick={() => router.push('/auth/register')}
              style={{
                padding: '14px 36px', borderRadius: 12,
                background: 'white', color: '#6366f1',
                border: 'none', cursor: 'pointer',
                fontWeight: 'bold', fontSize: 16
              }}
            >
              Создать аккаунт бесплатно →
            </button>
            <button
              onClick={() => router.push('/opportunities')}
              style={{
                padding: '14px 36px', borderRadius: 12,
                background: 'rgba(255,255,255,0.15)',
                color: 'white',
                border: '2px solid rgba(255,255,255,0.4)',
                cursor: 'pointer',
                fontWeight: 'bold', fontSize: 16
              }}
            >
              Смотреть возможности
            </button>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer style={{
        background: '#111827', padding: '32px 24px',
        textAlign: 'center'
      }}>
        <div style={{
          fontWeight: 'bold', fontSize: 18,
          color: 'white', marginBottom: 8
        }}>
          Mentoria Hub
        </div>
        <p style={{ color: '#9ca3af', fontSize: 14, marginBottom: 16 }}>
          Образование без барьеров для учеников 8–11 классов
        </p>
        <div style={{ display: 'flex', gap: 24, justifyContent: 'center' }}>
          <button
            onClick={() => router.push('/opportunities')}
            style={{
              background: 'none', border: 'none',
              color: '#9ca3af', cursor: 'pointer', fontSize: 14
            }}
          >
            Возможности
          </button>
          <button
            onClick={() => router.push('/courses')}
            style={{
              background: 'none', border: 'none',
              color: '#9ca3af', cursor: 'pointer', fontSize: 14
            }}
          >
            Курсы
          </button>
          <button
            onClick={() => router.push('/auth/register')}
            style={{
              background: 'none', border: 'none',
              color: '#9ca3af', cursor: 'pointer', fontSize: 14
            }}
          >
            Регистрация
          </button>
        </div>
        <p style={{ color: '#4b5563', fontSize: 12, marginTop: 24 }}>
          © 2025 Mentoria Hub. Все права защищены.
        </p>
      </footer>

    </div>
  )
}