import { expose } from "@rue/lumo";
import { html } from "../../../packages/literate/src/Literate.js";
//@ts-expect-error
import { toKebab } from "to-kebab"

export type BlogPost = {
    title: string;
    content: string;
    date: string;
}

type Props = {
    post: BlogPost
}

export function PostPreview({ post }: Props) {
    return [
        expose({
            title: post.title
        }),
        html`
            <h3>
                <a href="/blog/${toKebab(post.title)}">${post.title}</a>
            </h3>
            <p>${post.date}</p>
            <p>${post.content}</p>
            <hr>
        `]
}