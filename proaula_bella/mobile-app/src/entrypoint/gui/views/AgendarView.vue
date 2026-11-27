<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, onIonViewWillEnter } from '@ionic/vue';
import { useApplication, errorMessage, pesos, hoyColombia } from '../context';
import type { ServicioBella, EstilistaBella, FotoServicio } from '../../../domain/model/BellaModels';
import CarruselFotos from '../componentes/CarruselFotos.vue';

const app = useApplication();
const router = useRouter();
const servicios = ref<ServicioBella[]>([]);
const estilistas = ref<EstilistaBella[]>([]);
const fotos = ref<FotoServicio[]>([]);
const filtro = ref<'Todos' | 'Mujer' | 'Hombre'>('Todos');

const idServicio = ref(0);
const idEstilista = ref(0);
const fecha = ref(hoyColombia());
const horas = ref<string[]>([]);
const hora = ref('');
const observaciones = ref('');

const cargando = ref(false);
const buscandoHoras = ref(false);
const guardando = ref(false);
const error = ref('');
const exito = ref('');

const serviciosFiltrados = computed(() =>
  servicios.value.filter((s) => filtro.value === 'Todos' || s.publico === filtro.value || s.publico === 'Unisex'));
const servicio = computed(() => servicios.value.find((s) => s.id_servicio === idServicio.value));

const estilistasDelServicio = computed(() =>
  estilistas.value.filter((e) => String(e.ids_servicios || '').split(',').map(Number).includes(idServicio.value)));

function fotosDe(id: number): string[] {
  return fotos.value.filter((x) => x.id_servicio === id).map((f) => app.imagen(f.url));
}

async function cargar() {
  cargando.value = true;
  error.value = '';
  try {
    const [s, e, f] = await Promise.all([app.listarServicios(), app.listarEstilistas(), app.listarFotosServicios()]);
    servicios.value = s;
    estilistas.value = e;
    fotos.value = f;
  } catch (err) {
    error.value = errorMessage(err);
  } finally {
    cargando.value = false;
  }
}

async function buscarHoras() {
  hora.value = '';
  horas.value = [];
  if (!idServicio.value || !fecha.value) return;
  buscandoHoras.value = true;
  error.value = '';
  try {
    horas.value = await app.horasLibres(idServicio.value, fecha.value, idEstilista.value || undefined);
  } catch (err) {
    error.value = errorMessage(err);
  } finally {
    buscandoHoras.value = false;
  }
}

function elegir(s: ServicioBella) {
  idServicio.value = s.id_servicio;
  idEstilista.value = 0;
  exito.value = '';
  setTimeout(() => document.getElementById('formulario')?.scrollIntoView({ behavior: 'smooth' }), 50);
}

watch([idServicio, idEstilista, fecha], buscarHoras);

async function agendar() {
  if (!hora.value || guardando.value) return;
  if (!app.currentSession()) {
    void router.push({ path: '/login', query: { redirect: '/agendar' } });
    return;
  }
  if (!app.esClienta()) {
    error.value = 'Solo las clientas agendan citas desde la app.';
    return;
  }
  guardando.value = true;
  error.value = '';
  try {
    exito.value = await app.crearCita({
      idServicio: idServicio.value,
      fecha: fecha.value,
      hora: hora.value,
      idEstilista: idEstilista.value || undefined,
      observaciones: observaciones.value.trim() || undefined,
    });
    observaciones.value = '';
    idServicio.value = 0;
  } catch (err) {
    error.value = errorMessage(err);
    await buscarHoras();
  } finally {
    guardando.value = false;
  }
}

onIonViewWillEnter(cargar);
</script>

<template>
  <IonPage>
    <IonHeader><IonToolbar><IonTitle>Agendar cita</IonTitle></IonToolbar></IonHeader>
    <IonContent>
      <main class="page-content">
        <p class="eyebrow">Paso 1 · Elige el servicio</p>
        <h1>Servicios</h1>

        <p v-if="error" class="error" role="alert">{{ error }}</p>
        <div v-if="exito" class="success" role="status">
          {{ exito }}
          <button class="button primary full" style="margin-top:10px;" @click="router.push('/mis-citas')">Ir a Mis citas para pagar</button>
        </div>

        <div class="segment" style="grid-template-columns:repeat(3,1fr);">
          <button v-for="f in ['Todos', 'Mujer', 'Hombre']" :key="f" :class="{ active: filtro === f }" @click="filtro = f as typeof filtro">{{ f }}</button>
        </div>
        <p v-if="cargando" class="muted">Cargando servicios… (si el servidor estaba dormido puede tardar hasta un minuto)</p>

        <div class="card-grid">
          <article v-for="s in serviciosFiltrados" :key="s.id_servicio" class="panel" style="margin:0;">
            <CarruselFotos v-if="fotosDe(s.id_servicio).length" :fotos="fotosDe(s.id_servicio)" :nombre="s.nombre" />
            <div v-else class="foto sin-foto">✂</div>
            <div class="row between">
              <h3>{{ s.nombre }}</h3>
              <span class="badge">{{ pesos(s.precio) }}</span>
            </div>
            <p class="muted small">{{ s.duracion_min }} min · {{ s.publico }}</p>
            <button :class="['button', 'full', idServicio === s.id_servicio ? 'primary' : 'secondary']" @click="elegir(s)">
              {{ idServicio === s.id_servicio ? 'Elegido' : 'Elegir' }}
            </button>
          </article>
        </div>

        <section v-if="servicio" id="formulario" class="panel" style="margin-top:16px;">
          <p class="eyebrow">Paso 2 · Estilista, día y hora</p>
          <h2>{{ servicio.nombre }} · {{ pesos(servicio.precio) }}</h2>
          <form class="form" @submit.prevent="agendar">
            <div class="campo">
              <label for="estilista">Estilista</label>
              <select id="estilista" v-model.number="idEstilista">
                <option :value="0">Cualquiera disponible</option>
                <option v-for="e in estilistasDelServicio" :key="e.id_estilista" :value="e.id_estilista">
                  {{ e.nombres }} {{ e.apellidos }}{{ e.promedio ? ` · ★ ${e.promedio}` : '' }}
                </option>
              </select>
            </div>
            <div class="campo">
              <label for="fecha">Fecha</label>
              <input id="fecha" v-model="fecha" type="date" :min="hoyColombia()" required />
            </div>
            <div class="campo">
              <label>Horas libres</label>
              <p v-if="buscandoHoras" class="muted small">Buscando horas libres…</p>
              <p v-else-if="horas.length === 0" class="muted small">No hay horas libres ese día. Prueba otra fecha u otra estilista.</p>
              <div v-else class="horas">
                <button v-for="h in horas" :key="h" type="button" :class="['hora', { activa: hora === h }]" @click="hora = h">{{ h }}</button>
              </div>
            </div>
            <div class="campo">
              <label for="obs">Observaciones (opcional)</label>
              <input id="obs" v-model="observaciones" maxlength="200" placeholder="Ej.: corte en capas" />
            </div>
            <p class="muted small">Atendemos lunes a sábado de 8:00 a.m. a 7:00 p.m. y domingos de 8:00 a.m. a 3:00 p.m.</p>
            <button class="button primary full" :disabled="!hora || guardando">
              {{ guardando ? 'Agendando…' : !hora ? 'Elige una hora' : app.currentSession() ? `Confirmar cita a las ${hora}` : 'Inicia sesión para confirmar' }}
            </button>
          </form>
        </section>
      </main>
    </IonContent>
  </IonPage>
</template>
