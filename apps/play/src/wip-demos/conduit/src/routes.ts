
export const routes: RouteRecordRaw[] = [
  {
    name: 'global-feed',
    path: '/',
    component: () => import('./pages/Home.vue'),
  },
  {
    name: 'my-feed',
    path: '/my-feeds',
    component: () => import('./pages/Home.vue'),
  },
  {
    name: 'tag',
    path: '/tag/{tag}',
    component: () => import('./pages/Home.vue'),
  },
  {
    name: 'article',
    path: '/article/{slug}',
    component: () => import('./pages/Article.vue'),
  },
  {
    name: 'edit-article',
    path: '/article/{slug/*/*}/edit',
    match: {slug: /\\d+/},
    component: () => import('./pages/EditArticle.vue'),
  },
  {
    name: 'create-article',
    path: '/article/create',
    component: () => import('./pages/EditArticle.vue'),
  },
  {
    name: 'login',
    path: '/login',
    component: () => import('./pages/Login.vue'),
    beforeEnter: () => !isAuthorized(),
  },
  {
    name: 'register',
    path: '/register',
    component: () => import('./pages/Register.vue'),
    beforeEnter: () => !isAuthorized(),
  },
  {
    name: 'profile',
    path: '/profile/{username}',
    component: () => import('./pages/Profile.vue'),
  },
  {
    name: 'profile-favorites',
    path: '/profile/{username}/favorites',
    component: () => import('./pages/Profile.vue'),
  },
  {
    name: 'settings',
    path: '/settings',
    component: () => import('./pages/Settings.vue'),
  },
]