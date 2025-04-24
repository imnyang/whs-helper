document.addEventListener('DOMContentLoaded', () => {
    // 상태 관리 객체
    const options = {
      splitTable: true,
      submittedStrike: true,
      showExpiredUnsubmitted: true
    };
  
    // DOM 요소 캐싱
    const toggles = {
      splitTable: document.getElementById('splitTableToggle'),
      submittedStrike: document.getElementById('submittedStrikeToggle'),
      showExpiredUnsubmitted: document.getElementById('showExpiredUnsubmittedToggle')
    };
  
    // 상태 로드 함수
    const loadOptions = () => {
      chrome.storage.local.get(Object.keys(options), (data) => {
        Object.entries(data).forEach(([key, value]) => {
          if (toggles[key]) {
            toggles[key].checked = !!value;
            toggles[key].setAttribute('aria-checked', !!value);
          }
        });
      });
    };
  
    // 상태 저장 함수
    const saveOptions = (key, value) => {
      chrome.storage.local.set({ [key]: value }, () => {
        // 현재 탭에 실시간 업데이트 명령 전송
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: 'UPDATE_SETTINGS',
            [key]: value
          });
        });
      });
    };
  
    // 이벤트 핸들러 등록
    Object.entries(toggles).forEach(([key, element]) => {
      element.addEventListener('change', (e) => {
        const value = e.target.checked;
        saveOptions(key, value);
        element.setAttribute('aria-checked', value);
      });
    });
  
    // 초기 상태 로드
    loadOptions();
  });
  