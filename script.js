// ==========================================
// PWA SERVICE WORKER REGISTRATION
// ==========================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Removed the './' to make the path direct
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('Service Worker registered successfully.'))
            .catch(err => console.error('Service Worker registration failed:', err));
    });
}
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
// LOGIN, RECOVERY, & BIOMETRIC LOGIC
// ==========================================
function initLogin() {
    const setupSection = document.getElementById('setup-section');
    const loginSection = document.getElementById('login-section');
    const recoverySection = document.getElementById('recovery-section');
    
    const biometricLoginBtn = document.getElementById('biometric-login-btn');
    const enableBiometricsCheckbox = document.getElementById('enable-biometrics');
    
    const hasMaster = localStorage.getItem('masterPassword');
    const biometricsEnabled = localStorage.getItem('biometricsEnabled') === 'true';
    
    if (!hasMaster) {
        setupSection.classList.remove('hidden');
    } else {
        loginSection.classList.remove('hidden');
        if (biometricsEnabled && window.PublicKeyCredential) {
            biometricLoginBtn.classList.remove('hidden');
        }
    }

    document.getElementById('setup-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const pwd = document.getElementById('new-master').value;
        const question = document.getElementById('sec-question').value;
        const answer = document.getElementById('sec-answer').value.toLowerCase().trim();

        if (enableBiometricsCheckbox.checked) {
            if (window.PublicKeyCredential) {
                try {
                    const publicKeyCredentialCreationOptions = {
                        challenge: Uint8Array.from("randomStringFromServer", c => c.charCodeAt(0)),
                        rp: { name: "Master Vault", id: window.location.hostname },
                        user: {
                            id: Uint8Array.from("USER_ID", c => c.charCodeAt(0)),
                            name: "user@mastervault",
                            displayName: "Master Vault User"
                        },
                        pubKeyCredParams: [{alg: -7, type: "public-key"}],
                        authenticatorSelection: { authenticatorAttachment: "platform" },
                        timeout: 60000
                    };
                    await navigator.credentials.create({ publicKey: publicKeyCredentialCreationOptions });
                    localStorage.setItem('biometricsEnabled', 'true');
                } catch (err) {
                    alert("Biometric setup cancelled or failed. Proceeding with password only.");
                    localStorage.setItem('biometricsEnabled', 'false');
                }
            } else {
                alert("Your device or browser does not support biometric login.");
                localStorage.setItem('biometricsEnabled', 'false');
            }
        }

        localStorage.setItem('masterPassword', encrypt(pwd));
        localStorage.setItem('secQuestion', question);
        localStorage.setItem('secAnswer', encrypt(answer));
        
        sessionStorage.setItem('isAuthenticated', 'true');
        window.location.href = 'dashboard.html';
    });

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

    if (biometricLoginBtn) {
        biometricLoginBtn.addEventListener('click', async () => {
            try {
                const publicKeyCredentialRequestOptions = {
                    challenge: Uint8Array.from("randomStringFromServer", c => c.charCodeAt(0)),
                    timeout: 60000,
                    rpId: window.location.hostname
                };
                
                const assertion = await navigator.credentials.get({ publicKey: publicKeyCredentialRequestOptions });
                
                if (assertion) {
                    sessionStorage.setItem('isAuthenticated', 'true');
                    window.location.href = 'dashboard.html';
                }
            } catch (err) {
                alert("Biometric verification failed. Please use your Master Password.");
                console.error(err);
            }
        });
    }

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
            
            document.getElementById('recovery-form').reset();
            recoverySection.classList.add('hidden');
            loginSection.classList.remove('hidden');
        } else {
            alert("Incorrect security answer.");
        }
    });
}

// ==========================================
// DASHBOARD LOGIC (With 4 Pro Features)
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

    // FEATURE 1: Auto-Logout on Inactivity (3 Minutes)
    let inactivityTimer;
    const resetInactivityTimer = () => {
        clearTimeout(inactivityTimer);
        inactivityTimer = setTimeout(() => {
            sessionStorage.removeItem('isAuthenticated');
            alert("Vault automatically locked due to inactivity for your security.");
            window.location.href = 'index.html';
        }, 3 * 60 * 1000); 
    };
    ['mousemove', 'keydown', 'scroll', 'click'].forEach(evt => 
        document.addEventListener(evt, resetInactivityTimer)
    );
    resetInactivityTimer();

    // FEATURE 2: Export Vault Data
    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            const dataStr = localStorage.getItem('passwords') || "[]";
            const blob = new Blob([dataStr], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = "MasterVault_Encrypted_Backup.json";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    }

    // FEATURE 3: Secure Password Generator
    const generateBtn = document.getElementById('generate-btn');
    if (generateBtn) {
        generateBtn.addEventListener('click', () => {
            const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+";
            let randomPass = "";
            for (let i = 0; i < 16; i++) {
                randomPass += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            passInput.value = randomPass;
            passInput.type = 'text'; 
            document.querySelector('.toggle-password').innerHTML = '<i class="fa-solid fa-eye-slash"></i>';
            passInput.dispatchEvent(new Event('input')); 
        });
    }

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

        // FEATURE 4: Duplicate Password Warning
        const isDuplicate = passwords.some(p => p.password === password && p.id != editId);
        if (isDuplicate) {
            const proceed = confirm("⚠️ Security Warning: You have already used this exact password for another website. Reusing passwords makes your accounts vulnerable. Do you still want to save it?");
            if (!proceed) return; 
        }

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
        passInput.type = 'password'; 
        document.querySelector('.toggle-password').innerHTML = '<i class="fa-solid fa-eye"></i>';
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
                passInput.dispatchEvent(new Event('input')); 
            });
        });
    }

    render();
}
