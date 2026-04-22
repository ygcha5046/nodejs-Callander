#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');

const EVENTS_FILE = path.join(os.homedir(), '.melo_events.json');

function loadEvents() {
    if (!fs.existsSync(EVENTS_FILE)) return {};
    try {
        const data = fs.readFileSync(EVENTS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (e) {
        return {};
    }
}

function saveEvents(events) {
    fs.writeFileSync(EVENTS_FILE, JSON.stringify(events, null, 2));
}

const args = process.argv.slice(2);
const command = args[0];

if (command === 'add') {
    const dateStr = args[1];
    const eventTitle = args.slice(2).join(' ');
    if (!dateStr || !eventTitle) {
        console.log("Usage: melo add YYYY-MM-DD Event description");
        process.exit(1);
    }
    const events = loadEvents();
    if (!events[dateStr]) events[dateStr] = [];
    events[dateStr].push(eventTitle);
    saveEvents(events);
    console.log(`[Success] Event added on ${dateStr}`);

} else if (command === 'del') {
    const dateStr = args[1];
    const events = loadEvents();
    if (!dateStr) {
        console.log("Usage: melo del YYYY-MM-DD or melo del all");
        process.exit(1);
    }
    if (dateStr === 'all') {
        saveEvents({});
        console.log("[Success] All events cleared.");
    } else if (events[dateStr]) {
        delete events[dateStr];
        saveEvents(events);
        console.log(`[Success] Deleted all events on ${dateStr}`);
    } else {
        console.log(`[Info] No events found on ${dateStr}`);
    }

} else if (command === 'list') {
    const events = loadEvents();
    console.log("\n--- Melo Event List ---");
    const dates = Object.keys(events).sort();
    if (dates.length === 0) {
        console.log("Empty list.");
    } else {
        dates.forEach(date => {
            console.log(`\n[ ${date} ]`);
            events[date].forEach(event => console.log(`  - ${event}`));
        });
    }
    console.log("\n-----------------------\n");

} else {
    // 달력 출력 모드 (기본, 이전 달, 다음 달)
    const now = new Date();
    let viewYear = now.getFullYear();
    let viewMonth = now.getMonth();

    // 명령어 인자에 따른 달 이동 (melo > 또는 melo <)
    // 터미널 특성에 따라 ">"가 직접 안 올 수도 있어 유연하게 체크
    if (args.includes('>') || args.includes('next')) {
        viewMonth += 1;
    } else if (args.includes('<') || args.includes('prev')) {
        viewMonth -= 1;
    }

    const viewDate = new Date(viewYear, viewMonth, 1);
    viewYear = viewDate.getFullYear();
    viewMonth = viewDate.getMonth();

    const today = now.getDate();
    const isCurrentMonth = (now.getFullYear() === viewYear && now.getMonth() === viewMonth);
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(today).padStart(2, '0')}`;
    
    const events = loadEvents();
    const firstDay = viewDate.getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    console.log(`\n      Melo - ${monthNames[viewMonth]} ${viewYear}      \n`);
    console.log(" Su Mo Tu We Th Fr Sa");

    let calendarOutput = "";
    for (let i = 0; i < firstDay; i++) calendarOutput += "   ";

    for (let i = 1; i <= daysInMonth; i++) {
        let dayString = i.toString().padStart(2, " ");
        let checkDateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        let hasEvent = events[checkDateStr] && events[checkDateStr].length > 0;
        
        if (isCurrentMonth && i === today) {
            calendarOutput += hasEvent ? `\x1b[46m\x1b[30m${dayString}\x1b[0m ` : `\x1b[36m${dayString}\x1b[0m `;
        } else if (hasEvent) {
            calendarOutput += `\x1b[33m${dayString}\x1b[0m `;
        } else {
            calendarOutput += `${dayString} `;
        }

        if ((i + firstDay) % 7 === 0) calendarOutput += "\n";
    }

    console.log(calendarOutput);
    console.log("\n  * Use '<' or '>' to change months");
    console.log("  * Cyan: Today  |  Yellow: Event Day\n");

    if (isCurrentMonth && events[todayStr]) {
        console.log(`\x1b[36m[ Today's Schedule ]\x1b[0m`);
        events[todayStr].forEach(e => console.log(` - ${e}`));
        console.log();
    }
}