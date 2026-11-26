<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { IonPage, IonContent, IonRefresher, IonRefresherContent, onIonViewWillEnter } from '@ionic/vue';
import { useApplication, errorMessage, pesos } from '../context';
import type { ServicioBella, EstilistaBella, ProductoBella, FotoVitrina } from '../../../domain/model/BellaModels';

const app = useApplication();
const router = useRouter();
const session = ref(app.currentSession());
const servicios = ref<ServicioBella[]>([]);
const estilistas = ref<EstilistaBella[]>([]);
const productos = ref<ProductoBella[]>([]);
const vitrina = ref<FotoVitrina[]>([]);
const cargando = ref(true);
const error = ref('');

const destacados = computed(() => servicios.value.slice(0, 9));

async function cargar() {
  session.value = app.currentSession();
  cargando.value = true;
  error.value = '';
  try {
    const [s, e, p, v] = await Promise.all([
      app.listarServicios(), app.listarEstilistas(), app.listarProductos(), app.listarVitrina(),
    ]);
    servicios.value = s;
    estilistas.value = e;
    productos.value = p;
    vitrina.value = v;
  } catch (err) {
    error.value = errorMessage(err);
  } finally {
    cargando.value = false;
  }
}

async function refrescar(ev: CustomEvent) {
  await cargar();
  (ev.target as HTMLIonRefresherElement).complete();
}

function sinFoto(ev: Event) {
  (ev.target as HTMLImageElement).src = '/logo.webp';
}

function irAgendar() {
  void router.push('/agendar');
}

onIonViewWillEnter(cargar);
</script>

<template>
  <IonPage>
    <IonContent>
      <IonRefresher slot="fixed" @ionRefresh="refrescar"><IonRefresherContent /></IonRefresher>

      <header class="encabezado">
        <div class="logo-mini"><img src="/logo.webp" alt="" /><b>Bella<span>Style</span></b></div>
        <RouterLink v-if="session" to="/mis-citas" class="chip-blanco">Mi panel</RouterLink>
        <RouterLink v-else to="/login" class="chip-blanco">Entrar</RouterLink>
      </header>

      <main class="page-content">
        <section class="hero">
          <p class="eyebrow">Salón de belleza · Cartagena de Indias</p>
          <p v-if="session" class="saludo">Hola, {{ session.nombre.split(' ')[0] }}</p>
          <h1 class="titulo-serif">Tu estilo, <em>a un clic</em> de distancia</h1>
          <img class="silueta" src="/silueta-oscuro.webp" alt="" />
          <p class="muted">Cortes, color, peinados, uñas y tratamientos con estilistas profesionales. Agenda en línea: eliges el servicio y la hora, y te asignamos la estilista que lo domina.</p>
          <div class="row" style="margin:14px 0;">
            <button class="button rosa-claro" @click="irAgendar">Agendar mi cita</button>
            <RouterLink to="/agendar" class="button secondary">Ver servicios y precios</RouterLink>
          </div>
          <ul class="datos-salon">
            <li><small>Horario</small><b>Lun a sáb 8:00–19:00 · Dom hasta 15:00</b></li>
            <li><small>Tu estilista</small><b>Asignada según el servicio</b></li>
            <li><small>Pago</small><b>En línea (QR Bre-B) o en el salón</b></li>
          </ul>
        </section>

        <p v-if="error" class="error" role="alert">{{ error }} <button class="button secondary full" style="margin-top:8px;" @click="cargar">Reintentar</button></p>
        <p v-if="cargando" class="muted">Cargando… (si el servidor estaba dormido puede tardar hasta un minuto)</p>

        <section v-if="servicios.length" class="bloque">
          <div class="row between">
            <div><p class="eyebrow">Nuestros servicios</p><h2 class="titulo-serif">Lo que hacemos por ti</h2></div>
            <RouterLink to="/agendar" class="enlace">Ver catálogo →</RouterLink>
          </div>
          <article v-for="s in destacados" :key="s.id_servicio" class="panel servicio">
            <div>
              <h3 class="titulo-serif">{{ s.nombre }}</h3>
              <p class="muted small" style="margin:0;">{{ s.duracion_min }} min <span :class="['publico', s.publico]">{{ s.publico }}</span></p>
            </div>
            <b class="precio">{{ pesos(s.precio) }}</b>
          </article>
        </section>

        <section class="bloque">
          <p class="eyebrow">Cómo funciona</p>
          <h2 class="titulo-serif">Tu cita en tres pasos</h2>
          <div class="pasos">
            <div class="panel"><p class="numero">01</p><h3>Crea tu cuenta</h3><p class="muted small">Con tu nombre, usuario y tu teléfono o correo.</p></div>
            <div class="panel"><p class="numero">02</p><h3>Elige servicio y hora</h3><p class="muted small">Solo verás las horas que de verdad están libres.</p></div>
            <div class="panel"><p class="numero">03</p><h3>Te asignamos estilista</h3><p class="muted small">La especialista disponible con menos citas ese día.</p></div>
          </div>
        </section>

        <section v-if="estilistas.length" class="bloque">
          <p class="eyebrow">Nuestro equipo</p>
          <h2 class="titulo-serif">Estilistas profesionales</h2>
          <article v-for="e in estilistas" :key="e.id_estilista" class="panel lista-item">
            <img class="foto-mini" :src="app.imagen(`/api/usuarios/${e.id_usuario}/foto`)" alt="" loading="lazy" @error="sinFoto" />
            <div>
              <h3>{{ e.nombres }} {{ e.apellidos }}</h3>
              <p class="muted small" style="margin:0;">{{ e.especialidad }}</p>
            </div>
            <span v-if="e.promedio" class="badge">★ {{ e.promedio }}</span>
          </article>
        </section>

        <section v-if="vitrina.length" class="bloque">
          <p class="eyebrow">Nuestro portafolio</p>
          <h2 class="titulo-serif">Trabajos del salón</h2>
          <div class="galeria">
            <figure v-for="f in vitrina.slice(0, 6)" :key="f.id_foto">
              <img :src="app.imagen(f.url)" :alt="f.descripcion || 'Trabajo del salón'" loading="lazy" />
              <figcaption v-if="f.descripcion">{{ f.descripcion }}</figcaption>
            </figure>
          </div>
        </section>

        <section v-if="productos.length" class="bloque">
          <div class="row between">
            <div><p class="eyebrow">Tienda</p><h2 class="titulo-serif">Productos recomendados</h2></div>
            <RouterLink to="/tienda" class="enlace">Ir a la tienda →</RouterLink>
          </div>
          <div class="productos">
            <RouterLink v-for="p in productos.slice(0, 4)" :key="p.id_producto" to="/tienda" class="panel producto">
              <img v-if="p.tiene_foto" class="foto" :src="app.imagen(`/api/productos/${p.id_producto}/foto`)" :alt="p.nombre" loading="lazy" />
              <div v-else class="foto sin-foto">🛍</div>
              <h3>{{ p.nombre }}</h3>
              <b class="precio">{{ pesos(p.precio) }}</b>
            </RouterLink>
          </div>
        </section>

        <section class="bloque panel">
          <p class="eyebrow">Visítanos</p>
          <h2 class="titulo-serif">BellaStyle · Cartagena de Indias</h2>
          <p class="muted">Lunes a sábado de 8:00 a. m. a 7:00 p. m. · Domingos de 8:00 a. m. a 3:00 p. m.</p>
          <button class="button rosa-claro full" @click="irAgendar">Agendar mi cita</button>
        </section>
      </main>
    </IonContent>
  </IonPage>
</template>
