import { supabase } from './supabase'

interface ProfileData {
  full_name: string
  grade: number
  interests: string[]
  goals: string[]
}

export async function upsertProfile(userId: string, data: ProfileData) {
  const { error } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      full_name: data.full_name,
      grade: data.grade,
      interests: data.interests,
      goals: data.goals,
    }, {
      returning: 'minimal'
    })

  if (error) {
    console.error('Ошибка сохранения профиля:', error)
    throw error
  }
}

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Ошибка получения профиля:', error)
    return null
  }

  return data
}