// ==========================================
// UTILITY & ENCRYPTION FUNCTIONS
// ==========================================
const encrypt = (text) => btoa(text);
const decrypt = (hash) => atob(hash);

const toggleTheme = () => {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
};

// ==========================================
// PAGE ROUTING & INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
    }

    if (document.querySelector('.login-container')) initLogin();
    if (document.querySelector('.dashboard-container')) {
        if (sessionStorage.getItem('isAuthenticated') !== 'true') {
            window.location.href = 'index.html';
        } else {
            initDashboard();
        }
    }
});

// ==========================================
// LOGIN & RECOVERY LOGIC
// ==========================================
function initLogin() {
    // Sections
    const setupSection = document.getElementById('setup-section');
    const loginSection = document.getElementById('login-section');
    const recoverySection = document.getElementById('recovery-section');
    
    // Check if vault is already set up
    const hasMaster = localStorage.getItem('masterPassword');
    
    if (!hasMaster) {
        setupSection.classList.remove('hidden');
    } else {
        loginSection.classList.remove('hidden');
    }

    // --- SETUP FLOW ---
    document.getElementById('setup-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const pwd = document.getElementById('new-master').value;
        const question = document.getElementById('sec-question').value;
        const answer = document.getElementById('sec-answer').value.toLowerCase().trim(); // Convert to lowercase for easier matching later

        localStorage.setItem('masterPassword', encrypt(pwd));
        localStorage.setItem('secQuestion', question);
        localStorage.setItem('secAnswer', encrypt(answer)); // Encrypt the answer too!
        
        sessionStorage.setItem('isAuthenticated', 'true');
        window.location.href = 'dashboard.html';
    });

    // --- NORMAL LOGIN FLOW ---
    document.getElementById('login-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const pwd = document.getElementById('master-password').value;

        if (encrypt(pwd) === localStorage.getItem('masterPassword')) {
            sessionStorage.setItem('isAuthenticated', 'true');
            window.location.href = 'dashboard.html';
        } else {
            alert("Incorrect Master Password! Access Denied.");
        }
    });

    // Toggle Eye Icon
    const toggleMasterBtn = document.getElementById('toggle-master');
    const masterInput = document.getElementById('master-password');
    if (toggleMasterBtn) {
        toggleMasterBtn.addEventListener('click', () => {
            if (masterInput.type === 'password') {
                masterInput.type = 'text';
                toggleMasterBtn.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';
            } else {
                masterInput.type = 'password';
                toggleMasterBtn.innerHTML = '<i class="fa-solid fa-eye"></i>';
            }
        });
    }

    // --- RECOVERY FLOW ---
    document.getElementById('show-recovery-btn')?.addEventListener('click', () => {
        loginSection.classList.add('hidden');
        recoverySection.classList.remove('hidden');
        document.getElementById('display-question').innerText = localStorage.getItem('secQuestion') || "No security question set.";
    });

    document.getElementById('back-to-login-btn')?.addEventListener('click', () => {
        recoverySection.classList.add('hidden');
        loginSection.classList.remove('hidden');
    });

    document.getElementById('recovery-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const givenAnswer = document.getElementById('recovery-answer').value.toLowerCase().trim();
        const newPassword = document.getElementById('reset-password').value;
        const storedAnswer = localStorage.getItem('secAnswer');

        if (encrypt(givenAnswer) === storedAnswer) {
            alert("Security answer correct! Password has been reset.");
            localStorage.setItem('masterPassword', encrypt(newPassword));
            
            // Go back to login screen
            document.getElementById('recovery-form').reset();
            recoverySection.classList.add('hidden');
            loginSection.classList.remove('hidden');
        } else {
            alert("Incorrect security answer.");
        }
    });
}

// ==========================================
// DASHBOARD LOGIC (Unchanged, kept complete for copy-pasting)
// ==========================================
function initDashboard() {
    let passwords = JSON.parse(localStorage.getItem('passwords')) || [];
    
    const form = document.getElementById('password-form');
    const grid = document.getElementById('passwords-grid');
    const searchInput = document.getElementById('search-input');
    const logoutBtn = document.getElementById('logout-btn');
    const themeBtn = document.getElementById('theme-toggle');
    const passInput = document.getElementById('site-password');
    const strengthBar = document.getElementById('strength-bar');

    const render = (filterText = '') => {
        grid.innerHTML = '';
        const filtered = passwords.filter(p => p.site.toLowerCase().includes(filterText.toLowerCase()));
        
        filtered.forEach(p => {
            const decPass = decrypt(p.password);
            const card = document.createElement('div');
            card.className = 'password-card';
            card.innerHTML = `
                <div class="card-header">
                    <h4>${p.site}</h4>
                    <div class="card-actions">
                        <button class="icon-btn copy-btn" data-pass="${decPass}" title="Copy"><i class="fa-solid fa-copy"></i></button>
                        <button class="icon-btn edit-btn" data-id="${p.id}" title="Edit"><i class="fa-solid fa-pen"></i></button>
                        <button class="icon-btn delete-btn" data-id="${p.id}" title="Delete"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>
                <p class="small-text"><i class="fa-solid fa-user"></i> ${p.username}</p>
                <p class="hidden-pass">••••••••</p>
                <button class="icon-btn show-pass-btn small-text" data-pass="${decPass}">Show</button>
            `;
            grid.appendChild(card);
        });
        attachCardEvents();
    };

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const site = document.getElementById('site-name').value;
        const username = document.getElementById('username').value;
        const password = encrypt(document.getElementById('site-password').value);
        const editId = document.getElementById('edit-id').value;

        if (editId) {
            const index = passwords.findIndex(p => p.id == editId);
            passwords[index] = { id: editId, site, username, password };
            document.getElementById('edit-id').value = ''; 
        } else {
            passwords.push({ id: Date.now(), site, username, password });
        }

        localStorage.setItem('passwords', JSON.stringify(passwords));
        form.reset();
        strengthBar.style.width = '0%'; 
        render();
    });

    passInput.addEventListener('input', (e) => {
        const val = e.target.value;
        let strength = 0;
        if(val.length > 5) strength += 33;
        if(val.match(/[A-Z]/) && val.match(/[0-9]/)) strength += 33;
        if(val.match(/[^A-Za-z0-9]/)) strength += 34;
        strengthBar.style.width = `${strength}%`;
        strengthBar.style.backgroundColor = strength < 50 ? 'red' : strength < 80 ? 'orange' : 'green';
    });

    const addPassToggle = document.querySelector('.toggle-password');
    if (addPassToggle) {
        addPassToggle.addEventListener('click', (e) => {
            e.preventDefault();
            passInput.type = passInput.type === 'password' ? 'text' : 'password';
            addPassToggle.innerHTML = passInput.type === 'password' ? '<i class="fa-solid fa-eye"></i>' : '<i class="fa-solid fa-eye-slash"></i>';
        });
    }

    searchInput.addEventListener('input', (e) => render(e.target.value));

    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault(); 
            sessionStorage.removeItem('isAuthenticated'); 
            window.location.href = 'index.html'; 
        });
    }

    if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

    function attachCardEvents() {
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if(confirm("Are you sure you want to delete this password?")) {
                    passwords = passwords.filter(p => p.id != e.currentTarget.getAttribute('data-id'));
                    localStorage.setItem('passwords', JSON.stringify(passwords));
                    render();
                }
            });
        });

        document.querySelectorAll('.copy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                navigator.clipboard.writeText(e.currentTarget.getAttribute('data-pass'));
                alert("Password copied to clipboard!");
            });
        });

        document.querySelectorAll('.show-pass-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const passElement = e.currentTarget.previousElementSibling;
                if(passElement.innerText === '••••••••') {
                    passElement.innerText = e.currentTarget.getAttribute('data-pass');
                    e.currentTarget.innerText = 'Hide';
                } else {
                    passElement.innerText = '••••••••';
                    e.currentTarget.innerText = 'Show';
                }
            });
        });

        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = passwords.find(p => p.id == e.currentTarget.getAttribute('data-id'));
                document.getElementById('edit-id').value = target.id;
                document.getElementById('site-name').value = target.site;
                document.getElementById('username').value = target.username;
                document.getElementById('site-password').value = decrypt(target.password);
            });
        });
    }

    render();
}