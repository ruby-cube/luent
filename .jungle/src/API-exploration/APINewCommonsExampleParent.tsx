//@ts-nocheck
import { Context, template } from "@rue/luent"
import { ArticleDatabase } from "../wip-demos/conduit/src/db/ArticleDatabase"
import { ArticlesView } from "../wip-demos/conduit/src/feature/article-feed/ArticlesView"
import { ArticlePreview } from "./ArticlePreview"

function Parent() {

   component(
      <Context provide={[
         ArticlePreview['mu:db'](new ArticleDatabase()),
         Shared.db(new ArticleDatabase()),
      ]}>
         <ArticlesView></ArticlesView>
      </Context>
   )
}

const Shared = {
   db: mergeContextKeys(
      ArticlesView.db,
      ArticlePreview.db
   )
}