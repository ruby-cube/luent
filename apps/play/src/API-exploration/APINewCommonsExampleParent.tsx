//@ts-nocheck
import { Commons, component } from "@rue/lumo"
import { ArticleDatabase } from "../demos/conduit/src/db/ArticleDatabase"
import { ArticlesView } from "../demos/conduit/src/feature/article-feed/ArticlesView"
import { ArticlePreview } from "./ArticlePreview"

function Parent() {

   component(
      <Commons provide={[
         ArticlePreview['mu:db'](new ArticleDatabase()),
         Shared.db(new ArticleDatabase()),
      ]}>
         <ArticlesView></ArticlesView>
      </Commons>
   )
}

const Shared = {
   db: mergeCommonsKeys(
      ArticlesView.db,
      ArticlePreview.db
   )
}