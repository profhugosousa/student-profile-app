document.addEventListener('DOMContentLoaded', () => {
    let rawData = [];
    const skillsList = ['Reading', 'Speaking', 'Writing', 'Grammar', 'Vocabulary', 'Independent Work', 'Groupwork', 'Listening'];

    let aggregateChart = null;
    let individualChart = null;

    const authScreen = document.getElementById('authScreen');
    const authForm = document.getElementById('authForm');
    const passkeyInput = document.getElementById('passkeyInput');
    const authError = document.getElementById('authError');

    // Check if passkey is cached in session
    const cachedKey = sessionStorage.getItem('dashboard_passkey');
    if (cachedKey) {
        attemptLogin(cachedKey);
    }

    authForm.addEventListener('submit', (e) => {
        e.preventDefault();
        attemptLogin(passkeyInput.value);
    });

    async function attemptLogin(key) {
        authError.classList.add('hidden');
        try {
            const res = await fetch(`${GOOGLE_SCRIPT_URL}?key=${encodeURIComponent(key)}`);
            const data = await res.json();

            if (data.error) {
                authError.innerText = "Invalid passkey. Access denied.";
                authError.classList.remove('hidden');
                sessionStorage.removeItem('dashboard_passkey');
                return;
            }

            // Success: Save key to session, hide lock screen, and load data
            sessionStorage.setItem('dashboard_passkey', key);
            rawData = data;
            authScreen.classList.add('hidden');
            initDashboard();

        } catch (err) {
            authError.innerText = "Error connecting to server. Please try again.";
            authError.classList.remove('hidden');
        }
    }

    function initDashboard() {
        const filterYear = document.getElementById('filterYear');
        const filterGroup = document.getElementById('filterGroup');
        const filterStudent = document.getElementById('filterStudent');

        function updateGroupFilter() {
            const year = filterYear.value;
            filterGroup.innerHTML = '<option value="ALL">All Groups</option>';
            let options = new Set();

            rawData.forEach(item => {
                if ((year === 'ALL' || item['Year'] === year) && item['Group']) {
                    options.add(item['Group']);
                }
            });

            Array.from(options).sort().forEach(g => {
                filterGroup.innerHTML += `<option value="${g}">${g}</option>`;
            });
        }

        function updateStudentFilter() {
            filterStudent.innerHTML = '<option value="ALL">-- Overview Mode --</option>';
            const filtered = getFilteredData();

            filtered.forEach((s, idx) => {
                filterStudent.innerHTML += `<option value="${idx}">${s['Student Name']} (${s['Student Email']})</option>`;
            });
        }

        function getFilteredData() {
            return rawData.filter(item => {
                const yearMatch = filterYear.value === 'ALL' || item['Year'] === filterYear.value;
                const groupMatch = filterGroup.value === 'ALL' || item['Group'] === filterGroup.value;
                return yearMatch && groupMatch;
            });
        }

        function renderOverview() {
            const filtered = getFilteredData();
            document.getElementById('overviewSection').classList.remove('hidden');
            document.getElementById('studentDetailSection').classList.add('hidden');

            const tbody = document.getElementById('studentTableBody');
            tbody.innerHTML = '';
            filtered.forEach(s => {
                const tr = document.createElement('tr');
                tr.className = 'border-b border-stone-300 hover:bg-stone-100';
                tr.innerHTML = `
          <td class="p-2 font-bold">${s['Student Name']}</td>
          <td class="p-2 text-xs">${s['Student Email']}</td>
          <td class="p-2">${s['Year']}</td>
          <td class="p-2">${s['Group']}</td>
          <td class="p-2"><button data-email="${s['Student Email']}" class="view-btn text-xs bg-stone-800 text-white px-2 py-1">View</button></td>
        `;
                tbody.appendChild(tr);
            });

            const averages = skillsList.map(skill => {
                if (!filtered.length) return 0;
                const sum = filtered.reduce((acc, curr) => acc + (parseFloat(curr[skill]) || 0), 0);
                return Math.round(sum / filtered.length);
            });

            if (aggregateChart) aggregateChart.destroy();
            aggregateChart = new Chart(document.getElementById('aggregateChart'), {
                type: 'radar',
                data: {
                    labels: skillsList,
                    datasets: [{
                        label: 'Cohort Average',
                        data: averages,
                        backgroundColor: 'rgba(41, 37, 36, 0.2)',
                        borderColor: 'rgba(41, 37, 36, 1)',
                        borderWidth: 2
                    }]
                },
                options: { scales: { r: { min: 0, max: 100 } } }
            });

            document.querySelectorAll('.view-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const email = e.target.dataset.email;
                    const studentIndex = filtered.findIndex(s => s['Student Email'] === email);
                    filterStudent.value = studentIndex;
                    renderIndividualStudent(filtered[studentIndex]);
                });
            });
        }

        function renderIndividualStudent(student) {
            document.getElementById('overviewSection').classList.add('hidden');
            document.getElementById('studentDetailSection').classList.remove('hidden');

            document.getElementById('detailName').innerText = student['Student Name'];
            document.getElementById('detailMeta').innerText = `${student['Student Email']} | Year: ${student['Year']} | Group: ${student['Group']}`;
            document.getElementById('detailHobbies').innerText = student['Hobbies'] || 'N/A';
            document.getElementById('detailPresentation').innerText = student['Presentation Topic'] || 'N/A';
            document.getElementById('detailWords').innerText = student['Three Words'] || 'N/A';

            const studentSkills = skillsList.map(skill => parseFloat(student[skill]) || 0);

            if (individualChart) individualChart.destroy();
            individualChart = new Chart(document.getElementById('individualChart'), {
                type: 'radar',
                data: {
                    labels: skillsList,
                    datasets: [{
                        label: `${student['Student Name']}'s Skills`,
                        data: studentSkills,
                        backgroundColor: 'rgba(79, 70, 229, 0.2)',
                        borderColor: 'rgba(79, 70, 229, 1)',
                        borderWidth: 2
                    }]
                },
                options: { scales: { r: { min: 0, max: 100 } } }
            });
        }

        filterYear.addEventListener('change', () => { updateGroupFilter(); updateStudentFilter(); renderOverview(); });
        filterGroup.addEventListener('change', () => { updateStudentFilter(); renderOverview(); });
        filterStudent.addEventListener('change', (e) => {
            if (e.target.value === 'ALL') renderOverview();
            else renderIndividualStudent(getFilteredData()[e.target.value]);
        });
        document.getElementById('closeDetailBtn').addEventListener('click', () => {
            filterStudent.value = 'ALL';
            renderOverview();
        });

        updateGroupFilter();
        updateStudentFilter();
        renderOverview();
    }
});