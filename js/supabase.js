// Initialize Supabase Client
const supabaseUrl = 'https://ctqipvidofyxmuzbgwel.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0cWlwdmlkb2Z5eG11emJnd2VsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5MzQzNTksImV4cCI6MjA4NzUxMDM1OX0.wnXAZetcDfTYZ6_fUyM683BW-jqQSHx3kJKru_En-PI';

// Supabase is loaded from CDN in index.html
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

// Global State
const AppState = {
    user: null, // { nim, nama, matkul_dipilih }
    tasks: [],
    courses: [], // Will hold logic for courses
    currentFilter: 'all' // all, Mandiri, Kelompok, Global
};
