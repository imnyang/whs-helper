(function () {
  // 1. 과제 목록 처리
  function sortAndStyleAssignmentList_With_Split_Table() {
    const container = document.querySelector('.table_basics_com_cont_area');
    if (!container) return;
    const table = container.querySelector('table');
    if (!table) return;
    const tbody = table.querySelector('tbody');
    if (!tbody) return;
    const rows = Array.from(tbody.querySelectorAll('tr'));

    // 과제 기한 처리 및 스타일링
    function parseDeadline(dateStr) {
      const [datePart, timePart] = dateStr.trim().split(' ');
      const [year, month, day] = datePart.split('.').map(Number);
      if (timePart === "00:00") {
        const prevDay = new Date(year, month - 1, day);
        prevDay.setDate(prevDay.getDate() - 1);
        prevDay.setHours(23, 59, 0, 0);
        return prevDay;
      } else {
        const [hour, minute] = timePart.split(':').map(Number);
        return new Date(year, month - 1, day, hour, minute);
      }
    }

    function formatDate(date) {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const hour = date.getHours().toString().padStart(2, '0');
      const minute = date.getMinutes().toString().padStart(2, '0');
      return `${year}.${month}.${day} ${hour}:${minute}`;
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const categories = { urgent: [], notSubmitted: [], submitted: [], expired: [], submittedExpired: [] };

    rows.forEach(row => {
      const statusCell = row.cells[3];
      const periodCell = row.cells[2];
      const periodText = periodCell.textContent.trim();
      const deadlineStr = periodText.split('~')[1]?.trim() || "";
      if (!deadlineStr) return;

      const deadline = parseDeadline(deadlineStr);
      row._deadline = deadline; // 정렬을 위한 속성 저장

      const deadlineDate = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate());
      const diffDays = (deadlineDate - today) / (24 * 60 * 60 * 1000);
      const diffMs = deadline - now;
      const isSubmitted = statusCell.textContent.includes("제출완료");
      const isExpired = diffMs <= 0;

      let remainingStr = "";
      if (diffMs > 0) {
        if (diffMs >= 24 * 60 * 60 * 1000) {
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

      periodCell.textContent = `${formatDate(deadline)}${remainingStr}`;

      if (isExpired && isSubmitted) {
        categories.submittedExpired.push(row);
      } else if (isExpired) {
        categories.expired.push(row);
      } else if (isSubmitted) {
        categories.submitted.push(row);
      } else if (diffDays >= 0 && diffDays <= 3) {
        categories.urgent.push(row);
      } else {
        categories.notSubmitted.push(row);
      }
    });

    // 카테고리별로 마감 임박 순 정렬
    Object.values(categories).forEach(categoryRows => {
      categoryRows.sort((a, b) => a._deadline - b._deadline);
    });

    // 테이블 생성 및 스타일링
    function createTable(title, rows) {
      const newTable = table.cloneNode(true);
      const newTbody = newTable.querySelector('tbody');
      newTbody.innerHTML = '';
      rows.forEach((row, idx) => {
        const numCell = row.querySelector('.num');
        if (numCell) {
          numCell.textContent = idx + 1;
        }
        newTbody.appendChild(row);
      });
      const header = document.createElement('h3');
      header.textContent = title;
      header.style.fontSize = "1.5em";
      header.style.marginTop = "20px";
      header.style.marginBottom = "10px";
      header.style.fontWeight = "bold";
      container.appendChild(header);
      container.appendChild(newTable);
      return newTable;
    }

    function styleRows(table, bgColor, textDecoration) {
      const tbody = table.querySelector('tbody');
      const rows = tbody ? tbody.querySelectorAll('tr') : [];

      rows.forEach(row => {
        if (bgColor) {
          row.style.backgroundColor = bgColor;
          row.querySelectorAll('td').forEach(td => td.style.backgroundColor = bgColor);
        }
        if (textDecoration) {
          row.style.color = "gray";
          row.style.textDecoration = textDecoration;
          row.querySelectorAll('td').forEach(td => {
            td.style.color = "gray";
            td.style.textDecoration = textDecoration;
          });
          row.querySelectorAll('.txt').forEach(el => {
            el.style.color = "gray";
            el.style.textDecoration = textDecoration;
          });
        }
      });
    }

    // 카테고리별 테이블 생성 및 스타일링
    if (categories.urgent.length > 0) {
      const urgentTable = createTable("기한이 얼마 안 남은 과제 (3일 이내)", categories.urgent);
      styleRows(urgentTable, "#ffcccc");
    }
    if (categories.notSubmitted.length > 0) {
      createTable("제출 안 한 과제", categories.notSubmitted);
    }
    if (categories.submitted.length > 0) {
      const submittedTable = createTable("제출 완료", categories.submitted);
      styleRows(submittedTable, "#cce5ff");
    }
    if (categories.expired.length > 0) {
      const expiredTable = createTable("마감된 과제", categories.expired);
      styleRows(expiredTable, "gray", "line-through");
    }
    if (categories.submittedExpired.length > 0) {
      const submittedExpiredTable = createTable("제출 완료한 마감된 과제", categories.submittedExpired);
      styleRows(submittedExpiredTable, "#cce5ff", "line-through");
    }

    table.remove();
  }

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
        if (deadlineDate < today) {
          applyStyleMultiple({
            "color": "gray",
            "text-decoration": "line-through"
          });
        }
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

  // 2. 제출 완료 인원 비율 계산
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

  // 3. 오프라인 교육 일정에서 오늘 날짜 자동으로 선택하기
  function autoSelectTodayOfflineLecture() {
    var todayDay = new Date().getDate().toString();
    var calendarBox = document.getElementById('calendarBox');
    if (!calendarBox) return;
    var dayElem = calendarBox.querySelector('[data-day="' + todayDay + '"]');
    if (!dayElem) {
      var aElems = calendarBox.querySelectorAll('a');
      for (var i = 0; i < aElems.length; i++) {
        if (aElems[i].textContent.trim() === todayDay) {
          dayElem = aElems[i];
          break;
        }
      }
    }
    if (dayElem) {
      dayElem.click();
    }
  }

  // 과제 목록 페이지
  if (document.querySelector('.table_basics_area')) {
    // chrome storage에서 설정 값 불러오기
  
    chrome.storage.local.get(['splitTable'], function (result) {
      console.log(result.splitTable);
      if (result.splitTable) {
        sortAndStyleAssignmentList_With_Split_Table();
      } else {
        sortAndStyleAssignmentList();
      }
    });
  }
  // 과제 상세 페이지
  if (document.querySelector('.form_table table')) {
    updateCompletionPercentage();
  }
  // 오프라인 교육 일정 페이지
  if (window.location.href.indexOf('/dashboard/offline/lecture/index.do') !== -1) {
    if (document.getElementById('calendarBox')) {
      autoSelectTodayOfflineLecture();
    }
  }
})();
