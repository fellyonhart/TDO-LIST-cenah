const STORAGE_KEY = "todo_app_data_v1";

const Storage = {
  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const data = raw ? JSON.parse(raw) : [];
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error("Gagal parse localStorage:", err);
      return [];
    }
  },
  save(tasks) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (err) {
      console.error("Gagal simpan:", err);
    }
  },
  clear() {
    localStorage.removeItem(STORAGE_KEY);
  },
  exportToFile(tasks) {
    const dataStr = JSON.stringify(tasks, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const randomId =
      window.crypto?.randomUUID?.() || Math.random().toString(36).slice(2, 10);
    a.download = "todo-backup-" + timestamp + "-" + randomId + ".json";
    a.click();
    URL.revokeObjectURL(url);
  },
  importFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const parsed = JSON.parse(ev.target.result);
          if (!Array.isArray(parsed)) throw new Error("Format harus array");
          resolve(parsed);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error("Gagal membaca file"));
      reader.readAsText(file);
    });
  },
  normalize(list) {
    return list
      .filter((t) => t && typeof t.title === "string")
      .map((t) => ({
        id:
          t.id ||
          Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        title: String(t.title).slice(0, 120),
        priority: ["high", "medium", "low"].includes(t.priority)
          ? t.priority
          : "medium",
        category: t.category || "Umum",
        dueAt:
          t.dueAt && !Number.isNaN(new Date(t.dueAt).getTime())
            ? new Date(t.dueAt).toISOString()
            : null,
        done: !!t.done,
        createdAt: t.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));
  }
};
