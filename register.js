/**
 * register.js - Registration logic for Life-leveling
 */

const registerForm = document.getElementById('registerForm');
const registerBtn = document.getElementById('registerBtn');

if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (!name || !email || !password || !confirmPassword) return;
        
        if (password !== confirmPassword) {
            alert('Passwords do not match. Please try again.');
            return;
        }

        try {
            registerBtn.textContent = 'Registering...';
            registerBtn.disabled = true;
            registerBtn.style.opacity = '0.7';

            // Calculate redirect URL safely
            const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            const redirectUrl = isLocalhost 
                ? window.location.origin
                : window.location.href.replace('register.html', 'index.html').split('?')[0].split('#')[0];

            const { data, error } = await supabaseClient.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        full_name: name,
                    },
                    emailRedirectTo: redirectUrl
                }
            });

            if (error) throw error;
            
            if (data?.session) {
                // Auto-login successful
                window.location.href = 'index.html';
            } else {
                // Email confirmation required
                alert('Registration successful! Please check your email to verify your account before signing in.');
                window.location.href = 'login.html';
            }
            
        } catch (error) {
            console.error('Registration Error:', error);
            alert('Registration failed: ' + error.message);
            
            registerBtn.textContent = 'Register';
            registerBtn.disabled = false;
            registerBtn.style.opacity = '1';
        }
    });
}

// Redirect if already logged in
supabaseClient.auth.onAuthStateChange((event, session) => {
    if (session) {
        window.location.href = 'index.html';
    }
});

// Initial session check
(async function checkSession() {
    try {
        const { data: { session }, error } = await supabaseClient.auth.getSession();
        if (error) throw error;
        if (session) {
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.error('Session check failed:', error);
    }
})();
