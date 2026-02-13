const input = document.getElementById("taskInput");
const addBtn = document.getElementById("addBtn");
const list = document.getElementById("taskList");
const total = document.getElementById("total");
const completed = document.getElementById("completed");
const deleted = document.getElementById("deleted");
const edited = document.getElementById("edited");
const deleteSelectedBtn = document.getElementById("deleteSelected");
const themeToggle = document.getElementById("themeToggle");
const sortAsc = document.getElementById("sortAsc");
const sortDesc = document.getElementById("sortDesc");
const resetSort = document.getElementById("resetSort");

let deletedCount = 0;
let editedCount = 0;
let originalOrder = [];

function updateCounters() {
  total.textContent = list.children.length;
  completed.textContent = document.querySelectorAll(".completed").length;
  deleted.textContent = deletedCount;
  edited.textContent = editedCount;
}

function saveTasks() {
  const tasks = [...list.children].map(li => ({
    text: li.querySelector("span").textContent,
    completed: li.classList.contains("completed")
  }));
  localStorage.setItem("tasks", JSON.stringify(tasks));
  localStorage.setItem("originalOrder", JSON.stringify(originalOrder));
}

function loadTasks() {
  const tasks = JSON.parse(localStorage.getItem("tasks") || "[]");
  const order = JSON.parse(localStorage.getItem("originalOrder") || "[]");
  originalOrder = order;
  tasks.forEach(t => createTask(t.text, true, t.completed));
}

function taskExists(text) {
  return [...document.querySelectorAll("li span")]
    .some(s => s.textContent.toLowerCase() === text.toLowerCase());
}

function createTask(text, fromReset = false, completedTask = false) {
  const li = document.createElement("li");
  li.taskData = { text, completed: completedTask };

  const span = document.createElement("span");
  span.textContent = text;

  const selectBox = document.createElement("input");
  selectBox.type = "checkbox";
  selectBox.className = "select";
  selectBox.addEventListener("change", () => {
    li.classList.toggle("selected", selectBox.checked);
  });

  const completeBtn = document.createElement("button");
  completeBtn.className = "complete";
  completeBtn.innerHTML = '<i class="fa fa-check"></i>';
  completeBtn.onclick = () => {
    li.taskData.completed = !li.taskData.completed;
    li.classList.toggle("completed", li.taskData.completed);
    updateCounters();
    saveTasks();
  };

  const removeBtn = document.createElement("button");
  removeBtn.className = "remove";
  removeBtn.innerHTML = '<i class="fa fa-times"></i>';
  removeBtn.onclick = () => {
    if (confirm(`Delete "${span.textContent}"?`)) {
      li.remove();
      originalOrder = originalOrder.filter(t => t !== text);
      deletedCount++;
      updateCounters();
      saveTasks();
    }
  };

  span.ondblclick = () => {
    const newText = prompt("Edit task:", span.textContent);
    if (newText === null) return;
    const trimmed = newText.trim();
    const oldText = span.textContent.trim();
    if (trimmed === oldText) return;
    if (!trimmed) { alert("Task name cannot be empty."); return; }
    if (trimmed.toLowerCase() !== oldText.toLowerCase() && taskExists(trimmed)) {
      alert("This task already exists."); return;
    }
    span.textContent = trimmed;
    editedCount++;
    updateCounters();
    saveTasks();
  };

  li.append(selectBox, span, completeBtn, removeBtn);
  if (completedTask) li.classList.add("completed");
  list.appendChild(li);

  li.draggable = true;
  li.addEventListener("dragstart", e => {
    e.dataTransfer.setData("text/plain", li.taskData.text);
    li.classList.add("dragging");
  });
  li.addEventListener("dragend", () => {
    li.classList.remove("dragging");
    saveTasks();
  });

  if (!fromReset) originalOrder.push(text);
  updateCounters();
  saveTasks();
}

addBtn.onclick = () => {
  const text = input.value.trim();
  if (!text) { alert("Task name cannot be empty."); return; }
  if (taskExists(text)) { alert("This task already exists."); return; }
  createTask(text);
  input.value = "";
};

input.onkeydown = e => { if (e.key === "Enter") addBtn.click(); };

deleteSelectedBtn.onclick = () => {
  const selected = document.querySelectorAll(".selected");
  if (!selected.length) return;
  if (confirm(`Delete ${selected.length} selected tasks?`)) {
    selected.forEach(li => {
      const text = li.querySelector("span").textContent;
      li.remove();
      originalOrder = originalOrder.filter(t => t !== text);
    });
    deletedCount += selected.length;
    updateCounters();
    saveTasks();
  }
};

sortAsc.onclick = () => {
  [...list.children]
    .sort((a,b)=>a.querySelector("span").textContent.localeCompare(b.querySelector("span").textContent))
    .forEach(li => list.appendChild(li));
  saveTasks();
};

sortDesc.onclick = () => {
  [...list.children]
    .sort((a,b)=>b.querySelector("span").textContent.localeCompare(a.querySelector("span").textContent))
    .forEach(li => list.appendChild(li));
  saveTasks();
};

resetSort.onclick = () => {
  const items = [...list.children];
  items.sort((a,b) =>
    originalOrder.indexOf(a.querySelector("span").textContent) -
    originalOrder.indexOf(b.querySelector("span").textContent)
  );
  list.innerHTML = "";
  items.forEach(li => list.appendChild(li));
  updateCounters();
  saveTasks();
};

document.addEventListener("keydown", (e) => {
  if (e.key !== "Delete") return;
  const selected = document.querySelectorAll(".selected");
  if (!selected.length) return;
  if (confirm(`Delete ${selected.length} selected tasks?`)) {
    selected.forEach(li => {
      const text = li.querySelector("span").textContent;
      li.remove();
      originalOrder = originalOrder.filter(t => t !== text);
    });
    deletedCount += selected.length;
    updateCounters();
    saveTasks();
  }
});

list.addEventListener("dragover", e => {
  e.preventDefault();
  const dragging = document.querySelector(".dragging");
  const afterElement = getDragAfterElement(list, e.clientY);
  if (!afterElement) list.appendChild(dragging);
  else list.insertBefore(dragging, afterElement);
});

function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll("li:not(.dragging)")];
  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) return { offset: offset, element: child };
    else return closest;
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

const savedTheme = localStorage.getItem("theme");
if (savedTheme === "dark") document.body.classList.add("dark");
const initIcon = themeToggle.querySelector("i");
initIcon.style.color = document.body.classList.contains("dark") ? "white" : "black";

themeToggle.onclick = () => {
  document.body.classList.toggle("dark");
  const icon = themeToggle.querySelector("i");
  const dark = document.body.classList.contains("dark");
  icon.style.color = dark ? "white" : "black";
  localStorage.setItem("theme", dark ? "dark" : "light");
};

loadTasks();
updateCounters();