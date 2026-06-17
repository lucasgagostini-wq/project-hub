-- Project Hub — foto de perfil (avatar). Guardado como data URL (imagem leve, redimensionada no cliente).
alter table profiles add column if not exists avatar text;
