# Logging Rules

[Quay lai LOGGING_RULES.md](../LOGGING_RULES.md)

Bo tai lieu nay chia nho cac quy tac logging bat buoc cho AI agent khi lam viec voi repository.

AI coding agent phai doc file dieu huong nay truoc khi tao hoac cap nhat log task, sau do doc cac file con lien quan. Voi task co doc/sua/chay lenh trong repository, log task phai duoc tao theo bo rule nay.

## Muc luc

| File | Muc | Noi dung |
| --- | --- | --- |
| [01-purpose-and-scope.md](01-purpose-and-scope.md) | 1-4 | Muc dich, khi nao can log, vi tri log, nguyen tac cot loi |
| [02-log-structure.md](02-log-structure.md) | 5-13 | Cau truc bat buoc, metadata, request, context, timeline, commands, file changes, errors, decisions |
| [03-verification-and-context.md](03-verification-and-context.md) | 14-18 | Verification, token/context observations, context waste, repeated context tracking, accuracy rules |
| [04-summary-and-completion.md](04-summary-and-completion.md) | 19-22 | Final summary, logging efficiency, source of truth, completion checklist |

Khong copy toan bo source, terminal output dai, secret, token, cookie, `.env` value hoac chain-of-thought vao log.
