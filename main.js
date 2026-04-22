const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

// 일정 저장 파일 경로: 사용자 홈 디렉토리의 .melo_events.json
const EVENTS_FILE = path.join(os.homedir(), '.melo_events.json');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 650,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    title: "Melo Calendar",
    // 윈도우 메뉴바를 숨기고 싶다면 아래 주석을 해제하세요.
    // autoHideMenuBar: true 
  });

  mainWindow.loadFile('index.html');

  // 개발자 도구를 열고 싶다면 아래 주석을 해제하세요.
  // mainWindow.webContents.openDevTools();
}

// 1. 저장된 모든 일정 가져오기
ipcMain.handle('get-events', () => {
  if (!fs.existsSync(EVENTS_FILE)) {
    return {};
  }
  try {
    const data = fs.readFileSync(EVENTS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error("Failed to read events:", error);
    return {};
  }
});

// 2. 새로운 일정 추가 저장
ipcMain.on('save-event', (event, data) => {
  let events = {};
  if (fs.existsSync(EVENTS_FILE)) {
    events = JSON.parse(fs.readFileSync(EVENTS_FILE, 'utf8'));
  }

  if (!events[data.date]) {
    events[data.date] = [];
  }
  events[data.date].push(data.text);

  fs.writeFileSync(EVENTS_FILE, JSON.stringify(events, null, 2));
});

// 3. 전체 일정 데이터 업데이트 (삭제 시 사용)
ipcMain.on('update-all-events', (event, newEvents) => {
  try {
    fs.writeFileSync(EVENTS_FILE, JSON.stringify(newEvents, null, 2));
  } catch (error) {
    console.error("Failed to update events:", error);
  }
});

// 앱 생명주기 관리
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});