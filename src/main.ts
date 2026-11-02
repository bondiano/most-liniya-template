// Сервер города. Этот файл проверяет только GitHub CI: он запускает его процессом
// `tsx src/main.ts` на PostgreSQL 17 и останавливает сигналом SIGTERM.
//
// Что должно получиться (подробно в README, раздел «Что пишешь в src/main.ts»):
// * база из DATABASE_URL (PgClient, строка как Redacted);
// * CityLive из src/city.ts на настоящем кластере из одного раннера, сообщения
//   сущностей и очередь линии в той же базе;
// * окошки Почтамта (PochtamtRoutes) на HTTP-сервере Node, порт из PORT (3000 по умолчанию);
// * книга башен TowerBook.layer(TOWER_BOOK_URL);
// * насос: раз в секунду dispatch отправляет письма из outbox по линии;
// * трассы в OTEL_EXPORTER_OTLP_ENDPOINT с serviceName 'pochtamt', если адрес задан;
// * запуск через NodeRuntime.runMain, чтобы SIGTERM прерывал программу и закрывал ресурсы.
export {};
