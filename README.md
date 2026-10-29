# Engineering Game

## Getting Started

- [Install `pnpm`](https://pnpm.io/installation)
- Open the folder in [WebStorm](https://www.jetbrains.com/webstorm/download/)
- Run the following launch configuration: _Run_

## Publishing

- Run `pnpm run publish`
- Open the [published game](https://thsoft.github.io/engineering-game/)

## Changing the font

Run `pnpm font:set -- @fontsource/<font-package> "<Font Family>"` to replace the current Fontsource package and update the app's font imports and family settings. For example:

```sh
pnpm font:set -- @fontsource-variable/nunito "Nunito Variable"
```
