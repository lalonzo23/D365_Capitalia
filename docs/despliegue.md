# Guía de despliegue de web resources

## Opción A — Power Platform CLI (`pac`)

1. Instala la CLI: `dotnet tool install --global Microsoft.PowerApps.CLI.Tool`
2. Autentícate:
   ```powershell
   pac auth create --url https://<tuorg>.crm.dynamics.com
   ```
3. Sube un web resource a una solución:
   ```powershell
   pac webresource push --path src/scripts/forms/account.js --solution-name Capitalia
   ```
4. Publica los cambios desde Dynamics o:
   ```powershell
   pac solution publish
   ```

## Opción B — XrmToolBox (WebResource Manager)

1. Conéctate a tu entorno.
2. Abre **WebResource Manager**.
3. Arrastra/selecciona los archivos de `src/` respetando la ruta
   (`new_/scripts/forms/account.js`, etc.).
4. Guarda y **publica**.

## Opción C — Manual (Configuración avanzada)

1. **Configuración → Personalizaciones → Web Resources → Nuevo**.
2. Nombre: `new_/scripts/forms/account.js`.
3. Tipo: *Script (JScript)*.
4. Sube el archivo, guarda y **publica**.

## Registro en formularios

- Abre el formulario en el editor → **Propiedades del formulario**.
- En **Bibliotecas de formulario**, agrega el web resource (p. ej. `utils.js` y luego `account.js`).
- En **Controladores de eventos**, enlaza la función (`Cap.Account.onLoad`) al evento
  y marca *"Pasar contexto de ejecución como primer parámetro"*.
