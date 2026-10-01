console.log("Ficheiro JS carregado com sucesso!");

document.addEventListener('DOMContentLoaded', () => {
  const inputValor = document.getElementById('valor');
  console.log("Campo encontrado:", inputValor);

  if (inputValor) {
    inputValor.addEventListener('input', (e) => {
      let value = e.target.value.replace(/\D/g, '');
      if (!value) {
        e.target.value = '';
        return;
      }
      const options = { minimumFractionDigits: 2, maximumFractionDigits: 2 };
      e.target.value = (parseFloat(value) / 100).toLocaleString('pt-BR', options);
    });
  }
});