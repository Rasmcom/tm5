document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll('.sidebar .nav-link');
    const pages = document.querySelectorAll('.content .page');

    // Function to switch pages
    function switchPage(targetId) {
        // Handle active state for navigation links
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${targetId}`) {
                link.classList.add('active');
            }
        });

        // Handle page visibility
        pages.forEach(page => {
            if (page.id === targetId) {
                page.classList.add('active');
            } else {
                page.classList.remove('active');
            }
        });
    }

    // Add click event listener to each navigation link
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default anchor behavior
            const targetId = link.getAttribute('href').substring(1); // Get id from href (e.g., "home")
            switchPage(targetId);
        });
    });

    // Initially show the 'home' page
    switchPage('home');

    // --- Header Info Form Logic (Now with Firebase) ---
    const infoForm = document.getElementById('info-form');

    const teacherNameInput = document.getElementById('teacher-name');
    const adminNameInput = document.getElementById('admin-name');
    const schoolNameInput = document.getElementById('school-name');
    const academicYearInput = document.getElementById('academic-year');

    const headerTeacherName = document.getElementById('header-teacher-name');
    const headerAdmin = document.getElementById('header-admin');
    const headerSchool = document.getElementById('header-school');
    const headerYear = document.getElementById('header-year');

    function updateHeader(data) {
        headerTeacherName.textContent = data.teacherName || '';
        headerAdmin.textContent = data.adminName || '';
        headerSchool.textContent = data.schoolName || '';
        headerYear.textContent = data.academicYear || '';
    }

    function populateForm(data) {
        teacherNameInput.value = data.teacherName || '';
        adminNameInput.value = data.adminName || '';
        schoolNameInput.value = data.schoolName || '';
        academicYearInput.value = data.academicYear || '';
    }

    async function saveTeacherInfo(data) {
        try {
            await db.collection('portfolio').doc('teacherInfo').set(data, { merge: true });
            console.log("Teacher info saved successfully!");
            return true;
        } catch (error) {
            console.error("Error saving teacher info: ", error);
            return false;
        }
    }

    async function loadTeacherInfo() {
        try {
            const doc = await db.collection('portfolio').doc('teacherInfo').get();
            if (doc.exists) {
                const data = doc.data();
                updateHeader(data);
                populateForm(data);
                console.log("Teacher info loaded successfully!");
            } else {
                console.log("No teacher info document found.");
            }
        } catch (error) {
            console.error("Error loading teacher info: ", error);
        }
    }

    infoForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            teacherName: teacherNameInput.value,
            adminName: adminNameInput.value,
            schoolName: schoolNameInput.value,
            academicYear: academicYearInput.value,
        };

        const btn = infoForm.querySelector('.btn');
        const originalText = btn.textContent;
        btn.textContent = 'جاري الحفظ...';
        btn.disabled = true;

        const success = await saveTeacherInfo(data);

        if (success) {
            updateHeader(data);
            btn.textContent = 'تم الحفظ بنجاح!';
        } else {
            btn.textContent = 'خطأ في الحفظ';
        }

        setTimeout(() => {
            btn.textContent = originalText;
            btn.disabled = false;
        }, 2000);
    });

    // Load initial data from Firebase
    loadTeacherInfo();

    // --- CV Page Logic (Now with Firebase) ---
    const cvNameInput = document.getElementById('cv-name');
    const cvIdInput = document.getElementById('cv-id');
    const cvSpecializationInput = document.getElementById('cv-specialization');

    const licenseUpload = document.getElementById('license-upload');
    const licensePreview = document.getElementById('license-preview');
    const certUpload = document.getElementById('cert-upload');
    const certsPreview = document.getElementById('certs-preview');

    const addCourseBtn = document.getElementById('add-course-btn');
    const coursesList = document.getElementById('courses-list');
    const courseNameInput = document.getElementById('course-name');
    const courseProviderInput = document.getElementById('course-provider');
    const courseDateInput = document.getElementById('course-date');

    let localCourses = [];

    // Helper function to upload a file and get its URL
    async function uploadFile(file, path) {
        try {
            const ref = storage.ref().child(path);
            const snapshot = await ref.put(file);
            const url = await snapshot.ref.getDownloadURL();
            return url;
        } catch (error) {
            console.error(`Error uploading file ${file.name}:`, error);
            return null;
        }
    }

    // Professional License Upload
    licenseUpload.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        licensePreview.innerHTML = `<p>جاري رفع الرخصة...</p>`;
        const filePath = `license/${Date.now()}-${file.name}`;
        const url = await uploadFile(file, filePath);

        if (url) {
            await db.collection('portfolio').doc('cvData').set({ licenseUrl: url }, { merge: true });
            licensePreview.innerHTML = `<img src="${url}" alt="معاينة الرخصة المهنية">`;
        } else {
            licensePreview.innerHTML = `<p>فشل رفع الصورة.</p>`;
        }
    });

    // Certificates Upload
    certUpload.addEventListener('change', async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        if (files.length > 8) {
            alert('لا يمكن رفع أكثر من 8 شهادات.');
            return;
        }

        certsPreview.innerHTML = `<p>جاري رفع الشهادات...</p>`;
        const uploadPromises = files.map(file => {
            const filePath = `certificates/${Date.now()}-${file.name}`;
            return uploadFile(file, filePath);
        });

        const urls = await Promise.all(uploadPromises);
        const validUrls = urls.filter(url => url !== null);

        if (validUrls.length > 0) {
            await db.collection('portfolio').doc('cvData').update({
                certificateUrls: firebase.firestore.FieldValue.arrayUnion(...validUrls)
            });
            // Reload certs to show all
            loadCvData();
        } else {
            certsPreview.innerHTML = `<p>فشل رفع الشهادات.</p>`;
        }
    });

    async function saveCourses() {
        // Basic CV data is also saved here
        const cvBasicData = {
            cvName: cvNameInput.value,
            cvId: cvIdInput.value,
            cvSpecialization: cvSpecializationInput.value,
        };
        await db.collection('portfolio').doc('teacherInfo').set(cvBasicData, { merge: true });
        await db.collection('portfolio').doc('cvData').set({ courses: localCourses }, { merge: true });
    }

    function renderCourses() {
        coursesList.innerHTML = '';
        localCourses.forEach((course, index) => {
            const courseItem = document.createElement('div');
            courseItem.classList.add('course-item');
            courseItem.innerHTML = `
                <span><strong>${course.name}</strong> - ${course.provider} (${course.date})</span>
                <button class="delete-btn" data-index="${index}">حذف</button>
            `;
            coursesList.appendChild(courseItem);
        });
    }

    addCourseBtn.addEventListener('click', () => {
        const name = courseNameInput.value.trim();
        const provider = courseProviderInput.value.trim();
        const date = courseDateInput.value.trim();

        if (name && provider && date) {
            localCourses.push({ name, provider, date });
            renderCourses();
            saveCourses(); // Auto-save on add
            courseNameInput.value = '';
            courseProviderInput.value = '';
            courseDateInput.value = '';
        } else {
            alert('الرجاء ملء جميع حقول الدورة التدريبية.');
        }
    });

    coursesList.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const index = parseInt(e.target.dataset.index, 10);
            localCourses.splice(index, 1);
            renderCourses();
            saveCourses(); // Auto-save on delete
        }
    });

    async function loadCvData() {
        try {
            const doc = await db.collection('portfolio').doc('cvData').get();
            if (!doc.exists) return;

            const data = doc.data();
            // Load license
            if (data.licenseUrl) {
                licensePreview.innerHTML = `<img src="${data.licenseUrl}" alt="معاينة الرخصة المهنية">`;
            }
            // Load certificates
            if (data.certificateUrls && data.certificateUrls.length > 0) {
                certsPreview.innerHTML = '';
                data.certificateUrls.forEach(url => {
                    const img = document.createElement('img');
                    img.src = url;
                    img.classList.add('thumbnail');
                    certsPreview.appendChild(img);
                });
            }
            // Load courses
            if (data.courses) {
                localCourses = data.courses;
                renderCourses();
            }
        } catch(error) {
            console.error("Error loading CV data:", error);
        }
    }

    // Also load the basic info into the CV form
    async function loadTeacherInfoIntoCv() {
        const doc = await db.collection('portfolio').doc('teacherInfo').get();
        if (doc.exists) {
            const data = doc.data();
            cvNameInput.value = data.cvName || data.teacherName || '';
            cvIdInput.value = data.cvId || '';
            cvSpecializationInput.value = data.cvSpecialization || '';
        }
    }

    // Add a listener to save basic CV data when it changes
    [cvNameInput, cvIdInput, cvSpecializationInput].forEach(input => {
        input.addEventListener('change', saveCourses);
    });

    // Initial Load for CV Page
    loadCvData();
    loadTeacherInfoIntoCv();

    // --- Evidence Page Logic (Now with Firebase) ---
    const evidenceContainer = document.querySelector('.evidence-container');
    const totalScoreEl = document.getElementById('total-score');

    function calculateTotalScore() {
        let totalScore = 0;
        const evidenceItems = document.querySelectorAll('.evidence-item');
        evidenceItems.forEach(item => {
            const weight = parseFloat(item.dataset.weight);
            const checkedRadio = item.querySelector('input[type="radio"]:checked');
            if (checkedRadio) {
                const rating = parseFloat(checkedRadio.value);
                totalScore += (rating / 5) * weight;
            }
        });
        totalScoreEl.textContent = totalScore.toFixed(2);
    }

    async function saveEvidenceData(itemId, data) {
        try {
            await db.collection('evidence').doc(itemId).set(data, { merge: true });
        } catch (error) {
            console.error(`Error saving data for ${itemId}:`, error);
        }
    }

    evidenceContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('note-icon')) {
            const noteArea = e.target.closest('.evidence-header').nextElementSibling;
            noteArea.style.display = noteArea.style.display === 'block' ? 'none' : 'block';
        }
        if (e.target.classList.contains('btn-small')) {
            e.target.closest('.form-group').querySelector('.evidence-upload').click();
        }
    });

    evidenceContainer.addEventListener('change', async (e) => {
        const item = e.target.closest('.evidence-item');
        if (!item) return;
        const itemId = `item-${item.querySelector('h4').textContent.split('.')[0]}`;

        // Handle rating change
        if (e.target.matches('input[type="radio"]')) {
            calculateTotalScore();
            saveEvidenceData(itemId, { rating: parseInt(e.target.value, 10) });
        }

        // Handle note change
        if (e.target.matches('.note-area')) {
            saveEvidenceData(itemId, { note: e.target.value });
        }

        // Handle file upload
        if (e.target.classList.contains('evidence-upload')) {
            const previewGrid = item.querySelector('.evidence-preview-grid');
            previewGrid.innerHTML = '<p>جاري رفع الشواهد...</p>';

            const files = Array.from(e.target.files);
            const uploadPromises = files.map(file => {
                const filePath = `evidence/${itemId}/${Date.now()}-${file.name}`;
                return uploadFile(file, filePath);
            });

            const urls = await Promise.all(uploadPromises);
            const validUrls = urls.filter(url => url !== null);

            if (validUrls.length > 0) {
                await db.collection('evidence').doc(itemId).update({
                    evidenceUrls: firebase.firestore.FieldValue.arrayUnion(...validUrls)
                });
                loadEvidenceData(); // Reload to show all evidence for this item
            } else {
                previewGrid.innerHTML = '<p>فشل رفع الشواهد.</p>';
            }
        }
    });

    async function loadEvidenceData() {
        const querySnapshot = await db.collection('evidence').get();
        querySnapshot.forEach(doc => {
            const itemId = doc.id; // e.g., "item-1"
            const itemIndex = parseInt(itemId.split('-')[1], 10);
            const itemEl = evidenceContainer.querySelector(`.evidence-item:nth-child(${itemIndex})`);

            if (itemEl) {
                const data = doc.data();
                // Load rating
                if (data.rating) {
                    const radio = itemEl.querySelector(`input[value="${data.rating}"]`);
                    if (radio) radio.checked = true;
                }
                // Load note
                if (data.note) {
                    itemEl.querySelector('.note-area').value = data.note;
                }
                // Load evidence previews
                if (data.evidenceUrls && data.evidenceUrls.length > 0) {
                    const previewGrid = itemEl.querySelector('.evidence-preview-grid');
                    previewGrid.innerHTML = '';
                    data.evidenceUrls.forEach(url => {
                        const img = document.createElement('img');
                        img.src = url;
                        img.classList.add('thumbnail');
                        previewGrid.appendChild(img);
                    });
                }
            }
        });
        calculateTotalScore(); // Calculate score after loading all data
    }

    // Initial Load for Evidence Page
    loadEvidenceData();

    // --- Follow-up Page Logic ---
    const addFollowupBtn = document.getElementById('add-followup-btn');
    const followupList = document.getElementById('followup-list');

    async function saveFollowup(data) {
        try {
            // Add a timestamp for ordering
            const dataToSave = { ...data, createdAt: firebase.firestore.FieldValue.serverTimestamp() };
            await db.collection('followups').add(dataToSave);
            loadFollowups(); // Refresh list
        } catch (error) {
            console.error("Error saving followup:", error);
        }
    }

    async function loadFollowups() {
        try {
            followupList.innerHTML = ''; // Clear list
            const querySnapshot = await db.collection('followups').orderBy('createdAt', 'desc').get();
            querySnapshot.forEach(doc => {
                const followup = doc.data();
                const item = document.createElement('div');
                item.classList.add('followup-item');
                item.innerHTML = `
                    <h4>متابعة من: ${followup.followerName}</h4>
                    <p><strong>الملاحظات:</strong> ${followup.notes}</p>
                    <p><strong>التوصيات:</strong> ${followup.recommendations}</p>
                    <div class="meta">
                        <span>${followup.date}</span>
                        <button class="delete-btn-small" data-id="${doc.id}">حذف</button>
                    </div>
                `;
                followupList.appendChild(item);
            });
        } catch (error) {
            console.error("Error loading followups:", error);
        }
    }

    async function deleteFollowup(id) {
        try {
            await db.collection('followups').doc(id).delete();
            loadFollowups(); // Refresh list
        } catch (error) {
            console.error("Error deleting followup:", error);
        }
    }

    addFollowupBtn.addEventListener('click', () => {
        const notes = document.getElementById('followup-notes').value;
        const recommendations = document.getElementById('followup-recs').value;
        const followerName = document.getElementById('follower-name').value;
        const date = document.getElementById('followup-date').value;

        if (notes && recommendations && followerName && date) {
            saveFollowup({ notes, recommendations, followerName, date });
            // Clear form
            document.getElementById('followup-notes').value = '';
            document.getElementById('followup-recs').value = '';
            document.getElementById('follower-name').value = '';
            document.getElementById('followup-date').value = '';
        } else {
            alert('الرجاء ملء جميع حقول المتابعة.');
        }
    });

    followupList.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-btn-small')) {
            const id = e.target.dataset.id;
            if (confirm('هل أنت متأكد من حذف هذه المتابعة؟')) {
                deleteFollowup(id);
            }
        }
    });

    // Initial Load for Follow-up Page
    loadFollowups();

    // --- Improvement Plan Page Logic ---
    const addImprovementBtn = document.getElementById('add-improvement-btn');
    const improvementList = document.getElementById('improvement-list');
    const improvementAreaSelect = document.getElementById('improvement-area');

    const evidenceAreas = [
        "أداء الواجبات الوظيفية", "التفاعل مع المجتمع المهني", "التفاعل مع أولياء الأمور",
        "تنويع استراتيجيات التدريس", "تحسين نتائج المتعلمين", "إعداد وتنفيذ خطة التعلم",
        "توظيف التقنيات والوسائل", "تهيئة البيئة التعليمية", "الإدارة الصفية",
        "تحليل نتائج المتعلمين", "تنوع أساليب التقويم"
    ];

    function populateImprovementAreas() {
        evidenceAreas.forEach(area => {
            const option = document.createElement('option');
            option.value = area;
            option.textContent = area;
            improvementAreaSelect.appendChild(option);
        });
    }

    async function saveImprovementPlan(data) {
        try {
            const dataToSave = { ...data, createdAt: firebase.firestore.FieldValue.serverTimestamp() };
            await db.collection('improvementPlans').add(dataToSave);
            loadImprovementPlans(); // Refresh list
        } catch (error) {
            console.error("Error saving improvement plan:", error);
        }
    }

    async function loadImprovementPlans() {
        try {
            improvementList.innerHTML = ''; // Clear list
            const querySnapshot = await db.collection('improvementPlans').orderBy('createdAt', 'desc').get();
            querySnapshot.forEach(doc => {
                const plan = doc.data();
                const item = document.createElement('div');
                item.classList.add('improvement-item');
                item.innerHTML = `
                    <h4>${plan.area} (الأولوية: ${plan.priority})</h4>
                    <p><strong>الهدف:</strong> ${plan.goal}</p>
                    <p><strong>الإجراءات:</strong> ${plan.actions}</p>
                    <div class="meta">
                        <span>من ${plan.startDate} إلى ${plan.endDate}</span>
                        <button class="delete-btn-small" data-id="${doc.id}">حذف</button>
                    </div>
                `;
                improvementList.appendChild(item);
            });
        } catch (error) {
            console.error("Error loading improvement plans:", error);
        }
    }

    async function deleteImprovementPlan(id) {
        try {
            await db.collection('improvementPlans').doc(id).delete();
            loadImprovementPlans(); // Refresh list
        } catch (error) {
            console.error("Error deleting improvement plan:", error);
        }
    }

    addImprovementBtn.addEventListener('click', () => {
        const area = document.getElementById('improvement-area').value;
        const priority = document.getElementById('improvement-priority').value;
        const goal = document.getElementById('improvement-goal').value;
        const actions = document.getElementById('improvement-actions').value;
        const startDate = document.getElementById('improvement-start-date').value;
        const endDate = document.getElementById('improvement-end-date').value;

        if (area && goal && actions && startDate && endDate) {
            saveImprovementPlan({ area, priority, goal, actions, startDate, endDate });
            // Clear form
            document.getElementById('improvement-area').value = '';
            document.getElementById('improvement-goal').value = '';
            document.getElementById('improvement-actions').value = '';
        } else {
            alert('الرجاء ملء جميع حقول الخطة.');
        }
    });

    improvementList.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-btn-small')) {
            const id = e.target.dataset.id;
            if (confirm('هل أنت متأكد من حذف هذه الخطة؟')) {
                deleteImprovementPlan(id);
            }
        }
    });

    // Initial Load for Improvement Plan Page
    populateImprovementAreas();
    loadImprovementPlans();
});
