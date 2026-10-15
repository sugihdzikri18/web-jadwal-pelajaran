// Jadwal contoh hanya digunakan saat browser belum memiliki data jadwal.
const STORAGE_KEYS = {
  schedules: "jadwalku-schedules",
  theme: "jadwalku-theme"
};

const DAYS = [
  { name: "Senin", short: "Sen", jsDay: 1 },
  { name: "Selasa", short: "Sel", jsDay: 2 },
  { name: "Rabu", short: "Rab", jsDay: 3 },
  { name: "Kamis", short: "Kam", jsDay: 4 },
  { name: "Jumat", short: "Jum", jsDay: 5 },
  { name: "Sabtu", short: "Sab", jsDay: 6 }
];

const SAMPLE_SCHEDULES = [
  { id: "sample-1", day: "Senin", start: "07:00", end: "08:30", subject: "Matematika", teacher: "Pak Budi", room: "Ruang XI TKJ" },
  { id: "sample-2", day: "Senin", start: "08:30", end: "10:00", subject: "Jaringan Komputer", teacher: "Pak Andi", room: "Lab Komputer" },
  { id: "sample-3", day: "Selasa", start: "07:00", end: "08:30", subject: "Bahasa Inggris", teacher: "Bu Rina", room: "Ruang XI TKJ" },
  { id: "sample-4", day: "Rabu", start: "07:00", end: "08:30", subject: "Basis Data", teacher: "Pak Dedi", room: "Lab Komputer" },
  { id: "sample-5", day: "Kamis", start: "08:30", end: "10:00", subject: "Sistem Operasi", teacher: "Pak Andi", room: "Lab Komputer" },
  { id: "sample-6", day: "Jumat", start: "07:00", end: "08:30", subject: "Bahasa Indonesia", teacher: "Bu Siti", room: "Ruang XI TKJ" },
  { id: "sample-7", day: "Sabtu", start: "07:00", end: "08:30", subject: "Administrasi Sistem Jaringan", teacher: "Pak Dedi", room: "Lab Komputer" }
];

const SUBJECT_COLORS = [
  ["#5b8def", "#eef4ff", "#283a58"],
  ["#9a72dc", "#f4efff", "#39304f"],
  ["#e3994d", "#fff4e9", "#493626"],
  ["#42a889", "#eaf8f2", "#24453d"],
  ["#e06f89", "#fff0f3", "#4b2e39"],
  ["#4faeb7", "#eaf8fa", "#244249"],
  ["#d2a541", "#fff8e7", "#493f28"]
];
const WEEKDAY_ORDER = DAYS.map((day) => day.name);
const state = {
  schedules: loadSchedules(),
  selectedDay: WEEKDAY_ORDER.includes(getCurrentDayName()) ? getCurrentDayName() : "Semua",
  searchTerm: "",
  toastTimer: null
};

const elements = {
  body: document.body,
  headerDate: document.querySelector("#header-date"),
  welcomeDate: document.querySelector("#welcome-date"),
  breadcrumb: document.querySelector("#breadcrumb-current"),
  todayCount: document.querySelector("#today-count"),
  nextClass: document.querySelector("#next-class"),
  nextClassTime: document.querySelector("#next-class-time"),
  studyHours: document.querySelector("#study-hours"),
  studyHoursCaption: document.querySelector("#study-hours-caption"),
  todayDayLabel: document.querySelector("#today-day-label"),
  todayList: document.querySelector("#today-list"),
  weekOverview: document.querySelector("#week-overview"),
  dayTabs: document.querySelector("#day-tabs"),
  search: document.querySelector("#schedule-search"),
  viewLabel: document.querySelector("#schedule-view-label"),
  tableWrap: document.querySelector("#schedule-table-wrap"),
  empty: document.querySelector("#schedule-empty"),
  scheduleCount: document.querySelector("#schedule-count"),
  modal: document.querySelector("#schedule-modal"),
  form: document.querySelector("#schedule-form"),
  formError: document.querySelector("#form-error"),
  toast: document.querySelector("#toast"),
  sidebar: document.querySelector("#sidebar")
};

function loadSchedules() {
  const saved = localStorage.getItem(STORAGE_KEYS.schedules);
  if (saved === null) {
    localStorage.setItem(STORAGE_KEYS.schedules, JSON.stringify(SAMPLE_SCHEDULES));
    return SAMPLE_SCHEDULES.map((item) => ({ ...item }));
  }

  try {
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) throw new Error("Format data jadwal tidak valid.");
    return parsed.filter(isValidSchedule);
  } catch (error) {
    console.error("Gagal membaca data jadwal dari LocalStorage:", error);
    return [];
  }
}

function isValidSchedule(item) {
  return item && typeof item.id === "string" && typeof item.day === "string"
    && WEEKDAY_ORDER.includes(item.day) && typeof item.start === "string"
    && typeof item.end === "string" && typeof item.subject === "string"
    && typeof item.teacher === "string";
}

function saveSchedules() {
  try {
    localStorage.setItem(STORAGE_KEYS.schedules, JSON.stringify(state.schedules));
    return true;
  } catch (error) {
    console.error("Gagal menyimpan data jadwal:", error);
    showToast("Jadwal gagal disimpan. Periksa ruang penyimpanan browser.", true);
    return false;
  }
}

function getCurrentDayName() {
  const dayNumber = new Date().getDay();
  return DAYS.find((day) => day.jsDay === dayNumber)?.name || "Minggu";
}

function sortSchedules(schedules) {
  return [...schedules].sort((a, b) => a.start.localeCompare(b.start) || a.subject.localeCompare(b.subject, "id"));
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[character]);
}

function getSubjectColor(subject) {
  let hash = 0;
  for (const character of subject) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return SUBJECT_COLORS[hash % SUBJECT_COLORS.length];
}

function formatTime(time) {
  return time.replace(":", ".");
}

function formatDate(date, options = { weekday: "long", day: "numeric", month: "long", year: "numeric" }) {
  return new Intl.DateTimeFormat("id-ID", options).format(date);
}

function renderDates() {
  const now = new Date();
  elements.headerDate.textContent = formatDate(now, { weekday: "long", day: "numeric", month: "short", year: "numeric" });
  elements.welcomeDate.textContent = formatDate(now);
  document.querySelector("#current-year").textContent = String(now.getFullYear());
}

function renderDashboard() {
  const today = getCurrentDayName();
  const todaysSchedules = sortSchedules(state.schedules.filter((item) => item.day === today));
  elements.todayDayLabel.textContent = today;
  elements.todayCount.innerHTML = `${todaysSchedules.length} <small>mapel</small>`;

  if (todaysSchedules.length === 0) {
    elements.nextClass.textContent = today === "Minggu" ? "Hari istirahat" : "Belum ada jadwal";
    elements.nextClassTime.textContent = today === "Minggu" ? "Selamat menikmati hari Minggu!" : "Nikmati waktu luangmu!";
    elements.studyHours.textContent = "—";
    elements.studyHoursCaption.textContent = "Belum ada jadwal hari ini";
    elements.todayList.innerHTML = `<div class="empty-day"><strong>${today === "Minggu" ? "Hari Minggu waktunya istirahat!" : "Belum ada pelajaran hari ini."}</strong><span>${today === "Minggu" ? "Semoga harimu menyenangkan." : "Kamu bisa menambahkan jadwal kapan saja."}</span></div>`;
  } else {
    const first = todaysSchedules[0];
    const last = todaysSchedules[todaysSchedules.length - 1];
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const next = todaysSchedules.find((item) => item.start > currentTime);
    const ongoing = todaysSchedules.find((item) => item.start <= currentTime && item.end > currentTime);

    if (ongoing) {
      elements.nextClass.textContent = ongoing.subject;
      elements.nextClassTime.textContent = `Sedang berlangsung · selesai ${formatTime(ongoing.end)}`;
    } else if (next) {
      elements.nextClass.textContent = next.subject;
      elements.nextClassTime.textContent = `Mulai pukul ${formatTime(next.start)}`;
    } else {
      elements.nextClass.textContent = "Semua selesai!";
      elements.nextClassTime.textContent = "Tidak ada pelajaran berikutnya.";
    }
    elements.studyHours.textContent = `${formatTime(first.start)} – ${formatTime(last.end)}`;
    elements.studyHoursCaption.textContent = "Rentang waktu belajar hari ini";
    elements.todayList.innerHTML = todaysSchedules.map((item) => {
      const colors = getSubjectColor(item.subject);
      return `<article class="lesson-item" style="--lesson-color:${colors[0]}"><span class="lesson-time">${formatTime(item.start)}</span><i class="lesson-line"></i><div class="lesson-info"><strong>${escapeHtml(item.subject)}</strong><span>${escapeHtml(item.teacher)}</span></div>${item.room ? `<span class="room-tag">${escapeHtml(item.room)}</span>` : ""}</article>`;
    }).join("");
  }

  const todayDate = new Date();
  const mondayOffset = todayDate.getDay() === 0 ? -6 : 1 - todayDate.getDay();
  const monday = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate() + mondayOffset);
  elements.weekOverview.innerHTML = DAYS.map((day, index) => {
    const date = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + index);
    const count = state.schedules.filter((item) => item.day === day.name).length;
    const todayClass = day.name === today ? " is-today" : "";
    return `<button class="week-day${todayClass}" type="button" data-week-day="${day.name}" aria-label="Lihat jadwal ${day.name}, ${count} mata pelajaran"><span class="week-day-label">${day.short}</span><span class="week-day-number">${date.getDate()}</span><span class="week-day-count${count ? " has-class" : ""}">${count ? `${count} mapel` : "Kosong"}</span></button>`;
  }).join("");
}

function renderDayTabs() {
  elements.dayTabs.innerHTML = `<button class="day-tab${state.selectedDay === "Semua" ? " active" : ""}" type="button" data-day="Semua">Semua</button>`
    + DAYS.map((day) => `<button class="day-tab${state.selectedDay === day.name ? " active" : ""}" type="button" data-day="${day.name}">${day.short}</button>`).join("");
}

function renderSchedule() {
  renderDayTabs();
  const search = state.searchTerm.trim().toLocaleLowerCase("id-ID");
  const filtered = sortSchedules(state.schedules.filter((item) => {
    const matchesDay = state.selectedDay === "Semua" || item.day === state.selectedDay;
    const matchesSearch = !search || [item.subject, item.teacher, item.room, item.day].some((value) => value?.toLocaleLowerCase("id-ID").includes(search));
    return matchesDay && matchesSearch;
  }));
  const isAllDays = state.selectedDay === "Semua";
  const visibleDays = isAllDays ? WEEKDAY_ORDER : [state.selectedDay];
  elements.viewLabel.innerHTML = isAllDays ? "Menampilkan jadwal <strong>seminggu penuh</strong>" : `Menampilkan jadwal hari <strong>${escapeHtml(state.selectedDay)}</strong>`;
  elements.scheduleCount.textContent = `${filtered.length} jadwal${filtered.length === 1 ? "" : ""} ditampilkan`;
  elements.empty.hidden = filtered.length > 0;
  elements.tableWrap.hidden = filtered.length === 0;
  if (filtered.length === 0) return;

  const timeSlots = [...new Set(filtered.map((item) => item.start))].sort();
  const columns = visibleDays.map((day) => `<th scope="col">${day}</th>`).join("");
  const rows = timeSlots.map((time) => {
    const cells = visibleDays.map((day) => {
      const lessons = filtered.filter((item) => item.day === day && item.start === time);
      return `<td>${lessons.map(renderTableLesson).join("")}</td>`;
    }).join("");
    return `<tr><td class="time-cell">${formatTime(time)}</td>${cells}</tr>`;
  }).join("");
  elements.tableWrap.innerHTML = `<table class="schedule-table"><thead><tr><th scope="col">JAM MULAI</th>${columns}</tr></thead><tbody>${rows}</tbody></table>`;
}

function renderTableLesson(item) {
  const colors = getSubjectColor(item.subject);
  const darkColor = colors[2];
  return `<article class="table-lesson" style="--lesson-color:${colors[0]};--lesson-bg:${colors[1]};--lesson-bg-dark:${darkColor}">
    <strong>${escapeHtml(item.subject)}</strong>
    <span>${formatTime(item.start)}–${formatTime(item.end)} · ${escapeHtml(item.teacher)}</span>
    ${item.room ? `<span class="lesson-room">${escapeHtml(item.room)}</span>` : ""}
    <span class="lesson-actions">
      <button class="lesson-action" type="button" data-edit-id="${escapeHtml(item.id)}" aria-label="Edit ${escapeHtml(item.subject)}" title="Edit"><svg class="icon"><use href="#i-edit"/></svg></button>
      <button class="lesson-action delete" type="button" data-delete-id="${escapeHtml(item.id)}" aria-label="Hapus ${escapeHtml(item.subject)}" title="Hapus"><svg class="icon"><use href="#i-trash"/></svg></button>
    </span>
  </article>`;
}

function renderAll() {
  renderDates();
  renderDashboard();
  renderSchedule();
}

function setTheme(isDark) {
  elements.body.classList.toggle("dark", isDark);
  localStorage.setItem(STORAGE_KEYS.theme, isDark ? "dark" : "light");
  const icon = isDark ? "#i-sun" : "#i-moon";
  document.querySelector("#theme-toggle use").setAttribute("href", icon);
  document.querySelector("#theme-toggle").setAttribute("aria-label", isDark ? "Aktifkan mode terang" : "Aktifkan mode gelap");
  document.querySelector("#settings-theme-toggle").textContent = isDark ? "Mode gelap" : "Mode terang";
}

function showPage(pageName) {
  const pageLabels = { dashboard: "Dashboard", schedule: "Jadwal Pelajaran", settings: "Pengaturan" };
  for (const section of document.querySelectorAll(".page-section")) {
    const active = section.id === `page-${pageName}`;
    section.hidden = !active;
    section.classList.toggle("active", active);
  }
  for (const button of document.querySelectorAll(".nav-link")) button.classList.toggle("active", button.dataset.page === pageName);
  elements.breadcrumb.textContent = pageLabels[pageName];
  elements.sidebar.classList.remove("mobile-open");
}

function openModal(schedule = null) {
  elements.form.reset();
  elements.formError.hidden = true;
  document.querySelector("#schedule-id").value = schedule?.id || "";
  document.querySelector("#modal-title").textContent = schedule ? "Edit Jadwal" : "Tambah Jadwal";
  document.querySelector("#subject").value = schedule?.subject || "";
  document.querySelector("#teacher").value = schedule?.teacher || "";
  document.querySelector("#day").innerHTML = DAYS.map((day) => `<option value="${day.name}">${day.name}</option>`).join("");
  document.querySelector("#day").value = schedule?.day || (WEEKDAY_ORDER.includes(state.selectedDay) ? state.selectedDay : "Senin");
  document.querySelector("#start-time").value = schedule?.start || "";
  document.querySelector("#end-time").value = schedule?.end || "";
  document.querySelector("#room").value = schedule?.room || "";
  elements.modal.hidden = false;
  document.querySelector("#subject").focus();
}

function closeModal() {
  elements.modal.hidden = true;
  elements.formError.hidden = true;
}

function showToast(message, isError = false) {
  window.clearTimeout(state.toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.toggle("error", isError);
  elements.toast.classList.add("visible");
  state.toastTimer = window.setTimeout(() => elements.toast.classList.remove("visible"), 3000);
}

function showFormError(message) {
  elements.formError.textContent = message;
  elements.formError.hidden = false;
}

function handleFormSubmit(event) {
  event.preventDefault();
  const formData = new FormData(elements.form);
  const schedule = {
    id: document.querySelector("#schedule-id").value || `schedule-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    subject: String(formData.get("subject")).trim(),
    teacher: String(formData.get("teacher")).trim(),
    day: String(formData.get("day")),
    start: String(formData.get("start")),
    end: String(formData.get("end")),
    room: String(formData.get("room")).trim()
  };

  if (!schedule.subject || !schedule.teacher || !schedule.day || !schedule.start || !schedule.end) {
    showFormError("Lengkapi semua kolom wajib sebelum menyimpan.");
    return;
  }
  if (schedule.end <= schedule.start) {
    showFormError("Jam selesai harus lebih akhir daripada jam mulai.");
    return;
  }

  const existingIndex = state.schedules.findIndex((item) => item.id === schedule.id);
  const previousSchedules = state.schedules.map((item) => ({ ...item }));
  if (existingIndex >= 0) state.schedules[existingIndex] = schedule;
  else state.schedules.push(schedule);

  if (!saveSchedules()) {
    state.schedules = previousSchedules;
    return;
  }
  if (state.selectedDay !== "Semua" && state.selectedDay !== schedule.day) state.selectedDay = schedule.day;
  closeModal();
  renderAll();
  showToast(existingIndex >= 0 ? "Jadwal berhasil diperbarui." : "Jadwal berhasil ditambahkan.");
}

function editSchedule(id) {
  const schedule = state.schedules.find((item) => item.id === id);
  if (schedule) openModal(schedule);
}

function deleteSchedule(id) {
  const schedule = state.schedules.find((item) => item.id === id);
  if (!schedule) return;
  if (!window.confirm(`Hapus jadwal ${schedule.subject} hari ${schedule.day}?`)) return;
  const previousSchedules = state.schedules;
  state.schedules = state.schedules.filter((item) => item.id !== id);
  if (!saveSchedules()) {
    state.schedules = previousSchedules;
    return;
  }
  renderAll();
  showToast("Jadwal berhasil dihapus.");
}

function changeSelectedDay(direction) {
  const currentIndex = WEEKDAY_ORDER.indexOf(state.selectedDay);
  const startIndex = currentIndex < 0 ? 0 : currentIndex;
  state.selectedDay = WEEKDAY_ORDER[(startIndex + direction + WEEKDAY_ORDER.length) % WEEKDAY_ORDER.length];
  renderSchedule();
}

function initialize() {
  const savedTheme = localStorage.getItem(STORAGE_KEYS.theme);
  setTheme(savedTheme === "dark");
  renderAll();

  document.querySelectorAll(".nav-link").forEach((button) => button.addEventListener("click", () => showPage(button.dataset.page)));
  document.querySelectorAll("[data-go-page]").forEach((button) => button.addEventListener("click", () => showPage(button.dataset.goPage)));
  document.querySelector("#theme-toggle").addEventListener("click", () => setTheme(!elements.body.classList.contains("dark")));
  document.querySelector("#settings-theme-toggle").addEventListener("click", () => setTheme(!elements.body.classList.contains("dark")));
  document.querySelector("#menu-toggle").addEventListener("click", () => elements.sidebar.classList.toggle("mobile-open"));
  document.querySelector("#add-schedule").addEventListener("click", () => openModal());
  document.querySelector("#close-modal").addEventListener("click", closeModal);
  document.querySelector("#cancel-modal").addEventListener("click", closeModal);
  elements.modal.addEventListener("click", (event) => { if (event.target === elements.modal) closeModal(); });
  document.addEventListener("keydown", (event) => { if (event.key === "Escape" && !elements.modal.hidden) closeModal(); });
  elements.form.addEventListener("submit", handleFormSubmit);
  elements.search.addEventListener("input", () => { state.searchTerm = elements.search.value; renderSchedule(); });
  elements.dayTabs.addEventListener("click", (event) => {
    const tab = event.target.closest("[data-day]");
    if (!tab) return;
    state.selectedDay = tab.dataset.day;
    renderSchedule();
  });
  document.querySelector("#previous-day").addEventListener("click", () => changeSelectedDay(-1));
  document.querySelector("#next-day").addEventListener("click", () => changeSelectedDay(1));
  elements.weekOverview.addEventListener("click", (event) => {
    const day = event.target.closest("[data-week-day]");
    if (!day) return;
    state.selectedDay = day.dataset.weekDay;
    showPage("schedule");
    renderSchedule();
  });
  elements.tableWrap.addEventListener("click", (event) => {
    const editButton = event.target.closest("[data-edit-id]");
    const deleteButton = event.target.closest("[data-delete-id]");
    if (editButton) editSchedule(editButton.dataset.editId);
    if (deleteButton) deleteSchedule(deleteButton.dataset.deleteId);
  });
  document.querySelector("#reset-schedule").addEventListener("click", () => {
    if (!window.confirm("Pulihkan jadwal contoh? Semua jadwal yang saat ini tersimpan akan diganti.")) return;
    const previousSchedules = state.schedules;
    state.schedules = SAMPLE_SCHEDULES.map((item) => ({ ...item }));
    if (!saveSchedules()) {
      state.schedules = previousSchedules;
      return;
    }
    state.selectedDay = WEEKDAY_ORDER.includes(getCurrentDayName()) ? getCurrentDayName() : "Semua";
    renderAll();
    showToast("Jadwal contoh berhasil dipulihkan.");
  });
}

initialize();
