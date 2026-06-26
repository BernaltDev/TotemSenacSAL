# Totem Escolar — Versão com Melhorias Visuais, Excel e QR Único

Sistema web para totem vertical da unidade, com:

- tela pública moderna e animada;
- mapa de salas importado via planilha Excel;
- área de notícias, avisos, eventos, imagens e vídeos;
- botão animado para exibir o mapa da escola;
- dashboard administrativo simplificado;
- QR Code único para docentes confirmarem retirada de chaves;
- atualização automática do totem via Server-Sent Events.

---

## Tecnologias

- Frontend: HTML, CSS e JavaScript puro
- Backend: Node.js + Express
- Upload: Multer
- Leitura de Excel: xlsx
- QR Code: qrcode
- Persistência inicial: JSON local
- Futuro banco recomendado: PostgreSQL

---

## Como executar

Entre na pasta do backend:

```bash
cd totem-escolar-melhorias/backend
```

Instale as dependências:

```bash
npm install
```

Execute:

```bash
npm run dev
```

Acesse:

```txt
Totem:
http://localhost:3000

Login do painel:
http://localhost:3000/login.html

Dashboard:
http://localhost:3000/dashboard.html

Página pública do QR Code:
http://localhost:3000/retirada-chave.html
```

---

## Acesso de teste

```txt
E-mail: admin@escola.com
Senha: admin123
```

---

## Modelo esperado da planilha

A planilha deve ter três seções:

- MANHÃ
- TARDE
- NOITE

Dentro de cada seção, deve existir a linha de cabeçalho:

```txt
Turma | Horário | Local | Docente
```

Exemplo:

```txt
MANHÃ
Turma                  Horário          Local             Docente
Técnico em Estética    08:00 às 12:00   Sala de aula 2    Taisa

TARDE
Turma                  Horário          Local             Docente
Aprendizagem           13:00 às 17:00   Sala de aula 5    Lucas

NOITE
Turma                  Horário          Local             Docente
Programação Web        19:00 às 22:00   Lab. Software 9   Victor
```

O sistema identifica automaticamente a seção atual e importa as linhas para o período correspondente.

---

## Status das chaves

No totem:

- Vermelho: aguardando retirada da chave
- Verde: aula em andamento

O professor acessa a página pública do QR Code, seleciona a sala/aula e confirma a retirada. O totem atualiza automaticamente.

---

## QR Code único

O QR Code fica disponível no painel em:

```txt
Dashboard > Importar mapa
```

Ele aponta para:

```txt
http://localhost:3000/retirada-chave.html
```

Em produção, configure o arquivo `.env` para gerar o QR Code com o domínio real ou IP da máquina do totem.

Exemplo:

```txt
PUBLIC_BASE_URL=http://192.168.0.50:3000
```

---

## Uploads

Os uploads ficam em:

```txt
backend/uploads/media
backend/uploads/settings
```

---

## Próxima evolução recomendada

Quando sair da fase de testes, substituir o JSON local por PostgreSQL mantendo a mesma lógica de serviços/repositórios.
