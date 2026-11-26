import { createRouter, createWebHistory } from '@ionic/vue-router';
import type { RouteLocationNormalized } from 'vue-router';
import type { BellaApplicationService } from '../../application/services/BellaApplicationService';

const WelcomeView = () => import('./views/WelcomeView.vue');
const AuthView = () => import('./views/AuthView.vue');
const AgendarView = () => import('./views/AgendarView.vue');
const TiendaView = () => import('./views/TiendaView.vue');
const MisCitasView = () => import('./views/MisCitasView.vue');
const AccountView = () => import('./views/AccountView.vue');

export function createAppRouter(app: BellaApplicationService) {
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', component: WelcomeView, meta: { public: true } },
      { path: '/login', component: AuthView, meta: { public: true, sinTabs: true } },
      { path: '/agendar', component: AgendarView, meta: { public: true } },
      { path: '/tienda', component: TiendaView, meta: { public: true } },
      { path: '/mis-citas', component: MisCitasView },
      { path: '/cuenta', component: AccountView },
      { path: '/:pathMatch(.*)*', redirect: '/' },
    ],
  });

  router.beforeEach((to: RouteLocationNormalized) => {
    if (!to.meta.public && !app.currentSession()) {
      return { path: '/login', query: { redirect: to.fullPath } };
    }
  });

  return router;
}
