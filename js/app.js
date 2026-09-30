const App = {
  tasks: [],
  currentFilter: "all",
  searchQuery: "",
  listEl: null,
  statsEl: null,
  progressFillEl: null,
  progressLabelEl: null,
  progressTrackEl: null,
  PRIORITY_LABEL: { high: "Tinggi", medium: "Sedang", low: "Rendah" },

  init() {
    this.listEl = document.getElementById("list");
    this.statsEl = document.getElementById("stats");
    this.progressFillEl = document.getElementById("progressFill");
    this.progressLabelEl = document.getElementById("progressLabel");
    this.progressTrackEl = document.getElementById("progressTrack");
    this.tasks = Storage.load();
    this.render();
  },
  persist() {
    Storage.save(this.tasks);
  },

  add(title, priority, category, dueAt = "") {
    const dueDate = dueAt ? new Date(dueAt) : null;
    const task = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      title: title.trim(),
      priority,
      category,
      dueAt:
        dueDate && !Number.isNaN(dueDate.getTime())
          ? dueDate.toISOString()
          : null,
      done: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.tasks.unshift(task);
    this.persist();
    this.render();
  },
  update(id, title, priority, category, dueAt = "") {
    const task = this.tasks.find((item) => item.id === id);
    if (!task) return;
    const dueDate = dueAt ? new Date(dueAt) : null;
    task.title = title.trim();
    task.priority = priority;
    task.category = category;
    task.dueAt =
      dueDate && !Number.isNaN(dueDate.getTime())
        ? dueDate.toISOString()
        : null;
    task.updatedAt = new Date().toISOString();
    this.persist();
    this.render();
  },
  toggle(id) {
    const t = this.tasks.find((x) => x.id === id);
    if (!t) return;
    t.done = !t.done;
    t.updatedAt = new Date().toISOString();
    this.persist();
    this.render();
  },
  remove(id) {
    this.tasks = this.tasks.filter((t) => t.id !== id);
    this.persist();
    this.render();
  },
  clearAll() {
    this.tasks = [];
    this.persist();
    this.render();
  },
  replaceAll(newTasks) {
    this.tasks = newTasks;
    this.persist();
    this.render();
  },
  appendAll(newTasks) {
    const usedIds = new Set(this.tasks.map((task) => task.id));
    const additions = newTasks.map((task) => {
      let id = task.id;
      while (usedIds.has(id)) {
        id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      }
      usedIds.add(id);
      return { ...task, id };
    });
    this.tasks = [...this.tasks, ...additions];
    this.persist();
    this.render();
  },
  moveTask(sourceId, targetId) {
    if (sourceId === targetId) return;
    const sourceIndex = this.tasks.findIndex((task) => task.id === sourceId);
    const targetIndex = this.tasks.findIndex((task) => task.id === targetId);
    if (sourceIndex < 0 || targetIndex < 0) return;
    const [task] = this.tasks.splice(sourceIndex, 1);
    this.tasks.splice(targetIndex, 0, task);
    this.persist();
    this.render();
  },
  setFilter(filter) {
    this.currentFilter = filter;
    this.render();
  },
  setSearch(query) {
    this.searchQuery = query.trim().toLocaleLowerCase("id-ID");
    this.render();
  },
  getFiltered() {
    let tasks;
    switch (this.currentFilter) {
      case "active":
        tasks = this.tasks.filter((t) => !t.done);
        break;
      case "done":
        tasks = this.tasks.filter((t) => t.done);
        break;
      case "high":
        tasks = this.tasks.filter((t) => t.priority === "high" && !t.done);
        break;
      default:
        tasks = this.tasks;
    }
    if (!this.searchQuery) return tasks;
    return tasks.filter((task) =>
      (task.title + " " + task.category)
        .toLocaleLowerCase("id-ID")
        .includes(this.searchQuery)
    );
  },
  render() {
    const data = this.getFiltered();
    this.listEl.innerHTML = "";
    if (data.length === 0) {
      const empty = document.createElement("li");
      empty.className = "empty";
      empty.textContent =
        this.tasks.length === 0
          ? "Belum ada tugas. Tambahkan tugas pertama kamu di atas."
          : this.searchQuery
            ? "Tidak ada tugas yang cocok dengan pencarian ini."
            : "Tidak ada tugas yang cocok dengan filter ini.";
      this.listEl.appendChild(empty);
    } else {
      const frag = document.createDocumentFragment();
      data.forEach((t) => frag.appendChild(this.createTaskElement(t)));
      this.listEl.appendChild(frag);
    }
    this.renderStats();
  },
  createTaskElement(t) {
    const li = document.createElement("li");
    li.className = "task" + (t.done ? " done" : "");
    li.dataset.id = t.id;
    li.dataset.priority = t.priority;
    li.draggable = true;
    li.addEventListener("dragstart", (event) => {
      event.dataTransfer.setData("text/plain", t.id);
      event.dataTransfer.effectAllowed = "move";
      li.classList.add("dragging");
    });
    li.addEventListener("dragover", (event) => {
      event.preventDefault();
      li.classList.add("drag-over");
    });
    li.addEventListener("dragleave", () => li.classList.remove("drag-over"));
    li.addEventListener("drop", (event) => {
      event.preventDefault();
      li.classList.remove("drag-over");
      this.moveTask(event.dataTransfer.getData("text/plain"), t.id);
    });
    li.addEventListener("dragend", () => li.classList.remove("dragging"));

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = t.done;
    cb.setAttribute(
      "aria-label",
      (t.done ? "Tandai belum selesai: " : "Tandai selesai: ") + t.title
    );
    const body = document.createElement("div");
    body.className = "body";

    const title = document.createElement("div");
    title.className = "title";
    title.textContent = t.title;

    const meta = document.createElement("div");
    meta.className = "meta";

    const tagPriority = document.createElement("span");
    tagPriority.className = "tag " + t.priority;
    tagPriority.textContent = this.PRIORITY_LABEL[t.priority];

    const tagCat = document.createElement("span");
    tagCat.className = "tag";
    tagCat.textContent = t.category;

    const dateEl = document.createElement("span");
    dateEl.textContent =
      "Ditambahkan " +
      new Date(t.createdAt).toLocaleString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });

    meta.append(tagPriority, tagCat, dateEl);
    if (t.dueAt) {
      const dueDate = new Date(t.dueAt);
      const dueEl = document.createElement("span");
      dueEl.className = "tag due-date";
      if (!t.done && dueDate.getTime() < Date.now()) {
        dueEl.classList.add("overdue");
      }
      dueEl.textContent =
        "Tenggat " +
        dueDate.toLocaleString("id-ID", {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit"
        });
      meta.appendChild(dueEl);
    }
    body.append(title, meta);

    const actions = document.createElement("div");
    actions.className = "actions";

    const editBtn = document.createElement("button");
    editBtn.className = "edit";
    editBtn.title = "Edit tugas";
    editBtn.setAttribute("aria-label", "Edit tugas: " + t.title);
    editBtn.textContent = "Edit";

    const delBtn = document.createElement("button");
    delBtn.className = "del";
    delBtn.title = "Hapus";
    delBtn.setAttribute("aria-label", "Hapus tugas: " + t.title);
    delBtn.textContent = "Hapus";

    actions.append(editBtn, delBtn);
    li.append(cb, body, actions);
    return li;
  },
  renderStats() {
    const total = this.tasks.length;
    const done = this.tasks.filter((t) => t.done).length;
    const high = this.tasks.filter(
      (t) => t.priority === "high" && !t.done
    ).length;
    const progress = total ? Math.round((done / total) * 100) : 0;
    this.progressFillEl.style.width = progress + "%";
    this.progressLabelEl.textContent = progress + "%";
    this.progressTrackEl.setAttribute("aria-valuenow", String(progress));
    this.statsEl.innerHTML =
      "<span>Total <strong>" +
      total +
      "</strong></span>" +
      "<span>Selesai <strong>" +
      done +
      "</strong></span>" +
      "<span>Aktif <strong>" +
      (total - done) +
      "</strong></span>" +
      "<span>Prioritas tinggi <strong>" +
      high +
      "</strong></span>";
  }
};
