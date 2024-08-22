import express from 'express'
import { MainSite } from './src/MainSite.js';
import { HomePage } from './src/HomePage.js';
import { AboutPage } from './src/AboutPage.js';
import { BlogPage } from './src/BlogPage.js';
import { NotFound } from './src/NotFound.js';
import { BlogPost } from './src/BlogPost.js';
//@ts-expect-error
import { toKebab } from "to-kebab"

const app = express();
// app.use((request, response) => {
//     console.log("Got a request!")
// })



app.get('/', async (request, response) => {
    const page = await memoize('home-page', () => MainSite(HomePage))
    response.send(page.render());
})

app.get('/about', async (request, response) => {
    const page = await memoize('about-page', () => MainSite(AboutPage))
    response.send(page.render());
})

app.get('/blog', async (request, response) => {
    const page = await memoize('blog-page', () => MainSite(BlogPage))
    response.send(page.render());
})

app.get('/blog/:slug', async (request, response) => {
    const { slug } = request.params;
    const { blogPosts } = await import('./src/data.js');

    const post = blogPosts.find((item) =>
        toKebab(item.title) === slug ? item : null
    )
    if (post) {
        const page = await memoize(slug, () => MainSite(() => BlogPost(post)))
        response.send(page.render());
    }
    else {
        const page = await memoize('not-found', () => MainSite(NotFound))
        response.send(page.render());
    }
})

app.get('*', async (request, response) => {
    const page = await memoize('not-found', () => MainSite(NotFound))
    response.send(page.render());
})

app.listen(3000, () => {
    console.log("LISTENING ON PORT 3000")
})

export const serveHelloWorld = app;


