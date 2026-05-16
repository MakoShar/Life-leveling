/**
 * login.js - Authentication logic for Life-leveling
 */

const loginBtn = document.getElementById('loginBtn');
const loginForm = document.getElementById('loginForm');
const emailLoginBtn = document.getElementById('emailLoginBtn');

if (loginBtn) {
    loginBtn.addEventListener('click', async () => {
        try {
            // Set loading state
            const originalText = loginBtn.textContent;
            loginBtn.textContent = 'Initiating System...';
            loginBtn.disabled = true;
            loginBtn.style.opacity = '0.7';

            // Calculate redirect URL safely
            // We want to go to index.html in the same directory
            // On localhost, we use the base origin to match Supabase "Redirect URLs"
            // On GitHub Pages, we use the full path to index.html
            const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            const redirectUrl = isLocalhost 
                ? window.location.origin
                : window.location.href.replace('login.html', 'index.html').split('?')[0].split('#')[0];

            console.log('Redirecting to:', redirectUrl);

            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: redirectUrl
                }
            });

            if (error) throw error;
        } catch (error) {
            console.error('Login Error:', error);
            alert('Login failed: ' + error.message);
            
            // Reset button
            loginBtn.textContent = 'Sign in with Google';
            loginBtn.disabled = false;
            loginBtn.style.opacity = '1';
        }
    });
}

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        if (!email || !password) return;

        try {
            const originalText = emailLoginBtn.textContent;
            emailLoginBtn.textContent = 'Authenticating...';
            emailLoginBtn.disabled = true;
            emailLoginBtn.style.opacity = '0.7';

            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) throw error;
            
            // On success, the onAuthStateChange listener will redirect
        } catch (error) {
            console.error('Email Login Error:', error);
            alert('Login failed: ' + error.message);
            
            emailLoginBtn.textContent = 'Enter System';
            emailLoginBtn.disabled = false;
            emailLoginBtn.style.opacity = '1';
        }
    });
}

// Redirect if already logged in or upon successful redirect back
supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth State Change:', event);
    if (session) {
        window.location.href = 'index.html';
    }
});

// Initial session check
(async function checkSession() {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (session) {
            console.log('Session detected, redirecting...');
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.error('Session check failed:', error);
    }
})();
