# Standard Notes Tag Location

A Firefox extension that automatically adds note tags at the beginning of content in Standard Notes using the `<<<Location>>>` format.

Available at:
https://addons.mozilla.org/pt-BR/firefox/addon/standard-notes-tag-location/

## 🎯 Features

- **Automatic Tag Detection**: Intelligently identifies tags in your Standard Notes
- **One-Click Addition**: Simple blue button appears when viewing notes with tags
- **Hierarchical Tag Support**: Works with nested tags like `Personal/Work/Project`
- **Clean Format**: Adds tags in the format `<<<Location>>>\nTagName\n<<<Location>>>\n\n`
- **Non-Intrusive**: Only appears when needed, doesn't interfere with note editing

## � How It Works

1. **Open a note** in Standard Notes that has tags
2. **Look for the blue button** "Add Location" that appears automatically
3. **Click the button** to insert tags at the beginning of your note content
4. **Tags are formatted** consistently for easy identification

## 📋 Installation

### From Mozilla Add-ons (Recommended)
1. Visit the Firefox Add-ons page
2. Click "Add to Firefox"
3. Confirm the installation

### Manual Installation
1. Download the latest release
2. Open Firefox
3. Go to `about:addons`
4. Click the gear icon → "Install Add-on From File"
5. Select the downloaded `.xpi` file

## 🔧 Usage

1. Navigate to [app.standardnotes.com](https://app.standardnotes.com)
2. Open any note that has tags assigned
3. The "Add Location" button will appear automatically
4. Click to insert your tags in the standardized format

## 📝 Example Output

For a note tagged with "Personal/Finance":

```
<<<Location>>>
Personal/Finance
<<<Location>>>

[Your note content continues here...]
```

## 🛡️ Privacy & Security

- **No Data Collection**: This extension doesn't collect or transmit any personal data
- **Local Processing**: All tag detection and insertion happens locally in your browser
- **Minimal Permissions**: Only requests access to app.standardnotes.com
- **Open Source**: Full source code available for review

## 🔧 Technical Details

- **Compatible with**: Firefox 60.0+
- **Works on**: Standard Notes web application only
- **No Server Required**: Pure client-side functionality
- **Lightweight**: Minimal impact on browser performance

## 🐛 Troubleshooting

### Button doesn't appear
- Ensure you're on app.standardnotes.com
- Make sure the note has visible tags
- Try refreshing the page

### Tags not inserting
- Check browser console (F12) for error messages
- Ensure the note is in edit mode
- Verify the extension is enabled in about:addons

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔗 Links

- **Homepage**: [GitHub Repository]
- **Support**: [Issues Page]
- **Standard Notes**: [app.standardnotes.com](https://app.standardnotes.com)

## 📊 Version History

### 2.1.3 (Current)

- Fixed button positioning issues during note navigation
- Enhanced element reference validation
- Improved performance with debounced repositioning
- Fixed TypeError with className validation
- Reduced DOM observation noise for better stability

### 2.1.2

- Implemented persistent button positioning
- Added global repositioning functions
- Improved button state management during navigation

### 2.1.1

- Added protection against button duplication
- Enhanced initialization safety
- Improved button visibility management

### 2.1.0

- Enhanced security with sanitized DOM manipulation
- Replaced innerHTML with secure DOM methods
- Modern Firefox compatibility with browser_specific_settings
- Improved error handling and logging

### 1.0.0

- Initial release
- Basic tag detection and insertion
- Support for hierarchical tags
- Clean, non-intrusive interface

[conteúdo da nota...]
```

Para uma nota com tags hierárquicas "Pessoal/Informática":
```
<<<Localização>>>
Pessoal/Informática
<<<Localização>>>

[conteúdo da nota...]
```

## Notas técnicas

- A extensão usa MutationObserver para detectar mudanças na interface
- Implementa debouncing para evitar processamento excessivo
- Armazena estado no localStorage para evitar reprocessamento desnecessário
- Compatível com a estrutura DOM do Standard Notes

## Personalização

Você pode modificar o arquivo `content.js` para:
- Alterar o formato do bloco de localização
- Modificar o intervalo de verificação
- Adicionar filtros para tipos específicos de tags

## Troubleshooting

Se a extensão não funcionar:

1. Verifique se você está em https://app.standardnotes.com
2. Abra o console do desenvolvedor (F12) e procure por mensagens com "[SN Tag Addon]"
3. Certifique-se de que a nota tem tags visíveis na interface
4. Tente recarregar a página

## Limitações

- Funciona apenas no Standard Notes web (app.standardnotes.com)
- Detecta apenas tags visíveis na interface de usuário
- Pode precisar de ajustes se o Standard Notes mudar sua estrutura DOM

