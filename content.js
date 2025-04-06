(function() {
    // 과제목록 재정렬하기 (사실 이게 메인이었음)
    function sortAndStyleAssignmentList() {
      const table = document.querySelector('.table_basics_area');
      if (!table) return;
      const tbody = table.querySelector('tbody');
      if (!tbody) return;
      const rows = Array.from(tbody.querySelectorAll('tr'));
  
      // 제출 마감 시간이 "00:00"이면 전날 23:59로 간주하자
      // 이거 솔직히 조금 악질이라 생각해요
      function parseDeadline(dateStr) {
        const [datePart, timePart] = dateStr.trim().split(' ');
        const [year, month, day] = datePart.split('.').map(Number);
        if (timePart === "00:00") { // 00시 00분이 마감이라면 !!
          const prevDay = new Date(year, month - 1, day); // 그 전날 23:59로 설정
          prevDay.setDate(prevDay.getDate() - 1);
          prevDay.setHours(23, 59, 0, 0);
          return prevDay;
        } else {
          const [hour, minute] = timePart.split(':').map(Number);
          return new Date(year, month - 1, day, hour, minute);
        }
      }
  
      // 날짜 "YYYY.MM.DD HH:mm" 형식으로 다시 변환
      function formatDate(date) {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const hour = date.getHours().toString().padStart(2, '0');
        const minute = date.getMinutes().toString().padStart(2, '0');
        return `${year}.${month}.${day} ${hour}:${minute}`;
      }
  
      // 제출기간(세 번째 셀 "~" 뒤 부분)을 기준으로 오름차순 정렬
      rows.sort((a, b) => {
        const aText = a.cells[2].textContent.trim();
        const bText = b.cells[2].textContent.trim();
        const aDeadlineStr = aText.split('~')[1]?.trim() || "";
        const bDeadlineStr = bText.split('~')[1]?.trim() || "";
        const aDeadline = parseDeadline(aDeadlineStr);
        const bDeadline = parseDeadline(bDeadlineStr);
        return aDeadline - bDeadline;
      });
  
      // 현재 날짜 받아오기
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
      // 번호 다시 할당하기 !!
      rows.forEach((row, idx) => {
        const numCell = row.querySelector(".num");
        if(numCell) {
          numCell.textContent = idx + 1;
        }
      });
  
      rows.forEach(row => {
        tbody.appendChild(row);
        const statusCell = row.cells[3];   // 제출현황 셀
        const periodCell = row.cells[2];     // 제출기간 셀
        const periodText = periodCell.textContent.trim();
        const deadlineStr = periodText.split('~')[1]?.trim() || "";
        if (!deadlineStr) return;
        const deadline = parseDeadline(deadlineStr);
        const deadlineDate = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate());
        const diffDays = (deadlineDate - today) / (24 * 60 * 60 * 1000);
        
        // 남은 시간 계산하기
        const diffMs = deadline - new Date();
        let remainingStr = "";
        if(diffMs > 0) {
          if(diffMs >= 24 * 60 * 60 * 1000) {
            const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
            remainingStr = ` (${days}일 전)`;
          } else {
            const hours = Math.floor(diffMs / (1000 * 60 * 60));
            const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            remainingStr = ` (${hours}시간 ${minutes}분 전)`;
          }
        } else {
          remainingStr = " (마감됨)";
        }
        const formattedDeadline = formatDate(deadline);
        periodCell.textContent = formattedDeadline + remainingStr;
  
        // tr에 스타일 적용 (좁은 화면) & td에 스타일 적용 (넓은 화면)
        function applyStyle(property, value) {
          row.style.setProperty(property, value, "important");
          row.querySelectorAll("td").forEach(td => {
            td.style.setProperty(property, value, "important");
          });
        }
        function applyStyleMultiple(styles) {
          for (const [prop, val] of Object.entries(styles)) {
            row.style.setProperty(prop, val, "important");
            row.querySelectorAll("td").forEach(td => {
              td.style.setProperty(prop, val, "important");
            });
          }
        }
  
        // CSS 스타일 적용하기
        if (statusCell && statusCell.textContent.includes("제출완료")) {
          applyStyle("background-color", "#cce5ff");
        } else if (deadlineDate < today) {
          applyStyleMultiple({
            "color": "gray",
            "text-decoration": "line-through"
          });
          row.querySelectorAll(".txt").forEach(el => {
            el.style.setProperty("color", "gray", "important");
            el.style.setProperty("text-decoration", "line-through", "important");
          });
        } else if (diffDays >= 0 && diffDays <= 3) {
          applyStyle("background-color", "#ffcccc");
        }
      });
    }
  
    // 제출 완료 인원 비율 계산하기
    function updateCompletionPercentage() {
      const table = document.querySelector(".form_table table");
      if (!table) return;
      let totalStudents = null;
      let completedStudents = null;
      let completedCell = null;
      
      Array.from(table.rows).forEach(row => {
        Array.from(row.cells).forEach(cell => {
          if (cell.tagName.toLowerCase() === 'th' && cell.textContent.includes("총 수강생")) {
            const nextTd = cell.nextElementSibling;
            if (nextTd) {
              const totalText = nextTd.textContent.trim().replace("명", "");
              totalStudents = parseInt(totalText, 10);
            }
          }
          if (cell.tagName.toLowerCase() === 'th' && cell.textContent.includes("제출완료 인원")) {
            const nextTd = cell.nextElementSibling;
            if (nextTd) {
              completedCell = nextTd;
              const completedText = nextTd.textContent.trim().replace("명", "");
              completedStudents = parseInt(completedText, 10);
            }
          }
        });
      });
      
      if (totalStudents !== null && completedStudents !== null && totalStudents > 0) {
        const percentage = (completedStudents / totalStudents * 100).toFixed(1);
        if (completedCell) {
          completedCell.textContent = `${completedStudents}명 (${percentage}%)`;
        }
      }
    }
  
    // 오프라인 교육 일정에서 오늘 날짜 자동으로 선택하기
    function autoSelectTodayOfflineLecture() {
      var todayDay = new Date().getDate().toString();
      var calendarBox = document.getElementById('calendarBox');
      if (!calendarBox) return;
      var dayElem = calendarBox.querySelector('[data-day="'+todayDay+'"]');
      if (!dayElem) {
        var aElems = calendarBox.querySelectorAll('a');
        for (var i = 0; i < aElems.length; i++) {
           if(aElems[i].textContent.trim() === todayDay) {
               dayElem = aElems[i];
               break;
           }
        }
      }
      if(dayElem) {
        dayElem.click();
      }
    }
  
    // 과제 목록 페이지
    if (document.querySelector('.table_basics_area')) {
      sortAndStyleAssignmentList();
    }
    // 과제 상세 페이지
    if (document.querySelector('.form_table table')) {
      updateCompletionPercentage();
    }
    // 오프라인 교육 일정 페이지
    if (window.location.href.indexOf('/dashboard/offline/lecture/index.do') !== -1) {
      if (document.getElementById('calendarBox')) { // 캘린더 로드 완료되면
        autoSelectTodayOfflineLecture();
      }
    }
  })();
  