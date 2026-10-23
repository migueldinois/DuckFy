function lerValorMonetario(valor, pontoDecimal = false) {
  const texto = valor.replace(/[^\d.,]/g, '');
  const indiceVirgula = texto.lastIndexOf(',');
  const indicePonto = texto.lastIndexOf('.');
  let separadorDecimal = indiceVirgula;

  if (separadorDecimal < 0 && pontoDecimal && indicePonto >= 0) {
    const casasDecimais = texto.length - indicePonto - 1;
    if (casasDecimais <= 2) separadorDecimal = indicePonto;
  }

  const parteInteiraTexto = separadorDecimal >= 0
    ? texto.slice(0, separadorDecimal)
    : texto;
  const parteInteira = parteInteiraTexto.replace(/\D/g, '').replace(/^0+(?=\d)/, '') || '0';
  const parteDecimal = separadorDecimal >= 0
    ? texto.slice(separadorDecimal + 1).replace(/\D/g, '').slice(0, 2)
    : '';

  return {
    parteInteira,
    parteDecimal,
    temDecimal: separadorDecimal >= 0,
    decimal: Number(`${parteInteira}.${parteDecimal || '0'}`)
  };
}

function formatarValorMonetario(input, pontoDecimal = false, completarCentavos = false) {
  const valorOriginal = input.value;
  if (!valorOriginal) {
    input.setCustomValidity('');
    return;
  }

  const posicaoOriginal = input.selectionStart ?? valorOriginal.length;
  const digitosAntesDoCursor = valorOriginal.slice(0, posicaoOriginal).replace(/\D/g, '').length;
  const tinhaVirgulaAntesDoCursor = valorOriginal.slice(0, posicaoOriginal).includes(',');
  const valor = lerValorMonetario(valorOriginal, pontoDecimal);
  const inteiroFormatado = valor.parteInteira.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const centavos = completarCentavos ? valor.parteDecimal.padEnd(2, '0') : valor.parteDecimal;
  input.value = inteiroFormatado + (valor.temDecimal || completarCentavos ? `,${centavos}` : '');

  let novaPosicao = 0;
  let digitosEncontrados = 0;
  while (novaPosicao < input.value.length && digitosEncontrados < digitosAntesDoCursor) {
    if (/\d/.test(input.value[novaPosicao])) digitosEncontrados += 1;
    novaPosicao += 1;
  }
  if (tinhaVirgulaAntesDoCursor && input.value.includes(',')) {
    novaPosicao = Math.max(novaPosicao, input.value.indexOf(',') + 1);
  }
  input.setSelectionRange(novaPosicao, novaPosicao);

  const minimo = input.getAttribute('min');
  const maximo = input.getAttribute('max');
  const minimoInvalido = minimo !== null && valor.decimal < lerValorMonetario(minimo, true).decimal;
  const maximoInvalido = maximo !== null && valor.decimal > lerValorMonetario(maximo, true).decimal;
  input.setCustomValidity(minimoInvalido
    ? 'O valor deve ser maior ou igual ao mínimo permitido.'
    : maximoInvalido
      ? 'O valor excede o limite permitido.'
      : '');
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-currency-input]').forEach((input) => {
    if (input.value) formatarValorMonetario(input, true, true);

    input.addEventListener('input', () => formatarValorMonetario(input));
    input.addEventListener('blur', () => formatarValorMonetario(input, false, true));
    input.addEventListener('focus', () => {
      if (input.dataset.currencyInitialValue === 'true') {
        formatarValorMonetario(input, true);
        delete input.dataset.currencyInitialValue;
      }

      if (lerValorMonetario(input.value).decimal === 0) input.select();
    });
  });

  document.addEventListener('submit', (event) => {
    event.target.querySelectorAll('[data-currency-input]').forEach((input) => {
      const valor = lerValorMonetario(input.value);
      input.value = `${valor.parteInteira}.${valor.parteDecimal.padEnd(2, '0')}`;
    });
  }, true);
});