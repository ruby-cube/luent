import { blogPosts } from "./data.js";
import { fromEntries, html } from "../../../packages/literate/src/Literate.js";
import { PostPreview } from "./PostPreview.js";

export async function BlogPage() {
    const data = await import('./data.js')
    return {
        title: 'Blog',
        render: html`
            <h1>Blog posts are listed here</h1>
            <main>
                ${fromEntries(data.blogPosts,(post, index) => 
                    PostPreview(post).render()
                )}
            </main>
            `
    }
}

