//@ts-nocheck
import { Commons, component } from "@rue/lumo"
import { ArticleDatabase } from "./ArticleDatabase.class"
import { ArticlesView } from "./ArticlesView"
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