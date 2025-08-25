# 🚀 Guia Completo para Submissão na Mozilla Add-ons

## ✅ PROJETO PREPARADO PARA MOZILLA

Seu projeto foi completamente ajustado para submissão oficial na Mozilla Add-ons Store!

## 📦 ARQUIVOS CRIADOS

### Pacote de Submissão:
- **`standard-notes-tag-location-v1.0.0.zip`** - Arquivo para upload
- **`mozilla-submission/`** - Pasta com arquivos organizados

### Arquivos Incluídos:
- ✅ `manifest.json` - Configuração oficial para Mozilla
- ✅ `content.js` - Código limpo para produção (sem logs excessivos)
- ✅ `styles.css` - Estilos da extensão
- ✅ `README.md` - Documentação em inglês
- ✅ `LICENSE` - Licença MIT obrigatória
- ✅ `package.json` - Metadados do projeto
- ✅ `icons/` - Ícones em PNG e SVG

## 🎯 PASSO A PASSO PARA SUBMISSÃO

### 1. Acesse o Portal de Desenvolvedores
**URL**: https://addons.mozilla.org/developers/

### 2. Faça Login/Criar Conta
- Use sua conta Firefox Developer que você criou

### 3. Clique "Submit a New Add-on"

### 4. Upload do Arquivo
- **Escolha**: `standard-notes-tag-location-v1.0.0.zip`
- **Aguarde**: Validação automática

### 5. Preencha as Informações

#### Informações Básicas:
- **Name**: `Standard Notes Tag Location`
- **Summary**: `Automatically adds note tags at the beginning of content in Standard Notes using the <<<Location>>> format`
- **Description**: 
```
This extension helps Standard Notes users by automatically adding note tags at the beginning of their content in a standardized format.

Features:
• One-click tag insertion with blue "Add Location" button
• Automatic tag detection from Standard Notes interface
• Support for hierarchical tags (e.g., Personal/Work/Project)
• Clean <<<Location>>> format for easy identification
• Non-intrusive design that doesn't interfere with note editing

Perfect for users who want to organize their notes with consistent location markers at the top of each note.

How to use:
1. Open any note in Standard Notes that has tags
2. Click the blue "Add Location" button that appears
3. Tags are automatically inserted in the format: <<<Location>>>TagName<<<Location>>>

Privacy: This extension works entirely locally in your browser and doesn't collect or transmit any personal data.
```

#### Categorias e Tags:
- **Category**: `Productivity`
- **Tags**: `standard-notes`, `productivity`, `notes`, `organization`, `tags`

#### Informações Técnicas:
- **Compatible with Firefox**: `60.0+`
- **License**: `MIT License`
- **Source Code**: (deixe em branco por enquanto ou adicione seu GitHub)

### 6. Screenshots (Recomendado)
Você pode criar screenshots mostrando:
- A extensão em ação no Standard Notes
- O botão "Add Location" aparecendo
- Antes e depois da inserção das tags

### 7. Submeter para Revisão
- **Clique**: "Submit Version"
- **Aguarde**: Aprovação da Mozilla (geralmente 1-7 dias)

## 🔧 ANTES DE SUBMETER - PERSONALIZE

### Edite o manifest.json:
```json
{
  "author": "SEU NOME AQUI",
  "homepage_url": "https://github.com/SEU-USUARIO/standard-notes-tag-location"
}
```

### Edite o package.json:
```json
{
  "author": "SEU NOME AQUI",
  "repository": {
    "url": "https://github.com/SEU-USUARIO/standard-notes-tag-location.git"
  }
}
```

### Execute novamente o build:
```powershell
.\build-mozilla.ps1
```

## 📋 CHECKLIST FINAL

- [ ] Nome e URLs personalizados no manifest.json
- [ ] Informações do autor atualizadas
- [ ] README.md revisado
- [ ] Testado a extensão uma última vez
- [ ] Arquivo ZIP gerado (10.1 KB)
- [ ] Conta Mozilla Developer criada
- [ ] Screenshots preparados (opcional)

## 🎉 APÓS APROVAÇÃO

Quando aprovada, sua extensão estará disponível em:
`https://addons.mozilla.org/firefox/addon/standard-notes-tag-location/`

Os usuários poderão instalar diretamente da loja oficial!

## 🔄 ATUALIZAÇÕES FUTURAS

Para atualizar:
1. Modifique os arquivos necessários
2. Aumente a versão no `manifest.json`
3. Execute `.\build-mozilla.ps1` novamente
4. Submeta nova versão no portal Mozilla

---

**🚀 Seu projeto está 100% pronto para submissão oficial na Mozilla Add-ons!**

Execute `.\build-mozilla.ps1` sempre que fizer mudanças.
