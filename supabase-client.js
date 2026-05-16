const SUPABASE_URL = 'https://yiknrcgqpdlyklskpveg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlpa25yY2dxcGRseWtsc2twdmVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NzQxOTEsImV4cCI6MjA5NDQ1MDE5MX0.EKsDfV6BG45X0Ni5T4EAzVpwv9jcEdeXbN0d_ZBrzl4';

function getAppUrl(page = 'index.html') {
    const url = new URL(page, window.location.href);
    url.search = '';
    url.hash = '';
    return url.href;
}

function goToAppPage(page = 'index.html') {
    window.location.href = getAppUrl(page);
}

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
    }
});

window.getAppUrl = getAppUrl;
window.goToAppPage = goToAppPage;
window.supabaseClient = supabaseClient;
