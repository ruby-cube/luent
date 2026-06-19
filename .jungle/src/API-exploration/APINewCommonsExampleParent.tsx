//@ts-nocheck
import { Context, template } from "@rue/luent"
import { ArticleDatabase } from "../wip-demos/conduit/src/db/ArticleDatabase"
import { ArticlesView } from "../wip-demos/conduit/src/feature/article-feed/ArticlesView"
import { ArticlePreview } from "./ArticlePreview"

function Parent() {

  component(
    <v-context provide={[
      ArticlePreview['mu:db'](new ArticleDatabase()),
      Shared.db(new ArticleDatabase()),
    ]}>
      <ArticlesView></ArticlesView>
    </v-context>
  )
}

const Shared = {
  db: mergeContextKeys(
    ArticlesView.db,
    ArticlePreview.db
  )
}