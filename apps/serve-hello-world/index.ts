import express from 'express'
import { MainSite } from './src/MainSite.js';
import { HomePage } from './src/HomePage.js';
import { AboutPage } from './src/AboutPage.js';
import { BlogPage } from './src/BlogPage.js';
import { NotFound } from './src/NotFound.js';
import { BlogPost } from './src/BlogPost.js';
//@ts-expect-error
import { toKebab } from "to-kebab"
import { generateHTML } from '@rue/literate';

const app = express();
// app.use((request, response) => {
//     console.log("Got a request!")
// })



app.get('/', async (request, response) => {
    // const page = await memoize('home-page', () => MainSite(HomePage))
    const page = await generateHTML(() => MainSite({ Slot: HomePage }), 1000)
    response.send(page);
})

app.get('/about', async (request, response) => {
    // const page = await memoize('about-page', () => MainSite(AboutPage))
    const page = await generateHTML(() => MainSite({ Slot: AboutPage }), 1000)
    response.send(page);
})

app.get('/blog', async (request, response) => {
    const page = await generateHTML(() => MainSite({ Slot: BlogPage }), 1000)
    response.send(page);
})

app.get('/blog/:slug', async (request, response) => {
    const { slug } = request.params;
    const { blogPosts } = await import('./src/data.js');

    const post = blogPosts.find((item) =>
        toKebab(item.title) === slug ? item : null
    )
    if (post) {
        const page = await generateHTML(() => MainSite({ Slot: () => BlogPage({ post }) }), 1000)
        response.send(page);
    }
    else {
        const page = await generateHTML(() => MainSite({ Slot: NotFound }), 1000)
        response.send(page);
    }
})

app.get('*', async (request, response) => {
    const page = await generateHTML(() => MainSite({ Slot: NotFound }), 1000)
    response.send(page);
})

app.listen(3000, () => {
    console.log("LISTENING ON PORT 3000")
})

export const serveHelloWorld = app;


