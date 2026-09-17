# TANEM Site Engine v2

- Это центральный engine цифровых офисов мастеров. Один клиент — один отдельный репозиторий данных.
- Клиентские отличия выражаются только через `site.json`, изображения и `specialty`; персональные CSS/JS-патчи запрещены.
- Не переносить старый Next.js, `_next`, ClayTone runtime и код из production-репозиториев.
- Эталоны поведения: `examples/nonna.json`, `examples/tahmina.json`, `examples/julia.json`.
- Малое и большое число категорий обрабатывает один компонент автоматически. Волосы с ценами по длине задаются `price.type: "variants"`.
- Перед выпуском выполнить `npm test`, `npm run build:tahmina`, `npm run build:julia`.
- Не менять production-сайты при работе над engine. Выпускать version tag; клиенты обновлять на него отдельно.
