// let chatMessages;
// let currentAITab = "chat"; 
// const API_BASE = "http://127.0.0.1:8000/api";


// function getToken() {
//   return localStorage.getItem("authToken") || "";
// }

// function setToken(token) {
//   if (token) localStorage.setItem("authToken", token);
//   else localStorage.removeItem("authToken");
// }

// function getCurrentUser() {
//   try {
//     const raw = localStorage.getItem("pblCurrentUser");
//     return raw ? JSON.parse(raw) : null;
//   } catch {
//     return null;
//   }
// }

// function setCurrentUser(user) {
//   localStorage.setItem("pblCurrentUser", JSON.stringify(user));
// }

// function clearCurrentUser() {
//   localStorage.removeItem("pblCurrentUser");
//   setToken(null);
// }

// async function apiFetch(endpoint, options = {}) {
//   const headers = options.headers || {};

//   if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
//     headers["Content-Type"] = "application/json";
//   }

//   const token = getToken();
//   if (token) {
//     headers["Authorization"] = "Token " + token;
//   }
//   options.headers = headers;

//   const res = await fetch(API_BASE + endpoint, options);
//   if (!res.ok) {
//     let msg = "Request failed: " + res.status;
//     try {
//       const data = await res.json();
//       if (data && data.error) msg = data.error;
//     } catch {
//     }
//     throw new Error(msg);
//   }
//   return await res.json();
// }

// // SMALL UTILITIES 

// function $(id) {
//   return document.getElementById(id);
// }

// function extractPlainText(html) {
//   const tmp = document.createElement("div");
//   tmp.innerHTML = html || "";
//   return tmp.textContent || tmp.innerText || "";
// }

// // GLOBAL STATE 

// let subjectsState = [];
// let folders = [];
// let tasks = [];
// let calendarEvents = [];
// let ganttTasks = [];
// let aiFiles = [];
// let reminders = [];

// let focusTimer = null;
// let focusSeconds = 0;

// //LOGIN / REGISTER 

// function initLoginPage() {
//   const form = $("loginForm");
//   if (!form) return;

//   const errorEl = $("loginError");

//   form.addEventListener("submit", async (e) => {
//     e.preventDefault();
//     const username = $("loginUser").value.trim();
//     const password = $("loginPass").value.trim();

//     if (!username || !password) {
//       if (errorEl) errorEl.textContent = "Please enter username and password.";
//       return;
//     }

//     try {
//       const data = await apiFetch("/auth/login/", {
//         method: "POST",
//         body: JSON.stringify({ username, password }),
//       });

//       setToken(data.token);
//       setCurrentUser(data.user);
//       if (errorEl) errorEl.textContent = "";
//       window.location.href = "dashboard.html";
//     } catch (err) {
//       if (errorEl) errorEl.textContent = err.message;
//     }
//   });
// }

// function initRegisterPage() {
//   const form = $("registerForm");
//   if (!form) return;

//   const errorEl = $("registerError");

//   form.addEventListener("submit", async (e) => {
//     e.preventDefault();

//     const username = $("registerUsername").value.trim();
//     const email = $("registerEmail").value.trim();
//     const password = $("registerPassword").value.trim();
//     const confirm = $("registerConfirm").value.trim();

//     if (!username || !email || !password || !confirm) {
//       if (errorEl) errorEl.textContent = "Please fill all fields.";
//       return;
//     }
//     if (password !== confirm) {
//       if (errorEl) errorEl.textContent = "Passwords do not match.";
//       return;
//     }

//     try {
//       const data = await apiFetch("/auth/register/", {
//         method: "POST",
//         body: JSON.stringify({ username, email, password }),
//       });

//       setToken(data.token);
//       setCurrentUser(data.user);
//       if (errorEl) errorEl.textContent = "";
//       window.location.href = "dashboard.html";
//     } catch (err) {
//       if (errorEl) errorEl.textContent = err.message;
//     }
//   });
// }

// async function ensureAuthenticated(pageId) {
//   if (pageId === "login" || pageId === "register") return;

//   const token = getToken();
//   if (!token) {
//     window.location.href = "login.html";
//     return;
//   }

//   try {
//     const data = await apiFetch("/auth/me/", { method: "GET" });
//     if (data && data.user) {
//       setCurrentUser(data.user);
//     }
//   } catch {
//     clearCurrentUser();
//     window.location.href = "login.html";
//   }
// }


// function performGlobalSearch(query) {
//   const q = query.toLowerCase();
//   const results = [];

//   // Subjects, notes, files
//   folders.forEach((folder) => {
//     if (folder.subject.toLowerCase().includes(q)) {
//       results.push({
//         type: "Subject",
//         title: folder.subject,
//         meta: "Subject",
//       });
//     }
//     if (
//       folder.notes &&
//       extractPlainText(folder.notes).toLowerCase().includes(q)
//     ) {
//       results.push({
//         type: "Notes",
//         title: folder.subject,
//         meta: "Match in notes",
//       });
//     }
//     if (Array.isArray(folder.files)) {
//       folder.files.forEach((file) => {
//         if (file.name.toLowerCase().includes(q)) {
//           results.push({
//             type: "File",
//             title: file.name,
//             meta: `File in ${folder.subject}`,
//           });
//         }
//       });
//     }
//   });

//   // Calendar events
//   calendarEvents.forEach((ev) => {
//     if (ev.title.toLowerCase().includes(q)) {
//       results.push({
//         type: "Calendar",
//         title: ev.title,
//         meta: "Event on " + new Date(ev.start).toLocaleString(),
//       });
//     }
//   });

//   // Gantt tasks
//   ganttTasks.forEach((task) => {
//     if (task.name.toLowerCase().includes(q)) {
//       results.push({
//         type: "Timeline",
//         title: task.name,
//         meta: `Project task (${task.progress || 0}%)`,
//       });
//     }
//   });

//   // Tasks
//   tasks.forEach((t) => {
//     if (t.title.toLowerCase().includes(q)) {
//       results.push({
//         type: "Task",
//         title: t.title,
//         meta: `${t.priority} • due ${t.dueDate}`,
//       });
//     }
//   });

//   return results;
// }

// function renderGlobalSearchResults(results) {
//   const box = $("globalSearchResults");
//   if (!box) return;

//   if (!results.length) {
//     box.innerHTML = `
//       <div class="search-result-item">
//         <div class="search-result-main">
//           <span class="search-result-title">No results</span>
//           <span class="search-result-meta">Try a different keyword.</span>
//         </div>
//       </div>`;
//     return;
//   }

//   box.innerHTML = "";
//   results.slice(0, 30).forEach((r) => {
//     const div = document.createElement("div");
//     div.className = "search-result-item";
//     div.innerHTML = `
//       <div class="search-result-main">
//         <span class="search-result-title">${r.title}</span>
//         <span class="search-result-meta">${r.meta}</span>
//       </div>
//       <span class="search-type-pill">${r.type}</span>`;
//     box.appendChild(div);
//   });
// }

// function initHeaderSearch() {
//   const input = $("globalSearchInput");
//   const resultsBox = $("globalSearchResults");
//   if (!input || !resultsBox) return;

//   input.addEventListener("input", () => {
//     const q = input.value.trim();
//     if (q.length < 2) {
//       resultsBox.style.display = "none";
//       resultsBox.innerHTML = "";
//       return;
//     }
//     const results = performGlobalSearch(q);
//     renderGlobalSearchResults(results);
//     resultsBox.style.display = "block";
//   });

//   input.addEventListener("blur", () => {
//     setTimeout(() => {
//       resultsBox.style.display = "none";
//     }, 180);
//   });

//   document.addEventListener("keydown", (e) => {
//     if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
//       e.preventDefault();
//       input.focus();
//       input.select();
//     }
//     if (e.key === "Escape") {
//       resultsBox.style.display = "none";
//       input.blur();
//     }
//   });
// }

// // SIDEBAR NAV 

// function highlightActiveNav(pageId) {
//   const links = document.querySelectorAll(".nav-link");
//   links.forEach((link) => {
//     const target = link.getAttribute("data-page");
//     if (target === pageId) {
//       link.classList.add("active");
//     } else {
//       link.classList.remove("active");
//     }
//   });
// }

// // SETTINGS (LOCAL) 

// const defaultSettings = {
//   studyReminders: true,
//   soundsEnabled: true,
//   username: "",
//   email: "",
//   workDuration: 25,
//   shortBreak: 5,
//   longBreak: 15,
//   defaultLandingPage: "dashboard",
//   taskSorting: "dueDate",
//   highContrastMode: false,
//   keyboardShortcuts: true,
// };

// function getSettings() {
//   try {
//     const raw = localStorage.getItem("pblUserSettings");
//     const stored = raw ? JSON.parse(raw) : {};
//     return { ...defaultSettings, ...stored };
//   } catch {
//     return { ...defaultSettings };
//   }
// }

// function saveSettings(settings) {
//   localStorage.setItem("pblUserSettings", JSON.stringify(settings));
// }

// function applyThemeFromSettings(settings) {
//   document.body.setAttribute(
//     "data-theme",
//     settings.highContrastMode ? "dark" : "light"
//   );
// }

// // DASHBOARD: REMINDERS & FOCUS

// function initReminders() {
//   if (!$("reminderTime")) return;
//   $("btnAddReminder")?.addEventListener("click", setCustomReminder);
// }

// function setCustomReminder() {
//   const timeStr = $("reminderTime").value;
//   const message = $("reminderMessage").value.trim() || "Time to study!";

//   if (!timeStr) return alert("Select date and time.");

//   const target = new Date(timeStr).getTime();
//   const now = Date.now();

//   if (target <= now) return alert("Time must be in the future.");

//   reminders.push({
//     time: target,
//     message,
//     triggered: false,
//   });

//   const log = $("reminderLog");
//   if (log) {
//     log.innerHTML += `<p>Reminder set for <b>${new Date(
//       target
//     ).toLocaleString()}</b>: ${message}</p>`;
//   }

//   $("reminderTime").value = "";
//   $("reminderMessage").value = "";
// }

// function initFocusTimer() {
//   if (!$("focusMinutes")) return;
//   $("btnStartFocus")?.addEventListener("click", startFocus);
//   $("btnResetFocus")?.addEventListener("click", resetFocusTimer);
// }

// function updateFocusDisplay() {
//   const display = $("focusDisplay");
//   if (!display) return;
//   const h = String(Math.floor(focusSeconds / 3600)).padStart(2, "0");
//   const m = String(Math.floor((focusSeconds % 3600) / 60)).padStart(2, "0");
//   const s = String(focusSeconds % 60).padStart(2, "0");
//   display.textContent = `${h}:${m}:${s}`;
// }

// function startFocus() {
//   const mins = parseInt($("focusMinutes").value || "0", 10);
//   if (!mins || mins <= 0) return alert("Enter valid minutes");

//   focusSeconds = mins * 60;
//   if (focusTimer) clearInterval(focusTimer);
//   updateFocusDisplay();

//   focusTimer = setInterval(() => {
//     focusSeconds--;
//     if (focusSeconds <= 0) {
//       focusSeconds = 0;
//       updateFocusDisplay();
//       clearInterval(focusTimer);
//       focusTimer = null;
//       alert("Focus session complete!");
//     } else {
//       updateFocusDisplay();
//     }
//   }, 1000);
// }

// function resetFocusTimer() {
//   if (focusTimer) clearInterval(focusTimer);
//   focusTimer = null;
//   focusSeconds = 0;
//   updateFocusDisplay();
// }

// //  DASHBOARD STATS

// function updateDashboardStats() {
//   const totalSubjects = folders.length;
//   let totalFiles = 0;
//   let totalRead = 0;
//   folders.forEach((f) => {
//     totalFiles += f.files.length;
//     totalRead += f.files.filter((x) => x.read).length;
//   });

//   const totalTasks = tasks.length;
//   const completedTasks = tasks.filter((t) => t.completed).length;

//   if ($("statSubjects")) $("statSubjects").textContent = String(totalSubjects);
//   if ($("statFiles")) $("statFiles").textContent = String(totalFiles);
//   if ($("statProgress")) {
//     const pct = totalFiles > 0 ? Math.round((totalRead / totalFiles) * 100) : 0;
//     $("statProgress").textContent = pct + "%";
//   }
//   if ($("statTasks"))
//     $("statTasks").textContent = `${completedTasks}/${totalTasks}`;
// }
// // SUBJECTS & FILES (BACKEND) 

// async function refreshSubjectsFromAPI() {
//   try {
//     const data = await apiFetch("/subjects/", { method: "GET" });
//     subjectsState = data.subjects || [];

//     folders = subjectsState.map((s) => ({
//       id: s.id,
//       subject: s.name,
//       notes: s.notes_html || "",
//       files: (s.files || []).map((f) => ({
//         id: f.id,
//         name: f.original_name,
//         size: (f.size_kb || 0) * 1024,
//         url: f.url,
//         read: f.is_read,
//       })),
//     }));

//     renderFolders();
//     renderSubjectProgress();
//     fillSubjectDropdowns();
//     updateDashboardStats();
//   } catch (err) {
//     console.error("Failed to load subjects:", err.message);
//   }
// }

// function initSubjectsPage() {
//   const isSubjectsPage = $("subjectsContainer") || $("folders");
//   if (!isSubjectsPage) return;

//   const createBtn = $("btnAddSubject") || $("btnCreateSubject");
//   const uploadBtn = $("btnUploadFiles") || $("btnUploadFiles2");

//   if (createBtn) {
//     createBtn.addEventListener("click", async () => {
//       const input = $("subjectName") || $("newSubject");
//       if (!input) return;
//       const name = input.value.trim();
//       if (!name) return alert("Enter subject name");

//       try {
//         await apiFetch("/subjects/", {
//           method: "POST",
//           body: JSON.stringify({ name }),
//         });
//         input.value = "";
//         await refreshSubjectsFromAPI();
//       } catch (err) {
//         alert("Could not create subject: " + err.message);
//       }
//     });
//   }

//   if (uploadBtn) {
//     uploadBtn.addEventListener("click", async () => {
//       const select =
//         $("uploadSubjectSelect") || $("subjectSelect") || $("subjectSelect2");
//       const subjectName = select?.value;
//       const fileInput = $("fileInput");
//       if (!subjectName || !fileInput || !fileInput.files.length)
//         return alert("Select a subject and choose file(s).");

//       const folder = folders.find((f) => f.subject === subjectName);
//       if (!folder) return alert("Subject not found");

//       const formData = new FormData();
//       Array.from(fileInput.files).forEach((file) => {
//         formData.append("files", file);
//       });

//       try {
//         await apiFetch(`/subjects/${folder.id}/upload/`, {
//           method: "POST",
//           body: formData,
//         });
//         fileInput.value = "";
//         await refreshSubjectsFromAPI();
//       } catch (err) {
//         alert("Upload failed: " + err.message);
//       }
//     });
//   }

//   bindFolderActions();
//   refreshSubjectsFromAPI();
// }

// function renderFolders() {
//   const container =
//     $("subjectsContainer") || $("folders") || $("subjectsListContainer");
//   const uploadSelect =
//     $("uploadSubjectSelect") || $("subjectSelect") || $("subjectSelect2");

//   if (uploadSelect) {
//     uploadSelect.innerHTML = `<option value="">-- Select Subject --</option>`;
//     folders.forEach((f) => {
//       const opt = document.createElement("option");
//       opt.value = f.subject;
//       opt.textContent = f.subject;
//       uploadSelect.appendChild(opt);
//     });
//   }

//   if (!container) return;
//   container.innerHTML = "";

//   if (!folders.length) {
//     container.innerHTML =
//       '<p class="muted">No subjects yet. Create one above.</p>';
//     return;
//   }

//   folders.forEach((folder) => {
//     const div = document.createElement("div");
//     div.className = "subject-card";
//     div.innerHTML = `
//       <div class="card-header">
//         <div>
//           <strong>${folder.subject}</strong>
//           <div class="muted">${folder.files.length} file(s)</div>
//         </div>
//         <button class="ghost-btn" data-delete-subject="${folder.id}">Delete</button>
//       </div>
//     `;

//     if (folder.notes) {
//       const details = document.createElement("details");
//       details.innerHTML = `
//         <summary class="muted">View saved notes</summary>
//         <div style="margin-top:8px; max-height:160px; overflow:auto; border-radius:10px; border:1px solid var(--border); padding:8px; background:#f9fbff;">
//           ${folder.notes}
//         </div>`;
//       div.appendChild(details);
//     }

//     if (!folder.files.length) {
//       const p = document.createElement("p");
//       p.className = "muted";
//       p.textContent = "No files yet.";
//       div.appendChild(p);
//     } else {
//       folder.files.forEach((file) => {
//         const item = document.createElement("div");
//         item.className = "file-item";
//         item.innerHTML = `
//           <div>
//             <a href="${file.url}" target="_blank">
//               ${file.read ? "✅ " : ""}${file.name}
//             </a>
//             <br />
//             <small>${(file.size / 1024).toFixed(1)} KB</small>
//           </div>
//           <div class="file-actions">
//             <button class="small-icon-btn" data-toggle-read="${file.id}" title="Toggle read">✔</button>
//             <button class="small-icon-btn danger" data-delete-file="${file.id}" title="Delete">✕</button>
//           </div>
//         `;
//         div.appendChild(item);
//       });
//     }

//     container.appendChild(div);
//   });
// }

// function bindFolderActions() {
//   const container =
//     $("subjectsContainer") || $("folders") || $("subjectsListContainer");
//   if (!container || container.dataset.boundClick === "1") return;

//   container.dataset.boundClick = "1";

//   container.addEventListener("click", async (e) => {
//     const target = e.target;
//     if (!(target instanceof HTMLElement)) return;

//     const delSubId = target.getAttribute("data-delete-subject");
//     const toggleFileId = target.getAttribute("data-toggle-read");
//     const deleteFileId = target.getAttribute("data-delete-file");

//     try {
//       if (delSubId) {
//         if (!confirm("Delete this subject and ALL its files?")) return;

//         await apiFetch(`/subjects/${delSubId}/delete/`, {
//           method: "DELETE",
//         });

//         await refreshSubjectsFromAPI();
//         return;
//       }

//       if (toggleFileId) {
//         await apiFetch(`/files/${toggleFileId}/toggle/`, {
//           method: "POST",
//         });
//         await refreshSubjectsFromAPI();
//         return;
//       }

//       if (deleteFileId) {
//         if (!confirm("Delete this file?")) return;
//         await apiFetch(`/files/${deleteFileId}/delete/`, {
//           method: "POST",
//         });
//         await refreshSubjectsFromAPI();
//         return;
//       }
//     } catch (err) {
//       alert("Action failed: " + err.message);
//     }
//   });
// }

// function renderSubjectProgress() {
//   const container = $("subjectProgressContainer");
//   if (!container) return;

//   container.innerHTML = "";
//   if (!folders.length) {
//     container.innerHTML =
//       '<p class="muted">No subjects yet. Add some to see progress.</p>';
//     return;
//   }

//   folders.forEach((f) => {
//     const readCount = f.files.filter((file) => file.read).length;
//     const total = f.files.length;
//     const progress = total > 0 ? Math.round((readCount / total) * 100) : 0;

//     const circle = document.createElement("div");
//     circle.className = "progress-circle";
//     circle.style.setProperty("--p", progress);
//     circle.innerHTML = `<div>${progress}%</div><span>${f.subject}</span>`;
//     container.appendChild(circle);
//   });
// }

// function fillSubjectDropdowns() {
//   const notesSelect = $("notesSubject");
//   const chatSelect = $("chatSubjectSelect");

//   if (notesSelect) {
//     notesSelect.innerHTML = '<option value="">-- Select Subject --</option>';
//     folders.forEach((f) => {
//       const opt = document.createElement("option");
//       opt.value = f.id;
//       opt.textContent = f.subject;
//       notesSelect.appendChild(opt);
//     });
//   }

//   if (chatSelect) {
//     folders.forEach((f) => {
//       const opt = document.createElement("option");
//       opt.value = f.id;
//       opt.textContent = f.subject;
//       chatSelect.appendChild(opt);
//     });
//   }
// }

// function getFolderById(id) {
//   return folders.find((f) => String(f.id) === String(id));
// }

// // NOTES PAGE 

// function initNotesPage() {
//   const editor = $("notesEditor");
//   if (!editor) return;

//   refreshSubjectsFromAPI().then(() => {
//     const notesSelect = $("notesSubject");
//     if (notesSelect) {
//       notesSelect.addEventListener("change", () => {
//         const subjId = notesSelect.value;
//         const folder = getFolderById(subjId);
//         editor.innerHTML = folder?.notes || "";
//       });
//     }

//     $("btnSaveNotes")?.addEventListener("click", async () => {
//       const subjId = notesSelect?.value;
//       if (!subjId) return alert("Choose subject");

//       try {
//         await apiFetch(`/subjects/${subjId}/notes/`, {
//           method: "POST",
//           body: JSON.stringify({ notes_html: editor.innerHTML }),
//         });
//         alert("Notes saved.");
//         await refreshSubjectsFromAPI();
//       } catch (err) {
//         alert("Could not save notes: " + err.message);
//       }
//     });

//     $("btnSaveNotesAsFile")?.addEventListener("click", async () => {
//       const subjId = $("notesSubject").value;
//       if (!subjId) return alert("Choose subject");

//       const text = extractPlainText($("notesEditor").innerHTML);

//       const blob = new Blob([text], { type: "text/plain" });

//       const formData = new FormData();
//       formData.append("files", blob, "notes.txt");

//       try {
//         await apiFetch(`/subjects/${subjId}/upload/`, {
//           method: "POST",
//           body: formData,
//         });
//         alert("Notes uploaded as text file!");
//         await refreshSubjectsFromAPI();
//       } catch (err) {
//         alert("Upload failed: " + err.message);
//       }
//     });
//   });

//   // Simple toolbar
//   ["bold", "italic", "insertUnorderedList", "insertOrderedList"].forEach(
//     (cmd) => {
//       const btn = document.querySelector(`[data-format="${cmd}"]`);
//       if (btn) {
//         btn.addEventListener("click", () => {
//           document.execCommand(cmd, false, null);
//           editor.focus();
//         });
//       }
//     }
//   );

//   const h3Btn = document.querySelector('[data-format="h3"]');
//   if (h3Btn) {
//     h3Btn.addEventListener("click", () => {
//       document.execCommand("formatBlock", false, "H3");
//       editor.focus();
//     });
//   }
// }

// // SUBJECTS & FILES (BACKEND) 

// async function refreshSubjectsFromAPI() {
//   try {
//     const data = await apiFetch("/subjects/", { method: "GET" });
//     subjectsState = data.subjects || [];

//     folders = subjectsState.map((s) => ({
//       id: s.id,
//       subject: s.name,
//       notes: s.notes_html || "",
//       files: (s.files || []).map((f) => ({
//         id: f.id,
//         name: f.original_name,
//         size: (f.size_kb || 0) * 1024,
//         url: f.url,
//         read: f.is_read,
//       })),
//     }));

//     renderFolders();
//     renderSubjectProgress();
//     fillSubjectDropdowns();
//     updateDashboardStats();
//   } catch (err) {
//     console.error("Failed to load subjects:", err.message);
//   }
// }

// function initSubjectsPage() {
//   const isSubjectsPage = $("subjectsContainer") || $("folders");
//   if (!isSubjectsPage) return;

//   const createBtn = $("btnAddSubject") || $("btnCreateSubject");
//   const uploadBtn = $("btnUploadFiles") || $("btnUploadFiles2");

//   if (createBtn) {
//     createBtn.addEventListener("click", async () => {
//       const input = $("subjectName") || $("newSubject");
//       if (!input) return;
//       const name = input.value.trim();
//       if (!name) return alert("Enter subject name");

//       try {
//         await apiFetch("/subjects/", {
//           method: "POST",
//           body: JSON.stringify({ name }),
//         });
//         input.value = "";
//         await refreshSubjectsFromAPI();
//       } catch (err) {
//         alert("Could not create subject: " + err.message);
//       }
//     });
//   }

//   if (uploadBtn) {
//     uploadBtn.addEventListener("click", async () => {
//       const select =
//         $("uploadSubjectSelect") || $("subjectSelect") || $("subjectSelect2");
//       const subjectName = select?.value;
//       const fileInput = $("fileInput");
//       if (!subjectName || !fileInput || !fileInput.files.length)
//         return alert("Select a subject and choose file(s).");

//       const folder = folders.find((f) => f.subject === subjectName);
//       if (!folder) return alert("Subject not found");

//       const formData = new FormData();
//       Array.from(fileInput.files).forEach((file) => {
//         formData.append("files", file);
//       });

//       try {
//         await apiFetch(`/subjects/${folder.id}/upload/`, {
//           method: "POST",
//           body: formData,
//         });
//         fileInput.value = "";
//         await refreshSubjectsFromAPI();
//       } catch (err) {
//         alert("Upload failed: " + err.message);
//       }
//     });
//   }

//   bindFolderActions();
//   refreshSubjectsFromAPI();
// }

// function renderFolders() {
//   const container =
//     $("subjectsContainer") || $("folders") || $("subjectsListContainer");
//   const uploadSelect =
//     $("uploadSubjectSelect") || $("subjectSelect") || $("subjectSelect2");

//   if (uploadSelect) {
//     uploadSelect.innerHTML = `<option value="">-- Select Subject --</option>`;
//     folders.forEach((f) => {
//       const opt = document.createElement("option");
//       opt.value = f.subject;
//       opt.textContent = f.subject;
//       uploadSelect.appendChild(opt);
//     });
//   }

//   if (!container) return;
//   container.innerHTML = "";

//   if (!folders.length) {
//     container.innerHTML =
//       '<p class="muted">No subjects yet. Create one above.</p>';
//     return;
//   }

//   folders.forEach((folder) => {
//     const div = document.createElement("div");
//     div.className = "subject-card";
//     div.innerHTML = `
//       <div class="card-header">
//         <div>
//           <strong>${folder.subject}</strong>
//           <div class="muted">${folder.files.length} file(s)</div>
//         </div>
//         <button class="ghost-btn" data-delete-subject="${folder.id}">Delete</button>
//       </div>
//     `;

//     if (folder.notes) {
//       const details = document.createElement("details");
//       details.innerHTML = `
//         <summary class="muted">View saved notes</summary>
//         <div style="margin-top:8px; max-height:160px; overflow:auto; border-radius:10px; border:1px solid var(--border); padding:8px; background:#f9fbff;">
//           ${folder.notes}
//         </div>`;
//       div.appendChild(details);
//     }

//     if (!folder.files.length) {
//       const p = document.createElement("p");
//       p.className = "muted";
//       p.textContent = "No files yet.";
//       div.appendChild(p);
//     } else {
//       folder.files.forEach((file) => {
//         const item = document.createElement("div");
//         item.className = "file-item";
//         item.innerHTML = `
//           <div>
//             <a href="${file.url}" target="_blank">
//               ${file.read ? "✅ " : ""}${file.name}
//             </a>
//             <br />
//             <small>${(file.size / 1024).toFixed(1)} KB</small>
//           </div>
//           <div class="file-actions">
//             <button class="small-icon-btn" data-toggle-read="${file.id}" title="Toggle read">✔</button>
//             <button class="small-icon-btn danger" data-delete-file="${file.id}" title="Delete">✕</button>
//           </div>
//         `;
//         div.appendChild(item);
//       });
//     }

//     container.appendChild(div);
//   });
// }

// function bindFolderActions() {
//   const container =
//     $("subjectsContainer") || $("folders") || $("subjectsListContainer");
//   if (!container || container.dataset.boundClick === "1") return;

//   container.dataset.boundClick = "1";

//   container.addEventListener("click", async (e) => {
//     const target = e.target;
//     if (!(target instanceof HTMLElement)) return;

//     const delSubId = target.getAttribute("data-delete-subject");
//     const toggleFileId = target.getAttribute("data-toggle-read");
//     const deleteFileId = target.getAttribute("data-delete-file");

//     try {
//       if (delSubId) {
//         if (!confirm("Delete this subject and ALL its files?")) return;

//         await apiFetch(`/subjects/${delSubId}/delete/`, {
//           method: "DELETE",
//         });

//         await refreshSubjectsFromAPI();
//         return;
//       }

//       if (toggleFileId) {
//         await apiFetch(`/files/${toggleFileId}/toggle/`, {
//           method: "POST",
//         });
//         await refreshSubjectsFromAPI();
//         return;
//       }

//       if (deleteFileId) {
//         if (!confirm("Delete this file?")) return;
//         await apiFetch(`/files/${deleteFileId}/delete/`, {
//           method: "POST",
//         });
//         await refreshSubjectsFromAPI();
//         return;
//       }
//     } catch (err) {
//       alert("Action failed: " + err.message);
//     }
//   });
// }

// function renderSubjectProgress() {
//   const container = $("subjectProgressContainer");
//   if (!container) return;

//   container.innerHTML = "";
//   if (!folders.length) {
//     container.innerHTML =
//       '<p class="muted">No subjects yet. Add some to see progress.</p>';
//     return;
//   }

//   folders.forEach((f) => {
//     const readCount = f.files.filter((file) => file.read).length;
//     const total = f.files.length;
//     const progress = total > 0 ? Math.round((readCount / total) * 100) : 0;

//     const circle = document.createElement("div");
//     circle.className = "progress-circle";
//     circle.style.setProperty("--p", progress);
//     circle.innerHTML = `<div>${progress}%</div><span>${f.subject}</span>`;
//     container.appendChild(circle);
//   });
// }

// function fillSubjectDropdowns() {
//   const notesSelect = $("notesSubject");
//   const chatSelect = $("chatSubjectSelect");

//   if (notesSelect) {
//     notesSelect.innerHTML = '<option value="">-- Select Subject --</option>';
//     folders.forEach((f) => {
//       const opt = document.createElement("option");
//       opt.value = f.id;
//       opt.textContent = f.subject;
//       notesSelect.appendChild(opt);
//     });
//   }

//   if (chatSelect) {
//     folders.forEach((f) => {
//       const opt = document.createElement("option");
//       opt.value = f.id;
//       opt.textContent = f.subject;
//       chatSelect.appendChild(opt);
//     });
//   }
// }

// function getFolderById(id) {
//   return folders.find((f) => String(f.id) === String(id));
// }

// //  NOTES PAGE 

// function initNotesPage() {
//   const editor = $("notesEditor");
//   if (!editor) return;

//   refreshSubjectsFromAPI().then(() => {
//     const notesSelect = $("notesSubject");
//     if (notesSelect) {
//       notesSelect.addEventListener("change", () => {
//         const subjId = notesSelect.value;
//         const folder = getFolderById(subjId);
//         editor.innerHTML = folder?.notes || "";
//       });
//     }

//     $("btnSaveNotes")?.addEventListener("click", async () => {
//       const subjId = notesSelect?.value;
//       if (!subjId) return alert("Choose subject");

//       try {
//         await apiFetch(`/subjects/${subjId}/notes/`, {
//           method: "POST",
//           body: JSON.stringify({ notes_html: editor.innerHTML }),
//         });
//         alert("Notes saved.");
//         await refreshSubjectsFromAPI();
//       } catch (err) {
//         alert("Could not save notes: " + err.message);
//       }
//     });

//     $("btnSaveNotesAsFile")?.addEventListener("click", async () => {
//       const subjId = $("notesSubject").value;
//       if (!subjId) return alert("Choose subject");

//       const text = extractPlainText($("notesEditor").innerHTML);

//       const blob = new Blob([text], { type: "text/plain" });

//       const formData = new FormData();
//       formData.append("files", blob, "notes.txt");

//       try {
//         await apiFetch(`/subjects/${subjId}/upload/`, {
//           method: "POST",
//           body: formData,
//         });
//         alert("Notes uploaded as text file!");
//         await refreshSubjectsFromAPI();
//       } catch (err) {
//         alert("Upload failed: " + err.message);
//       }
//     });
//   });

//   // Simple toolbar
//   ["bold", "italic", "insertUnorderedList", "insertOrderedList"].forEach(
//     (cmd) => {
//       const btn = document.querySelector(`[data-format="${cmd}"]`);
//       if (btn) {
//         btn.addEventListener("click", () => {
//           document.execCommand(cmd, false, null);
//           editor.focus();
//         });
//       }
//     }
//   );

//   const h3Btn = document.querySelector('[data-format="h3"]');
//   if (h3Btn) {
//     h3Btn.addEventListener("click", () => {
//       document.execCommand("formatBlock", false, "H3");
//       editor.focus();
//     });
//   }
// }

// // AI PAGE 
// function appendChatMessage(role, text) {
//   const box = document.getElementById("chatMessages");
//   if (!box) return;

//   const div = document.createElement("div");
//   div.className = role === "user" ? "chat-msg user" : "chat-msg assistant";
//   div.innerHTML = `<p>${text}</p>`;
//   box.appendChild(div);

//   box.scrollTop = box.scrollHeight;
// }

// async function initAIPage() {
//   console.log("AI page initialized");

//   chatMessages = $("chatMessages");

//   document.querySelectorAll(".tab-btn").forEach((btn) => {
//     btn.addEventListener("click", () => {
//       document
//         .querySelectorAll(".tab-btn")
//         .forEach((b) => b.classList.remove("active"));
//       document
//         .querySelectorAll(".ai-tab")
//         .forEach((p) => p.classList.remove("active"));

//       btn.classList.add("active");
//       const tab = btn.dataset.aiTab;
//       currentAITab = tab;
//       const panel = $("ai-tab-" + tab);
//       if (panel) panel.classList.add("active");
//     });
//   });

// try {
//   const data = await apiFetch("/subjects/", { method: "GET" });
//   const selectQuiz = $("quizSubject");
//   const selectChat = $("chatSubjectSelect");

//   if (selectQuiz) {
//     selectQuiz.innerHTML = '<option value="">-- Select Subject --</option>';
//   }

//   if (selectChat) {
//     const general = selectChat.querySelector("option[value='']");
//     selectChat.innerHTML = "";
//     if (general) selectChat.appendChild(general);
//   }

//   (data.subjects || []).forEach((s) => {
//     if (selectQuiz) {
//       const opt1 = document.createElement("option");
//       opt1.value = s.id;
//       opt1.textContent = s.name;
//       selectQuiz.appendChild(opt1);
//     }

//     if (selectChat) {
//       const opt2 = document.createElement("option");
//       opt2.value = s.id;
//       opt2.textContent = s.name;
//       selectChat.appendChild(opt2);
//     }
//   });
// } catch (err) {
//   console.error("Failed to load AI subjects:", err.message);
// }


//   const btnSendChat = $("btnSendChat");
//   const chatInput = $("chatInput");
//   const chatSubjectSelect = $("chatSubjectSelect");
//   const btnOpenGPT = $("btnOpenGPT");

//   if (btnOpenGPT) {
//     btnOpenGPT.addEventListener("click", () => {
//       window.open("https://chat.openai.com", "_blank");
//     });
//   }

//   if (btnSendChat && chatInput) {
   
//     btnSendChat.addEventListener("click", async () => {
//       const msg = chatInput.value.trim();
//       if (!msg) return;

//       const subjectId = chatSubjectSelect ? chatSubjectSelect.value : "";

//       appendChatMessage("user", msg);

//       try {
//         const res = await apiFetch("/chat/", {
//           method: "POST",
//           body: JSON.stringify({
//             message: msg,
//             subject_id: subjectId || null,
//           }),
//         });

//         appendChatMessage("assistant", res.answer || "(no answer)");
//       } catch (err) {
//         appendChatMessage("assistant", "Error: " + err.message);
//       }

//     chatInput.value = "";
//     });


//   }

//   // AI History Sidebar 
//   const btnAIHistory = $("btnAIHistory");
//   const btnCloseAIHistory = $("btnCloseAIHistory");
//   const historySidebar = $("aiHistorySidebar");

//   if (btnAIHistory && historySidebar) {
//     btnAIHistory.addEventListener("click", () => {
//       historySidebar.classList.add("open");
//     });
//   }

//   if (btnCloseAIHistory && historySidebar) {
//     btnCloseAIHistory.addEventListener("click", () => {
//       historySidebar.classList.remove("open");
//     });
//   }

//   if (btnAIReview) {
//     btnAIReview.addEventListener("click", () => {
//       alert(
//         "AI Review Summary is not implemented yet. (You can remove this button or build summary from quiz history.)"
//       );
//     });
//   }

//   if (btnSelectQuizFiles && fileSelectModal) {
//     btnSelectQuizFiles.addEventListener("click", openFileSelectModal);
//   }

//   if (btnCloseFileModal && fileSelectModal) {
//     btnCloseFileModal.addEventListener("click", () => {
//       fileSelectModal.classList.remove("open");
//     });
//   }

//   if (btnSelectAllFiles && fileSelectList) {
//     btnSelectAllFiles.addEventListener("click", () => {
//       fileSelectList
//         .querySelectorAll("input[type='checkbox']")
//         .forEach((cb) => (cb.checked = true));
//     });
//   }

//   if (btnClearFiles && fileSelectList) {
//     btnClearFiles.addEventListener("click", () => {
//       fileSelectList
//         .querySelectorAll("input[type='checkbox']")
//         .forEach((cb) => (cb.checked = false));
//     });
//   }

//   if (btnConfirmFileSelection && fileSelectList && quizSelectedFilesInfo) {
//     btnConfirmFileSelection.addEventListener("click", () => {
//       selectedQuizFileIds = Array.from(
//         fileSelectList.querySelectorAll("input[type='checkbox']")
//       )
//         .filter((cb) => cb.checked)
//         .map((cb) => parseInt(cb.value, 10));

//       if (!selectedQuizFileIds.length) {
//         quizSelectedFilesInfo.textContent = "No files selected.";
//       } else {
//         quizSelectedFilesInfo.textContent =
//           selectedQuizFileIds.length + " file(s) selected.";
//       }

//       fileSelectModal.classList.remove("open");
//     });
//   }

//   if (btnCreateAIQuiz && quizSubject && quizQuestionCount) {
//     btnCreateAIQuiz.addEventListener("click", async () => {
//       const subjectId = quizSubject.value;
//       const count = parseInt(quizQuestionCount.value || "5", 10) || 5;

//       if (!subjectId) {
//         alert("Select subject");
//         return;
//       }

//       try {
//         const data = await apiFetch("/quiz/", {
//           method: "POST",
//           body: JSON.stringify({
//             subject_id: subjectId,
//             question_count: count,
//             file_ids: selectedQuizFileIds,
//           }),
//         });

//       } catch (err) {
//         const box = $("quizOutput");
//         if (box) {
//           box.innerHTML = `<p class="text-danger">${err.message}</p>`;
//         }
//       }
//     });
//   }
// }
// //  TASKS PAGE (BACKEND) 

// async function refreshTasksFromAPI() {
//   try {
//     const data = await apiFetch("/tasks/", { method: "GET" });
//     tasks = data.tasks || [];
//     renderTasks();
//     renderTasksCalendar();
//     updateDashboardStats();
//   } catch (err) {
//     console.error("Failed to load tasks:", err.message);
//   }
// }

// function initTasksPage() {
//   const form = $("taskForm");
//   if (!form) return;

//   refreshTasksFromAPI();

//   form.addEventListener("submit", async (e) => {
//     e.preventDefault();
//     const title = $("taskTitle").value.trim();
//     const subject = $("taskSubject").value.trim();
//     const dueDate = $("taskDue").value;
//     const priority = $("taskPriority").value || "medium";

//     if (!title || !dueDate) return alert("Title & due date required");

//     try {
//       await apiFetch("/tasks/", {
//         method: "POST",
//         body: JSON.stringify({ title, subject, dueDate, priority }),
//       });

//       await refreshTasksFromAPI();
//       form.reset();
//     } catch (err) {
//       alert("Could not save task: " + err.message);
//     }
//   });

//   bindTaskActions();
// }

// function renderTasks() {
//   const container = $("tasksContainer");
//   if (!container) return;

//   container.innerHTML = "";
//   if (!tasks.length) {
//     container.innerHTML =
//       '<p class="muted">No tasks yet. Add some from the form.</p>';
//     return;
//   }

//   const sorted = [...tasks].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
//   const today = new Date().toISOString().slice(0, 10);

//   sorted.forEach((t) => {
//     const div = document.createElement("div");
//     div.className = "task-item";

//     if (t.completed) div.classList.add("completed");
//     if (!t.completed && t.dueDate < today) div.classList.add("overdue");

//     div.innerHTML = `
//       <div class="task-info">
//         <h3>${t.title}</h3>
//         <p>${t.subject || "General"} • due ${t.dueDate}</p>
//       </div>
//       <div class="task-actions">
//         <span class="priority ${t.priority}">${t.priority}</span>
//         <button data-toggle-task="${t.id}" title="Complete/Undo">✔</button>
//         <button data-delete-task="${t.id}" title="Delete">✕</button>
//       </div>
//     `;
//     container.appendChild(div);
//   });
// }

// function bindTaskActions() {
//   const container = $("tasksContainer");
//   if (!container || container.dataset.boundClick === "1") return;

//   container.dataset.boundClick = "1";

//   container.addEventListener("click", async (e) => {
//     const target = e.target;
//     if (!(target instanceof HTMLElement)) return;

//     const toggleId = target.getAttribute("data-toggle-task");
//     const deleteId = target.getAttribute("data-delete-task");

//     try {
//       if (toggleId) {
//         await apiFetch(`/tasks/${toggleId}/`, {
//           method: "PATCH",
//         });
//         await refreshTasksFromAPI();
//         return;
//       }

//       if (deleteId) {
//         if (!confirm("Delete this task?")) return;
//         await apiFetch(`/tasks/${deleteId}/`, {
//           method: "DELETE",
//         });
//         await refreshTasksFromAPI();
//       }
//     } catch (err) {
//       alert("Action failed: " + err.message);
//     }
//   });
// }

// function renderTasksCalendar() {
//   const container = $("tasksCalendarGrid");
//   if (!container) return;

//   const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
//   container.innerHTML = "";

//   days.forEach((d) => {
//     const h = document.createElement("div");
//     h.className = "day-header";
//     h.textContent = d;
//     container.appendChild(h);
//   });

//   const today = new Date();
//   for (let i = 0; i < 7; i++) {
//     const d = new Date();
//     d.setDate(today.getDate() + i);
//     const iso = d.toISOString().slice(0, 10);

//     const cell = document.createElement("div");
//     cell.className = "day-cell";
//     cell.innerHTML = `<span class="date">${iso}</span>`;

//     tasks
//       .filter((t) => t.dueDate === iso)
//       .forEach((t) => {
//         const span = document.createElement("span");
//         span.className = `task ${t.priority}`;
//         span.textContent = t.title;
//         cell.appendChild(span);
//       });

//     container.appendChild(cell);
//   }
// }

// // SETTINGS PAGE 

// function initSettingsPage() {
//   const remindersToggle = $("remindersToggle");
//   if (!remindersToggle) return;

//   const soundToggle = $("soundToggle");
//   const usernameInput = $("usernameInput");
//   const emailInput = $("emailInput");
//   const passwordInput = $("passwordInput");
//   const btnExportData = $("btnExportData");
//   const btnImportData = $("btnImportData");
//   const btnClearData = $("btnClearData");
//   const workDuration = $("workDuration");
//   const shortBreak = $("shortBreak");
//   const longBreak = $("longBreak");
//   const defaultPageSelect = $("defaultPageSelect");
//   const taskSortingSelect = $("taskSortingSelect");
//   const highContrastToggle = $("highContrastToggle");
//   const keyboardShortcutsToggle = $("keyboardShortcutsToggle");

//   let settings = getSettings();
//   const currentUser = getCurrentUser();

//   remindersToggle.checked = settings.studyReminders;
//   if (soundToggle) soundToggle.checked = settings.soundsEnabled;

//   if (usernameInput)
//     usernameInput.value =
//       settings.username || (currentUser && currentUser.username) || "";
//   if (emailInput)
//     emailInput.value =
//       settings.email || (currentUser && currentUser.email) || "";

//   if (workDuration) workDuration.value = settings.workDuration;
//   if (shortBreak) shortBreak.value = settings.shortBreak;
//   if (longBreak) longBreak.value = settings.longBreak;

//   if (defaultPageSelect)
//     defaultPageSelect.value = settings.defaultLandingPage;
//   if (taskSortingSelect) taskSortingSelect.value = settings.taskSorting;

//   if (highContrastToggle)
//     highContrastToggle.checked = settings.highContrastMode;
//   if (keyboardShortcutsToggle)
//     keyboardShortcutsToggle.checked = settings.keyboardShortcuts;

//   applyThemeFromSettings(settings);

//   remindersToggle.addEventListener("change", () => {
//     settings.studyReminders = remindersToggle.checked;
//     saveSettings(settings);
//   });

//   soundToggle?.addEventListener("change", () => {
//     settings.soundsEnabled = soundToggle.checked;
//     saveSettings(settings);
//   });

//   usernameInput?.addEventListener("input", () => {
//     settings.username = usernameInput.value;
//     saveSettings(settings);
//   });

//   emailInput?.addEventListener("input", () => {
//     settings.email = emailInput.value;
//     saveSettings(settings);
//   });

//   passwordInput?.addEventListener("change", () => {
//     settings.lastPasswordChange = new Date().toISOString();
//     saveSettings(settings);
//     passwordInput.value = "";
//     alert("Password change will be handled by backend in a real app.");
//   });

//   [workDuration, shortBreak, longBreak].forEach((input) => {
//     if (!input) return;
//     input.addEventListener("change", () => {
//       const val = parseInt(input.value || "0", 10);
//       if (input === workDuration) settings.workDuration = val || 25;
//       if (input === shortBreak) settings.shortBreak = val || 5;
//       if (input === longBreak) settings.longBreak = val || 15;
//       saveSettings(settings);
//     });
//   });

//   defaultPageSelect?.addEventListener("change", () => {
//     settings.defaultLandingPage = defaultPageSelect.value;
//     saveSettings(settings);
//   });

//   taskSortingSelect?.addEventListener("change", () => {
//     settings.taskSorting = taskSortingSelect.value;
//     saveSettings(settings);
//   });

//   highContrastToggle?.addEventListener("change", () => {
//     settings.highContrastMode = highContrastToggle.checked;
//     saveSettings(settings);
//     applyThemeFromSettings(settings);
//   });

//   keyboardShortcutsToggle?.addEventListener("change", () => {
//     settings.keyboardShortcuts = keyboardShortcutsToggle.checked;
//     saveSettings(settings);
//   });

//   btnExportData?.addEventListener("click", () => {
//     const data = JSON.stringify(localStorage, null, 2);
//     const blob = new Blob([data], { type: "application/json" });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement("a");
//     a.href = url;
//     a.download = "studywithme_data.json";
//     a.click();
//     URL.revokeObjectURL(url);
//   });

//   btnImportData?.addEventListener("click", () => {
//     const input = document.createElement("input");
//     input.type = "file";
//     input.accept = ".json";
//     input.onchange = (e) => {
//       const file = e.target.files[0];
//       if (!file) return;
//       const reader = new FileReader();
//       reader.onload = (event) => {
//         try {
//           const importedData = JSON.parse(event.target.result);
//           Object.keys(importedData).forEach((key) => {
//             localStorage.setItem(key, importedData[key]);
//           });
//           alert("Data imported successfully! Reloading...");
//           location.reload();
//         } catch {
//           alert("Invalid JSON file.");
//         }
//       };
//       reader.readAsText(file);
//     };
//     input.click();
//   });

//   btnClearData?.addEventListener("click", () => {
//     if (!confirm("Are you sure you want to reset all app data?")) return;
//     localStorage.clear();
//     alert("Local data cleared. Reloading...");
//     location.reload();
//   });
// }


// function initCollabIndicator() {
//   const label = $("collabLabel");
//   const dot = $("collabDot");
//   if (!label || !dot) return;
//   label.textContent = "Solo mode";
//   dot.style.background = "#ef4444";
// }
// document.addEventListener("DOMContentLoaded", async () => {
//   const pageId = document.body.dataset.page || "";

//   applyThemeFromSettings(getSettings());

//   initHeaderSearch();
//   initCollabIndicator();

//   if (pageId === "login") {
//     initLoginPage();
//     return;
//   }
//   if (pageId === "register") {
//     initRegisterPage();
//     return;
//   }

//   await ensureAuthenticated(pageId);

//   highlightActiveNav(pageId);

//   switch (pageId) {
//     case "dashboard":
//       initReminders();
//       initFocusTimer();
//       initGanttPage();
//       refreshSubjectsFromAPI();
//       refreshTasksFromAPI();
//       break;
//     case "subjects":
//       initSubjectsPage();
//       break;
//     case "notes":
//       initNotesPage();
//       break;
//     case "ai":
//       await refreshSubjectsFromAPI();
//       initAIPage();
//       break;
//     case "calendar":
//       initCalendarPage();
//       initGanttPage();
//       break;
//     case "tasks":
//       initTasksPage();
//       break;
//     case "settings":
//       initSettingsPage();
//       break;
//     default:
//       break;
//   }
// });


// // REMINDER TICKER

// setInterval(() => {
//   const now = Date.now();

//   reminders.forEach((r) => {
//     if (!r.triggered && now >= r.time) {
//       r.triggered = true;

//       alert("REMINDER: " + r.message);

//       const log = $("reminderLog");
//       if (log) {
//         log.innerHTML += `<p><strong>Triggered:</strong> ${
//           r.message
//         } at ${new Date().toLocaleString()}</p>`;
//       }
//     }
//   });
// }, 1000);
// function initCalendarPage() {
//   const calendarEl = document.getElementById("calendar");
//   if (!calendarEl) return;

//   const calendar = new FullCalendar.Calendar(calendarEl, {
//     initialView: "dayGridMonth",
//     height: "auto",
//     selectable: true,
//     events: calendarEvents,
//     dateClick: function(info) {
//       alert("Clicked date: " + info.dateStr);
//     }
//   });

//   calendar.render();

//   // Add event button logic
//   const btn = document.getElementById("btnAddEvent");
//   if (btn) {
//     btn.addEventListener("click", () => {
//       const title = document.getElementById("eventTitle").value.trim();
//       const date = document.getElementById("eventTime").value;

//       if (!title || !date) {
//         alert("Enter event title & date");
//         return;
//       }

//       calendar.addEvent({
//         title: title,
//         start: date
//       });

//       document.getElementById("eventTitle").value = "";
//       document.getElementById("eventTime").value = "";
//     });
//   }
// }
// function initAIUploadSection() {
//   // prevents JS crash
// }

// async function loadAIHistory() {
//   const list = $("aiHistoryList");
//   if (!list) return;
//   list.innerHTML = `<p class="muted">Loading...</p>`;

//   try {
//     const data = await apiFetch("/chat/history/", { method: "GET" });

//     if (!data.history.length) {
//       list.innerHTML = `<p class="muted">No history yet.</p>`;
//       return;
//     }

//     list.innerHTML = data.history.map(h => `
//       <div class="hist-item">
//         <b>${h.subject || "General"}</b>
//         <p>${h.question}</p>
//         <small>${h.created_at}</small>
//       </div>
//     `).join("");
//   } catch (err) {
//     list.innerHTML = `<p class="text-danger">${err.message}</p>`;
//   }
// }
// function initGanttPage() {
//   // do nothing
// }
// CLEANED VERSION OF YOUR APP JS
// All comments preserved, duplicates removed, non‑identical merged (favor latest logic)