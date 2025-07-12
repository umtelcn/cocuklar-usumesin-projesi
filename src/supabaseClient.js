import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://aoagoenbbsdhskebhmrq.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvYWdvZW5iYnNkaHNrZWJobXJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxMDA5MzksImV4cCI6MjA2NzY3NjkzOX0.8LohSV1ZaJSTl7Luo85NZjP0PMApfQy8C82cErfCRNQ';
export const supabase = createClient(supabaseUrl, supabaseKey);