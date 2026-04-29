const BASE_URL = "https://easysnippet.onrender.com";
document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // GLOBAL VARIABLES
    // ==========================================
    let currentView = 'all'; 
    let isEditing = false; 
    let editingId = null;  
    let allSnippets = []; // <--- We store all data here now!

    // ==========================================
    // 1. AUTHENTICATION (Login / Signup)
    // ==========================================
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const showSignup = document.getElementById('showSignup');
    const showLogin = document.getElementById('showLogin');

    if (loginForm && signupForm) {
        // ... (Keep existing login logic mostly same, just ensuring variables exist)
        const visualTitle = document.getElementById('visual-title');
        const visualDesc = document.getElementById('visual-desc');

        if (showSignup) {
            showSignup.addEventListener('click', (e) => {
                e.preventDefault();
                loginForm.classList.remove('active');
                signupForm.classList.add('active');
                if (visualTitle) {
                    visualTitle.textContent = "Join the Community";
                    visualDesc.textContent = "Create your free account.";
                }
            });
        }

        if (showLogin) {
            showLogin.addEventListener('click', (e) => {
                e.preventDefault();
                signupForm.classList.remove('active');
                loginForm.classList.add('active');
                if (visualTitle) {
                    visualTitle.textContent = "Welcome back!";
                    visualDesc.textContent = "Access your personal code vault.";
                }
            });
        }

        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('signup-name').value;
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;

            try {
                const response = await fetch('${BASE_URL}/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password })
                });
                const data = await response.json();
                if (data.success) {
                    alert("Account Created! Please Log In.");
                    if(showLogin) showLogin.click(); 
                } else {
                    alert("Error: " + data.message);
                }
            } catch (error) { console.error(error); }
        });

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            try {
                const response = await fetch('${BASE_URL}/login-user', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const data = await response.json();
                if (data.success) {
                    localStorage.setItem('user', JSON.stringify(data.user));
                    window.location.href = "dashboard.html";
                } else {
                    alert("Login Failed: " + data.message);
                }
            } catch (error) { console.error(error); }
        });
    }

    // ==========================================
    // 2. SIDEBAR NAVIGATION
    // ==========================================
    const menuItems = document.querySelectorAll('.menu-item');
    if (menuItems.length > 0) {
        menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                menuItems.forEach(i => i.classList.remove('active'));
                item.classList.add('active');

                const rawText = item.innerText; 
                let titleText = "All Snippets";

                if (rawText.includes('All Snippets')) { currentView = 'all'; titleText = "All Snippets"; }
                else if (rawText.includes('Favorites')) { currentView = 'favorites'; titleText = "Favorites"; }
                else if (rawText.includes('Trash')) { currentView = 'trash'; titleText = "Trash"; }
                else if (rawText.includes('Tags')) { currentView = 'tags'; titleText = "Browse Tags"; }

                const pageTitle = document.querySelector('.page-title');
                if (pageTitle) pageTitle.innerText = titleText;
                loadSnippets();
            });
        });
    }

    // ==========================================
    // 3. LOAD SNIPPETS (Updated Logic)
    // ==========================================
    async function loadSnippets() {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) return;

        const snippetsGrid = document.querySelector('.snippets-grid');
        if (!snippetsGrid) return; 

        try {
            const response = await fetch(`${BASE_URL}/get-snippets/${user.id}`);
            const data = await response.json();

            if (data.success) {
                // 👇 THIS IS THE MISSING MAGIC LINE! 👇
                snippetsGrid.innerHTML = ""; 
                // 👆 It wipes the slate clean before drawing new cards.
                
                allSnippets = data.snippets; 
                let snippetsToShow = [];

                // ... (The rest of your filter logic) ...
                if (currentView === 'all') snippetsToShow = allSnippets.filter(s => s.is_deleted == 0);
                else if (currentView === 'favorites') snippetsToShow = allSnippets.filter(s => s.is_favorite == 1 && s.is_deleted == 0);
                else if (currentView === 'trash') snippetsToShow = allSnippets.filter(s => s.is_deleted == 1);
                else if (currentView === 'tags') {
                    const allTags = new Set();
                    allSnippets.forEach(s => {
                        if (s.is_deleted == 0 && s.tags) {
                            s.tags.split(/,| /).forEach(t => {
                                if(t.trim()) allTags.add(t.trim().replace(/^#/, ''));
                            });
                        }
                    });

                    if (allTags.size === 0) {
                        snippetsGrid.innerHTML = "<p style='grid-column: 1/-1; text-align: center;'>No tags found yet.</p>";
                        return;
                    }

                    const cloud = document.createElement('div');
                    cloud.style.gridColumn = "1 / -1";
                    cloud.style.display = "flex";
                    cloud.style.gap = "15px";
                    cloud.style.flexWrap = "wrap";
                    cloud.style.justifyContent = "center";
                    cloud.style.padding = "20px";

                    allTags.forEach(tag => {
                        const btn = document.createElement('button');
                        btn.innerText = "#" + tag;
                        
                        // --- RESTORING THE STYLES HERE ---
                        btn.style.padding = "10px 20px";
                        btn.style.border = "1px solid #e0e0e0";
                        btn.style.borderRadius = "20px";
                        btn.style.background = "white";
                        btn.style.fontSize = "14px";
                        btn.style.cursor = "pointer";
                        btn.style.color = "#555";
                        btn.style.transition = "all 0.2s";

                        btn.onmouseover = () => { btn.style.background = "#007bff"; btn.style.color = "white"; };
                        btn.onmouseout = () => { btn.style.background = "white"; btn.style.color = "#555"; };

                        btn.onclick = () => {
                             const allBtn = document.querySelectorAll('.menu-item')[0];
                             if(allBtn) allBtn.click();
                             setTimeout(() => {
                                 const search = document.querySelector('.search-input');
                                 if(search) { search.value = tag; search.dispatchEvent(new Event('input')); }
                             }, 100);
                        };
                        cloud.appendChild(btn);
                    });
                    
                    snippetsGrid.appendChild(cloud);
                    return;
                }

                if (snippetsToShow.length === 0) {
                    snippetsGrid.innerHTML = `<p style='grid-column: 1/-1; text-align: center; color: #888;'>No snippets found.</p>`;
                    return;
                }

                snippetsToShow.forEach(snippet => {
                    // ... (Your existing card rendering code) ...
                    const favIcon = snippet.is_favorite == 1 ? '❤️' : '🤍';
                    let actionBtn = "";
                    let editBtn = "";

                    if (currentView === 'trash') {
                         actionBtn = `<span class="delete-btn" onclick="deletePermanently(${snippet.id})" style="cursor: pointer; color: red;" title="Delete Forever">🗑️</span>`;
                    } else {
                         editBtn = `<span class="edit-btn" onclick="openEditModal(${snippet.id})" style="cursor: pointer; margin-right: 10px;" title="Edit">✏️</span>`;
                         actionBtn = `<span class="delete-btn" onclick="deleteSnippet(${snippet.id})" style="cursor: pointer;" title="Move to Trash">🗑️</span>`;
                    }

                    // Date Formatting
                    const dateObj = new Date(snippet.created_at);
                    const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

                    const snippetCard = `
                        <div class="snippet-card dashboard-card">
                            <div class="card-header">
                                <span class="lang-tag ${snippet.language}">${snippet.language.toUpperCase()}</span>
                                <span class="card-title">${snippet.title}</span>
                                <div style="margin-left: auto; display: flex; align-items: center;">
                                    <span style="cursor: pointer; margin-right: 10px;" onclick="toggleFavorite(${snippet.id})">${favIcon}</span>
                                    ${editBtn}
                                    ${actionBtn}
                                </div>
                            </div>
                            <div class="card-body">
                                <pre><code class="language-${snippet.language}">${escapeHtml(snippet.code)}</code></pre>
                            </div>
                            <div class="card-footer">
                                <div class="tags-container">
                                    <span class="tag">${snippet.tags}</span>
                                </div>
                                <div style="display: flex; gap: 10px; align-items: center;">
                                    <span style="font-size: 12px; color: #999;">${dateStr}</span>
                                    <button class="copy-btn" onclick="copyText(this)">Copy</button>
                                </div>
                            </div>
                        </div>
                    `;
                    snippetsGrid.innerHTML += snippetCard;
                });

                if (window.hljs) document.querySelectorAll('pre code').forEach((block) => hljs.highlightElement(block));
            }
        } catch (error) { console.error("Error loading snippets:", error); }
    }

    // ==========================================
    // 4. MODAL & EDIT LOGIC (Fixed)
    // ==========================================
    const modal = document.getElementById('snippetModal');
    const newSnippetBtn = document.querySelector('.btn-primary.btn-sm'); 
    const closeModalBtn = document.getElementById('closeModal');
    const cancelBtn = document.getElementById('cancelBtn');
    const modalTitle = document.querySelector('#snippetModal h2');
    const saveBtn = document.querySelector('#snippetModal .btn-primary');

    const resetModal = () => {
        isEditing = false;
        editingId = null;
        document.getElementById('addSnippetForm').reset();
        if(modalTitle) modalTitle.innerText = "Create New Snippet";
        if(saveBtn) saveBtn.innerText = "Save Snippet";
    };

    if (modal) {
        if(newSnippetBtn) {
            newSnippetBtn.addEventListener('click', () => {
                resetModal();
                modal.classList.remove('hidden');
            });
        }
        
        const closeModal = () => {
            modal.classList.add('hidden');
            resetModal();
        };

        if(closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
        if(cancelBtn) cancelBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

        // --- THE FIXED EDIT FUNCTION ---
        window.openEditModal = (id) => {
            // Find the snippet in our GLOBAL variable 'allSnippets'
            // This is much safer than trying to read it from the HTML
            const snippet = allSnippets.find(s => s.id === id);
            
            if (!snippet) return console.error("Snippet not found for editing");

            // Fill Form
            document.getElementById('snippetTitle').value = snippet.title;
            document.getElementById('snippetLang').value = snippet.language;
            document.getElementById('snippetTags').value = snippet.tags;
            document.getElementById('snippetCode').value = snippet.code;

            // Set Edit Mode
            isEditing = true;
            editingId = id;
            if(modalTitle) modalTitle.innerText = "Edit Snippet";
            if(saveBtn) saveBtn.innerText = "Update Snippet";

            modal.classList.remove('hidden');
        };

        // Handle Save/Update
        const addSnippetForm = document.getElementById('addSnippetForm');
        if (addSnippetForm) {
            addSnippetForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const submitBtn = addSnippetForm.querySelector('button[type="submit"]');
                const originalText = submitBtn.innerText;

                // --- 1. THE BULLETPROOF GUARD ---
                // If the button is already disabled (clicked), STOP IMMEDIATELY.
                if (submitBtn.disabled) return; 

                // 2. Lock the button
                submitBtn.disabled = true;
                submitBtn.innerText = "Saving...";

                const user = JSON.parse(localStorage.getItem('user'));
                if (!user) return alert("Please log in first!");

                const title = document.getElementById('snippetTitle').value;
                const language = document.getElementById('snippetLang').value;
                const tags = document.getElementById('snippetTags').value;
                const code = document.getElementById('snippetCode').value;

                let url = '/add-snippet';
                let method = 'POST';
                let body = { userId: user.id, title, language, tags, code };

                if (isEditing) {
                    url = '/update-snippet';
                    method = 'PUT';
                    body = { id: editingId, title, language, tags, code };
                }

                try {
                    const response = await fetch(url, {
                        method: method,
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(body)
                    });
                    const data = await response.json();
                    
                    if (data.success) {
                        closeModal();
                        loadSnippets(); 
                    } else {
                        alert("Error: " + data.message);
                    }
                } catch (error) { 
                    console.error(error);
                } finally {
                    // 3. Unlock button only after everything is finished
                    submitBtn.disabled = false;
                    submitBtn.innerText = originalText;
                }
            });
        }
    }

    // ==========================================
    // 5. GLOBAL HELPERS
    // ==========================================
    // Delete (Soft)
    window.deleteSnippet = async (id) => {
        if (confirm("Move to Trash?")) {
            await fetch('${BASE_URL}/delete-snippet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            loadSnippets(); 
        }
    };

    // Delete (Hard)
    window.deletePermanently = async (id) => {
        if (confirm("⚠️ Delete FOREVER?")) {
            await fetch(`${BASE_URL}/permanent-delete/${id}`, { method: 'DELETE' });
            loadSnippets(); 
        }
    };

    // Favorite
    window.toggleFavorite = async (id) => {
        await fetch('${BASE_URL}/toggle-favorite', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });
        loadSnippets(); 
    };

    // Copy
    window.copyText = (btn) => {
        const card = btn.closest('.snippet-card');
        const code = card.querySelector('code').innerText;
        navigator.clipboard.writeText(code);
        btn.innerText = "Copied!";
        setTimeout(() => btn.innerText = "Copy", 2000);
    };

    function escapeHtml(text) {
        if (!text) return text;
        return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    // Search
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchValue = e.target.value.toLowerCase().trim();
            const cards = document.querySelectorAll('.snippet-card');
            cards.forEach(card => {
                const text = card.innerText.toLowerCase();
                if(text.includes(searchValue)) card.style.display = "flex";
                else card.style.display = "none";
            });
        });
    }

    // Initial Load
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        const userNameDisplay = document.querySelector('.user-name');
        if (userNameDisplay) {
            userNameDisplay.innerText = user.full_name;
            document.querySelector('.avatar').innerText = user.full_name.substring(0, 2).toUpperCase();
            loadSnippets();
        }
    } else {
        if (window.location.pathname.includes('dashboard')) window.location.href = "login.html";
    }
    
    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('user');
        window.location.href = "index.html";
    });

});
