import { Ionized } from "@rue/quarky"
import { Article } from "../../../api"

type ArticleResponse = {
   articles: Ionized<Article>[],
   articleCount: number
}

export class ArticleDatabase {

   fetchArticles(...args: any[]): Promise<ArticleResponse> {
      // makes a copy of article state
   }
   markFavoriteState(slug: string, favorited: boolean) {
      // 
      // stores response to local storage
      // posts to db
      // retries using if fails
   }
}