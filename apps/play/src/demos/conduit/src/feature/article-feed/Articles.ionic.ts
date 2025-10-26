//@ts-nocheck
import { HubKey, fromRoot, SuspenseIon } from "@rue/lumo";
import { $from, Ion } from "@rue/quarky";
import { ArticleData, ArticleDatabase, ArticleResponse } from "../../db/ArticleDatabase";



// #region:

fetchArticles.db = HubKey<ArticleDatabase>()

export function fetchArticles(
   $articlesMeta: Ion<{ tag: string, username: string, category: string }>,
   $page: Ion<number>,
   $articlesPerPage: Ion<number>,
   db = fromRoot(fetchArticles.db)
) {

   return SuspenseIon({
      initial: { articles: [], articleCount: 0 } as ArticleResponse,
      fetch: () => db.fetchArticles($articlesMeta(), $page(), $articlesPerPage())
         .then(res => toIonicArticleResponse(res))
   })
}



// #region:

type IonicArticleResponse = { articles: $$<Article>[], articleCount: number }

function toIonicArticleResponse(articleResponse: ArticleResponse): IonicArticleResponse {
   return articleResponse.map(({ articles, articleCount }) => { articles: asIonicArticle(article), articleCount })
}


// business logic
// persistence/retreival/sync logic
// -- optimistic updates
// view logic


// db
// -- validation


// flat data --> class instances (business logic) --> ionic (view and persistence)

function as<T, P>(Entity: (new (...args: P) => T) | symbol, args: P, uid: unknown): T {
   const depot = fromRoot('~depot')
   return depot.get(Article, uid) ?? depot.store(Entity, Entity instanceof Symbol ? args[0] : new Entity(...args), uid)
}

// function use(uid: string, obj: object) {
//    const depot = fromRoot('~depot')
//    return depot.get(uid) ?? depot.store(obj, uid)
// }

type SuspenseIon = {
   value: unknown

   error: Error | null
   pending: boolean
   initialLoad: boolean

   $error: Ion<Error | null>
   $pending: Ion<boolean>
   $initialLoad: Ion<boolean>

   '~ionic': true

   refetch(): Promise<unknown>
   prefetch(...args: unknown[]): Promise<unknown>
}

type PrivateSuspenseIon = {
   stale: boolean
   staleTime: number
   update(value: unknown): void
   dispatch(payload: unknown): Promise<unknown>
   retryDispatch(payload: unknown): Promise<unknown>
   abortDispatches(): void
}

type SuspenseOptions = {
   await: true,
   reawait: true
}

// #region:

IonicArticle.Article = RootHubKey<typeof Article>()
IonicArticle.Profile = RootHubKey<typeof Profile>()

function asIonicArticle(data: ArticleData) {

   const db = fromRoot(fetchArticles.db)
   const Article = fromRoot(IonicArticle.Article)
   const Profile = fromRoot(IonicArticle.Profile)
   const profile = as(Profile, [data.author], data.author.id)
   const article = as(Article, [data, profile], data.slug)

   const profile = as(Symbol('Profile'), [data.author], data.author.id)
   const article = as(Symbol('Article'), [data], data.slug)

   return asIonic(article, {
      ['@init']() { },

      favorited: {
         suspense: true,
         initial: data.favorited,
         async dispatch({ previous }) {
            return db.patchArticle(this.slug, { favorited: this.favorited }, {
               debounce: 50,
               previous: { favorited: previous }
            })
         },
         async['@init']() {
            if (localDB.getArticle(this.slug).favorited.stale) {
               await this.$favorited.dispatch({ favorited: this.favorited, previous })
            }
         },
         async['@set']({ previous }) {
            this.$favorited.abortDispatches()
            await this.$favorited.dispatch({ favorited: this.favorited, previous })
         },
         async['@error'](err, { previous }) {
            await this.$favorited.retryDispatch({ favorited: this.favorited, previous })

            // runStream(async ({ timeout, run }) => {
            //    await timeout(500)
            //    await run(() =>
            //       db.patchArticle(this.slug, { favorited: this.favorited }, {
            //          debounce: 50,
            //          previous: { favorited: previous },
            //          abort: abortDispatches.signal
            //       }) // TODO: what about deeply nested properties that need the article slug?
            //    )
            //    run(() => {
            //       // store in local storage

            //       db.onArticleUpdated(this.slug, (article) => {

            //       }, { once: true })
            //    })
            // })
         }
      },

      favoritesCount: {
         suspense: true,
         initial: data.favoritesCount,
         stale: localDB.getArticle(this.slug).favorited.stale,
         ['@init']() {
            db.onArticleUpdated(this.slug, (article) => {
               const $count = this.$favoritesCount
               if ($count.stale && this.$favorited.stale) {
                  $count.staleValue = article.favoritesCount
               }
               else {
                  $count.update(article.favoritesCount)
               }
            })

            watch(this.$favorited, sync(() => {
               $count.stale = true;
            }))
         },
         standin(staleCount) { return staleCount + (this.favorited ? 1 : 0) },
      },

      author: {
         ionize: asIonicProfile
      }
   })
}







function asIonicArticle(data: ArticleData) {

   const db = fromRoot(fetchArticles.db)
   const Article = fromRoot(IonicArticle.Article)
   const Profile = fromRoot(IonicArticle.Profile)
   const profile = as(Profile, [data.author], data.author.id)
   const article = as(Article, [data, profile], data.slug)

   const profile = as(Symbol('Profile'), [data.author], data.author.id)
   const article = as(Symbol('Article'), [data], data.slug)

   return asIonic(article, article => ({
      favorited: SuspenseIon({
         initial: data.favorited,
         dispatch({ previous }) {
            return db.patchArticle(this.slug, { favorited: this.favorited }, {
               debounce: 50,
               previous: { favorited: previous }
            })
         },
         '@set'({ previous }) {
            this.abortDispatches()
            this.await(this.dispatch({ favorited: article.favorited, previous }))
         },
         '@race'() {

         }
      }),

      favoritesCount: {
         suspense: true,
         initial: data.favoritesCount,
         stale: localDB.getArticle(this.slug).favorited.stale,
         ['@init']() {
            db.onArticleUpdated(this.slug, (article) => {
               const $count = this.$favoritesCount
               if ($count.stale && this.$favorited.stale) {
                  $count.staleValue = article.favoritesCount
               }
               else {
                  $count.update(article.favoritesCount)
               }
            })

            watch(this.$favorited, sync(() => {
               $count.stale = true;
            }))
         },
         standin(staleCount) { return staleCount + (this.favorited ? 1 : 0) },
      },

      author: {
         ionize: asIonicProfile
      }
   }))
}
