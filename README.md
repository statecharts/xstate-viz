# xstate-viz

See it in action at https://xstate.js.org/viz/.


## Super quick start

In the root and public directory (`xstate-viz/` & `xstate-viz/public`) run

```bash
npm i
```

In root run

```bash
npm link
```

In public run

```bash
npm link @statecharts/xstate-viz
```

In root run

```bash
npm run develop
```

Using PreviewOnly for local machine development (experimental).
Add machines in `public/src/machines/` and update `public/src/index.tsx`.
In root run

```bash
npm run previewOnly
```
