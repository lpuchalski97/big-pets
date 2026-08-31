# Ateliê & Bicho — Controle de Produção e Vendas

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
- **Clientes**: cadastro com nome, cidade, endereço e telefone, cnpj, com histórico de
  compras de cada um.

## Passo 1 — Criar o banco de dados gratuito (Firebase)

1. Acesse [console.firebase.google.com](https://console.firebase.google.com) e
   entre com uma conta Google.
2. Clique em **Criar projeto**, dê um nome (ex: `atelie-bicho`) e siga os passos
   (pode desativar o Google Analytics, não é necessário).
3. Dentro do projeto, no menu lateral, clique em **Firestore Database** →
   **Criar banco de dados**. Escolha o modo **produção** e a região mais
   próxima (ex: `southamerica-east1`).
4. Vá em **Regras** (aba dentro do Firestore) e substitua o conteúdo por:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if true;
       }
     }
   }
   ```

   Isso libera leitura e escrita para quem tiver o link do site. Como os dados
   aqui não são sensíveis (produção, vendas, clientes de um pequeno negócio),
   isso é aceitável para começar. Se no futuro quiser proteger com senha, dá
   para adicionar Firebase Authentication depois.

5. Volte à página inicial do projeto, clique no ícone **`</>`** (Web) para
   registrar um app da Web. Dê um apelido (ex: `site`) e clique em **Registrar app**.
6. O Firebase vai mostrar um bloco `firebaseConfig = {...}`. Copie os valores
   e cole no arquivo **`firebase-config.js`** deste projeto, substituindo os
   valores de exemplo.

## Passo 2 — Publicar no GitHub Pages

1. Crie uma conta em [github.com](https://github.com) (se ainda não tiver).
2. Crie um novo repositório (botão **New**), com o nome que quiser (ex:
   `atelie-bicho`). Pode deixar como **público** — o link só é fácil de
   adivinhar se alguém souber o nome exato.
3. Na página do repositório recém-criado, clique em **Add file → Upload files**
   e arraste os arquivos deste projeto (`index.html`, `styles.css`, `app.js`,
   `firebase-config.js` já editado, `README.md`). Clique em **Commit changes**.
4. Vá em **Settings → Pages** (menu lateral do repositório).
5. Em **Source**, selecione **Deploy from a branch**, branch `main`, pasta `/ (root)`.
   Clique em **Save**.
6. Em alguns minutos o GitHub mostra o link do site, algo como:
   `https://seu-usuario.github.io/atelie-bicho/`

Esse é o link que você pode salvar na tela inicial do celular de quem for
usar o sistema.

## Estrutura dos arquivos

```
index.html          → estrutura da página
styles.css           → visual (cores, fontes, layout)
app.js               → toda a lógica (formulários, cálculos, conexão com o banco)
firebase-config.js   → chaves do SEU projeto Firebase (edite antes de publicar)
```

## Atualizando o site depois

Sempre que quiser mudar algo no código, edite o arquivo direto pelo GitHub
(clique no arquivo → ícone de lápis ✏️ → **Commit changes**) e o site atualiza
sozinho em cerca de 1 minuto.
