# Plugin Basket

This repository currently contains **Revenge Backup**, a Revenge/Vendetta-style mobile Discord plugin that backs up installed plugin links and their settings.

## Plugin

- [`src/plugins/revenge-backup`](src/plugins/revenge-backup) — adds a settings menu for manually or automatically compiling installed plugins/settings into a JSON backup, saving it as a file, and managing restore/delete actions.

## Development

```sh
npm install
npm run typecheck
npm run build
```

> Note: the current execution environment blocks npm registry access, so dependencies may need to be installed in a normal local environment before running `npm run build`.
