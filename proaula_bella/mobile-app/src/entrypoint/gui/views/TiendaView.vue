<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, onIonViewWillEnter } from '@ionic/vue';
import { useApplication, errorMessage, pesos } from '../context';
import type { ProductoBella, ItemCarritoBella } from '../../../domain/model/BellaModels';

const app = useApplication();
const router = useRouter();
const productos = ref<ProductoBella[]>([]);
const carrito = ref<ItemCarritoBella[]>(app.obtenerCarrito());
const cargando = ref(false);
const enviando = ref(false);
const error = ref('');
const exito = ref('');

const lineas = computed(() =>
  carrito.value
    .map((it) => ({ ...it, producto: productos.value.find((p) => p.id_producto === it.id_producto) }))
    .filter((l) => l.producto));
const total = computed(() => lineas.value.reduce((s, l) => s + Number(l.producto!.precio) * l.cantidad, 0));

function sincronizar() {
  carrito.value = app.obtenerCarrito();
}
onMounted(() => window.addEventListener('cart-changed', sincronizar));
onUnmounted(() => window.removeEventListener('cart-changed', sincronizar));

async function cargar() {
  cargando.value = true;
  error.value = '';
  try {
    productos.value = await app.listarProductos();
  } catch (e) {
    error.value = errorMessage(e);
  } finally {
    cargando.value = false;
  }
}

async function pedir() {
  if (enviando.value) return;
  if (!app.currentSession()) {
    void router.push({ path: '/login', query: { redirect: '/tienda' } });
    return;
  }
  if (!app.esClienta()) {
    error.value = 'Solo las clientas hacen pedidos desde la app.';
    return;
  }
  enviando.value = true;
  error.value = '';
  exito.value = '';
  try {
    exito.value = await app.hacerPedido();
    await cargar();
  } catch (e) {
    error.value = errorMessage(e);
  } finally {
    enviando.value = false;
  }
}

onIonViewWillEnter(cargar);
</script>

<template>
  <IonPage>
    <IonHeader><IonToolbar><IonTitle>Tienda</IonTitle></IonToolbar></IonHeader>
    <IonContent>
      <main class="page-content">
        <p class="eyebrow">Productos del salón</p>
        <h1>Tienda</h1>
        <p v-if="error" class="error" role="alert">{{ error }}</p>
        <p v-if="exito" class="success" role="status">{{ exito }}</p>

        <section v-if="lineas.length" class="panel">
          <h2>Tu carrito</h2>
          <div v-for="l in lineas" :key="l.id_producto" class="lista-item" style="margin-bottom:10px;">
            <div>
              <h3>{{ l.producto!.nombre }}</h3>
              <p class="muted small" style="margin:0;">{{ pesos(l.producto!.precio) }} c/u</p>
            </div>
            <div class="cantidad">
              <button type="button" aria-label="Quitar uno" @click="app.cambiarCantidad(l.id_producto, -1, l.producto!.stock)">−</button>
              <b>{{ l.cantidad }}</b>
              <button type="button" aria-label="Agregar uno" @click="app.cambiarCantidad(l.id_producto, 1, l.producto!.stock)">+</button>
            </div>
          </div>
          <hr class="sep" />
          <div class="row between"><b>Total</b><b>{{ pesos(total) }}</b></div>
          <p class="muted small" style="margin-top:6px;">Pagas y recoges tu pedido en el salón. El precio y el stock los confirma el servidor.</p>
          <div class="row" style="margin-top:8px;">
            <button class="button primary" style="flex:1;" :disabled="enviando" @click="pedir">{{ enviando ? 'Enviando…' : app.currentSession() ? 'Hacer pedido' : 'Inicia sesión para pedir' }}</button>
            <button class="button secondary" @click="app.vaciarCarrito()">Vaciar</button>
          </div>
        </section>

        <p v-if="cargando" class="muted">Cargando productos…</p>
        <div class="card-grid">
          <article v-for="p in productos" :key="p.id_producto" class="panel" style="margin:0;">
            <img v-if="p.tiene_foto" class="foto" :src="app.imagen(`/api/productos/${p.id_producto}/foto`)" :alt="p.nombre" loading="lazy" />
            <div v-else class="foto sin-foto">🛍</div>
            <div class="row between">
              <h3>{{ p.nombre }}</h3>
              <span class="badge">{{ pesos(p.precio) }}</span>
            </div>
            <p :class="['small', p.stock > 0 ? 'muted' : '']" :style="p.stock > 0 ? '' : 'color:#f87171'">
              {{ p.stock > 0 ? `${p.stock} disponibles` : 'Agotado' }}
            </p>
            <button class="button primary full" :disabled="p.stock <= 0" @click="app.agregarAlCarrito(p)">Agregar al carrito</button>
          </article>
        </div>
      </main>
    </IonContent>
  </IonPage>
</template>
