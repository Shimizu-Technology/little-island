import { it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
const hostRequire = createRequire(import.meta.url);
const babel = hostRequire("@babel/core") as { transformSync: (code: string, options: object) => { code: string } };
/** Vitest's ordinary TS transform does not build UI-runtime closures. Exercise the shipped transform too. */
it("initializes both action engines and their complete worklet dependency graph without forward-capture errors", () => {
  const cache = new Map<string, { exports: Record<string, unknown> }>();
  function load(file: string): Record<string, unknown> {
    const found = cache.get(file);
    if (found) return found.exports;
    const mod = { exports: {} };
    cache.set(file, mod);
    const transformed = babel.transformSync(readFileSync(file, "utf8"), {
      filename: file,
      babelrc: false,
      configFile: false,
      plugins: [
        hostRequire.resolve("react-native-worklets/plugin"),
        hostRequire.resolve("@babel/plugin-transform-typescript"),
        hostRequire.resolve("@babel/plugin-transform-modules-commonjs"),
      ],
    });
    const localRequire = (name: string) =>
      name.startsWith(".") ? load(resolve(dirname(file), `${name}.ts`)) : hostRequire(name);
    const wrapper = runInNewContext(`(function(require,module,exports){${transformed.code}\n})`, {
      console,
      global: { Error },
    });
    wrapper(localRequire, mod, mod.exports);
    return mod.exports;
  }
  const controls = load(resolve("src/arcade/action/controls.ts"));
  expect(typeof controls.palmFrameStep).toBe("function");
  expect(typeof controls.beachFrameStep).toBe("function");
  for (const file of ["palm-patrol", "beach-ball"]) {
    const engine = load(resolve(`src/arcade/games/${file}/engine.ts`));
    const prefix = file === "palm-patrol" ? "palm" : "beach";
    const step = engine[`${prefix}Step`] as { __closure: Record<string, unknown>; __initData: { code: string } };
    expect(step.__initData.code).toContain("function");
    expect(Object.values(step.__closure).every((value) => value !== undefined)).toBe(true);
  }
});
