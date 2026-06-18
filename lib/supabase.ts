import { createClient } from '@supabase/supabase-js';

// Вставляй свои данные прямо сюда между кавычек ''
const supabaseUrl = 'https://rwakgrpcxhyeybabpzti.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3YWtncnBjeGh5ZXliYWJwenRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1NDQ5OTEsImV4cCI6MjA5NzEyMDk5MX0.xNbBVsDTj0EGV35Y6ZZHonvY6QgT-HHqBq7E71XfbwE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);