# Город на одном сервере: финальный босс курса Effect

Босс урока 120 курса Effect школы BatSchool: окошки Почтамта, кадры старых башен и Магистрали и линия башен без хозяина работают одним сервером на PostgreSQL 17, в настоящем кластере и с трассами наружу. Условие заказа в школе, на странице урока «Финальный босс», этап «Экзамен: город на одном сервере». В репозитории только обвязка: зависимости, PostgreSQL в Docker, пример окружения, заготовка `src/main.ts` и проверка в CI. Код твой: перенеси сюда каталог `src/` из своей репетиции (этап «Репетиция» того же урока, его видно в редакторе этапа), закоммить и допиши `src/main.ts`.

## Как работать локально

Нужны Node 24, [pnpm](https://pnpm.io/) и Docker.

```sh
pnpm install
docker compose up -d                      # PostgreSQL 17 на :5432
cp .env.example .env                      # адрес базы, порт, книга башен
pnpm start                                # tsx --env-file=.env src/main.ts
pnpm typecheck
```

Свои тесты клади рядом и запускай `pnpm test`.

## Что пишешь в `src/main.ts`

Сервер собирает те же модули, что и репетиция, но на настоящих сервисах:

* **База.** `PgClient.layerConfig` из `@effect/sql-pg`, адрес из `DATABASE_URL` через `Config.Redacted`: в строке пароль. Миграции города при старте делает `CityLive`.
* **Кластер.** Один раннер, у которого сообщения сущностей и раннеры лежат в той же базе: `SingleRunner.layer({ runnerStorage: 'sql' })` и поверх него `ClusterWorkflowEngine.layer`. Кластеру нужен `Digest`, его даёт `NodeCrypto.layerDigest`.
* **Очередь линии** в базе: `PersistedQueue.layer` на `PersistedQueue.layerStoreSql()`, перезапуск сервера задания не теряет.
* **Книга башен** Магистрали: `TowerBook.layer(url)` из `src/pochtamt/towers.ts`, адрес из `TOWER_BOOK_URL`; ей нужен `HttpClient` (`NodeHttpClient.layerUndici`).
* **Окошки Почтамта.** `PochtamtRoutes` из `src/pochtamt/server.ts` через `HttpRouter.serve` на `NodeHttpServer.layer(createServer, { port })`, порт из `PORT`, по умолчанию 3000.
* **Насос.** Раз в секунду `dispatch(jobs)` из `src/city.ts` отправляет письма из outbox по линии; беда одного прохода не останавливает следующие.
* **Трассы.** Если задан `OTEL_EXPORTER_OTLP_ENDPOINT`, трассы уходят туда через `Otlp.layerJson` из `effect/observability` с `serviceName: 'pochtamt'`; без адреса сервер работает без них.
* **Запуск.** `NodeRuntime.runMain(Layer.launch(...))`: SIGTERM прерывает программу, финализаторы закрывают HTTP-сервер, насос и базу.

## Как проверяется

1. Привяжи свой репозиторий в школе: настройки, блок «Репозитории изделий», строка «Линия башен», поле `владелец/репозиторий`, кнопка «Привязать». Владелец репозитория должен совпасть с твоим аккаунтом GitHub. Проверка в CI засчитывается с премиумом.
2. Каждый пуш запускает `.github/workflows/grade.yml`. Он вызывает общий workflow школы `bondiano/py-graders-ci` с `lang: typescript`, тот поднимает PostgreSQL 17, гоняет скрытые проверки образом `ghcr.io/bondiano/ts-grader-liniya:09` и отправляет результат в школу. Зелёный прогон засчитывает этап и даёт ранг.
3. Не меняй `grade.yml`: школа принимает отчёт только от общего workflow на опубликованном теге.

Проверки такие: тесты всех этапов линии и репетиции, как в браузере; город на PostgreSQL 17 (миграции, письмо по линии, сообщения кластера в базе); и `src/main.ts` настоящим процессом: `/health`, письмо из окошка уходит насосом, письмо на башню не из книги это 422, трассы приходят в тестовый коллектор, SIGTERM останавливает сервер чисто.

Тот же прогон можно сделать у себя. Образ собран для `linux/amd64` (на ARM добавь `--platform linux/amd64`, будет медленнее). Грейдер дописывает свои файлы в каталог проекта, поэтому дай ему копию:

```sh
docker compose up -d
work="$(mktemp -d)" && cp -R . "$work" && rm -rf "$work/.git" "$work/node_modules" && chmod -R a+rwX "$work"
docker run --rm --network host --read-only --tmpfs /tmp \
  -e DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres \
  -v "$work:/work" ghcr.io/bondiano/ts-grader-liniya:09
```

Каждая строка вывода это одна проверка: `"passed": true` или `false` и сообщение.
