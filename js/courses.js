// =============================================
// RPL Anak Emas - Course Data & Selection Logic
// =============================================

const COURSES_DATA = {
    ganjil: [
        {
            semester: 1,
            list: ["Ulum al-Qur'an", "Ulumul Hadits", "Nahwul Qur'an", "Kemahiran Digital", "Tahfidz Juz 1", "Ilmu Asbabun Nuzul", "Tarikh Al-Qur'an", "Mufradat al_Qur'an", "English for Academic Purposes", "Pancasila"]
        },
        {
            semester: 3,
            list: ["Bahasa Indonesia", "Studi kitab-kitab Tafsir", "Tafsir al-Qur'an di Indonesia/Muhammadiyah", "Balaghah al-Qur'an", "Tahfidz Juz 3", "Islam dan Iptek", "Pemikiran Islam", "Epistemologi islam", "Sosiologi dalam Al-Qur'an", "Ushul Fiqh"]
        },
        {
            semester: 5,
            list: ["Orientalisme dan Studi al-Qur'an", "Tahsin dan Tahfiz Juz 30", "Pengembangan Materi pembelajaran Al-Qur'an", "Tafsir Irfani", "Desain Media Pembelajaran Al-Qur'an", "Metodologi Penelitian Al-Qur'an dan Tafsir", "Tatbiq 'Irabi al-Qur'an", "Semantik al-Qur'an", "Tatbiq Tafsir Maudu'i"]
        },
        {
            semester: 7,
            list: ["Tafsir Ayat Dakwah", "Manhaj Tafsir Muhammadiyah", "Manhaj Dakwah Muhammadiyah", "Fiqh Munakahat", "Desain Evaluasi Pembelajaran Al-Qur'an", "Desain strategi Pembelajaran al-Qur'an", "Hadis Ahkam", "Hadis Tematik", "Tafsir Ayat Muamalah", "Tafsir Ayat Aqidah"]
        }
    ],
    genap: [
        {
            semester: 2,
            list: ["Mazahib al-Tafsir", "Kewarganegaraan", "Ilmu Tafsir", "Digitalisasi Tafsir dan Al-Qur'an", "Multimedia Studi Al-Qur'an", "Takhrijul Hadis", "Qowaid al-Tafsir", "Ilmu Tarjamah Al-Qur'an", "Tahfidz Juz 2", "Standarized Test Preparation"]
        },
        {
            semester: 4,
            list: ["Tatbiq Qawaid Balaghiyah fi al-Tafsir", "Studi Kemuhammadiyahan", "Tatbiq Tafsir Tahlili", "Tatbiq Qawaid Lughawiyah fi Tafsir", "Quranic Worldview", "Tahfidz Juz 29", "Qawaid Fiqh Manhaj Tarjih Muhammadiyah", "Metodologi Tafsir Al-Qur'an", "Tafsir Qur'an Kontemporer", "Al-Qur'an dan Sains Modern"]
        },
        {
            semester: 6,
            list: ["Fiqh Ibadah", "Aqidah", "Akhlak", "Ilmu Qira'at", "Pendekatan Studi Tafsir", "Peradaban Islam", "Seminar Proposal Skripsi", "Ilmu Tajwid dan Tahsin", "Desain Buku Ajar Al-Qur'an"]
        },
        {
            semester: 8,
            list: ["Skripsi", "Life Skills"]
        }
    ]
};

let selectedCourseNames = new Set();

function renderCourses(type = 'ganjil') {
    const container = document.getElementById('course-list');
    container.innerHTML = '';

    const groups = COURSES_DATA[type];

    groups.forEach(group => {
        // Semester Header
        const header = document.createElement('div');
        header.style.cssText = 'font-size:12px;font-weight:800;color:#7C3AED;text-transform:uppercase;letter-spacing:0.1em;margin:20px 0 10px;padding:0 2px;display:flex;align-items:center;gap:8px;';
        header.innerHTML = `
            <span style="flex:0 0 auto;">Semester ${group.semester}</span>
            <div style="flex:1;height:1px;background:linear-gradient(to right,#EDE9FE,transparent);"></div>`;
        container.appendChild(header);

        group.list.forEach(courseName => {
            const isSelected = selectedCourseNames.has(courseName);
            const card = document.createElement('div');
            card.style.cssText = `
                display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:14px;
                background:${isSelected ? '#F5F3FF' : '#fff'};
                border:1.5px solid ${isSelected ? '#7C3AED' : '#F0EBFF'};
                cursor:pointer;margin-bottom:8px;transition:all 0.15s;
                box-shadow:${isSelected ? '0 4px 14px rgba(124,58,237,0.12)' : '0 1px 4px rgba(0,0,0,0.04)'};`;

            card.innerHTML = `
                <div style="width:36px;height:36px;border-radius:10px;background:${isSelected ? 'linear-gradient(135deg,#7C3AED,#A78BFA)' : '#F5F3FF'};display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all 0.15s;">
                    <svg width="18" height="18" fill="none" stroke="${isSelected ? 'white' : '#A78BFA'}" stroke-width="2" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                    </svg>
                </div>
                <div style="flex:1;min-width:0;">
                    <p style="font-size:13px;font-weight:${isSelected ? '700' : '600'};color:${isSelected ? '#4C1D95' : '#374151'};line-height:1.35;">${courseName}</p>
                    <p style="font-size:10px;color:#A78BFA;font-weight:600;margin-top:2px;">IQT UMS</p>
                </div>
                <div style="width:22px;height:22px;border-radius:7px;border:2px solid ${isSelected ? '#7C3AED' : '#D1D5DB'};background:${isSelected ? '#7C3AED' : 'transparent'};display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all 0.15s;">
                    ${isSelected ? `<svg width="12" height="12" fill="none" stroke="white" stroke-width="3" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>` : ''}
                </div>`;

            card.addEventListener('click', () => {
                if (selectedCourseNames.has(courseName)) {
                    selectedCourseNames.delete(courseName);
                } else {
                    selectedCourseNames.add(courseName);
                }
                updateCourseCounter();
                renderCourses(type);
            });

            container.appendChild(card);
        });
    });
}

function updateCourseCounter() {
    const count = selectedCourseNames.size;
    const countEl = document.getElementById('course-count');
    if (countEl) countEl.textContent = count;

    const btn = document.getElementById('btn-save-courses');
    if (!btn) return;
    if (count === 0) {
        btn.disabled = true;
        btn.style.opacity = '0.5';
        btn.style.cursor = 'not-allowed';
    } else {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
    }
}

function getSelectedCourseNames() {
    return Array.from(selectedCourseNames);
}
