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

            const redirectUrl = getAppUrl('index.html');

            console.log('Redirecting to:', redirectUrl);

            const { error } = await supabaseClient.auth.signInWithOAuth({
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

            const { data, error } = await supabaseClient.auth.signInWithPassword({
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
supabaseClient.auth.onAuthStateChange((event, session) => {
    console.log('Auth State Change:', event);
    if (session) {
        goToAppPage('index.html');
    }
});

// Initial session check
(async function checkSession() {
    try {
        const { data: { session }, error } = await supabaseClient.auth.getSession();
        if (error) throw error;
        if (session) {
            console.log('Session detected, redirecting...');
            goToAppPage('index.html');
        }
    } catch (error) {
        console.error('Session check failed:', error);
    }
})();
