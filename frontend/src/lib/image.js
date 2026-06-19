// Redimensiona uma imagem para um quadrado (cover) e devolve um data URL JPEG leve.
// Centraliza a lógica antes duplicada no avatar do perfil (MeuPerfil) e que faltava na
// capa de projeto (HomeGeral salvava o base64 em tamanho original — vários MB no estado
// e no localStorage). Revoga o object URL ao terminar para não vazar memória.
export function resizeImageToDataURL(file, side = 256, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = side; canvas.height = side;
      const ctx = canvas.getContext("2d");
      const src = Math.min(img.width, img.height);
      const sx = (img.width - src) / 2, sy = (img.height - src) / 2;
      ctx.drawImage(img, sx, sy, src, src, 0, 0, side, side);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
    img.src = url;
  });
}
