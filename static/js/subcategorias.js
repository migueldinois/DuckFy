document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("formSubcategoria");
    const nameInput = document.getElementById("nomeSubcategoria");
    const categorySelect = document.getElementById("categoriaSubcategoria");
    const filterSelect = document.getElementById("filtroCategoria");
    const list = document.getElementById("listaSubcategorias");
    const count = document.getElementById("contadorSubcategorias");
    const summaryCount = document.getElementById("contadorSubcategoriasResumo");
    const emptyMessage = document.getElementById("mensagemVazia");
    const modal = document.getElementById("modalNovaSubcategoria");
    const modalTitle = document.getElementById("tituloNovaSubcategoria");
    const submitButton = document.getElementById("salvarSubcategoria");
    const deleteButton = document.getElementById("excluirSubcategoria");
    const emojiInput = document.getElementById("emojiSubcategoria");
    const emojiPreview = document.getElementById("previewEmojiSubcategoria");
    const emojiPicker = document.getElementById("emojiPickerSubcategoria");
    const emojiPickerButton = document.getElementById("abrirSeletorEmojiSubcategoria");
    const colorInput = document.getElementById("corSubcategoria");
    const customColorInput = document.getElementById("corPersonalizadaSubcategoria");
    const colorValue = document.getElementById("valorCorSubcategoria");
    const colorSample = document.getElementById("amostraCorSubcategoria");
    const customColorButton = document.getElementById("abrirCorPersonalizada");
    const colorOptions = [...form.querySelectorAll(".color-option[data-color]")];
    let currentRow = null;

    const setEmoji = (emoji) => {
        emojiInput.value = emoji;
        emojiPreview.textContent = emoji;
        document.getElementById("textoEmojiSubcategoria").textContent = "Selecionar emoji";
        emojiPickerButton.setAttribute("aria-label", `Emoji selecionado ${emoji}, escolher outro emoji`);
        window.carregarEmojisIOS?.();
    };

    const setColor = (color) => {
        const normalizedColor = color.toUpperCase();
        colorInput.value = normalizedColor;
        customColorInput.value = normalizedColor;
        colorValue.textContent = normalizedColor;
        colorSample.style.backgroundColor = normalizedColor;
        colorOptions.forEach((option) => {
            option.classList.toggle("selecionada", option.dataset.color === normalizedColor);
        });
        customColorButton.classList.toggle(
            "selecionada",
            !colorOptions.some((option) => option.dataset.color === normalizedColor)
        );
        customColorButton.style.backgroundColor = customColorButton.classList.contains("selecionada")
            ? normalizedColor
            : "";
    };

    const updateList = () => {
        const rows = [...list.querySelectorAll(".subcategoria-row")];
        let visibleCount = 0;

        rows.forEach((row) => {
            const visible = filterSelect.value === "todas" || row.dataset.categoria === filterSelect.value;
            row.hidden = !visible;
            if (visible) visibleCount += 1;
        });

        count.textContent = String(visibleCount);
        summaryCount.textContent = String(visibleCount);
        emptyMessage.hidden = visibleCount > 0;
    };

    const createRow = (name, categoryId, categoryName, emoji, color) => {
        const row = document.createElement("article");
        row.className = "category-item subcategoria-row";
        row.dataset.categoria = categoryId;
        row.dataset.nome = name;
        row.dataset.emoji = emoji;
        row.dataset.cor = color;

        const icon = document.createElement("div");
        icon.className = "cat-icon-circle subcategoria-symbol";
        icon.style.setProperty("--cor-categoria", color);
        icon.setAttribute("aria-hidden", "true");
        const emojiPreview = document.createElement("span");
        emojiPreview.className = "emoji-ios";
        emojiPreview.textContent = emoji;
        icon.append(emojiPreview);

        const info = document.createElement("div");
        info.className = "category-info";
        const text = document.createElement("div");
        text.className = "category-text";
        const title = document.createElement("h3");
        title.className = "cat-name";
        title.textContent = name;
        const category = document.createElement("p");
        category.className = "cat-subs";
        category.innerHTML = '<i class="bi bi-arrow-return-right" aria-hidden="true"></i> ';
        category.append(document.createTextNode(categoryName));
        text.append(title, category);
        info.append(icon, text);

        const actions = document.createElement("div");
        actions.className = "subcategoria-actions";

        const edit = document.createElement("button");
        edit.className = "arrow-link subcategoria-editar";
        edit.type = "button";
        edit.setAttribute("aria-label", `Editar ${name}`);
        edit.title = "Editar subcategoria";
        edit.innerHTML = '<i class="bi bi-pencil" aria-hidden="true"></i>';

        actions.append(edit);
        row.append(info, actions);
        return row;
    };

    const updateRow = (row, name, categoryId, categoryName, emoji, color) => {
        row.dataset.categoria = categoryId;
        row.dataset.nome = name;
        row.dataset.emoji = emoji;
        row.dataset.cor = color;

        const icon = row.querySelector(".subcategoria-symbol");
        icon.dataset.cor = color;
        icon.style.setProperty("--cor-categoria", color);
        const emojiPreview = document.createElement("span");
        emojiPreview.className = "emoji-ios";
        emojiPreview.textContent = emoji;
        icon.replaceChildren(emojiPreview);

        row.querySelector(".cat-name").textContent = name;
        const category = row.querySelector(".cat-subs");
        category.innerHTML = '<i class="bi bi-arrow-return-right" aria-hidden="true"></i> ';
        category.append(document.createTextNode(categoryName));

        const editButton = row.querySelector(".subcategoria-editar");
        editButton.setAttribute("aria-label", `Editar ${name}`);
        window.carregarEmojisIOS?.();
    };

    document.addEventListener("click", (event) => {
        if (event.target.closest('[data-open-modal="modalNovaSubcategoria"]')) {
            currentRow = null;
            modalTitle.textContent = "Nova Subcategoria";
            submitButton.textContent = "Criar Subcategoria";
            form.classList.remove("editing");
            deleteButton.hidden = true;
            requestAnimationFrame(() => nameInput.focus());
        }
    });

    modal.addEventListener("click", (event) => {
        if (event.target === modal) {
            ModalManager.fechar(modal.id);
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && modal.classList.contains("active")) {
            ModalManager.fechar(modal.id);
        }
    });

    modal.addEventListener("transitionend", (event) => {
        if (event.target === modal && !modal.classList.contains("active")) {
            form.reset();
            currentRow = null;
            modalTitle.textContent = "Nova Subcategoria";
            submitButton.textContent = "Criar Subcategoria";
            form.classList.remove("editing");
            deleteButton.hidden = true;
            setEmoji("⭐");
            setColor("#7C4DFF");
            document.querySelector('[data-open-modal="modalNovaSubcategoria"]')?.focus();
        }
    });

    emojiPickerButton.addEventListener("click", () => {
        emojiPicker.hidden = !emojiPicker.hidden;
        emojiPickerButton.setAttribute("aria-expanded", String(!emojiPicker.hidden));
    });

    emojiPicker.addEventListener("click", (event) => {
        const option = event.target.closest("[data-emoji]");
        if (!option) return;
        setEmoji(option.dataset.emoji);
        emojiPicker.hidden = true;
        emojiPickerButton.setAttribute("aria-expanded", "false");
    });

    colorOptions.forEach((option) => {
        option.addEventListener("click", () => setColor(option.dataset.color));
    });

    customColorButton.addEventListener("click", () => customColorInput.click());
    customColorInput.addEventListener("input", () => setColor(customColorInput.value));

    deleteButton.addEventListener("click", async () => {
        if (!currentRow) return;

        const confirmed = await window.DuckFyAlert.confirm({
            title: "Excluir subcategoria?",
            text: `Deseja excluir ${currentRow.dataset.nome}?`,
            confirmButtonText: "Excluir subcategoria"
        });
        if (!confirmed) return;

        currentRow.remove();
        currentRow = null;
        updateList();
        ModalManager.fechar(modal.id);
    });

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        const name = nameInput.value.trim();
        const selected = categorySelect.selectedOptions[0];
        if (!name || !selected.value) return;

        if (currentRow) {
            updateRow(currentRow, name, selected.value, selected.dataset.nome, emojiInput.value, colorInput.value);
        } else {
            list.prepend(createRow(name, selected.value, selected.dataset.nome, emojiInput.value, colorInput.value));
            window.carregarEmojisIOS?.();
        }
        form.reset();
        setEmoji("⭐");
        setColor("#7C4DFF");
        emojiPicker.hidden = true;
        emojiPickerButton.setAttribute("aria-expanded", "false");
        updateList();
        currentRow = null;
        ModalManager.fechar(modal.id);
    });

    list.addEventListener("click", (event) => {
        const editButton = event.target.closest(".subcategoria-editar");
        if (editButton) {
            currentRow = editButton.closest(".subcategoria-row");
            form.classList.add("editing");
            deleteButton.hidden = false;
            nameInput.value = currentRow.dataset.nome;
            categorySelect.value = currentRow.dataset.categoria;
            setEmoji(currentRow.dataset.emoji || "⭐");
            setColor(currentRow.dataset.cor || currentRow.querySelector(".subcategoria-symbol").dataset.cor || "#7C4DFF");
            modalTitle.textContent = "Editar Subcategoria";
            submitButton.textContent = "Salvar Alterações";
            ModalManager.abrir(modal.id);
            requestAnimationFrame(() => nameInput.focus());
            return;
        }

    });

    filterSelect.addEventListener("change", updateList);
    list.querySelectorAll(".subcategoria-symbol[data-cor]").forEach((icon) => {
        icon.style.setProperty("--cor-categoria", icon.dataset.cor);
    });
    window.carregarEmojisIOS?.();
    setColor(colorInput.value);
    updateList();
});