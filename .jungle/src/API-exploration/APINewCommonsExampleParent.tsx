//@ts-nocheck
import { Context, template } from "luent"
import { ArticleDatabase } from "../wip-demos/conduit/src/db/ArticleDatabase"
import { ArticlesView } from "../wip-demos/conduit/src/feature/article-feed/ArticlesView"
import { ArticlePreview } from "./ArticlePreview"


function Parent() {

  return(
    <div>
      <div>Hello World</div>
      <o:context with={[
        ARTICLE_DB(new ArticleDatabase()),
        SHARED.DB(new Database()),
      ]}>
        <ArticlesView></ArticlesView>
      </o:context>
    </div>
  )
}


const Shared = {
  DB: mergeKeys(
    ArticlesView.db,
    ArticlePreview.db
  )
}