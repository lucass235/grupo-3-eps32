# 📊 Dashboard – Firebase Realtime (REST)

Este projeto é um **Dashboard web** simples e responsivo, desenvolvido com **HTML, CSS e JavaScript puros**, que consome dados de sensores e estados de componentes (como botão, LED, temperatura, umidade, tempo de operação e um potenciômetro/slider) usando a API REST do **Firebase Realtime Database**.

A aplicação foi projetada para realizar o **polling** (requisições periódicas) do endpoint do Firebase para manter os dados na interface sempre atualizados, simulando uma experiência de tempo real.

---

## ✨ Funcionalidades

* **Conexão REST:** Realiza requisições `GET` periódicas (polling) ao endpoint `.json` do Firebase Realtime Database.
* **Visualização de Componentes Digitais:** Exibe o estado (**ON/OFF**) de um **Botão** e um **LED**.
* **Termômetro Dinâmico:** Apresenta a **Temperatura** com um termômetro visual que se preenche e muda de cor.
* **Potenciômetro/Limite de Referência:** Exibe o valor de um potenciômetro (usado como **Limite de Referência de Temperatura**), com feedback **visual (barra de preenchimento, pulsação)**, **sonoro (tom de frequência variável)** e **háptico (vibração)**, dependendo da faixa de valor.
* **Umidade:** Exibe o valor da **Umidade**.
* **Gráfico de Tempo de Operação:** Gráfico de linha (usando **Chart.js**) para rastrear o **Tempo de Operação (Uptime)** ao longo do tempo.
* **Correlação Temperatura × Umidade:** Gráfico de dispersão (scatter plot) com uma **linha de tendência** para visualizar a relação entre Temperatura e Umidade.
* **Configuração Dinâmica:** Permite alterar o **Endpoint** do Firebase e o **Intervalo de Polling** diretamente na interface.

---

## 🛠️ Tecnologias Utilizadas

* **Frontend:** HTML5, CSS3 (`styles.css`), JavaScript (`app.js`).
* **Gráficos:** **Chart.js** (via CDN).
* **Comunicação:** API REST do **Firebase Realtime Database** (utilizando `fetch` em JavaScript).
* **Hospedagem:** **Vercel** para deploy estático e contínuo.

---

## 🚀 Como Usar

1.  **Clone o Repositório:**
    ```bash
    git clone [URL_DO_SEU_REPOSITÓRIO]
    cd [pasta_do_projeto]
    ```

2.  **Abra o `index.html`:**
    Basta abrir o arquivo `index.html` em qualquer navegador web moderno. Não é necessário um servidor local para a maioria das funcionalidades.

3.  **Configure o Endpoint:**
    * Ao carregar, o dashboard tentará se conectar ao `DEFAULT_ENDPOINT` definido em `app.js` (ou ao valor pré-preenchido no input).
    * **Altere a URL** no campo de entrada do **Endpoint** para o caminho de leitura de dados do seu próprio **Firebase Realtime Database** (terminando com `.json`).
    * Ajuste o **Intervalo** de atualização (em milissegundos). O valor padrão é **2000 ms** (2 segundos).
    * Clique em **"Conectar"** (ou aguarde o início automático da conexão).

4.  **Estrutura de Dados Esperada:**
    O script `app.js` tenta ler os dados usando nomes de campos comuns (aceitando variações). A estrutura básica esperada no seu Firebase é:

    ```json
    {
      "botao": 0 or 1,          // ou button, estadoBotao
      "led": 0 or 1,            // ou lampada, estadoLed
      "temperature": 25.5,      // ou temperatura
      "humidity": 60.2,         // ou umidade
      "slider": 80,             // ou pot (Valor de referência/limite)
      "uptime": 1234            // ou tempoVida, tempovida (Tempo de Operação)
    }
    ```

5.  **Feedback Áudio/Háptico:**
    * Clique no botão **"Ativar áudio/háptico"** para ligar o feedback interativo do Potenciômetro (apenas em navegadores compatíveis com a API de Vibração e Web Audio).

---

## 🌐 Deploy na Vercel

Você pode hospedar este dashboard gratuitamente e facilmente usando a **Vercel**, que é excelente para sites estáticos (HTML/CSS/JS).

1.  **Crie um Repositório Git:**
    Certifique-se de que o seu projeto está versionado e publicado em um serviço como **GitHub**, **GitLab** ou **Bitbucket**.

2.  **Importe o Projeto na Vercel:**
    * Acesse a [Vercel](https://vercel.com/) e faça login.
    * Clique em **"Add New"** e depois em **"Project"**.
    * **Importe** o repositório do seu projeto.

3.  **Configuração do Deploy:**
    Como o projeto é puramente estático (HTML, CSS e JS na raiz), a Vercel deve detectar automaticamente as configurações corretas:
    * **Root Directory:** (Manter o padrão, se os arquivos estiverem na raiz).
    * **Build Command:** (Manter o padrão/vazio, pois não há processo de *build*).
    * **Output Directory:** (Manter o padrão/vazio).

4.  **Deploy:**
    Clique em **"Deploy"**. A Vercel irá buscar o seu projeto e publicá-lo em um domínio `.vercel.app`.

5.  **Atualizações Contínuas:**
    Após o primeiro deploy, qualquer *push* (envio) para o seu branch principal (ex: `main` ou `master`) no Git irá acionar um novo deploy automático (CI/CD) na Vercel, mantendo seu dashboard sempre atualizado com as últimas mudanças do código.

---

## ⚙️ Configuração Principal

O endpoint padrão para o polling REST está definido em `app.js`:

```javascript
// 👉 Seu endpoint (já preenchido com o do print). Altere se desejar.
const DEFAULT_ENDPOINT =
  "[https://grupo3-16a7b-default-rtdb.firebaseio.com/.json](https://grupo3-16a7b-default-rtdb.firebaseio.com/.json)";
