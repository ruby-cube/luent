import { expose } from "@rue/lumo";
import { html } from "../../../packages/literate/src/Literate.js";
import { BlogPost as Post } from "./PostPreview.js";

export function BlogPost({ post }: {
    post: Post
}) {
    return [
        expose({
            title: post.title
        }),
        html`
            <h1>${post.title}</h1>
            <p>${post.date}</p>
            <p>${post.content}</p>
        `
    ]
}