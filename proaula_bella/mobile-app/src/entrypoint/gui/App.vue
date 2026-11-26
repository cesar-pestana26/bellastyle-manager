<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { IonApp, IonRouterOutlet } from '@ionic/vue';
import { House, CalendarPlus, ShoppingBag, CalendarCheck, CircleUserRound } from 'lucide-vue-next';
import { useApplication } from './context';

const app = useApplication();
const route = useRoute();
const scope = ref(0);
const cartCount = ref(0);
const esClienta = ref(app.esClienta());
const conSesion = ref(!!app.currentSession());

function syncCartBadge() {
  cartCount.value = app.obtenerCarrito().reduce((acc, it) => acc + Number(it.cantidad || 1), 0);
}

function reset() {
  scope.value++;
  esClienta.value = app.esClienta();
  conSesion.value = !!app.currentSession();
  syncCartBadge();
}

onMounted(() => {
  syncCartBadge();
  window.addEventListener('session-changed', reset);
  window.addEventListener('cart-changed', syncCartBadge);
});

onUnmounted(() => {
  window.removeEventListener('session-changed', reset);
  window.removeEventListener('cart-changed', syncCartBadge);
});

const sinTabs = computed(() => !!route.meta.sinTabs);
const esPersonal = computed(() => conSesion.value && !esClienta.value);
</script>

<template>
  <IonApp>
    <IonRouterOutlet :key="scope" :class="{ 'with-tabs': !sinTabs }" />
    <nav v-if="!sinTabs" class="tabbar" aria-label="Navegación BellaStyle">
      <RouterLink to="/" :aria-current="route.path === '/' ? 'page' : undefined">
        <House :size="21" /><span>Inicio</span>
      </RouterLink>
      <RouterLink v-if="!esPersonal" to="/agendar" :aria-current="route.path.startsWith('/agendar') ? 'page' : undefined">
        <CalendarPlus :size="21" /><span>Agendar</span>
      </RouterLink>
      <RouterLink v-if="!esPersonal" to="/tienda" :aria-current="route.path.startsWith('/tienda') ? 'page' : undefined">
        <ShoppingBag :size="21" /><span>Tienda</span>
        <b v-if="cartCount > 0" class="cart-pill">{{ cartCount }}</b>
      </RouterLink>
      <RouterLink v-if="conSesion" to="/mis-citas" :aria-current="route.path.startsWith('/mis-citas') ? 'page' : undefined">
        <CalendarCheck :size="21" /><span>{{ esClienta ? 'Mis citas' : 'Agenda' }}</span>
      </RouterLink>
      <RouterLink v-if="conSesion" to="/cuenta" :aria-current="route.path === '/cuenta' ? 'page' : undefined">
        <CircleUserRound :size="21" /><span>Cuenta</span>
      </RouterLink>
      <RouterLink v-else to="/login">
        <CircleUserRound :size="21" /><span>Entrar</span>
      </RouterLink>
    </nav>
  </IonApp>
</template>
