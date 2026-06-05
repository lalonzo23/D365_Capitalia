# D365 Capitalia — Web Resources

Repositorio de web resources (JavaScript, HTML, CSS e imágenes) para Dynamics 365 / Power Platform.

## Convención de nombres

Los web resources usan el prefijo de publisher **`new_`**. La ruta del web resource en
Dynamics replica la ruta dentro de `src/`. Ejemplos:

| Archivo local                                   | Nombre del web resource en D365              |
| ----------------------------------------------- | -------------------------------------------- |
| `src/scripts/forms/account.js`                  | `new_/scripts/forms/account.js`              |
| `src/scripts/common/utils.js`                   | `new_/scripts/common/utils.js`               |
| `src/html/dialogs/confirm.html`                 | `new_/html/dialogs/confirm.html`             |
| `src/css/main.css`                              | `new_/css/main.css`                          |
| `src/images/logo.png`                           | `new_/images/logo.png`                       |

## Estructura

```
src/
  scripts/
    forms/      Lógica de eventos de formulario (OnLoad, OnSave, OnChange)
    ribbon/     Comandos de botones de cinta (ribbon / command bar)
    common/     Utilidades reutilizables compartidas
  html/         Web resources HTML (páginas, diálogos)
    dialogs/
  css/          Hojas de estilo
  images/       Iconos e imágenes (.png, .svg, .gif)
docs/           Documentación interna
```

## Tipos de web resource (D365)

| Extensión        | Tipo en D365              | Código |
| ---------------- | ------------------------- | ------ |
| `.js`            | Script (JScript)          | 3      |
| `.html` / `.htm` | Página web (HTML)         | 1      |
| `.css`           | Hoja de estilos (CSS)     | 2      |
| `.png`           | PNG                       | 5      |
| `.svg`           | Vector (SVG)              | 11     |

## Despliegue

Sube cada archivo como web resource desde **Configuración avanzada → Web Resources**,
o usa herramientas como **XrmToolBox (WebResource Manager)** o la **Power Platform CLI**:

```powershell
pac webresource push --path src/scripts/forms/account.js --solution-name <NombreSolucion>
```

> Recuerda **publicar** los cambios en Dynamics tras cada subida.
