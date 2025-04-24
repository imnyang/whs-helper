(function () {
  // 옵션값 캐싱
  let options = {
    splitTable: true,
    submittedStrike: true,
    showExpiredUnsubmitted: true
  };


  const parseDeadline = (dateStr) => {
    const [datePart, timePart] = dateStr.trim().split(" ");
    const [year, month, day] = datePart.split(".").map(Number);
    const date = new Date(year, month - 1, day);
    if (timePart === "00:00") {
      date.setDate(date.getDate() - 1);
      date.setHours(23, 59, 0, 0);
    } else {
      const [hour, minute] = timePart.split(":" ).map(Number);
      date.setHours(hour, minute);
    }
    return date;
  };

  const formatDate = (date) => {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, "0");
    const d = date.getDate().toString().padStart(2, "0");
    const h = date.getHours().toString().padStart(2, "0");
    const min = date.getMinutes().toString().padStart(2, "0");
    return `${y}.${m}.${d} ${h}:${min}`;
  };

  const applyStyleMultiple = (row, styles) => {
    row.style.cssText += Object.entries(styles).map(([k, v]) => `${k}:${v} !important`).join(';');
    row.querySelectorAll("td, .txt").forEach((el) => {
      el.style.cssText += Object.entries(styles).map(([k, v]) => `${k}:${v} !important`).join(';');
    });
  };

  const appendRemainingTime = (cell, deadline) => {
    const now = new Date();
    const diffMs = deadline - now;
    let remainingStr = " (마감됨)";
    if (diffMs > 0) {
      if (diffMs >= 86400000) {
        const days = Math.floor(diffMs / 86400000);
        remainingStr = ` (${days}일 전)`;
      } else {
        const hours = Math.floor(diffMs / 3600000);
        const minutes = Math.floor((diffMs % 3600000) / 60000);
        remainingStr = ` (${hours}시간 ${minutes}분 전)`;
      }
    }
    cell.textContent = `${formatDate(deadline)}${remainingStr}`;
  };

  function loadOptionsAndApply() {
    chrome.storage.local.get(['splitTable', 'submittedStrike', 'showExpiredUnsubmitted'], (result) => {
      options = {
        splitTable: !!result.splitTable,
        submittedStrike: !!result.submittedStrike,
        showExpiredUnsubmitted: result.showExpiredUnsubmitted !== false
      };
      applyAssignmentList();
    });
  }

  // 과제 목록 적용 함수
  function applyAssignmentList() {
    if (document.querySelector(".table_basics_area")) {
      options.splitTable ? sortAndStyleAssignmentList_With_Split_Table() : sortAndStyleAssignmentList();
    }
  }
  
function sortAndStyleAssignmentList_With_Split_Table() {
    const container = document.querySelector(".table_basics_com_cont_area");
    const table = container?.querySelector("table");
    const tbody = table?.querySelector("tbody");
    if (!tbody) return;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const rows = Array.from(tbody.querySelectorAll("tr"));
    const categories = {
      urgent: [], notSubmitted: [], submitted: [], expired: [], submittedExpired: []
    };

    rows.forEach(row => {
      const statusCell = row.cells[3];
      const periodCell = row.cells[2];
      const deadlineStr = periodCell.textContent.trim().replace(/\(.*?\)/g, '').split('~')[1]?.trim();
      if (!deadlineStr) return;

      const deadline = parseDeadline(deadlineStr);
      row._deadline = deadline;
      const deadlineDate = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate());
      const diffDays = (deadlineDate - today) / 86400000;
      const isSubmitted = statusCell.textContent.includes("제출완료");
      const isExpired = deadline - now <= 0;

      appendRemainingTime(periodCell, deadline);

      if (isExpired && isSubmitted) categories.submittedExpired.push(row);
      else if (isExpired) categories.expired.push(row);
      else if (isSubmitted) categories.submitted.push(row);
      else if (diffDays >= 0 && diffDays <= 3) categories.urgent.push(row);
      else categories.notSubmitted.push(row);
    });

    Object.values(categories).forEach(list => list.sort((a, b) => a._deadline - b._deadline));

    const createTable = (title, rows) => {
      const newTable = table.cloneNode(true);
      const newTbody = newTable.querySelector("tbody");
      newTbody.innerHTML = "";
      rows.forEach((row, i) => {
        const numCell = row.querySelector(".num");
        if (numCell) numCell.textContent = i + 1;
        newTbody.appendChild(row);
      });
      const header = document.createElement("h3");
      Object.assign(header.style, {
        fontSize: "1.5em", marginTop: "20px", marginBottom: "10px", fontWeight: "bold"
      });
      header.textContent = title;
      container.appendChild(header);
      container.appendChild(newTable);
      return newTable;
    };

    if (categories.urgent.length) styleTable(createTable("기한이 얼마 안 남은 과제 (3일 이내)", categories.urgent), "#ffcccc");
    if (categories.notSubmitted.length) createTable("제출 안 한 과제", categories.notSubmitted);
    if (categories.submitted.length) {
      const t = createTable("제출 완료", categories.submitted);
      styleTable(t, "#cce5ff", options.submittedStrike && "line-through");
    }
    if (options.showExpiredUnsubmitted && categories.expired.length) {
      styleTable(createTable("마감된 과제", categories.expired), "#f0f0f0", "line-through");
    }
    if (categories.submittedExpired.length) {
      styleTable(createTable("제출 완료한 마감된 과제", categories.submittedExpired), "#cce5ff", "line-through");
    }
    table.remove();
  }

  function styleTable(table, bgColor, textDecoration) {
    table.querySelectorAll("tbody tr").forEach(row => {
      const styles = {};
      if (bgColor) styles["background-color"] = bgColor;
      if (textDecoration) styles["color"] = "gray", styles["text-decoration"] = textDecoration;
      applyStyleMultiple(row, styles);
    });
  }

  function sortAndStyleAssignmentList() {
    const table = document.querySelector(".table_basics_area");
    const tbody = table?.querySelector("tbody");
    if (!tbody) return;
    const rows = Array.from(tbody.querySelectorAll("tr"));

    rows.sort((a, b) => {
      const aDeadline = parseDeadline(a.cells[2].textContent.replace(/\(.*?\)/g, '').split("~")[1]?.trim() || "");
      const bDeadline = parseDeadline(b.cells[2].textContent.replace(/\(.*?\)/g, '').split("~")[1]?.trim() || "");
      return aDeadline - bDeadline;
    });

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    rows.forEach((row, idx) => {
      const numCell = row.querySelector(".num");
      if (numCell) numCell.textContent = idx + 1;
      tbody.appendChild(row);

      const statusCell = row.cells[3];
      const periodCell = row.cells[2];
      const deadlineStr = periodCell.textContent.trim().replace(/\(.*?\)/g, '').split("~")[1]?.trim();
      if (!deadlineStr) return;
      const deadline = parseDeadline(deadlineStr);
      const deadlineDate = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate());
      const diffDays = (deadlineDate - today) / 86400000;

      appendRemainingTime(periodCell, deadline);

      const isSubmitted = statusCell.textContent.includes("제출완료");
      const isExpired = deadlineDate < today;
      if (isSubmitted) {
        const styles = { "background-color": "#cce5ff" };
        if (isExpired || options.submittedStrike) Object.assign(styles, { color: "gray", "text-decoration": options.submittedStrike ? "line-through" : "none" });
        applyStyleMultiple(row, styles);
      } else if (isExpired) {
        options.showExpiredUnsubmitted
          ? applyStyleMultiple(row, { color: "gray", "text-decoration": "line-through", "background-color": "#f0f0f0" })
          : row.style.display = "none";
      } else if (diffDays >= 0 && diffDays <= 3) {
        applyStyleMultiple(row, { "background-color": "#ffcccc" });
      }
    });
  }

  function updateCompletionPercentage() {
    const table = document.querySelector(".form_table table");
    if (!table) return;
    let total = 0, complete = 0, completeCell;
    Array.from(table.rows).forEach(row => {
      Array.from(row.cells).forEach(cell => {
        if (cell.tagName.toLowerCase() === "th") {
          const td = cell.nextElementSibling;
          if (cell.textContent.includes("총 수강생")) total = parseInt(td.textContent.replace("명", ""), 10);
          if (cell.textContent.includes("제출완료 인원")) complete = parseInt(td.textContent.replace("명", ""), 10), completeCell = td;
        }
      });
    });
    if (total && complete && completeCell) {
      completeCell.textContent = `${complete}명 (${((complete / total) * 100).toFixed(1)}%)`;
    }
  }

  function autoSelectTodayOfflineLecture() {
    const todayDay = new Date().getDate().toString();
    const calendarBox = document.getElementById("calendarBox");
    if (!calendarBox) return;
    let dayElem = calendarBox.querySelector(`[data-day="${todayDay}"]`);
    if (!dayElem) {
      const aElems = calendarBox.querySelectorAll("a");
      for (const a of aElems) {
        if (a.textContent.trim() === todayDay) {
          dayElem = a;
          break;
        }
      }
    }
    if (dayElem) dayElem.click();
  }

  chrome.runtime.onMessage.addListener((request) => {
    if (request.type === "RELOAD_ASSIGNMENTS") {
      Object.assign(options, request.options);
      applyAssignmentList();
    }
  });

  if (document.querySelector(".table_basics_area")) loadOptionsAndApply();
  if (document.querySelector(".form_table table")) updateCompletionPercentage();
  if (window.location.href.includes("/dashboard/offline/lecture/index.do") && document.getElementById("calendarBox")) {
    autoSelectTodayOfflineLecture();
  }
})();