import { blogPosts } from "./data.js";
import { fromEntries, html } from "../../../packages/literate/src/Literate.js";
import { BlogPost, PostPreview } from "./PostPreview.js";
import { suspendRender, mO, Suspense } from "@rue/literate";
import { ion } from "../../../packages/quarky/src/index.js";

export function BlogPage() {
    const $blogPosts = ion([])
    const pendingBlogPosts = suspendRender(import('./data.js'))
        .then((posts)=>{
            $blogPosts.set(posts)
        })

    const PendingPostPreviews = Suspense(pendingBlogPosts, {
            Pending: () => html`
                ${fromEntries($blogPosts,(post, index) => 
                        mO(PostPreview, {post})
                )}
            `
    })

    return [
        expose({
            title: 'Blog'
        }),
        html`
            <h1>Blog posts are listed here</h1>
            <main>
                ${mO(PendingPostPreviews)}
            </main>
        `
    ]
}

