//@ts-nocheck
import { Commons, CommonsKey, component, Else, ElseIf, For, fromCommons, fromApp, FromTag, If, RenderSlot, SuspenseIon } from "@rue/lumo";
import { Ion, Ionized, watch } from "@rue/quarky";
import { Article } from "../../../api";
import { AnyObject } from "@rue/types";
import { ArticleDatabase } from "../../db/ArticleDatabase";


// #region: main

ArticlesView.db = RootCommonsKey<ArticleDatabase>()
ArticlesView.settings = CommonsKey<SiteSettings>()
ArticlesView.greeting = CommonsKey<string>()

export function ArticlesView(input: FromTag<{
   articlesMeta: Ion<{ tag: string, username: string, category: string }>
   articlesPerPage: Ion<number>,
   greeting?: string
}>) {
   const {
      $articlesMeta,
      $articlesPerPage,
      greeting = fromCommons(ArticlesView.greeting) ?? "Hello world"
   } = input()
   const db = fromRoot.required(ArticlesView.root.db)

   const $page = Ion(0)
   const $result = fetchArticles($articlesMeta, $page, $articlesPerPage)

   const $articles = Ion(() => $result().articles)
   const $articleCount = Ion(() => $result().articleCount)

   const $feed = Ion('global' as 'global' | 'user')
   const $tabs = Ion(['global', 'my-feed'])

   return component(
      <>
         <ArticlesNav
            mu:activetab={$feed}
            tabs={$tabs}
            can:prefetch={(feed) => $result.prefetch(feed, 0, $articlesPerPage())}
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
         {ElseIf($articles.length === 0,
            <>No articles here yet</>
         )}
         {Else((settings = fromCommons(ArticlesView.settings)) =>
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
   )
}

// #endregion


// #region: navigation

ArticlesNav.router = CommonsKey<Router>()

function ArticlesNav(input: FromTag<{}>) {
   const router = fromRoot(ArticlesNav.router)

   return component(
      <div>
         hi
      </div>
   )
}

// #endregion


// #region: preview

ArticlePreview['mu:db'] = RootCommonsKey.Mutable<ArticleDatabase>()
ArticlePreview['author'] = RootCommonsKey.Ion<ArticleDatabase>()
ArticlePreview['mm:addTodo'] = CommonsKey<() => void>()
ArticlePreview['on:clickIncrement'] = CommonsKey<() => void>()

export function ArticlePreview(input: FromTag<{
   'mu:article': Ionized<Article>,
}>) {

   const { article, mu } = input as unknown as { article: Ionized<Article>, mu: <T>(arg: T) => T }
   const db = fromCommons(ArticlePreview.db)

   const $author = Ion(() => article.author.username)
   const $authorImage = Ion(() => article.author.image)

   return component(
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
            <h1>{(article.title)}</h1>
            <p>{article.description}</p>
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
function RootCommonsKey<T>() {
   throw new Error("Function not implemented.")
}
// #endregion


// #region: pagination

function ArticlePagination(input: FromTag<{
   page: Ion<number>
   articleCount: Ion<number>
   articlesPerPage: Ion<number>
}>) {
   const { $page, $articleCount, $articlesPerPage } = input

   const $totalPages = Ion(() => Math.ceil($articleCount() / $articlesPerPage()))

   return component(
      <ul class="pagination">
         {Thru($totalPages, (page) =>
            <li class={{ "active": $page() === page, "page-item": true }}>
               <a>{page}</a>
            </li>
         )}
      </ul>
   )
}



const Thru = For