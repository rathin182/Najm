<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- Glass effect uses the npm `liquid-gl` package via `useLiquidGlass(selector)` in src/components/site/motion.ts; lens targets are empty decorative spans behind real content, so content stays visible/clickable if WebGL fails.
- Admin panel data lives in src/lib/admin-store.tsx (React context persisted to localStorage); public forms feed it via pushEnquiry. Why: demo mode with no backend yet — swap this module for Cloud when going live.
