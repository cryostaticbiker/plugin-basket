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

If `npm run build` says it cannot find `rollup` or another build package, the dependencies have not been installed in that checkout yet. Run `npm install` from the repository root, wait for it to finish, and then run `npm run build` again.

> Note: the current execution environment blocks npm registry access, so dependencies may need to be installed in a normal local environment before running `npm run build`.


### Backup file saving

Manual and automatic compiles now generate a JSON backup and try to write it directly to the phone's Downloads storage using the available Revenge/Discord file-manager module. If direct Downloads access is unavailable on a given build, the plugin keeps the compiled backup in plugin storage/internal app storage and warns that direct download is unavailable instead of treating the compile itself as failed.

### Troubleshooting configure-page crashes

If Revenge shows `TypeError: undefined is not a function` when opening **Configure**, make sure you rebuilt and redeployed after pulling the latest changes. Older builds attempted to call form helper components that are not present on every Revenge runtime. The current build safely falls back when those helpers are missing.

## Publishing a Revenge plugin link

Revenge/Vendetta plugin links point at the **hosted plugin folder**, not at this repository's TypeScript source file. The included GitHub Actions workflow builds `src/plugins/revenge-backup`, writes the compiled plugin to `dist/revenge-backup`, and deploys the contents of `dist` to the `gh-pages` branch.

After the workflow succeeds, configure GitHub Pages to serve from the `gh-pages` branch. The Revenge install link should be:

```text
https://cryostaticbiker.github.io/plugin-basket/revenge-backup/
```

Do **not** use this URL with the included workflow:

```text
https://cryostaticbiker.github.io/plugin-basket/dist/revenge-backup/
```

The `dist` path is only a local build directory in this repo. The workflow publishes the contents of `dist` as the web root, so the public URL drops `/dist`.

The working URL must serve both:

- `https://cryostaticbiker.github.io/plugin-basket/revenge-backup/manifest.json`
- `https://cryostaticbiker.github.io/plugin-basket/revenge-backup/index.js`

Then, in Revenge, open **Settings → Plugins → Add Plugin**, paste the folder URL above, and install it.
