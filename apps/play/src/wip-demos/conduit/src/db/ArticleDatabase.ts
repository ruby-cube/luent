import { Ionized } from "@rue/quarky"

export interface ProfileData {
   id: string;
   username: string;
   bio: string;
   image: string;
   following: boolean;
}

export interface ArticleData {
   slug: string;
   title: string;
   description: string;
   body: string;
   tagList: string[];
   /** @format date-time */
   createdAt: string;
   /** @format date-time */
   updatedAt: string;
   favorited: boolean;
   favoritesCount: number;
   author: ProfileData;
}

export type ArticleResponse = {
   articles: ArticleData[],
   articleCount: number
}


export class ArticleDatabase {

   fetchArticles(...args: any[]): Promise<ArticleResponse> {
      // makes a copy of article state
   }
   
   setFavoriteState(slug: string, favorited: boolean) {
      // 
      // stores response to local storage
      // posts to db
      // retries using if fails
   }

   fetchArticle(slug: string): Promise<Article> {

   }
}