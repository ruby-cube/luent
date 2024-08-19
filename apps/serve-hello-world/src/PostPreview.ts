import { html } from "../../../packages/literate/src/Literate.js";
//@ts-expect-error
import { toKebab } from "to-kebab"

export type BlogPost = {
    title: string;
    content: string;
    date: string;
}

export function PostPreview(post: BlogPost) {
    return {
        render: html`
            <h3>
                <a href="/blog/${toKebab(post.title)}">${post.title}</a>
            </h3>
            <p>${post.date}</p>
            <p>${post.content}</p>
            <hr>
        `
    }
}