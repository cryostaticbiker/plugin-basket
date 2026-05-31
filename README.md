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

## Publishing a Revenge plugin link

Revenge/Vendetta plugin links point at the **hosted plugin folder**, not at this repository's TypeScript source file. After building, publish the generated `dist/revenge-backup` folder somewhere static, such as GitHub Pages.

For a GitHub Pages monorepo deployment, the install link should look like:

```text
https://<github-username>.github.io/<repo-name>/revenge-backup
```

For this repository name, that would become:

```text
https://<github-username>.github.io/plugin-basket/revenge-backup
```

That URL must serve both:

- `https://<github-username>.github.io/plugin-basket/revenge-backup/manifest.json`
- `https://<github-username>.github.io/plugin-basket/revenge-backup/index.js`

Then, in Revenge, open **Settings → Plugins → Add Plugin**, paste the folder URL above, and install it.
