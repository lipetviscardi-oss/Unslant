// O leitor de PDF oficial (pdfjs-dist) instala junto o "@napi-rs/canvas", um
// componente de desenho para servidores que o site não usa. Se o jsdom (leitura
// de links) o encontrasse, tentaria carregá-lo e o build quebraria. Este arquivo
// toma o lugar dele: o jsdom recebe o erro e segue sem ele, como sempre seguiu.
throw new Error("@napi-rs/canvas não é usado pelo unslant");
