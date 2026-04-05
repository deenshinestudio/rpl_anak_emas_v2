// =============================================
// RPL Anak Emas - Main Application Logic v2
// Mobile-First | All Bugs Fixed
// =============================================

// ---- INIT ----
document.addEventListener('DOMContentLoaded', async () => {
    const storedUser = localStorage.getItem('rpl_user');
    if (storedUser) {
        try {
            AppState.user = JSON.parse(storedUser);
            checkRouting();
        } catch (e) {
            localStorage.removeItem('rpl_user');
            switchView('view-login');
        }
    } else {
        switchView('view-login');
    }

    // --- Nav: Edit Matkul ---
    const editMatkulBtn = document.getElementById('nav-btn-edit-matkul');
    if (editMatkulBtn) {
        editMatkulBtn.addEventListener('click', () => {
            document.querySelectorAll('.nav-item').forEach(btn => {
                btn.classList.remove('active');
                btn.style.color = '';
            });
            editMatkulBtn.classList.add('active');
            editMatkulBtn.style.color = '#7C3AED';

            switchView('view-onboarding');
            initOnboarding();
        });
    }
    setupEventListeners();
    // NOTE: Notification permission is now triggered by user clicking
    // the "Aktifkan Notifikasi" banner, not auto-requested on load.
});

// ---- ROUTING ----
function checkRouting() {
    if (!AppState.user) { switchView('view-login'); return; }

    if (isAdmin(AppState.user.nim)) {
        document.getElementById('nav-btn-admin').classList.remove('hidden');
        showNav();
        switchView('view-dashboard');
        initDashboard();
        return;
    }

    const hasCourses = AppState.user.matkul_dipilih && AppState.user.matkul_dipilih.length > 0;
    if (!hasCourses) {
        hideNav();
        switchView('view-onboarding');
        initOnboarding();
    } else {
        showNav();
        switchView('view-dashboard');
        initDashboard();
    }
}

function isAdmin(nim) {
    return typeof nim === 'string' && nim.toUpperCase().startsWith('ADMIN');
}

function showNav() {
    const nav = document.getElementById('main-nav');
    nav.classList.remove('hidden');
    nav.style.display = 'flex';
}

function hideNav() {
    const nav = document.getElementById('main-nav');
    nav.classList.add('hidden');
    nav.style.display = 'none';
}

// ---- VIEW SWITCHER ----
function switchView(viewId) {
    document.querySelectorAll('.view').forEach(el => {
        el.classList.add('hidden');
        el.style.display = 'none';
    });
    const target = document.getElementById(viewId);
    if (target) {
        target.classList.remove('hidden');
        // Use flex for the views that are flex containers
        if (['view-dashboard', 'view-onboarding', 'view-admin'].includes(viewId)) {
            target.style.display = 'flex';
        } else {
            target.style.display = 'flex';
        }
    }

    // Update active nav button
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.classList.remove('active');
        btn.style.color = '';
    });

    if (viewId === 'view-dashboard') {
        const homeBtn = document.getElementById('nav-btn-home');
        if (homeBtn) {
            homeBtn.classList.add('active');
            homeBtn.style.color = '#7C3AED';
        }
    } else if (viewId === 'view-admin') {
        const adminBtn = document.getElementById('nav-btn-admin');
        if (adminBtn) {
            adminBtn.classList.add('active');
            adminBtn.style.color = '#7C3AED';
        }
    }
}

// ---- EVENT LISTENERS ----
function setupEventListeners() {

    // --- Nav: Home ---
    const homeBtn = document.getElementById('nav-btn-home');
    if (homeBtn) {
        homeBtn.addEventListener('click', () => {
            switchView('view-dashboard');
        });
    }

    // --- Nav: Admin ---
    const adminBtn = document.getElementById('nav-btn-admin');
    if (adminBtn) {
        adminBtn.addEventListener('click', () => {
            switchView('view-admin');
            fetchAdminGlobalTasks();
        });
    }

    // --- Nav: Logout ---
    const logoutBtn = document.getElementById('nav-btn-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (!confirm('Yakin ingin keluar?')) return;
            localStorage.removeItem('rpl_user');
            AppState.user = null;
            AppState.tasks = [];
            hideNav();
            document.getElementById('nav-btn-admin').classList.add('hidden');
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            switchView('view-login');
        });
    }

    // --- Back: Onboarding → Login ---
    document.getElementById('btn-back-login').addEventListener('click', () => {
        localStorage.removeItem('rpl_user');
        AppState.user = null;
        hideNav();
        switchView('view-login');
    });

    // --- Reminder Bell ---
    document.getElementById('btn-reminder').addEventListener('click', triggerReminder);

    // --- Aktifkan Notifikasi Button ---
    const enableNotifBtn = document.getElementById('btn-enable-notif');
    if (enableNotifBtn) {
        enableNotifBtn.addEventListener('click', async () => {
            enableNotifBtn.textContent = 'Meminta...';
            enableNotifBtn.disabled = true;
            await requestNotificationPermission();
            // Button click satisfies the browser's user-gesture requirement
        });
    }

    // --- LOGIN FORM ---
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('login-submit-btn');
        submitBtn.textContent = 'Memproses...';
        submitBtn.disabled = true;

        const nama = document.getElementById('login-nama').value.trim();
        const nim = document.getElementById('login-nim').value.trim().toUpperCase();

        if (!nama || !nim) {
            alert('Nama dan NIM tidak boleh kosong.');
            submitBtn.textContent = 'Masuk';
            submitBtn.disabled = false;
            return;
        }

        try {
            let userData = null;

            const { data: existingUser, error: findError } = await supabaseClient
                .from('users')
                .select('*')
                .eq('nim', nim)
                .maybeSingle();

            if (findError) throw findError;

            if (existingUser) {
                userData = existingUser;
                await supabaseClient.from('users').update({ last_login: new Date().toISOString() }).eq('nim', nim);
            } else {
                const { data: newUser, error: insertError } = await supabaseClient
                    .from('users')
                    .insert([{ nim, nama, matkul_dipilih: [] }])
                    .select()
                    .single();
                if (insertError) throw insertError;
                userData = newUser;
            }

            AppState.user = userData;
            localStorage.setItem('rpl_user', JSON.stringify(userData));
            checkRouting();

        } catch (err) {
            alert('Error: ' + (err.message || JSON.stringify(err)));
        } finally {
            submitBtn.textContent = 'Masuk';
            submitBtn.disabled = false;
        }
    });

    // --- ONBOARDING TABS ---
    document.getElementById('tab-odd').addEventListener('click', () => {
        setActiveTab('tab-odd');
        renderCourses('ganjil');
    });
    document.getElementById('tab-even').addEventListener('click', () => {
        setActiveTab('tab-even');
        renderCourses('genap');
    });

    // --- SAVE COURSES ---
    document.getElementById('btn-save-courses').addEventListener('click', async () => {
        const courses = getSelectedCourseNames();
        if (courses.length === 0) { alert('Pilih setidaknya 1 mata kuliah.'); return; }

        const btn = document.getElementById('btn-save-courses');
        btn.textContent = 'Menyimpan...';
        btn.disabled = true;

        try {
            const { error } = await supabaseClient
                .from('users')
                .update({ matkul_dipilih: courses })
                .eq('nim', AppState.user.nim);

            if (error) throw error;

            AppState.user.matkul_dipilih = courses;
            localStorage.setItem('rpl_user', JSON.stringify(AppState.user));
            checkRouting();
        } catch (err) {
            alert('Gagal menyimpan: ' + err.message);
            btn.textContent = 'Coba Lagi';
            btn.disabled = false;
        }
    });

    // --- FILTER CHIPS ---
    document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            AppState.currentFilter = chip.dataset.filter.toLowerCase();
            renderTasks();
        });
    });

    // --- ADD TASK FAB ---
    document.getElementById('btn-add-task').addEventListener('click', () => openModal(false));
    document.getElementById('btn-add-global').addEventListener('click', () => openModal(true));

    // --- CLOSE MODAL ---
    document.querySelectorAll('.close-modal').forEach(btn => btn.addEventListener('click', closeModal));
    document.getElementById('modal-backdrop').addEventListener('click', closeModal);

    // --- TASK TYPE TOGGLE ---
    document.querySelectorAll('.type-toggle').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.type-toggle').forEach(b => {
                b.classList.remove('active');
                b.style.color = '#9CA3AF';
            });
            btn.classList.add('active');
            btn.style.color = '#7C3AED';
            document.getElementById('task-jenis').value = btn.dataset.type;
            const bg = document.getElementById('type-bg');
            bg.style.transform = btn.dataset.type === 'Kelompok' ? 'translateX(100%)' : 'translateX(0)';
        });
    });

    // --- TASK FORM SUBMIT ---
    document.getElementById('form-add-task').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        const savedText = btn.textContent;
        btn.textContent = 'Menyimpan...';
        btn.disabled = true;

        const isGlobal = document.getElementById('task-is-global').value === 'true';

        // *** FK FIX: global tasks use a dedicated sentinel NIM that MUST exist in DB ***
        // If your DB requires FK, use the admin's actual NIM or NULL if column is nullable.
        // We use a special constant 'GLOBAL_ADMIN' which should exist in users table.
        const userNim = isGlobal ? 'GLOBAL_ADMIN' : AppState.user.nim;

        const taskData = {
            user_nim: userNim,
            matkul: document.getElementById('task-matkul').value,
            judul: document.getElementById('task-judul').value.trim(),
            jenis_tugas: isGlobal ? 'Global' : document.getElementById('task-jenis').value,
            deadline: document.getElementById('task-deadline').value,
            status: 'pending',
            is_global: isGlobal
        };

        try {
            // Ensure GLOBAL_ADMIN user exists before inserting global task
            if (isGlobal) {
                const { data: adminRow } = await supabaseClient
                    .from('users')
                    .select('nim')
                    .eq('nim', 'GLOBAL_ADMIN')
                    .maybeSingle();

                if (!adminRow) {
                    await supabaseClient.from('users').insert([{
                        nim: 'GLOBAL_ADMIN',
                        nama: 'Global Admin',
                        matkul_dipilih: []
                    }]);
                }
            }

            const taskId = document.getElementById('task-id').value;
            let error;
            if (taskId) {
                ({ error } = await supabaseClient.from('tasks').update(taskData).eq('id', taskId));
            } else {
                ({ error } = await supabaseClient.from('tasks').insert([taskData]));
            }
            if (error) throw error;

            closeModal();
            if (isGlobal) {
                fetchAdminGlobalTasks();
            } else {
                await fetchTasks();
            }
        } catch (err) {
            alert('Gagal menyimpan tugas: ' + err.message);
        } finally {
            btn.textContent = savedText;
            btn.disabled = false;
        }
    });
}

// ---- HELPERS ----
function setActiveTab(activeId) {
    const oddTab = document.getElementById('tab-odd');
    const evenTab = document.getElementById('tab-even');
    if (activeId === 'tab-odd') {
        oddTab.style.background = 'linear-gradient(135deg,#7C3AED,#A78BFA)';
        oddTab.style.color = '#fff';
        evenTab.style.background = 'transparent';
        evenTab.style.color = '#9CA3AF';
    } else {
        evenTab.style.background = 'linear-gradient(135deg,#7C3AED,#A78BFA)';
        evenTab.style.color = '#fff';
        oddTab.style.background = 'transparent';
        oddTab.style.color = '#9CA3AF';
    }
}

// =============================================
// ONBOARDING
// =============================================
function initOnboarding() {
    selectedCourseNames.clear();
    if (AppState.user && AppState.user.matkul_dipilih) {
        AppState.user.matkul_dipilih.forEach(m => selectedCourseNames.add(m));
    }
    updateCourseCounter();
    setActiveTab('tab-odd');
    renderCourses('ganjil');
}

// =============================================
// DASHBOARD
// =============================================
async function initDashboard() {
    const name = AppState.user.nama || '';
    document.getElementById('profile-name').textContent = name.split(' ')[0] || name;

    // Populate matkul select
    const select = document.getElementById('task-matkul');
    select.innerHTML = '<option value="" disabled selected>Pilih Matkul...</option>';

    const matkulList = isAdmin(AppState.user.nim)
        ? Object.values(COURSES_DATA).flatMap(groups => groups.flatMap(g => g.list))
        : (AppState.user.matkul_dipilih || []);

    matkulList.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m;
        opt.textContent = m;
        select.appendChild(opt);
    });

    showNotifBannerIfNeeded(); // show or hide the permission banner
    await fetchTasks();
}


async function fetchTasks() {
    const container = document.getElementById('task-container');
    container.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:center;height:120px;gap:10px;color:#A78BFA;">
            <svg style="animation:spin 1s linear infinite;width:28px;height:28px;" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle style="opacity:0.25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path style="opacity:0.75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            <span style="font-size:13px;font-weight:600;color:#A78BFA;">Memuat tugas...</span>
        </div>
        <style>@keyframes spin{to{transform:rotate(360deg)}}</style>`;

    try {
        // 1. Personal tasks (exact NIM match)
        const { data: personalTasks, error: err1 } = await supabaseClient
            .from('tasks')
            .select('*')
            .eq('user_nim', AppState.user.nim)
            .order('deadline', { ascending: true });

        if (err1) throw err1;

        // 2. ALL global tasks — filter client-side using normalized name matching
        //    This prevents mismatches due to trailing spaces or case differences
        const { data: allGlobalTasks, error: err2 } = await supabaseClient
            .from('tasks')
            .select('*')
            .eq('is_global', true)
            .order('deadline', { ascending: true });

        let globalTasks = [];
        if (!err2 && allGlobalTasks) {
            const enrolledNormalized = (AppState.user.matkul_dipilih || [])
                .map(m => m.trim().toLowerCase());

            globalTasks = allGlobalTasks.filter(t => {
                const taskMatkul = (t.matkul || '').trim().toLowerCase();
                return enrolledNormalized.includes(taskMatkul);
            });
        }

        // 3. Apply saved local completion status for global tasks (per-user localStorage)
        const globalDoneKey = `rpl_global_done_${AppState.user.nim}`;
        const globalDoneSet = new Set(JSON.parse(localStorage.getItem(globalDoneKey) || '[]'));

        globalTasks = globalTasks.map(t => ({
            ...t,
            _isGlobalLocal: true, // marker
            status: globalDoneSet.has(String(t.id)) ? 'completed' : 'pending'
        }));

        // 4. Merge and deduplicate, then sort with new priority rules:
        //    GROUP A (top): pending tasks with FUTURE deadline → sorted nearest first
        //    GROUP B (bottom): completed tasks OR past-deadline tasks → sorted soonest first within group
        const map = new Map();
        [...(personalTasks || []), ...globalTasks].forEach(t => map.set(t.id, t));
        const now = new Date();

        AppState.tasks = Array.from(map.values()).sort((a, b) => {
            const isCompletedA = a.status === 'completed';
            const isCompletedB = b.status === 'completed';
            const dlA = new Date(a.deadline); dlA.setHours(23, 59, 59, 999);
            const dlB = new Date(b.deadline); dlB.setHours(23, 59, 59, 999);
            const isPastA = dlA < now;
            const isPastB = dlB < now;

            // A task is "low priority" if it's completed OR its deadline has passed
            const lowA = isCompletedA || isPastA;
            const lowB = isCompletedB || isPastB;

            // Group A (active+future) always above Group B (done/past)
            if (!lowA && lowB) return -1;
            if (lowA && !lowB) return 1;

            // Within same group: sort by deadline ascending (nearest first)
            return dlA - dlB;
        });

        checkUrgentTasks();
        renderTasks();
        updateProgressRing();

    } catch (err) {
        container.innerHTML = `<div style="text-align:center;padding:40px 20px;color:#EF4444;font-size:13px;font-weight:600;">Gagal memuat: ${err.message}</div>`;
    }
}

// Urgent = deadline today or already past (not completed)
function isUrgent(deadlineStr, status) {
    if (status === 'completed') return false;
    const now = new Date();
    const dl = new Date(deadlineStr);
    dl.setHours(23, 59, 59, 999);
    return dl <= now;
}

// Near deadline = within 3 days (not completed)
function isNearDeadline(deadlineStr, status) {
    if (status === 'completed') return false;
    const now = new Date();
    const dl = new Date(deadlineStr);
    dl.setHours(23, 59, 59, 999);
    const diffMs = dl - now;
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 3;
}

function checkUrgentTasks() {
    const urgentCount = AppState.tasks.filter(t => isUrgent(t.deadline, t.status)).length;
    const nearCount = AppState.tasks.filter(t => isNearDeadline(t.deadline, t.status)).length;
    const dot = document.getElementById('notif-dot');
    const totalAlert = urgentCount + nearCount;
    if (dot) {
        if (totalAlert > 0) dot.style.display = 'block';
        else dot.style.display = 'none';
    }

    if (Notification.permission === 'granted') {
        scheduleDeadlineNotifications(AppState.tasks);
    }
}

function scheduleDeadlineNotifications(tasks) {
    const today = new Date().toDateString();
    const lastNotified = localStorage.getItem('rpl_last_notif_date');
    if (lastNotified === today) return; // Only once per day

    const urgentTasks = tasks.filter(t => isUrgent(t.deadline, t.status));
    const nearTasks = tasks.filter(t => isNearDeadline(t.deadline, t.status) && !isUrgent(t.deadline, t.status));

    if (urgentTasks.length > 0) {
        urgentTasks.forEach(t => {
            setTimeout(() => {
                new Notification('🔴 Tugas Melewati Deadline!', {
                    body: `"${t.judul}" (${t.matkul}) sudah melewati deadline!`,
                    icon: '/manifest.json',
                    tag: 'urgent-' + t.id,
                    requireInteraction: true
                });
            }, 500);
        });
    }

    if (nearTasks.length > 0) {
        setTimeout(() => {
            new Notification('⚠️ Tugas Mendekati Deadline!', {
                body: `Ada ${nearTasks.length} tugas yang akan jatuh tempo dalam 3 hari ke depan.`,
                icon: '/manifest.json',
                tag: 'near-deadline'
            });
        }, 1500);
    }

    localStorage.setItem('rpl_last_notif_date', today);
}

function triggerReminder() {
    showReminderPopup();
}

// ============================================
// CUSTOM REMINDER POPUP
// ============================================
function showReminderPopup() {
    const urgentTasks = AppState.tasks.filter(t => isUrgent(t.deadline, t.status));
    const nearTasks = AppState.tasks.filter(t => isNearDeadline(t.deadline, t.status) && !isUrgent(t.deadline, t.status));

    const popup = document.getElementById('reminder-popup');
    const taskList = document.getElementById('reminder-task-list');
    const badges = document.getElementById('reminder-badges');
    const titleEl = document.getElementById('reminder-popup-title');
    const subEl = document.getElementById('reminder-popup-subtitle');
    const bellIcon = document.getElementById('btn-reminder');

    // Bell shake animation
    if (bellIcon) {
        bellIcon.classList.remove('bell-shake');
        void bellIcon.offsetWidth; // reflow to restart animation
        bellIcon.classList.add('bell-shake');
        setTimeout(() => bellIcon.classList.remove('bell-shake'), 800);
    }

    const allAlertTasks = [...urgentTasks, ...nearTasks];

    // --- Empty state ---
    if (allAlertTasks.length === 0) {
        titleEl.textContent = 'Semua Aman! 🎉';
        subEl.textContent = 'Tidak ada tugas mendesak saat ini.';
        badges.innerHTML = '';
        taskList.innerHTML = `
            <div class="reminder-empty">
                <span class="reminder-empty-icon">✅</span>
                <p class="reminder-empty-text">Semua tugas terkendali!</p>
                <p class="reminder-empty-sub">Tetap semangat Anak Emas 🌟</p>
            </div>`;
    } else {
        const totalUrgent = urgentTasks.length;
        const totalNear = nearTasks.length;

        titleEl.textContent = totalUrgent > 0 ? '⚠️ Deadline Terlewat!' : '🕐 Deadline Mendekat!';
        subEl.textContent = 'Tugas berikut membutuhkan perhatianmu segera:';

        // Badges
        badges.innerHTML = '';
        if (totalUrgent > 0) {
            badges.innerHTML += `<span class="reminder-badge urgent">🔴 ${totalUrgent} Terlewat</span>`;
        }
        if (totalNear > 0) {
            badges.innerHTML += `<span class="reminder-badge near">⚠️ ${totalNear} Mendekati</span>`;
        }

        // Task items
        taskList.innerHTML = '';
        allAlertTasks.forEach(t => {
            const isUrg = isUrgent(t.deadline, t.status);
            const isNear = isNearDeadline(t.deadline, t.status) && !isUrg;
            const typeClass = isUrg ? 'urgent' : (isNear ? 'near' : 'normal');
            const icon = isUrg ? '🔴' : (isNear ? '⚠️' : '📌');
            const dl = new Date(t.deadline);
            const dateStr = dl.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

            const item = document.createElement('div');
            item.className = `reminder-task-item ${typeClass}`;
            item.innerHTML = `
                <div class="reminder-task-icon ${typeClass}">${icon}</div>
                <div class="reminder-task-body">
                    <div class="reminder-task-title">${t.judul}</div>
                    <div class="reminder-task-meta">📅 ${dateStr} &nbsp;•&nbsp; ${t.matkul}</div>
                </div>`;
            taskList.appendChild(item);
        });
    }

    // Show popup
    popup.classList.remove('hidden');
    popup.classList.add('show');

    // Send native push notification too if permitted
    if (Notification.permission === 'granted' && allAlertTasks.length > 0) {
        const urgCount = urgentTasks.length;
        const nearCount = nearTasks.length;
        let body = '';
        if (urgCount > 0) body += `🔴 ${urgCount} tugas melewati deadline!\n`;
        if (nearCount > 0) body += `⚠️ ${nearCount} tugas mendekati deadline.`;
        new Notification('Anak Emas — Pengingat Tugas', {
            body: body.trim(),
            tag: 'reminder-manual'
        });
    }
}

function closeReminderPopup() {
    const popup = document.getElementById('reminder-popup');
    const card = document.getElementById('reminder-card');
    card.style.transform = 'translateY(100%)';
    card.style.opacity = '0';
    setTimeout(() => {
        popup.classList.add('hidden');
        popup.classList.remove('show');
        // Reset card for next open
        card.style.transform = '';
        card.style.opacity = '';
    }, 400);
}

function renderTasks() {
    const container = document.getElementById('task-container');
    container.innerHTML = '';
    const filter = AppState.currentFilter;

    let filtered = AppState.tasks;
    if (filter === 'global') {
        filtered = filtered.filter(t => t.is_global);
    } else if (filter === 'mandiri') {
        filtered = filtered.filter(t => !t.is_global && t.jenis_tugas === 'Mandiri');
    } else if (filter === 'kelompok') {
        filtered = filtered.filter(t => !t.is_global && t.jenis_tugas === 'Kelompok');
    }

    if (filtered.length === 0) {
        container.innerHTML = `
            <div style="text-align:center;margin-top:48px;padding:0 24px;">
                <div style="width:72px;height:72px;background:#F5F3FF;border-radius:20px;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">
                    <svg width="36" height="36" fill="none" stroke="#C4B5FD" stroke-width="1.5" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                </div>
                <p style="font-size:14px;font-weight:700;color:#6B7280;">Belum ada tugas</p>
                <p style="font-size:12px;color:#A78BFA;margin-top:4px;cursor:pointer;" onclick="openModal(false)">+ Tambah tugas baru</p>
            </div>
            <p style="text-align:center;font-size:10px;font-weight:700;color:#D1D5DB;margin-top:24px;">@deenshinestudio</p>`;
        return;
    }

    filtered.forEach((task, index) => {
        const isCompleted = task.status === 'completed';
        const urgent = isUrgent(task.deadline, task.status);
        const near = isNearDeadline(task.deadline, task.status) && !urgent;
        const dl = new Date(task.deadline);
        const dateStr = dl.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

        let pillBg = '', pillColor = '', pillText = '';
        if (task.is_global) {
            pillBg = '#EFF6FF'; pillColor = '#2563EB'; pillText = 'Global';
        } else if (task.jenis_tugas === 'Mandiri') {
            pillBg = '#F5F3FF'; pillColor = '#7C3AED'; pillText = 'Mandiri';
        } else {
            pillBg = '#FFF7ED'; pillColor = '#EA580C'; pillText = 'Kelompok';
        }

        const card = document.createElement('div');
        card.className = 'task-card fade-in-up' + (urgent ? ' urgent' : '') + (isCompleted ? ' completed-task' : '');
        card.style.animationDelay = (index * 0.05) + 's';

        const urgentBanner = urgent ? `
            <div class="urgent-banner">
                <svg width="12" height="12" fill="none" stroke="white" stroke-width="3" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
                ⚡ Deadline Terlewat!
            </div>` : (near ? `
            <div style="display:inline-flex;align-items:center;gap:5px;background:linear-gradient(90deg,#F59E0B,#F97316);color:white;font-size:10px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;padding:3px 8px;border-radius:7px;margin-bottom:8px;">
                <svg width="10" height="10" fill="none" stroke="white" stroke-width="3" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                Segera Selesaikan!
            </div>` : '');

        const deadlineColor = urgent ? '#EF4444' : (near ? '#F59E0B' : '#9CA3AF');
        const doneStyle = isCompleted
            ? 'background:linear-gradient(135deg,#7C3AED,#A78BFA);border-color:transparent;'
            : 'background:transparent;border-color:#D1D5DB;';

        // Global tasks: can be toggled locally (localStorage-based per user)
        const globalLockIcon = task.is_global ? `<span title="Tugas Global - Status disimpan lokal" style="position:absolute;bottom:-2px;right:-2px;width:14px;height:14px;background:#2563EB;border-radius:50%;display:flex;align-items:center;justify-content:center;border:1.5px solid #fff;">
            <svg width="7" height="7" fill="white" viewBox="0 0 24 24"><path d="M12 1a5 5 0 00-5 5v3H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2V11a2 2 0 00-2-2h-2V6a5 5 0 00-5-5zm0 2a3 3 0 013 3v3H9V6a3 3 0 013-3zm0 9a2 2 0 110 4 2 2 0 010-4z"/></svg>
        </span>` : '';

        card.innerHTML = `
            ${urgentBanner}
            <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;">
                <div style="flex:1;min-width:0;">
                    <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;flex-wrap:wrap;">
                        <span style="font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;padding:2px 8px;border-radius:6px;background:${pillBg};color:${pillColor};">${pillText}</span>
                        <span style="font-size:10px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.06em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:160px;">${task.matkul}</span>
                    </div>
                    <h4 style="font-size:14px;font-weight:700;color:${isCompleted ? '#9CA3AF' : '#1E1B4B'};line-height:1.3;margin-bottom:6px;${isCompleted ? 'text-decoration:line-through;' : ''}">${task.judul}</h4>
                    <div style="display:flex;align-items:center;gap:6px;font-size:11px;font-weight:600;color:${deadlineColor};">
                        <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                        </svg>
                        ${dateStr}
                        ${!task.is_global ? `
                        <div style="margin-left:auto;display:flex;gap:4px;">
                            <button class="btn-edit-task" data-id="${task.id}" style="background:none;border:none;padding:2px 4px;cursor:pointer;font-size:13px;border-radius:4px;transition:background 0.2s;" title="Edit Tugas" onmouseover="this.style.background='rgba(124,58,237,0.1)'" onmouseout="this.style.background='none'">✏️</button>
                            <button class="btn-delete-task" data-id="${task.id}" style="background:none;border:none;padding:2px 4px;cursor:pointer;font-size:13px;border-radius:4px;transition:background 0.2s;" title="Hapus Tugas" onmouseover="this.style.background='rgba(239,68,68,0.1)'" onmouseout="this.style.background='none'">🗑️</button>
                        </div>
                        ` : ''}
                    </div>
                </div>
                <div style="position:relative;flex-shrink:0;">
                    <button class="toggle-status ${isCompleted ? 'done' : ''}" data-id="${task.id}" data-global="${task.is_global ? '1' : '0'}"
                        style="width:38px;height:38px;border-radius:50%;border:2px solid ${isCompleted ? 'transparent' : '#D1D5DB'};${doneStyle}display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all 0.2s;">
                        <svg width="16" height="16" fill="none" stroke="${isCompleted ? 'white' : '#D1D5DB'}" stroke-width="3" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                        </svg>
                    </button>
                    ${globalLockIcon}
                </div>
            </div>`;

        container.appendChild(card);
    });

    // Footer
    const footer = document.createElement('a');
    footer.href = 'https://www.instagram.com/dinsaalim?igsh=aXJscGxgMWl4cHRh&utm_source=qr';
    footer.target = '_blank'; // Membuka di tab baru
    footer.style.cssText = 'display:block;text-align:center;font-size:10px;font-weight:700;color:#D1D5DB;margin:24px 0 8px;text-decoration:none;';
    footer.textContent = '@deenshinestudio';

    // *** EVENT DELEGATION at container level (Optimistic UI Update) ***
    container.addEventListener('click', async (e) => {
        const editBtn = e.target.closest('.btn-edit-task');
        if (editBtn) {
            e.stopPropagation();
            openEditModal(editBtn.dataset.id);
            return;
        }

        const delBtn = e.target.closest('.btn-delete-task');
        if (delBtn) {
            e.stopPropagation();
            deleteTask(delBtn.dataset.id);
            return;
        }

        const btn = e.target.closest('.toggle-status');
        if (!btn) return;
        e.stopPropagation();

        // Mencegah user spam klik saat masih proses
        if (btn.disabled) return;
        btn.disabled = true;

        const id = btn.dataset.id;
        const isGlobalBtn = btn.dataset.global === '1';
        const task = AppState.tasks.find(t => String(t.id) === String(id));
        if (!task) {
            btn.disabled = false;
            return;
        }

        // Simpan status lama untuk jaga-jaga kalau error
        const oldStatus = task.status;
        const newStatus = oldStatus === 'completed' ? 'pending' : 'completed';
        const isNowCompleted = newStatus === 'completed';

        // 1. OPTIMISTIC UI: Langsung ubah state & tampilan layar tanpa nunggu loading
        task.status = newStatus;

        // Cari elemen visual untuk diubah langsung
        const card = btn.closest('.task-card');
        const titleEl = card.querySelector('h4');
        const iconSvg = btn.querySelector('svg');

        // Ubah gaya visual seketika
        if (isNowCompleted) {
            card.classList.add('completed-task');
            btn.classList.add('done');
            btn.style.background = 'linear-gradient(135deg,#7C3AED,#A78BFA)';
            btn.style.borderColor = 'transparent';
            iconSvg.setAttribute('stroke', 'white');
            titleEl.style.color = '#9CA3AF';
            titleEl.style.textDecoration = 'line-through';

            // --- MICRO-INTERACTIONS ---
            // 1. Checkbox bounce pop
            btn.classList.remove('checkbox-pop');
            void btn.offsetWidth; // reflow to restart animation
            btn.classList.add('checkbox-pop');
            setTimeout(() => btn.classList.remove('checkbox-pop'), 500);

            // 2. Play completion audio (reset to start for rapid clicks)
            const sound = document.getElementById('complete-sound');
            if (sound) {
                sound.currentTime = 0;
                sound.play().catch(() => { }); // ignore autoplay block gracefully
            }

            // 3. Confetti burst at checkbox position
            if (typeof confetti === 'function') {
                const rect = btn.getBoundingClientRect();
                confetti({
                    particleCount: 70,
                    spread: 55,
                    startVelocity: 28,
                    decay: 0.92,
                    scalar: 0.85,
                    origin: {
                        x: (rect.left + rect.width / 2) / window.innerWidth,
                        y: (rect.top + rect.height / 2) / window.innerHeight
                    },
                    colors: ['#7C3AED', '#A78BFA', '#10B981', '#F59E0B', '#EC4899']
                });
            }
        } else {
            card.classList.remove('completed-task');
            btn.classList.remove('done');
            btn.style.background = 'transparent';
            btn.style.borderColor = '#D1D5DB';
            iconSvg.setAttribute('stroke', '#D1D5DB');
            titleEl.style.color = '#1E1B4B';
            titleEl.style.textDecoration = 'none';
        }

        // Langsung perbarui ring persentase
        updateProgressRing();

        // 2. BACKGROUND PROCESS: Kirim ke Database / LocalStorage secara diam-diam
        if (isGlobalBtn) {
            // Tugas Global via LocalStorage (Cepat)
            const globalDoneKey = `rpl_global_done_${AppState.user.nim}`;
            const doneSet = new Set(JSON.parse(localStorage.getItem(globalDoneKey) || '[]'));
            if (isNowCompleted) doneSet.add(String(id));
            else doneSet.delete(String(id));
            localStorage.setItem(globalDoneKey, JSON.stringify([...doneSet]));

            btn.disabled = false; // Buka kunci tombol
        } else {
            // Tugas Personal via Supabase (Butuh Waktu/Jaringan)
            try {
                const { error } = await supabaseClient.from('tasks').update({ status: newStatus }).eq('id', task.id);
                if (error) throw error;
                btn.disabled = false; // Buka kunci tombol jika sukses
            } catch (error) {
                // 3. REVERT: Kalau gagal kirim ke Supabase, batalkan centang dan beritahu user
                task.status = oldStatus;
                alert('Gagal menyinkronkan dengan server. Periksa jaringan Anda.');

                // Karena error, kita panggil render ulang untuk kembalikan state awal
                renderTasks();
                updateProgressRing();
            }
        }

        // KITA TIDAK MEMANGGIL renderTasks() DI SINI JIKA SUKSES.
        // Inilah yang membuat animasi refresh / layar blank menghilang!

    }, { once: false });

    container.appendChild(footer);
}

function updateProgressRing() {
    // Only count non-global tasks for personal progress, but count all for display
    const myTasks = AppState.tasks;
    const total = myTasks.length;
    const completed = myTasks.filter(t => t.status === 'completed').length;
    const pending = total - completed;
    const pct = total === 0 ? 0 : Math.round((completed / total) * 100);

    // Update ring
    const circumference = 100.53;
    const offset = circumference - (pct / 100) * circumference;
    const ring = document.getElementById('progress-ring');
    const text = document.getElementById('progress-text');
    if (ring) {
        ring.style.strokeDashoffset = offset;
        ring.style.color = pct === 100 ? '#10B981' : '#A78BFA';
    }
    if (text) text.textContent = pct + '%';

    // Update stat numbers
    const statDone = document.getElementById('stat-done');
    const statPending = document.getElementById('stat-pending');
    const statTotal = document.getElementById('stat-total');
    if (statDone) statDone.textContent = completed;
    if (statPending) statPending.textContent = pending;
    if (statTotal) statTotal.textContent = total;
}

// =============================================
// ADMIN
// =============================================
async function fetchAdminGlobalTasks() {
    const container = document.getElementById('admin-task-container');
    container.innerHTML = '<p style="color:#A78BFA;font-size:13px;font-weight:600;padding:16px;">Memuat...</p>';

    try {
        const { data, error } = await supabaseClient
            .from('tasks')
            .select('*')
            .eq('is_global', true)
            .order('created_at', { ascending: false });

        if (error) throw error;

        container.innerHTML = '';
        if (!data || data.length === 0) {
            container.innerHTML = `
                <div style="text-align:center;margin-top:48px;">
                    <p style="font-size:14px;font-weight:700;color:#9CA3AF;">Belum ada tugas global</p>
                    <p style="font-size:12px;color:#C4B5FD;margin-top:4px;">Klik "+ Tugas Global" untuk menambah</p>
                </div>`;
        } else {
            data.forEach((task, idx) => {
                const dl = new Date(task.deadline);
                const dateStr = dl.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
                const urgent = isUrgent(task.deadline, task.status);
                const near = isNearDeadline(task.deadline, task.status);

                const card = document.createElement('div');
                card.className = 'admin-task-card fade-in-up' + (urgent ? ' urgent' : '');
                card.style.animationDelay = (idx * 0.05) + 's';
                card.style.borderLeft = '4px solid ' + (urgent ? '#EF4444' : near ? '#F59E0B' : '#7C3AED');
                card.innerHTML = `
                    <div style="flex:1;min-width:0;">
                        ${urgent ? '<span style="font-size:9px;font-weight:800;color:#EF4444;text-transform:uppercase;letter-spacing:0.08em;">⚡ Deadline Terlewat</span>' : ''}
                        <h4 style="font-size:14px;font-weight:700;color:#1E1B4B;margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${task.judul}</h4>
                        <p style="font-size:11px;font-weight:600;color:#7C3AED;text-transform:uppercase;letter-spacing:0.06em;">${task.matkul}</p>
                        <p style="font-size:11px;color:#9CA3AF;font-weight:600;margin-top:2px;">📅 ${dateStr}</p>
                    </div>
                    <button class="btn-del-global" data-id="${task.id}"
                        style="width:36px;height:36px;border-radius:50%;background:#FFF1F2;border:1.5px solid #FECDD3;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;transition:all 0.2s;"
                        onmouseenter="this.style.background='#FEE2E2'" onmouseleave="this.style.background='#FFF1F2'">
                        <svg width="16" height="16" fill="none" stroke="#EF4444" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                    </button>`;
                container.appendChild(card);
            });

            container.querySelectorAll('.btn-del-global').forEach(btn => {
                btn.addEventListener('click', async () => {
                    if (!confirm('Hapus tugas global ini?')) return;
                    btn.disabled = true;
                    await supabaseClient.from('tasks').delete().eq('id', btn.dataset.id);
                    fetchAdminGlobalTasks();
                });
            });
        }

        const footer = document.createElement('a');
        footer.href = 'https://www.instagram.com/dinsaalim?igsh=aXJscGxgMWl4cHRh&utm_source=qr';
        footer.target = '_blank'; // Membuka di tab baru
        footer.style.cssText = 'display:block;text-align:center;font-size:10px;font-weight:700;color:#D1D5DB;margin:24px 0 8px;text-decoration:none;';
        footer.textContent = '@deenshinestudio';
        container.appendChild(footer);

    } catch (err) {
        container.innerHTML = `<p style="color:#EF4444;font-size:13px;font-weight:600;padding:16px;">${err.message}</p>`;
    }
}

// =============================================
// MODAL & CRUD
// =============================================
function openModal(isGlobal) {
    document.getElementById('form-add-task').reset();
    document.getElementById('task-id').value = '';
    document.getElementById('task-is-global').value = isGlobal ? 'true' : 'false';
    document.getElementById('modal-title').textContent = isGlobal ? 'Tambah Tugas Global' : 'Tambah Tugas';
    document.querySelector('#form-add-task button[type="submit"]').textContent = 'Simpan Tugas';

    const jenisContainer = document.getElementById('jenis-container');
    jenisContainer.style.display = isGlobal ? 'none' : '';

    if (!isGlobal) {
        document.getElementById('task-jenis').value = 'Mandiri';
        document.getElementById('type-bg').style.transform = 'translateX(0)';
        document.querySelectorAll('.type-toggle').forEach(b => {
            b.classList.remove('active');
            b.style.color = '#9CA3AF';
        });
        const mandiriBtn = document.querySelector('.type-toggle[data-type="Mandiri"]');
        if (mandiriBtn) { mandiriBtn.classList.add('active'); mandiriBtn.style.color = '#7C3AED'; }
    }

    const today = new Date().toISOString().split('T')[0];
    document.getElementById('task-deadline').value = today;

    const modal = document.getElementById('modal-add-task');
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            document.getElementById('modal-content').style.transform = 'translateY(0)';
            document.getElementById('modal-content').style.opacity = '1';
        });
    });
}

function openEditModal(taskId) {
    const task = AppState.tasks.find(t => String(t.id) === String(taskId));
    if (!task) return;

    // Reuse the existing modal, but populate it
    document.getElementById('form-add-task').reset();
    document.getElementById('task-id').value = task.id;
    document.getElementById('task-is-global').value = task.is_global ? 'true' : 'false';
    document.getElementById('modal-title').textContent = 'Edit Tugas';
    document.querySelector('#form-add-task button[type="submit"]').textContent = 'Simpan Perubahan';

    const jenisContainer = document.getElementById('jenis-container');
    jenisContainer.style.display = task.is_global ? 'none' : '';

    document.getElementById('task-matkul').value = task.matkul;
    document.getElementById('task-judul').value = task.judul;
    document.getElementById('task-deadline').value = task.deadline;

    if (!task.is_global) {
        document.getElementById('task-jenis').value = task.jenis_tugas;
        const isKelompok = task.jenis_tugas === 'Kelompok';
        document.getElementById('type-bg').style.transform = isKelompok ? 'translateX(100%)' : 'translateX(0)';
        document.querySelectorAll('.type-toggle').forEach(b => {
            b.classList.remove('active');
            b.style.color = '#9CA3AF';
        });
        const btnSelector = isKelompok ? '.type-toggle[data-type="Kelompok"]' : '.type-toggle[data-type="Mandiri"]';
        const typeBtn = document.querySelector(btnSelector);
        if (typeBtn) { typeBtn.classList.add('active'); typeBtn.style.color = '#7C3AED'; }
    }

    const modal = document.getElementById('modal-add-task');
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            document.getElementById('modal-content').style.transform = 'translateY(0)';
            document.getElementById('modal-content').style.opacity = '1';
        });
    });
}

async function deleteTask(taskId) {
    if (!confirm('Apakah kamu yakin ingin menghapus tugas ini?')) return;

    // Optimistic UI delete
    const originalTasks = [...AppState.tasks];
    AppState.tasks = AppState.tasks.filter(t => String(t.id) !== String(taskId));
    renderTasks();
    updateProgressRing();
    checkUrgentTasks();

    try {
        const { error } = await supabaseClient.from('tasks').delete().eq('id', taskId);
        if (error) throw error;
    } catch (err) {
        console.error('Delete error', err);
        alert('Gagal menghapus tugas. Periksa koneksi Anda.');
        // Revert UI if fail
        AppState.tasks = originalTasks;
        renderTasks();
        updateProgressRing();
        checkUrgentTasks();
    }
}

function closeModal() {
    const content = document.getElementById('modal-content');
    content.style.transform = 'translateY(100%)';
    content.style.opacity = '0';
    setTimeout(() => {
        const modal = document.getElementById('modal-add-task');
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }, 350);
}

// =============================================
// NOTIFICATIONS & WEB PUSH
// =============================================

// ⚠️ GANTI dengan public key VAPID milikmu sendiri!
// Generate dengan: npx web-push generate-vapid-keys
// Key PUBLIK aman ditaruh di sini. Key PRIVAT hanya di server/Edge Function.
const VAPID_PUBLIC_KEY = 'BMBV4cG4-UufMswEfuGKsk3PclrLhsnPyjEZ4QNWC-ezRBRKC4VKYbsHFvya7tUWMkt0d0T0dFAJOSffBmv9cug';

// Show/hide the notification banner based on current permission state
function showNotifBannerIfNeeded() {
    const banner = document.getElementById('notif-banner');
    if (!banner) return;

    const dismissed = localStorage.getItem('rpl_notif_dismissed') === '1';

    if (!('Notification' in window) || dismissed) {
        banner.style.display = 'none';
        return;
    }

    if (Notification.permission === 'default') {
        // Not decided yet — show banner
        banner.style.display = 'block';
    } else if (Notification.permission === 'granted') {
        // Already allowed — hide banner, subscribe silently
        banner.style.display = 'none';
        subscribeToPush();
    } else {
        // 'denied' — hide banner, nothing we can do
        banner.style.display = 'none';
    }
}

// Called when user clicks "Aktifkan" button — MUST be triggered by a click event
async function requestNotificationPermission() {
    const banner = document.getElementById('notif-banner');
    const enableBtn = document.getElementById('btn-enable-notif');

    if (!('Notification' in window)) {
        if (banner) banner.style.display = 'none';
        return;
    }

    // If already decided, respect the existing state
    if (Notification.permission === 'granted') {
        if (banner) banner.style.display = 'none';
        await subscribeToPush();
        return;
    }
    if (Notification.permission === 'denied') {
        if (banner) banner.style.display = 'none';
        if (enableBtn) { enableBtn.textContent = 'Diblokir'; enableBtn.disabled = true; }
        return;
    }

    // Request permission — works because it's called directly from a click handler
    const perm = await Notification.requestPermission();

    if (perm === 'granted') {
        if (banner) banner.style.display = 'none';
        if (AppState.tasks.length > 0) checkUrgentTasks();
        await subscribeToPush();
    } else {
        // User denied — dismiss banner
        if (banner) banner.style.display = 'none';
        if (enableBtn) { enableBtn.textContent = 'Ditolak'; enableBtn.disabled = true; }
    }
}


// Convert base64 VAPID public key to Uint8Array for browser subscription
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
}

async function subscribeToPush() {
    // Skip if VAPID key is not configured
    if (!VAPID_PUBLIC_KEY || VAPID_PUBLIC_KEY === 'YOUR_VAPID_PUBLIC_KEY_HERE') {
        console.info('[Push] VAPID_PUBLIC_KEY belum dikonfigurasi. Lewati subscribe.');
        return;
    }
    if (!('PushManager' in window)) {
        console.warn('[Push] Browser tidak mendukung Web Push.');
        return;
    }
    if (!AppState.user) return;

    try {
        const registration = await navigator.serviceWorker.ready;

        // Check if already subscribed
        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });
        }

        // Save subscription to Supabase (upsert so re-subscribes don't duplicate)
        const { error } = await supabaseClient
            .from('push_subscriptions')
            .upsert([
                {
                    user_nim: AppState.user.nim,
                    subscription: subscription.toJSON()
                }
            ], { onConflict: 'user_nim' });

        if (error) {
            console.error('[Push] Gagal simpan subscription:', error.message);
        } else {
            console.log('[Push] Subscription berhasil disimpan ke Supabase ✅');
        }
    } catch (err) {
        console.error('[Push] Subscribe gagal:', err);
    }
}

/*
  =========================================================
  ARSITEKTUR TRIGGER OTOMATIS (Edge Function Supabase)
  =========================================================
  Buat file: supabase/functions/send-reminders/index.ts

  import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
  import webpush from 'npm:web-push'
  import { createClient } from 'npm:@supabase/supabase-js@2'

  serve(async () => {
    const supabase = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'))
    webpush.setVapidDetails('mailto:kamu@email.com', Deno.env.get('VAPID_PUBLIC_KEY'), Deno.env.get('VAPID_PRIVATE_KEY'))

    const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000).toISOString()
    const now = new Date().toISOString()

    const { data: tasks } = await supabase.from('tasks')
      .select('*, users(nim)').eq('status', 'pending')
      .gte('deadline', now).lte('deadline', oneHourFromNow)

    for (const task of tasks ?? []) {
      const { data: subs } = await supabase.from('push_subscriptions')
        .select('subscription').eq('user_nim', task.user_nim)
      for (const row of subs ?? []) {
        await webpush.sendNotification(row.subscription, JSON.stringify({
          title: '⏰ Deadline dalam 1 jam!',
          body: `${task.judul} — ${task.matkul}`
        }))
      }
    }
    return new Response('ok')
  })

  Deploy: supabase functions deploy send-reminders --no-verify-jwt
  Cron (Pro): supabase sql "select cron.schedule('send-reminders', '0 * * * *', $$select net.http_post('https://<project>.supabase.co/functions/v1/send-reminders', '{}', 'application/json', ARRAY[net.http_header('Authorization','Bearer <anon_key>')])$$);"
  =========================================================
*/
