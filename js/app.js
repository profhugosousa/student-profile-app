document.addEventListener('DOMContentLoaded', () => {
    const categories = ['Reading', 'Speaking', 'Writing', 'Grammar', 'Vocabulary', 'Independent Work', 'Groupwork', 'Listening'];
    const skillValues = { Reading: 50, Speaking: 50, Writing: 50, Grammar: 50, Vocabulary: 50, 'Independent Work': 50, Groupwork: 50, Listening: 50 };

    // --- Dynamic Group Selection Logic ---
    const yearSelect = document.getElementById('studentYear');
    const groupSelect = document.getElementById('studentGroup');

    yearSelect.addEventListener('change', () => {
        const selectedYear = yearSelect.value;
        groupSelect.innerHTML = '<option value="" disabled selected>Select</option>';
        groupSelect.disabled = false;

        if (selectedYear === '10.º') {
            // Letters A to Z for 10.º Year
            for (let i = 65; i <= 90; i++) {
                const letter = String.fromCharCode(i);
                const opt = document.createElement('option');
                opt.value = letter;
                opt.textContent = letter;
                groupSelect.appendChild(opt);
            }
        } else if (selectedYear === '7.º' || selectedYear === '9.º') {
            // Numbers 1 to 10 for 7.º and 9.º Years
            for (let i = 1; i <= 10; i++) {
                const opt = document.createElement('option');
                opt.value = i.toString();
                opt.textContent = i;
                groupSelect.appendChild(opt);
            }
        }
    });

    // --- 1. Build Control Sliders for the Wheel ---
    const wheelControls = document.getElementById('wheelControls');
    categories.forEach((cat) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'flex flex-col gap-1';
        wrapper.innerHTML = `
      <div class="flex justify-between font-semibold">
        <span>${cat}</span>
        <span id="val-${cat}">${skillValues[cat]}%</span>
      </div>
      <input type="range" min="25" max="100" step="25" value="${skillValues[cat]}" data-cat="${cat}" class="wheel-slider accent-stone-800">
    `;
        wheelControls.appendChild(wrapper);
    });

    // --- 2. Initialize Radar Chart ---
    const ctx = document.getElementById('wheelChart').getContext('2d');
    const radarChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: categories,
            datasets: [{
                label: 'Skill Level',
                data: Object.values(skillValues),
                backgroundColor: 'rgba(41, 37, 36, 0.2)',
                borderColor: 'rgba(41, 37, 36, 1)',
                borderWidth: 2,
                pointBackgroundColor: 'rgba(41, 37, 36, 1)'
            }]
        },
        options: {
            scales: {
                r: {
                    min: 0,
                    max: 100,
                    ticks: { stepSize: 25, display: false },
                    grid: { color: '#a8a29e' }
                }
            },
            plugins: { legend: { display: false } }
        }
    });

    // --- 3. Sync Sliders with Radar Chart ---
    document.querySelectorAll('.wheel-slider').forEach((slider) => {
        slider.addEventListener('input', (e) => {
            const cat = e.target.dataset.cat;
            const val = parseInt(e.target.value, 10);
            skillValues[cat] = val;
            document.getElementById(`val-${cat}`).innerText = `${val}%`;
            radarChart.data.datasets[0].data = categories.map((c) => skillValues[c]);
            radarChart.update();
        });
    });

    // --- 4. Form Submission Handling ---
    const form = document.getElementById('worksheetForm');
    const modal = document.getElementById('statusModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    const modalCloseBtn = document.getElementById('modalCloseBtn');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const payload = {
            studentName: document.getElementById('studentName')?.value || '',
            studentEmail: document.getElementById('studentEmail')?.value || '',
            studentYear: yearSelect?.value || '',
            studentGroup: groupSelect?.value || '',
            hobbies: document.getElementById('hobbies')?.value || '',
            presentation: document.getElementById('presentation')?.value || '',
            skills: skillValues,
            wheelComments: document.getElementById('wheelComments')?.value || '',
            lessonInThis: document.getElementById('lessonInThis')?.value || '',
            lessonStudents: document.getElementById('lessonStudents')?.value || '',
            lessonTeacher: document.getElementById('lessonTeacher')?.value || '',
            threeWords: document.getElementById('threeWords')?.value || '',
            submittedAt: new Date().toISOString()
        };

        modal.classList.remove('hidden');
        modalTitle.innerText = 'Submitting...';
        modalMessage.innerText = 'Please wait while your answers are saved.';
        modalCloseBtn.classList.add('hidden');

        try {
            await sendWorksheetToGoogleSheets(payload);
            modalTitle.innerText = 'Submitted!';
            modalMessage.innerText = 'Your worksheet has been saved successfully.';
            form.reset();
            groupSelect.innerHTML = '<option value="" disabled selected>-</option>';
            groupSelect.disabled = true;
        } catch (err) {
            modalTitle.innerText = 'Error';
            modalMessage.innerText = 'Failed to submit. Please try again.';
        } finally {
            modalCloseBtn.classList.remove('hidden');
        }
    });

    modalCloseBtn.addEventListener('click', () => modal.classList.add('hidden'));
});