const { ipcRenderer } = require('electron');

let currentViewDate = new Date();
let events = {};
let selectedDate = null;

async function init() {
    events = await ipcRenderer.invoke('get-events');
    const now = new Date();
    selectedDate = formatDate(now);
    renderCalendar();
    showEvents(selectedDate);
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function renderCalendar() {
    const year = currentViewDate.getFullYear();
    const month = currentViewDate.getMonth();
    document.getElementById('monthDisplay').innerText = 
        `${new Intl.DateTimeFormat('en-US', { month: 'long' }).format(currentViewDate)} ${year}`;

    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    const grid = document.getElementById('daysGrid');
    grid.innerHTML = '';

    for (let i = 0; i < firstDay; i++) grid.appendChild(document.createElement('div'));

    for (let i = 1; i <= lastDate; i++) {
        const dayEl = document.createElement('div');
        dayEl.className = 'day';
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        
        dayEl.innerText = i;
        if (events[dateStr] && events[dateStr].length > 0) dayEl.classList.add('has-event');
        if (dateStr === selectedDate) dayEl.classList.add('selected');
        
        const now = new Date();
        if (i === now.getDate() && month === now.getMonth() && year === now.getFullYear()) {
            dayEl.classList.add('today');
        }

        dayEl.onclick = () => {
            selectedDate = dateStr;
            renderCalendar();
            showEvents(dateStr);
        };
        grid.appendChild(dayEl);
    }
}

function showEvents(date) {
    document.getElementById('selectedDateText').innerText = `Plan for ${date}`;
    const list = document.getElementById('eventList');
    list.innerHTML = '';
    
    const dayEvents = events[date] || [];
    dayEvents.forEach((text, index) => {
        const li = document.createElement('li');
        li.className = 'event-item';
        li.innerHTML = `
            <span>${text}</span>
            <button class="del-btn" onclick="deleteEvent('${date}', ${index})">×</button>
        `;
        list.appendChild(li);
    });
}

// 전역 함수로 등록 (onclick 사용을 위함)
window.deleteEvent = (date, index) => {
    events[date].splice(index, 1);
    if (events[date].length === 0) delete events[date];
    
    // 파일에 저장 (전체 데이터 업데이트)
    // main.js에 전체 저장 로직이 없다면 아래처럼 새로 정의 가능
    ipcRenderer.send('update-all-events', events); 
    renderCalendar();
    showEvents(date);
};

document.getElementById('addBtn').onclick = () => {
    const text = document.getElementById('eventInput').value;
    if (!text || !selectedDate) return;
    
    ipcRenderer.send('save-event', { date: selectedDate, text });
    if (!events[selectedDate]) events[selectedDate] = [];
    events[selectedDate].push(text);
    
    document.getElementById('eventInput').value = '';
    renderCalendar();
    showEvents(selectedDate);
};

// 월 이동 버튼
document.getElementById('prevMonth').onclick = () => { currentViewDate.setMonth(currentViewDate.getMonth() - 1); renderCalendar(); };
document.getElementById('nextMonth').onclick = () => { currentViewDate.setMonth(currentViewDate.getMonth() + 1); renderCalendar(); };

init();