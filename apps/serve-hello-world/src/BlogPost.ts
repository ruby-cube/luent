import { html } from "./lumin.js";
import { BlogPost as Post } from "./PostPreview.js";

export function BlogPost(post: Post) {
    return {
        title: post.title,
        render: html`
            <h1>${post.title}</h1>
            <p>${post.date}</p>
            <p>${post.content}</p>
        `
    }
}