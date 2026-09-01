# Big Pets — Controle de Produção e Vendas

Sistema simples para controlar produção, vendas e clientes de um negócio artesanal
(casinhas de gatos e arranhadores vendidos porta a porta em agropecuárias).

Funciona em qualquer navegador — celular ou computador — e os dados ficam
sincronizados em tempo real entre todos os aparelhos que acessarem o site,
usando o Firebase (banco de dados gratuito do Google).

## O que o sistema faz

- **Painel**: estoque atual por modelo/cor, receita total e lista de clientes
  ordenada por tempo desde a última compra (para saber quem visitar).
- **Produção**: registra o que foi feito, modelo, cor e quantidade.
- **Vendas**: registra vendas vinculadas a um cliente, com cálculo automático do total.
- **Clientes**: cadastro com nome, cidade, endereço e telefone, com histórico de
  compras de cada um.

## Passo 1 — Banco de dados (Firebase) — já configurado

O projeto Firebase **big-pets** já foi criado e as chaves já estão coladas em
`firebase-config.js`. Não precisa mexer nisso de novo, a menos que queira trocar
de projeto.

## Passo 2 — Publicar no GitHub Pages

1. Crie uma conta em [github.com](https://github.com) (se ainda não tiver).
2. Crie um novo repositório (botão **New**), com o nome que quiser (ex:
   `big-pets`). Pode deixar como **público** — o link só é fácil de
   adivinhar se alguém souber o nome exato.
3. Na página do repositório recém-criado, clique em **Add file → Upload files**
   e arraste os arquivos deste projeto (`index.html`, `styles.css`, `app.js`,
   `firebase-config.js`, `README.md`). Clique em **Commit changes**.
4. Vá em **Settings → Pages** (menu lateral do repositório).
5. Em **Source**, selecione **Deploy from a branch**, branch `main`, pasta `/ (root)`.
   Clique em **Save**.
6. Em alguns minutos o GitHub mostra o link do site, algo como:
   `https://seu-usuario.github.io/big-pets/`

Esse é o link que você pode salvar na tela inicial do celular de quem for
usar o sistema.

## Estrutura dos arquivos

```
index.html          → estrutura da página
styles.css           → visual (cores, fontes, layout)
app.js               → toda a lógica (formulários, cálculos, conexão com o banco)
firebase-config.js   → chaves do projeto Firebase big-pets
```

## Atualizando o site depois

Sempre que quiser mudar algo no código, edite o arquivo direto pelo GitHub
(clique no arquivo → ícone de lápis ✏️ → **Commit changes**) e o site atualiza
sozinho em cerca de 1 minuto.
