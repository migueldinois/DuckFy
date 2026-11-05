(function () {
  window.carregarEmojisIOS = function (seletor = '.emoji-ios') {
    document.querySelectorAll(seletor).forEach((elemento) => {
      const emojiTexto = elemento.textContent.trim();
      if (!emojiTexto || elemento.querySelector('img')) return;

      const unicodeHex = [...emojiTexto]
        .map((caractere) => caractere.codePointAt(0).toString(16))
        .filter((codigo) => codigo !== 'fe0f')
        .join('-');

      const imagem = document.createElement('img');
      imagem.src = `https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/${unicodeHex}.png`;
      imagem.alt = emojiTexto;
      imagem.width = 28;
      imagem.height = 28;

      imagem.onerror = () => {
        elemento.textContent = emojiTexto;
      };

      elemento.replaceChildren(imagem);
    });
  };
})();
