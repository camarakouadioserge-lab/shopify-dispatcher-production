
# Shopify Dispatcher Production

Version plus proche d'une vraie exploitation, pour centraliser les commandes Shopify, les dispatcher aux closers, suivre les livraisons, le chiffre d'affaires, les dépenses et lancer les appels client.

## Ce que cette version ajoute
- file de jobs Redis + BullMQ
- worker séparé pour traitement webhook et appels sortants
- idempotence persistée des webhooks Shopify
- journal d'audit
- middleware de protection des espaces privés
- route de maintenance pour purge sessions + requeue des webhooks en échec
- healthcheck base + Redis
- stack Docker avec `app`, `worker`, `postgres`, `redis`

## Stack
- Next.js App Router
- TypeScript
- Prisma + PostgreSQL
- Redis + BullMQ
- Twilio Voice
- Shopify webhooks
- Auth email / mot de passe avec session DB

## Démarrage local
```bash
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed
npm run dev
```

Dans un second terminal :
```bash
npm run worker
```

## Démarrage Docker
```bash
cp .env.example .env
docker compose up --build
```

## Comptes de démo
- Admin: `admin@example.com` / `Admin123!`
- Closer: `closer1@example.com` / `Closer123!`

## Routes principales
- `/login`
- `/dashboard`
- `/dashboard/orders`
- `/dashboard/closers`
- `/dashboard/assignments`
- `/dashboard/expenses`
- `/dashboard/audit`
- `/workspace`

## Routes techniques
- `POST /api/webhooks/shopify/orders-create`
- `POST /api/calls/start`
- `POST /api/twilio/status`
- `GET /api/health`
- `POST /api/cron/maintenance`

## Exécution prod minimale recommandée
1. Mettre un vrai domaine HTTPS.
2. Configurer PostgreSQL managé.
3. Configurer Redis managé.
4. Ajouter les secrets Twilio et Shopify.
5. Enregistrer le webhook Shopify `orders/create`.
6. Faire tourner `app` et `worker`.
7. Superviser `GET /api/health`.

## Commandes utiles
```bash
npm run build
npm run start
npm run worker
npm run prisma:seed
npm run typecheck
npm run db:studio
```

## Remarques
- Les appels sont lancés via Twilio et mis à jour par callback.
- Les webhooks Shopify sont reçus, validés, stockés, puis traités en arrière-plan par le worker.
- Cette base est sérieuse, mais il faut encore la brancher à tes vrais comptes, valider les règles métier exactes, ajouter tests, monitoring, sauvegardes et intégration transporteur si tu veux une prod critique.
