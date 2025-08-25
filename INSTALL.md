# 📦 Guia de Instalação - Standard Notes Tag Location Addon

## 🚀 Métodos de Instalação

### Método 1: Instalação via Arquivo XPI (Recomendado)

1. **Execute o script de build:**
   ```powershell
   .\build.ps1
   ```

2. **Abra o Firefox**

3. **Acesse o gerenciador de add-ons:**
   - Digite `about:addons` na barra de endereços
   - Ou use Ctrl+Shift+A

4. **Instale a extensão:**
   - Clique no ícone de engrenagem ⚙️ no canto superior direito
   - Selecione "Install Add-on From File..."
   - Navegue até a pasta `build/` 
   - Selecione o arquivo `standard-notes-tag-addon-v1.1.0.xpi`

5. **Confirme a instalação:**
   - Clique em "Add" quando aparecer o diálogo de confirmação
   - A extensão será instalada permanentemente

### Método 2: Instalação Temporária (Para Teste)

1. **Abra o Firefox**

2. **Acesse about:debugging:**
   - Digite `about:debugging` na barra de endereços

3. **Carregue temporariamente:**
   - Clique em "Este Firefox" no menu lateral
   - Clique em "Carregar extensão temporária..."
   - Selecione o arquivo `manifest.json` na pasta da extensão

⚠️ **Nota:** Extensões temporárias são removidas quando o Firefox é fechado.

## 🔧 Desenvolvimento e Modificação

### Estrutura de Arquivos
```
standard-notes-tag-addon/
├── manifest.json          # Configuração da extensão
├── content.js            # Script principal
├── styles.css            # Estilos
├── icons/                # Ícones da extensão
│   ├── icon-48.svg
│   └── icon-96.svg
├── build.ps1             # Script de empacotamento
├── README.md             # Documentação
└── INSTALL.md            # Este arquivo
```

### Modificar e Recompilar

1. **Faça suas modificações** nos arquivos fonte
2. **Execute o build novamente:**
   ```powershell
   .\build.ps1
   ```
3. **Remova a versão antiga** no Firefox (about:addons)
4. **Instale a nova versão** usando o novo arquivo .xpi

## 🛠️ Troubleshooting

### Erro: "This add-on could not be installed"
- Verifique se o arquivo `manifest.json` está válido
- Certifique-se de que todos os arquivos referenciados existem

### Erro: "Script execution is disabled"
- Execute no PowerShell como administrador:
  ```powershell
  Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
  ```

### A extensão não aparece após instalação
- Verifique em `about:addons` se está listada
- Tente recarregar a página do Standard Notes
- Verifique o console do browser (F12) por erros

### O botão não aparece no Standard Notes
- Certifique-se de estar em `https://app.standardnotes.com`
- Abra uma nota que tenha tags
- Verifique o console (F12) por mensagens `[SN Tag Addon]`

## 📋 Requisitos

- **Firefox:** Versão 57.0 ou superior
- **Permissões:** A extensão precisa de acesso a app.standardnotes.com
- **Standard Notes:** Versão web (app.standardnotes.com)

## 🔄 Atualizações

Para atualizar a extensão:

1. Baixe/compile a nova versão
2. Vá para `about:addons`
3. Encontre "Standard Notes Tag Location Addon"
4. Clique nos três pontos (...) → "Remove"
5. Instale a nova versão seguindo os passos acima

## 🆘 Suporte

Se encontrar problemas:

1. **Verifique o console** do browser (F12) por erros
2. **Teste com extensão temporária** primeiro
3. **Verifique as permissões** da extensão em about:addons
4. **Recarregue** a página do Standard Notes

---

✨ **Aproveite sua extensão Standard Notes Tag Location Addon!**
