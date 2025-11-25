//@ts-nocheck
import { ContextKey, fromRoot, AsyncIon } from "@rue/lumo";
import { $from, dispatch, Ion } from "@rue/quarky";
import { ArticleData, ArticleDatabase, ArticleResponse } from "../../db/ArticleDatabase";



// #region:

fetchArticles.db = ContextKey<ArticleDatabase>()

export function fetchArticles(
   $articlesMeta: Ion<{ tag: string, username: string, category: string }>,
   $page: Ion<number>,
   $articlesPerPage: Ion<number>,
   db = fromRoot(fetchArticles.db)
) {

   return AsyncIon({
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

type AsyncIon = {
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

type PrivateAsyncIon = {
   stale: boolean
   staleTime: number
   update(value: unknown): void
   dispatch(payload: unknown): Promise<unknown>
   retryDispatch(payload: unknown): Promise<unknown>
   abortDispatches(): void
}

type AsyncOptions = {
   await: true,
   reawait: true
}

asArticle['Article'] = RootContextKey<typeof Article>()

function asArticle(data: ArticleData) {
   return depot.get(data.slug) ?? depot.create(() => { // create will throw if not preceded by depot.get(id), it needs the id
      const Article = fromRoot(asArticle['Article'])
      return new Article(data, asProfile(data.author))
   })
}



asProfile['Profile'] = RootContextKey<typeof Profile>()

function asProfile(data) {
   return depot.get(data.id) ?? depot.create(() => {
      // optional dependency injection
      const Profile = fromRoot(asProfile['Profile'])
      return new Profile(data)
   })
}

// #region:


// data --> class instance --> ionic instance

// data type
// class declaration
// asClass
// asIonic

function asIonicArticle(data: ArticleData) {
   // NOTE: Ionic and asIonic can take two types of configs: an object config and an extender function
   // - object config hooks into ionic model
   // - extender function extends the ionic model with the provided properties and methods

   return depot.getIonic(data.slug) ?? depot.createIonic(() => {
      const db = fromRoot(fetchArticles.db)

      return Ionic(asArticle(data), article => ({
         $author: AsyncIon({
            initial: asIonicProfile(article.super.author),
            sync: true,
            dispatch() {

            },
            '@get'() { },
            '@set'() { },
         })
      }))
   })


   const article = extendIonicInstance(_article, class {
      $favorited = AsyncIon({

      })

      doSomething = AsyncAction({
         sync() {
            article.super.doSomething()
         },
         dispatch() {

         }
      })
   }


      , {
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

type IonFetchConfig<T> = {
   fetch(): Promise<T> // --> status: 'pending', stale: 'fetching'
} | {
   initial: T // --> latest: T, status: 'received', stale: false
   fetch?(): Promise<T> // --> status: 'pending', stale: 'fetching'
}

type IonDispatchConfig<T> = {
   dispatch(context: DispatchContext, value: T): Promise<T> // --> status: 'pending', stale: 'fetching'
   presumes?: boolean // whether or not to set ion optimistically
} | {
   presuming: () => boolean
   presumption: () => T
}


type AsyncIonConfig<T> = IonFetchConfig<T> & IonDispatchConfig<T> & {
   expiration?: number
   // preawait?: boolean // throws promise while 'pending'
   reawait?: boolean // throws promise while 'refetching'
}

type DispatchContext = {
   ooo: AsyncSequence
   abortSignal: AbortSignal
   dispatchID: string
}

const UNDEFINED = Symbol('undefined')

class AsyncIon<T> {

   private _fetch(): Promise<T>

   private _dispatch(): void

   private initialized;

   constructor(config: AsyncIonConfig) {
      this._fetch = config.fetch
      this._dispatch = config.dispatch
      this.initialized = 'initial' in config ? true : false;
      this.latest = 'initial' in config ? config.initial : undefined
      this.status = 'initial' in config ? 'received' : 'fetch' in config ? 'pending' : 'error'
      this.stale = 'initial' in config ? false : 'fetch' in config ? 'fetching' : true
      if (this.status === 'error') throw new Error('[INVALID INPUT] Async ion config is requires an initial value or a fetch function')
      if (isFunction(config.presuming)) {
         Object.defineProperty(this, 'presuming', {
            get: config.presuming
         })
      }

      if (isFunction(config.presumption)) {
         Object.defineProperty(this, 'presumption', {
            get: config.presumption
         })
      }

      if ('fetch' in config && !this.initialized) {
         this.watchFetch()
      }
   }

   private watchingFetch = false;

   private watchFetch() {
      queueIonicTask(() => this.fetch())
      this.watchingFetch = true;
   }

   private fetch() {
      if (!this._fetch) return;
      if (!this.watchingFetch) {
         this.watchFetch()
      }
      this.status = this.initialized ? 'refetching' : 'pending'

      return this._fetch()
         .then(res => {
            this.status = 'received'
            return res
         })
         .catch(err => {
            this.status = 'error'
            this.error = err
         })
         .finally(res => {
            this.initialized = true
            return res
         })
   }

   private dispatch() {
      if (!this._dispatch) return;

   }

   latest: T | undefined = 0 // latest synced value

   private presumption: T | typeof UNDEFINED = UNDEFINED

   private status: 'pending' | 'error' | 'received' | 'refetching' = 'received'

   // #region: status booleans
   get pending() {
      return this.status === 'pending'
   }

   _error: Error = new Error("")

   get error() {
      return this.status === 'error' ? this._error : null
   }

   get fetching() {
      return this.status === 'pending' | 'refetching'
   }

   fetchStatus: 'idle' // 'idle' | 'active' | 'paused'

   // #endregion


   get value() {
      return this.presuming ? this.presumption : this.latest
   }

   get presuming() {
      return this.presumes && this.presumption !== UNDEFINED
   }

   get synced() {
      return this.presumption === UNDEFINED
   }

   private presumes: boolean = true

   set value(value: T) {
      if (this.presumes) this.presumption = value
      const ooo = new AsyncSequence()
      this.dispatch({ ooo }, value)
   }

   sync(value: T) {
      this.presumption = UNDEFINED
      this.latest = value;
   }

   private stale: false | true | 'fetching'

   refetch() {
      this.stale = true
   }
}


function asArticle(data: ArticleData) {
   const Article = fromRoot(asIonicArticle.Article)
   const Profile = fromRoot(asIonicArticle.Profile)

   const profile = as(Profile)(data.author).uid(data.author.id) // TODO: refactor as() to this format

   return as(Article)(data, profile).uid(data.slug)
}


function asIonicArticle(data: ArticleData, refetchArticles: () => void) {
   const db = fromRoot(fetchArticles.db)

   const article = asIonic(asArticle(data), {
      $favorited: AsyncIon({
         uid: data.slug, // used for caching such that if articles is refetched by another part of the app, stale state etc won't be overwritten
         initial: data.favorited,
         presumes: true,

         '@init'({ ooo }) {
            ooo.await(() => localDB.getArticle(article.slug))
         },

         dispatch({ ooo }) {
            ooo.await(() => db.patchArticle(article.slug).favorited(article.favorited))
               .then(favorited => this.sync(favorited))
            // .finally(refetchArticles)
         },
         debounce: 50,
         '@race'() {

         }
      }),

      // value: T
      // latest: T
      // stale: boolean
      // 

      favoritesCount: asAsyncIon({
         uid: article.slug,
         initial: data.favoritesCount,
         '@init'() {
            db.watchArticle(this.slug).favoritesCount((count) => {
               if (this.stale) {
                  this.staleValue = count
               }
               else {
                  this.value = count
               }
            })
         },
         presuming() { return article.$favorited.presuming },
         presumption(latest) {
            return article.favorited === article.$favorited.latest
               ? latest
               : latest + article.favorited ? 1 : -1
         }
      }),

      author: { as: asIonicProfile }
   })

   return article
}
