# Ref-forwarding fix spec (Codex round 1, MED 2 — §7.6 "forwarded ref")

Every exported **DOM-root** component must forward a consumer `ref` to the host element it owns.
React 19 ref-as-prop is the idiom here (NOT `React.forwardRef`, which is deprecated in React 19).
Two proven, minimal patterns — apply the one that matches each component. Gold references already
landed: `registry/ui/button.tsx` (useRender) and `registry/ui/alert.tsx` (type-swap).

## Pattern A — plain function that spreads `{...props}` onto its host root (MOST components)
Change ONLY the props type; the existing `{...props}` spread carries the ref onto the host element.

```tsx
// BEFORE:  export interface FooProps extends React.ComponentPropsWithoutRef<'div'> { … }
// AFTER:   export interface FooProps extends React.ComponentPropsWithRef<'div'> { … }
// (type aliases too:  export type FooProps = React.ComponentPropsWithRef<'div'>;)
export function Foo({ className, ...props }: FooProps) {
  return <div data-slot="foo" className={cn(…)} {...props} />;   // ref flows via {...props}
}
```
Requirement: the root host element must receive `{...props}` AFTER any fixed attrs. If `{...props}`
is already there (it almost always is), the type change alone is the entire fix.

## Pattern B — `useRender` root (Base UI Model-A polymorphic components)
`useRender` takes a top-level `ref` param. Type the props with `ComponentPropsWithRef`, destructure
`ref`, pass it to `useRender`.

```tsx
export interface FooProps extends React.ComponentPropsWithRef<'button'>, VariantProps<…> { … }
export function Foo({ className, render, ref, ...props }: FooProps) {
  return useRender({
    render: render ?? <button />,
    defaultTagName: 'button',
    ref,                          // ← forward onto the rendered/composed element
    props: { 'data-slot': 'foo', className: cn(…), ...props },
  });
}
```

## Pattern C — component that does NOT spread props onto a single host root
(e.g. wraps children conditionally, renders a list, or portals). Type with `ComponentPropsWithRef`,
destructure `ref`, and place it explicitly on the intended root host element: `<div ref={ref} …>`.
If there is genuinely no single host root (a pure portal like a toaster), leave it and note why in
the component's JSDoc.

## Pattern D — delegating wrapper (extends another component's props, spreads onto it)
NO code change needed: if `FooProps extends ButtonProps` (now ref-bearing) and the body does
`<Button {...props} />`, the ref auto-forwards. Just ADD a ref test.

## Test to add to each component's *.test.tsx (adapt element type + data-slot)
Ensure `import * as React from 'react';` is at the top of the test file.

```tsx
test('forwards ref to the root element', async () => {
  const ref = React.createRef<HTMLDivElement>();   // match the root element type
  await render(<Foo ref={ref} />);                  // give it required props
  expect(ref.current).toBeInstanceOf(HTMLElement);
  expect(ref.current?.dataset.slot).toBe('foo');    // the root's data-slot
});
```

## Hard requirements for every change
- Keep ALL existing tests passing. Do not change behavior, styling, or public prop names.
- `cd packages/ui && PATH="/opt/homebrew/opt/node@24/bin:$PATH" pnpm exec tsc --noEmit` must be clean.
- `PATH=… pnpm exec vitest run registry/ui/<name>.test.tsx` must pass for every file you touch.
- Do NOT touch registry.json or apps/docs copy-in — the parent re-syncs those centrally.
