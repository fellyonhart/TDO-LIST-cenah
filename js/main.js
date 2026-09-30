const AppDialog = {
  element: null,
  init() {
    this.element = document.getElementById("appDialog");
  },
  open({ eyebrow, title, message, choices = [], actions = [] }) {
    const dialog = this.element;
    dialog.querySelector("#dialogEyebrow").textContent = eyebrow;
    dialog.querySelector("#dialogTitle").textContent = title;
    dialog.querySelector("#dialogMessage").textContent = message;

    const content = dialog.querySelector(".dialog-content");
    const previousChoices = content.querySelector(".dialog-choices");
    if (previousChoices) previousChoices.remove();

    const actionsEl = dialog.querySelector("#dialogActions");
    actionsEl.replaceChildren();

    if (choices.length) {
      const choicesEl = document.createElement("div");
      choicesEl.className = "dialog-choices";
      choices.forEach((choice) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "dialog-choice";
        button.setAttribute("aria-label", choice.label);
        button.innerHTML =
          '<span class="choice-mark" aria-hidden="true">' +
          choice.mark +
          '</span><span class="choice-copy"><strong></strong><small></small></span>';
        button.querySelector("strong").textContent = choice.label;
        button.querySelector("small").textContent = choice.description;
        button.addEventListener("click", () => dialog.close(choice.value));
        choicesEl.appendChild(button);
      });
      content.insertBefore(choicesEl, actionsEl);
    }

    actions.forEach((action) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = action.label;
      if (action.className) button.className = action.className;
      button.addEventListener("click", () => dialog.close(action.value));
      actionsEl.appendChild(button);
    });

    dialog.returnValue = "";
    return new Promise((resolve) => {
      dialog.addEventListener("close", () => resolve(dialog.returnValue), {
        once: true
      });
      dialog.showModal();
    });
  }
};

function showToast(message, type = "success") {
  const container = document.getElementById("toastContainer");
  const toast = document.createElement("div");
  toast.className = "toast" + (type === "error" ? " error" : "");
  toast.setAttribute("role", type === "error" ? "alert" : "status");
  toast.textContent = message;
  container.appendChild(toast);
  window.setTimeout(() => toast.remove(), 4200);
}

const ThemeManager = {
  key: "todo_app_theme_v1",
  init() {
    const savedTheme = localStorage.getItem(this.key);
    const preferredTheme = window.matchMedia("(prefers-color-scheme: dark)")
      .matches
      ? "dark"
      : "light";
    this.setTheme(savedTheme || preferredTheme, false);
    document.getElementById("themeToggle").addEventListener("click", () => {
      const nextTheme =
        document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      this.setTheme(nextTheme);
    });
  },
  setTheme(theme, persist = true) {
    const isDark = theme === "dark";
    document.documentElement.dataset.theme = isDark ? "dark" : "light";
    const toggle = document.getElementById("themeToggle");
    toggle.setAttribute("aria-pressed", String(isDark));
    toggle.setAttribute(
      "aria-label",
      "Aktifkan mode " + (isDark ? "terang" : "gelap")
    );
    toggle.querySelector(".theme-label").textContent =
      "Mode " + (isDark ? "terang" : "gelap");
    toggle.querySelector(".theme-icon").textContent = isDark ? "☼" : "◐";
    document.querySelector('meta[name="theme-color"]').content = isDark
      ? "#171d1b"
      : "#f4f6f2";
    if (persist) localStorage.setItem(this.key, isDark ? "dark" : "light");
  }
};

const ReminderManager = {
  timers: new Map(),
  maxDelay: 2147480000,
  scheduleAll() {
    this.timers.forEach((timer) => window.clearTimeout(timer));
    this.timers.clear();
    App.tasks.forEach((task) => this.schedule(task));
  },
  schedule(task) {
    if (task.done || !task.dueAt) return;
    const dueTime = new Date(task.dueAt).getTime();
    if (Number.isNaN(dueTime) || dueTime <= Date.now()) return;
    const timer = window.setTimeout(
      () => {
        this.timers.delete(task.id);
        if (dueTime - Date.now() > 0) {
          this.schedule(task);
          return;
        }
        const currentTask = App.tasks.find((item) => item.id === task.id);
        if (currentTask && !currentTask.done) {
          showToast("Tenggat tugas: " + currentTask.title, "error");
        }
      },
      Math.min(dueTime - Date.now(), this.maxDelay)
    );
    this.timers.set(task.id, timer);
  }
};

let editingTaskId = null;

function setFormMode(isEditing) {
  const submitButton = document.getElementById("submitTaskBtn");
  const cancelButton = document.getElementById("cancelEditBtn");
  submitButton.innerHTML = isEditing
    ? "Simpan perubahan"
    : '<span aria-hidden="true">+</span> Tambah tugas';
  cancelButton.hidden = !isEditing;
}

function beginEditingTask(taskId) {
  const task = App.tasks.find((item) => item.id === taskId);
  if (!task) return;
  editingTaskId = task.id;

  const titleInput = document.getElementById("title");
  const priorityInput = document.getElementById("priority");
  const categoryInput = document.getElementById("category");
  const dueInput = document.getElementById("dueAt");

  titleInput.value = task.title;
  priorityInput.value = task.priority;
  if (
    ![...categoryInput.options].some((option) => option.value === task.category)
  ) {
    categoryInput.add(new Option(task.category, task.category));
  }
  categoryInput.value = task.category;

  if (task.dueAt) {
    const date = new Date(task.dueAt);
    dueInput.value = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  } else {
    dueInput.value = "";
  }
  dueInput.min = task.dueAt ? dueInput.value : dueInput.min;
  setFormMode(true);
  document
    .getElementById("form")
    .scrollIntoView({ behavior: "smooth", block: "center" });
  titleInput.focus({ preventScroll: true });
}

function cancelEditingTask() {
  editingTaskId = null;
  document.getElementById("form").reset();
  const dueInput = document.getElementById("dueAt");
  const localNow = new Date(
    Date.now() - new Date().getTimezoneOffset() * 60000
  );
  dueInput.min = localNow.toISOString().slice(0, 16);
  setFormMode(false);
}

async function confirmAction({ title, message, confirmLabel }) {
  return AppDialog.open({
    eyebrow: "KONFIRMASI",
    title,
    message,
    actions: [
      { label: "Batal", value: "cancel" },
      { label: confirmLabel, value: "confirm", className: "danger-action" }
    ]
  });
}

document.addEventListener("DOMContentLoaded", () => {
  AppDialog.init();
  ThemeManager.init();
  App.init();
  ReminderManager.scheduleAll();

  const dueInput = document.getElementById("dueAt");
  const localNow = new Date(
    Date.now() - new Date().getTimezoneOffset() * 60000
  );
  dueInput.min = localNow.toISOString().slice(0, 16);

  document.getElementById("form").addEventListener("submit", (e) => {
    e.preventDefault();
    const titleEl = document.getElementById("title");
    const title = titleEl.value.trim();
    if (!title) return;

    const priority = document.getElementById("priority").value;
    const category = document.getElementById("category").value;
    const dueAt = dueInput.value;

    if (editingTaskId) {
      App.update(editingTaskId, title, priority, category, dueAt);
      editingTaskId = null;
      setFormMode(false);
      showToast("Perubahan tugas berhasil disimpan.");
    } else {
      App.add(title, priority, category, dueAt);
    }
    ReminderManager.scheduleAll();
    document.getElementById("form").reset();
    const localNow = new Date(
      Date.now() - new Date().getTimezoneOffset() * 60000
    );
    dueInput.min = localNow.toISOString().slice(0, 16);
    titleEl.focus();
  });

  document.getElementById("cancelEditBtn").addEventListener("click", () => {
    cancelEditingTask();
    document.getElementById("title").focus();
  });

  document.getElementById("searchInput").addEventListener("input", (event) => {
    App.setSearch(event.target.value);
  });

  document.getElementById("filters").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-filter]");
    if (!btn) return;
    document
      .querySelectorAll("#filters button")
      .forEach((filterButton) =>
        filterButton.classList.toggle("active", filterButton === btn)
      );
    App.setFilter(btn.dataset.filter);
  });

  document.getElementById("list").addEventListener("click", async (e) => {
    const editButton = e.target.closest("button.edit");
    if (editButton) {
      beginEditingTask(editButton.closest(".task").dataset.id);
      return;
    }
    const deleteButton = e.target.closest("button.del");
    if (!deleteButton) return;
    const task = deleteButton.closest(".task");
    const result = await confirmAction({
      title: "Hapus tugas ini?",
      message: "Tugas yang dihapus tidak dapat dipulihkan.",
      confirmLabel: "Hapus tugas"
    });
    if (result === "confirm") {
      App.remove(task.dataset.id);
      ReminderManager.scheduleAll();
    }
  });

  document.getElementById("list").addEventListener("change", (event) => {
    if (!event.target.matches('.task input[type="checkbox"]')) return;
    App.toggle(event.target.closest(".task").dataset.id);
    ReminderManager.scheduleAll();
  });

  document.getElementById("clearBtn").addEventListener("click", async () => {
    if (App.tasks.length === 0) {
      showToast("Belum ada tugas untuk dihapus.");
      return;
    }
    const result = await confirmAction({
      title: "Hapus semua tugas?",
      message:
        "Semua tugas akan dihapus dari perangkat ini dan tidak dapat dipulihkan.",
      confirmLabel: "Hapus semua"
    });
    if (result === "confirm") {
      App.clearAll();
      ReminderManager.scheduleAll();
      showToast("Semua tugas berhasil dihapus.");
    }
  });

  document.getElementById("exportBtn").addEventListener("click", () => {
    if (App.tasks.length === 0) {
      showToast(
        "Belum ada tugas untuk diekspor. Tambahkan tugas terlebih dahulu.",
        "error"
      );
      return;
    }
    Storage.exportToFile(App.tasks);
    showToast("Cadangan tugas berhasil diekspor.");
  });

  document
    .getElementById("importBtn")
    .addEventListener("click", () =>
      document.getElementById("fileInput").click()
    );

  document.getElementById("fileInput").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const raw = await Storage.importFromFile(file);
      const clean = Storage.normalize(raw);
      const result = await AppDialog.open({
        eyebrow: "PILIH CARA IMPOR",
        title: "Impor tugas",
        message:
          "File berisi " +
          clean.length +
          " tugas. Daftar saat ini memiliki " +
          App.tasks.length +
          " tugas.",
        choices: [
          {
            value: "replace",
            mark: "↻",
            label: "Ganti daftar",
            description: "Hapus daftar saat ini dan gunakan tugas dari file."
          },
          {
            value: "append",
            mark: "+",
            label: "Tambahkan ke daftar",
            description:
              "Pertahankan tugas saat ini dan masukkan tugas dari file."
          }
        ],
        actions: [{ label: "Batal", value: "cancel" }]
      });

      if (result === "replace") {
        App.replaceAll(clean);
        ReminderManager.scheduleAll();
        showToast(
          clean.length + " tugas berhasil diimpor. Daftar lama diganti."
        );
      } else if (result === "append") {
        App.appendAll(clean);
        ReminderManager.scheduleAll();
        showToast(clean.length + " tugas berhasil ditambahkan ke daftar.");
      }
    } catch (err) {
      showToast("Gagal mengimpor file: " + err.message, "error");
    } finally {
      e.target.value = "";
    }
  });
});
