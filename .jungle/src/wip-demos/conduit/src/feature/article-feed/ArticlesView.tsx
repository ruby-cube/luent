//@ts-nocheck
import { component, Context, ContextKey, template, Else, ElseIf, For, fromContext, fromRoot, If, RenderSlot, AsyncIon } from "luent";
import { Ion, Ionized, watch, ion } from "@luent/quarky";
import { Article } from "../../../api";
import { AnyObject } from "@luent/types";
import { ArticleDatabase } from "../../db/ArticleDatabase";


// #region: main

ArticlesView['db'] = RootContextKey<ArticleDatabase>()
ArticlesView['settings'] = ContextKey<SiteSettings>()
ArticlesView['greeting'] = ContextKey<string>()

export function ArticlesView(input: {
   'articlesMeta': $<{ tag: string, username: string, category: string }>
   'articlesPerPage': $<number>,
   'greeting'?: string
}) {
   const {
      $articlesMeta,
      $articlesPerPage,
      greeting = fromContext(ArticlesView['greeting'], '?') ?? "Hello world",
      db = fromRoot(ArticlesView['db'])
   } = input()

   const $page = ion(0)
   const $result = fetchArticles($articlesMeta, $page, $articlesPerPage)

   const $articles = ion(() => $result().articles)
   const $articleCount = ion(() => $result().articleCount)

   const $feed = ion('global' as 'global' | 'user')
   const $tabs = ion(['global', 'my-feed'])

   return (

      <>
         <ArticlesNav
            mu:activetab={$feed}
            tabs={$tabs}
            prefetch={(feed) => $result.prefetch(feed, 0, $articlesPerPage())}
         ></ArticlesNav>
         {If(($result.pending),
            <div class="article-preview">
               <ArticlesSkeleton></ArticlesSkeleton>
            </div>
         )}
         {ElseIf(($result.error),
            <div class="article-preview">
               Something went wrong
            </div>
         )}
         {ElseIf(($articles().length === 0),
            <>No articles here yet</>
         )}
         {Else((settings = fromContext(ArticlesView.settings)) =>
            <>
               {For($articles, m => m.id, article => (
                  <ArticlePreview mu:article={article}></ArticlePreview>
               ))}
               <ArticlePagination
                  mu:page={$page}
                  articlesPerPage={settings?.$articlesPerPage ?? 10}
                  articleCount={$articleCount}
               ></ArticlePagination>
            </>
         )}
      </>
   ).expose({
      'mu:page': $page  // TODO: may only expose locally created ions and ionic objects, may not expose ions directly
   })
}

// #endregion


// #region: navigation

ArticlesNav.router = ContextKey<Router>()

function ArticlesNav(input: {}) {
   const router = fromRoot(ArticlesNav.router)

   return (

      <div>
         hi
      </div>
   )
}

// #endregion


// #region: preview

ArticlePreview['mu:db'] = RootContextKey.Mutable<ArticleDatabase>()
ArticlePreview['author'] = RootContextKey.Ion<ArticleDatabase>()
ArticlePreview['addTodo'] = ContextKey<() => void>()
ArticlePreview['on:clickIncrement'] = ContextKey<() => void>()

export function ArticlePreview(input: {
   'mu:article': Ionized<Article>,
}) {

   const { article, mu } = input as unknown as { article: Ionized<Article>, mu: <T>(arg: T) => T }
   const db = fromContext(ArticlePreview.db)

   const $author = ion(() => article.author.username)
   const $authorImage = ion(() => article.author.image)

   return (

      <div class="article-preview">
         <div class="article-meta">
            <RouterLink to="profile" params={{ username: $author }}>
               <img alt={$author} src={$authorImage}></img>
            </RouterLink>
         </div>
         <div class="info">
            <RouterLink
               class="author"
               to="profile"
               params={{ username: $author }}
            >
               {$author}
            </RouterLink>
            <span class="date">{new Date(article.createdAt).toDateString()}</span>
            <button
               class={(article.favorited ? 'btn-primary' : 'btn-outline-primary')}
               on:click={e => mu(article).favorited = !article.favorited}
            >
               <i class='ion-heart'>{(article.favoritesCount)}</i>
            </button>
         </div>
         <RouterLink
            class="preview-link"
            to="article"
            params={{ slug: article.slug }}
         >
            <h1>{article.$title}</h1>
            <p>{article.$description}</p>
            <span>Read more...</span>
            <ul class="tag-list">
               {For((article.tagList), m => m, (tag) => (
                  <li class="tag-default tag-pill tag-outline">
                     {tag}
                  </li>
               ))}
            </ul>
         </RouterLink>
      </div>
   )
}


function __postrender() {
   throw new Error("Function not implemented.");
}
function RootContextKey<T>() {
   throw new Error("Function not implemented.")
}
// #endregion


// #region: pagination

function ArticlePagination(input: {
   page: Ion<number>
   articleCount: Ion<number>
   articlesPerPage: Ion<number>
}) {
   const { $page, $articleCount, $articlesPerPage } = input

   const $totalPages = ion(() => Math.ceil($articleCount() / $articlesPerPage()))

   return (

      <ul class="pagination">
         {Thru($totalPages, (page) =>
            <li class={`${$page() === page && 'active'} page-item`}>
               <a>{page}</a>
            </li>
         )}
      </ul>
   )
}



const Thru = For