# CI workflow (chưa kích hoạt)

`ci.yml` chạy lint, typecheck, unit test và build cho mọi PR và cho `main`.
Workflow chưa nằm trong `.github/workflows/` vì token dùng để push không có quyền `workflow`.

Để bật CI, chủ repo chạy:

```bash
gh auth refresh -s workflow
mkdir -p .github/workflows && git mv docs/ci/ci.yml .github/workflows/ci.yml
git commit -m "ci: enable workflow" && git push
```

Workflow không cần secret nào (build không gọi AI hay TTS).
