document.addEventListener("DOMContentLoaded", function () {
	const dialog = document.getElementById("dialog-acessibilidade");
	const abrirDialog = document.querySelector("[data-abrir-acessibilidade]");
	const fecharDialog = document.querySelector("[data-fechar-acessibilidade]");

	if (dialog) {
		abrirDialog?.addEventListener("click", function (evento) {
			evento.preventDefault();
			if (!dialog.open) dialog.showModal();
		});
		fecharDialog?.addEventListener("click", function () {
			dialog.close();
		});
		dialog.addEventListener("click", function (evento) {
			if (evento.target === dialog) dialog.close();
		});
	}

	if (!document.getElementById("form-acessibilidade")) return;

	const raiz = document.documentElement;
	const etapas = Array.from(document.querySelectorAll(".assistente-etapa"));
	const rotuloEtapa = document.getElementById("rotulo-etapa");
	const progressoEtapa = document.getElementById("progresso-etapa");
	const fonte = document.getElementById("tamanho-fonte");
	const valorFonte = document.getElementById("valor-fonte");
	const paletas = document.querySelectorAll('input[name="paleta-daltonismo"]');
	const voltar = document.getElementById("voltar-etapa");
	const avancar = document.getElementById("avancar-etapa");
	const salvar = document.getElementById("salvar-acessibilidade");
	const status = document.getElementById("status-acessibilidade");
	const mensagemStatus = document.getElementById("mensagem-acessibilidade");
	const restaurar = document.getElementById("restaurar-acessibilidade");
	const resumoFonte = document.getElementById("resumo-fonte");
	const resumoPaleta = document.getElementById("resumo-paleta");
	const classesDaltonismo = [
		"daltonismo-protanopia",
		"daltonismo-deuteranopia",
		"daltonismo-tritanopia"
	];
	const nomesPaletas = {
		normal: "Original",
		protanopia: "Protanopia",
		deuteranopia: "Deuteranopia",
		tritanopia: "Tritanopia"
	};
	let etapaAtual = 0;
	let preferencias = lerPreferencias();
	let temporizadorStatus;

	function lerPreferencias() {
		localStorage.removeItem("duckfy-negrito");
		return {
			fonte: Number(localStorage.getItem("duckfy-fonte") || 100),
			daltonismo: localStorage.getItem("duckfy-daltonismo") || "normal"
		};
	}

	function aplicarPreferencias() {
		raiz.style.fontSize = `${preferencias.fonte}%`;
		raiz.classList.remove(...classesDaltonismo);

		if (classesDaltonismo.includes(`daltonismo-${preferencias.daltonismo}`)) {
			raiz.classList.add(`daltonismo-${preferencias.daltonismo}`);
		}

		localStorage.setItem("duckfy-fonte", String(preferencias.fonte));
		localStorage.setItem("duckfy-daltonismo", preferencias.daltonismo);
	}

	function mostrarStatus(titulo, mensagem) {
		window.clearTimeout(temporizadorStatus);
		if (window.Swal && typeof window.Swal.fire === "function") {
			window.Swal.fire({
				target: dialog?.open ? dialog : document.body,
				icon: "success",
				title: titulo,
				text: mensagem,
				confirmButtonText: "Entendi",
				buttonsStyling: false,
				customClass: {
					popup: "duckfy-swal-popup",
					confirmButton: "botao-etapa botao-principal"
				},
				heightAuto: false
			});
			return;
		}

		mensagemStatus.textContent = mensagem;
		status.hidden = false;
		temporizadorStatus = window.setTimeout(function () {
			status.hidden = true;
		}, 4500);
	}

	function atualizarResumo() {
		if (resumoFonte) resumoFonte.textContent = `${preferencias.fonte}%`;
		if (resumoPaleta) resumoPaleta.textContent = nomesPaletas[preferencias.daltonismo] || nomesPaletas.normal;
	}

	function atualizarControles() {
		if (fonte) {
			fonte.value = String(preferencias.fonte);
			if (valorFonte) valorFonte.value = `${preferencias.fonte}%`;
		}
		paletas.forEach((opcao) => {
			opcao.checked = opcao.value === preferencias.daltonismo;
		});
		atualizarResumo();
	}

	function mostrarEtapa(indice, moverFoco = false) {
		etapaAtual = Math.min(Math.max(indice, 0), etapas.length - 1);
		etapas.forEach((etapa, posicao) => {
			const ativa = posicao === etapaAtual;
			etapa.hidden = !ativa;
			etapa.classList.toggle("ativa", ativa);
		});

		const numeroEtapa = etapaAtual + 1;
		rotuloEtapa.textContent = `Etapa ${numeroEtapa} de ${etapas.length}`;
		progressoEtapa.style.width = `${(numeroEtapa / etapas.length) * 100}%`;
		voltar.hidden = etapaAtual === 0;
		avancar.hidden = etapaAtual === etapas.length - 1;
	salvar.hidden = etapaAtual !== etapas.length - 1;
	restaurar.hidden = etapaAtual !== etapas.length - 1;
		avancar.textContent = etapaAtual === 0 ? "Começar" : "Continuar";

		if (moverFoco) etapas[etapaAtual].querySelector("h3")?.focus();
	}

	preferencias = lerPreferencias();
	mostrarEtapa(0);
	atualizarControles();

	if (fonte) {
		fonte.addEventListener("input", function () {
			preferencias.fonte = Number(fonte.value);
			if (valorFonte) valorFonte.value = `${preferencias.fonte}%`;
			atualizarResumo();
		});
	}
	paletas.forEach((opcao) => {
		opcao.addEventListener("change", function () {
			if (opcao.checked) {
				preferencias.daltonismo = opcao.value;
				atualizarResumo();
			}
		});
	});
	voltar.addEventListener("click", function () {
		mostrarEtapa(etapaAtual - 1, true);
	});
	avancar.addEventListener("click", function () {
		mostrarEtapa(etapaAtual + 1, true);
	});
	salvar.addEventListener("click", function () {
		aplicarPreferencias();
		dialog?.close();
		mostrarStatus("Alterações salvas!", "Suas preferências de acessibilidade foram aplicadas.");
	});
	if (restaurar) {
		restaurar.addEventListener("click", function () {
			preferencias = { fonte: 100, daltonismo: "normal" };
			atualizarControles();
			aplicarPreferencias();
			mostrarStatus("Padrões restaurados", "As configurações de leitura e cores voltaram ao padrão.");
		});
	}

	if (dialog) {
		dialog.addEventListener("close", function () {
			preferencias = lerPreferencias();
			atualizarControles();
			mostrarEtapa(0);
			if (status) status.hidden = true;
		});
	}
});
