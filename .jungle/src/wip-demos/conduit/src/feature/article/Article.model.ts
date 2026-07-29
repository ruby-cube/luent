//@ts-nocheck
import { Ion, Ionic } from "@luent/quarky";
import { Article as ArticleData, Profile } from "../../../api";
import { AsyncIon } from "luent";
import { watch } from "node:fs";
import { ArticleDatabase } from "../../db/ArticleDatabase";

class Article implements ArticleData {
   slug: string;
   title: string;
   description: string;
   body: string;
   tagList: string[];
   createdAt: string;
   updatedAt: string;
   favorited: boolean;
   favoritesCount: number;

   constructor(
      data: ArticleData,
      public author: Profile
   ) {
      this.slug = data.slug;
      this.title = data.title;
      this.description = data.description;
      this.body = data.body;
      this.tagList = data.tagList;
      this.createdAt = data.createdAt;
      this.updatedAt = data.updatedAt;
      this.favorited = data.favorited;
      this.favoritesCount = data.favoritesCount;
   }
}