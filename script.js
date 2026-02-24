document.addEventListener('DOMContentLoaded', () => {
    // State
    let todos = [];
    let listName = 'cyber_state';

    // DOM Elements
    const todoForm = document.getElementById('todo-form');
    const todoInput = document.getElementById('todo-input');
    const todoList = document.getElementById('todo-list');
    const emptyState = document.getElementById('empty-state');
    const btnSave = document.getElementById('btn-save');
    const fileUpload = document.getElementById('file-upload');
    const listNameInput = document.getElementById('list-name-input');

    // Load initial state from localStorage if exists
    const loadInitialState = () => {
        const saved = localStorage.getItem('terminall-todos');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Handle new object format { listName, todos } or old array format
                if (Array.isArray(parsed)) {
                    todos = parsed;
                } else if (parsed && typeof parsed === 'object') {
                    todos = parsed.todos || [];
                    listName = parsed.listName || 'cyber_state';
                }

                listNameInput.value = listName === 'cyber_state' ? '' : listName;
                renderTodos();
            } catch (e) {
                console.error('Failed to parse localStorage', e);
            }
        } else {
            renderTodos();
        }
    };

    // Save to localStorage
    const saveToLocalStorage = () => {
        const stateToSave = {
            listName: listName,
            todos: todos
        };
        localStorage.setItem('terminall-todos', JSON.stringify(stateToSave));
    };

    // Render Todos
    const renderTodos = () => {
        todoList.innerHTML = '';

        if (todos.length === 0) {
            emptyState.classList.remove('hidden');
            emptyState.classList.add('flex');
            return;
        }

        emptyState.classList.add('hidden');
        emptyState.classList.remove('flex');

        todos.forEach(todo => {
            const taskEl = document.createElement('div');

            // Allow animation only when the task is first created, not when rendered later (e.g. toggle completion)
            let animationClass = todo.justAdded ? 'animate-slide-down ' : '';
            if (todo.justAdded) {
                delete todo.justAdded; // Only animate once
            }

            taskEl.className = `${animationClass}task-item flex items-center gap-4 p-4 border border-term-primary/20 rounded-lg bg-[#050D1A]/80 hover:border-term-primary/60 transition-all group duration-300 shadow-sm hover:shadow-glow`;

            // Checkbox logic
            const isCompleted = todo.completed;
            const checkboxClass = isCompleted
                ? 'w-6 h-6 rounded border border-term-secondary bg-term-secondary/20 flex items-center justify-center text-term-secondary transition-colors cursor-pointer shrink-0'
                : 'w-6 h-6 rounded border border-term-primary/40 flex items-center justify-center text-transparent group-hover:border-term-secondary transition-colors cursor-pointer shrink-0';

            const textClass = isCompleted
                ? 'flex-1 task-completed break-words break-all min-w-0 font-medium'
                : 'flex-1 text-term-text break-words break-all min-w-0 font-medium transition-colors';

            const checkMark = isCompleted ? '✓' : '';

            taskEl.innerHTML = `
                <button class="todo-toggle ${checkboxClass}" aria-label="Toggle task">
                    ${checkMark}
                </button>
                <span class="${textClass}">${escapeHtml(todo.text)}</span>
                <button class="todo-edit text-term-muted hover:text-term-secondary transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center shrink-0 font-bold tracking-widest px-2" aria-label="Edit task" title="Edit">
                    [edit]
                </button>
                <button class="todo-delete text-term-muted hover:text-[#ff4d4d] transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center shrink-0 font-bold tracking-widest px-2" aria-label="Delete task" title="Delete">
                    [del]
                </button>
            `;

            // Event Listeners for buttons within task
            const toggleBtn = taskEl.querySelector('.todo-toggle');
            toggleBtn.addEventListener('click', () => toggleTodo(todo.id));

            const editBtn = taskEl.querySelector('.todo-edit');
            editBtn.addEventListener('click', () => startEditTodo(todo.id, taskEl));

            const deleteBtn = taskEl.querySelector('.todo-delete');
            deleteBtn.addEventListener('click', () => deleteTodo(todo.id));

            todoList.appendChild(taskEl);
        });
    };

    // Utility to prevent XSS
    const escapeHtml = (unsafe) => {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    };

    // Add Todo
    const addTodo = (text) => {
        if (!text.trim()) return;

        const newTodo = {
            id: Date.now().toString(),
            text: text.trim(),
            completed: false,
            justAdded: true
        };

        todos.push(newTodo); // Add to end
        saveToLocalStorage();
        renderTodos();
    };

    // Toggle Todo
    const toggleTodo = (id) => {
        todos = todos.map(todo =>
            todo.id === id ? { ...todo, completed: !todo.completed } : todo
        );
        saveToLocalStorage();
        renderTodos();
    };

    // Delete Todo
    const deleteTodo = (id) => {
        todos = todos.filter(todo => todo.id !== id);
        saveToLocalStorage();
        renderTodos();
    };

    // Start Editing Todo Interactive
    const startEditTodo = (id, taskEl) => {
        const todo = todos.find(t => t.id === id);
        if (!todo) return;

        const spanEl = taskEl.querySelector('span');
        if (!spanEl) return;

        const input = document.createElement('input');
        input.type = 'text';
        input.value = todo.text;
        // Styling matches terminal aesthetic
        input.className = 'flex-1 bg-[#050D1A]/90 border border-term-secondary rounded px-3 py-1 min-w-0 text-term-text focus:outline-none focus:shadow-glow-focus text-sm sm:text-base font-medium font-mono';

        taskEl.replaceChild(input, spanEl);
        input.focus();

        // Hide action buttons during edit
        const editBtn = taskEl.querySelector('.todo-edit');
        const deleteBtn = taskEl.querySelector('.todo-delete');
        if (editBtn) editBtn.classList.add('hidden');
        if (deleteBtn) deleteBtn.classList.add('hidden');

        let isSaved = false;
        const saveEdit = () => {
            if (isSaved) return;
            isSaved = true;
            const newText = input.value.trim();
            if (newText) {
                todo.text = newText;
                saveToLocalStorage();
            }
            renderTodos(); // rerender hides input and restores buttons
        };

        input.addEventListener('blur', saveEdit); // Save when clicking out
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') saveEdit(); // Save on Enter key
        });
    };

    // Export to JSON
    const exportJSON = () => {
        if (todos.length === 0) {
            alert('Operation Aborted: System register is empty.');
            return;
        }

        const stateToExport = {
            listName: listName,
            todos: todos
        };

        const dataStr = JSON.stringify(stateToExport, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

        const safeFilename = listName.trim().replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'cyber_state';
        const exportFileDefaultName = `${safeFilename}.json`;

        let linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    };

    // Import from JSON
    const importJSON = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const parsedData = JSON.parse(e.target.result);
                let importedTodos = [];
                let importedName = 'cyber_state';

                // Detect format
                if (Array.isArray(parsedData)) {
                    // Old format
                    importedTodos = parsedData;
                } else if (parsedData && typeof parsedData === 'object') {
                    // New format
                    importedTodos = parsedData.todos || [];
                    importedName = parsedData.listName || 'cyber_state';
                }

                // Basic validation
                if (Array.isArray(importedTodos) && importedTodos.every(t => t.id && typeof t.text === 'string' && typeof t.completed === 'boolean')) {
                    todos = importedTodos;
                    listName = importedName;
                    listNameInput.value = listName === 'cyber_state' ? '' : listName;

                    saveToLocalStorage();
                    renderTodos();

                    // Reset file input so the same file can be selected again
                    event.target.value = '';
                } else {
                    alert('Err: State format invalid.');
                }
            } catch (error) {
                alert('Err: State corruption detected during load.');
                console.error(error);
            }
        };
        reader.readAsText(file);
    };

    // Event Listeners
    todoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        addTodo(todoInput.value);
        todoInput.value = '';
        todoInput.focus();
    });

    listNameInput.addEventListener('input', (e) => {
        listName = e.target.value.trim() || 'cyber_state';
        saveToLocalStorage();
    });

    btnSave.addEventListener('click', exportJSON);
    fileUpload.addEventListener('change', importJSON);

    // Initial render
    loadInitialState();
});
