document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("formSubcategoria");
    const nameInput = document.getElementById("nomeSubcategoria");
    const categorySelect = document.getElementById("categoriaSubcategoria");
    const filterSelect = document.getElementById("filtroCategoria");
    const list = document.getElementById("listaSubcategorias");
    const searchInput = document.getElementById("inputBusca");
    const clearSearchButton = document.getElementById("limparBusca");
    const count = document.getElementById("contadorSubcategorias");
    const summaryCount = document.getElementById("contadorSubcategoriasResumo");
    const expenseCount = document.getElementById("contadorDespesas");
    const incomeCount = document.getElementById("contadorReceitas");
    const expenseTab = document.getElementById("btnSaidas");
    const incomeTab = document.getElementById("btnEntradas");
    const listTitle = document.getElementById("tituloListaSubcategorias");
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
    const alert = window.DuckFyAlert;
    const colorOptions = [...form.querySelectorAll(".color-option[data-color]")];
    let activeType = "Despesa";
    let currentRow = null;

    const enviarRequisicao = async (url, options) => {
        const response = await fetch(url, {
            ...options,
            headers: { "Content-Type": "application/json", ...options.headers }
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.ok) {
            throw new Error(result.message || "Não foi possível concluir a operação.");
        }
        return result;
    };

    const mostrarErro = (error) => {
        alert?.error(error.message || "Não foi possível concluir a operação.");
    };

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
        const searchTerm = searchInput.value.trim().toLocaleLowerCase("pt-BR");
        let visibleCount = 0;

        rows.forEach((row) => {
            const matchesType = row.dataset.tipo === activeType;
            const matchesCategory = filterSelect.value === "todas" || row.dataset.categoria === filterSelect.value;
            const searchableText = `${row.dataset.nome} ${row.querySelector(".cat-subs").textContent}`
                .toLocaleLowerCase("pt-BR");
            const matchesSearch = searchableText.includes(searchTerm);
            const visible = matchesType && matchesCategory && matchesSearch;
            row.hidden = !visible;
            if (visible) visibleCount += 1;
        });

        const expenseTotal = rows.filter((row) => row.dataset.tipo === "Despesa").length;
        const incomeTotal = rows.filter((row) => row.dataset.tipo === "Receita").length;
        count.textContent = `${visibleCount} ${visibleCount === 1 ? "subcategoria" : "subcategorias"}`;
        summaryCount.textContent = String(rows.length);
        expenseCount.textContent = String(expenseTotal);
        incomeCount.textContent = String(incomeTotal);
        emptyMessage.hidden = visibleCount > 0;
        clearSearchButton.classList.toggle("d-none", searchTerm.length === 0);
        expenseTab.classList.toggle("active", activeType === "Despesa");
        incomeTab.classList.toggle("active", activeType === "Receita");
        expenseTab.setAttribute("aria-selected", String(activeType === "Despesa"));
        incomeTab.setAttribute("aria-selected", String(activeType === "Receita"));
        listTitle.textContent = `Subcategorias de ${activeType === "Despesa" ? "despesas" : "receitas"}`;
        document.getElementById("painelSubcategorias").setAttribute(
            "aria-labelledby",
            activeType === "Despesa" ? "btnSaidas" : "btnEntradas"
        );
    };

    const createRow = (subcategoria) => {
        const row = document.createElement("article");
        row.className = "category-item subcategoria-row";
        row.dataset.id = subcategoria.id;
        row.dataset.categoria = subcategoria.categoria_id;
        row.dataset.tipo = subcategoria.categoria_tipo;
        row.dataset.nome = subcategoria.nome;
        row.dataset.emoji = subcategoria.emoji;
        row.dataset.cor = subcategoria.cor;

        const icon = document.createElement("div");
        icon.className = "cat-icon-circle subcategoria-symbol";
        icon.dataset.cor = subcategoria.cor;
        icon.style.setProperty("--cor-categoria", subcategoria.cor);
        icon.setAttribute("aria-hidden", "true");
        const emojiPreview = document.createElement("span");
        emojiPreview.className = "emoji-ios";
        emojiPreview.textContent = subcategoria.emoji;
        icon.append(emojiPreview);

        const info = document.createElement("div");
        info.className = "category-info";
        const text = document.createElement("div");
        text.className = "category-text";
        const title = document.createElement("h3");
        title.className = "cat-name";
        title.textContent = subcategoria.nome;
        const category = document.createElement("p");
        category.className = "cat-subs";
        category.innerHTML = '<i class="bi bi-arrow-return-right" aria-hidden="true"></i> ';
        category.append(document.createTextNode(subcategoria.categoria_nome));
        text.append(title, category);
        info.append(icon, text);

        const actions = document.createElement("div");
        actions.className = "subcategoria-actions";

        const edit = document.createElement("button");
        edit.className = "arrow-link subcategoria-editar";
        edit.type = "button";
        edit.setAttribute("aria-label", `Editar ${subcategoria.nome}`);
        edit.title = "Editar subcategoria";
        edit.innerHTML = '<i class="bi bi-pencil" aria-hidden="true"></i>';

        actions.append(edit);
        row.append(info, actions);
        return row;
    };

    const updateRow = (row, subcategoria) => {
        row.dataset.id = subcategoria.id;
        row.dataset.categoria = subcategoria.categoria_id;
        row.dataset.tipo = subcategoria.categoria_tipo;
        row.dataset.nome = subcategoria.nome;
        row.dataset.emoji = subcategoria.emoji;
        row.dataset.cor = subcategoria.cor;

        const icon = row.querySelector(".subcategoria-symbol");
        icon.dataset.cor = subcategoria.cor;
        icon.style.setProperty("--cor-categoria", subcategoria.cor);
        const emojiPreview = document.createElement("span");
        emojiPreview.className = "emoji-ios";
        emojiPreview.textContent = subcategoria.emoji;
        icon.replaceChildren(emojiPreview);

        row.querySelector(".cat-name").textContent = subcategoria.nome;
        const category = row.querySelector(".cat-subs");
        category.innerHTML = '<i class="bi bi-arrow-return-right" aria-hidden="true"></i> ';
        category.append(document.createTextNode(subcategoria.categoria_nome));

        const editButton = row.querySelector(".subcategoria-editar");
        editButton.setAttribute("aria-label", `Editar ${subcategoria.nome}`);
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
        if (!currentRow || !currentRow.dataset.id) return;

        const confirmed = await alert.confirm({
            title: "Excluir subcategoria?",
            text: `Deseja excluir ${currentRow.dataset.nome}?`,
            confirmButtonText: "Excluir subcategoria"
        });
        if (!confirmed) return;

        deleteButton.disabled = true;
        try {
            await enviarRequisicao(`/subcategorias/api/${currentRow.dataset.id}`, { method: "DELETE" });
            currentRow.remove();
            currentRow = null;
            updateList();
            ModalManager.fechar(modal.id);
        } catch (error) {
            mostrarErro(error);
        } finally {
            deleteButton.disabled = false;
        }
    });

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const name = nameInput.value.trim();
        const selected = categorySelect.selectedOptions[0];
        if (!name || !selected.value) return;

        submitButton.disabled = true;
        try {
            const result = await enviarRequisicao(
                currentRow ? `/subcategorias/api/${currentRow.dataset.id}` : "/subcategorias/api",
                {
                    method: currentRow ? "PUT" : "POST",
                    body: JSON.stringify({
                        nome: name,
                        categoria_id: selected.value,
                        emoji: emojiInput.value,
                        cor: colorInput.value
                    })
                }
            );

            if (currentRow) {
                updateRow(currentRow, result.subcategoria);
            } else {
                list.prepend(createRow(result.subcategoria));
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
        } catch (error) {
            mostrarErro(error);
        } finally {
            submitButton.disabled = false;
        }
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

    expenseTab.addEventListener("click", () => {
        activeType = "Despesa";
        filterSelect.value = "todas";
        updateList();
    });
    incomeTab.addEventListener("click", () => {
        activeType = "Receita";
        filterSelect.value = "todas";
        updateList();
    });
    filterSelect.addEventListener("change", updateList);
    searchInput.addEventListener("input", updateList);
    clearSearchButton.addEventListener("click", () => {
        searchInput.value = "";
        searchInput.focus();
        updateList();
    });
    list.querySelectorAll(".subcategoria-symbol[data-cor]").forEach((icon) => {
        icon.style.setProperty("--cor-categoria", icon.dataset.cor);
    });
    window.carregarEmojisIOS?.();
    setColor(colorInput.value);
    updateList();
});