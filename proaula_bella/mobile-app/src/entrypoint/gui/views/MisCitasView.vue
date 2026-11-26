<script setup lang="ts">
import { ref, computed } from 'vue';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonRefresher, IonRefresherContent, onIonViewWillEnter } from '@ionic/vue';
import { useApplication, errorMessage, pesos, fechaCorta } from '../context';
import type { CitaBella, PagoBella, PedidoBella, DatosCobroSalon } from '../../../domain/model/BellaModels';

const app = useApplication();
const esClienta = app.esClienta();
const pestana = ref<'citas' | 'pedidos'>('citas');
const citas = ref<CitaBella[]>([]);
const pagos = ref<PagoBella[]>([]);
const pedidos = ref<PedidoBella[]>([]);
const cobro = ref<DatosCobroSalon | null>(null);
const cargando = ref(false);
const error = ref('');
const exito = ref('');

// Formularios abiertos (uno a la vez)
const pagando = ref(0);
const comprobante = ref('');
const calificando = ref(0);
const estrellas = ref(5);
const comentario = ref('');
const ocupado = ref(false);

const pagoDe = (idCita: number) => pagos.value.find((p) => p.id_cita === idCita);
const ordenadas = computed(() => [...citas.value].sort((a, b) => (b.fecha + b.hora).localeCompare(a.fecha + a.hora)));

function claseEstado(estado: string) {
  if (estado === 'Confirmada' || estado === 'Finalizada' || estado === 'Pagado' || estado === 'Entregado' || estado === 'Listo para recoger') return 'ok';
  if (estado === 'Cancelada' || estado === 'Rechazado' || estado === 'Cancelado') return 'bad';
  return 'warn';
}

async function cargar() {
  cargando.value = true;
  error.value = '';
  try {
    if (esClienta) {
      const [c, p, pe, co] = await Promise.all([app.listarCitas(), app.listarPagos(), app.listarPedidos(), app.datosCobroSalon()]);
      citas.value = c; pagos.value = p; pedidos.value = pe; cobro.value = co;
    } else {
      citas.value = await app.listarCitas();
    }
  } catch (e) {
    error.value = errorMessage(e);
  } finally {
    cargando.value = false;
  }
}

async function refrescar(ev: CustomEvent) {
  await cargar();
  (ev.target as HTMLIonRefresherElement).complete();
}

async function ejecutar(accion: () => Promise<string>) {
  if (ocupado.value) return;
  ocupado.value = true;
  error.value = '';
  exito.value = '';
  try {
    exito.value = await accion();
    pagando.value = 0;
    calificando.value = 0;
    comprobante.value = '';
    comentario.value = '';
    await cargar();
  } catch (e) {
    error.value = errorMessage(e);
  } finally {
    ocupado.value = false;
  }
}

const pagarBreB = (c: CitaBella) => ejecutar(() => app.pagarCita(c.id, 'Bre-B', comprobante.value.trim()));
const pagarEnSalon = (c: CitaBella) => ejecutar(() => app.pagarCita(c.id, 'Efectivo / Salón'));
const cancelar = (c: CitaBella) => ejecutar(() => app.cancelarCita(c.id));
const calificar = (c: CitaBella) => ejecutar(() => app.calificarCita(c.id, estrellas.value, comentario.value.trim()));

onIonViewWillEnter(cargar);
</script>

<template>
  <IonPage>
    <IonHeader><IonToolbar><IonTitle>{{ esClienta ? 'Mis citas y pedidos' : 'Mi agenda' }}</IonTitle></IonToolbar></IonHeader>
    <IonContent>
      <IonRefresher slot="fixed" @ionRefresh="refrescar"><IonRefresherContent /></IonRefresher>
      <main class="page-content">
        <div v-if="esClienta" class="segment">
          <button :class="{ active: pestana === 'citas' }" @click="pestana = 'citas'">Citas</button>
          <button :class="{ active: pestana === 'pedidos' }" @click="pestana = 'pedidos'">Pedidos de la tienda</button>
        </div>

        <p v-if="error" class="error" role="alert">{{ error }}</p>
        <p v-if="exito" class="success" role="status">{{ exito }}</p>
        <p v-if="cargando" class="muted">Cargando…</p>

        <template v-if="pestana === 'citas'">
          <p v-if="!cargando && citas.length === 0" class="muted">Aún no hay citas.</p>
          <article v-for="c in ordenadas" :key="c.id" class="panel">
            <div class="row between">
              <h3>{{ c.servicio }}</h3>
              <span :class="['badge', claseEstado(c.estado)]">{{ c.estado }}</span>
            </div>
            <p class="muted">{{ fechaCorta(c.fecha) }} · {{ c.hora }} · {{ esClienta ? c.estilista : c.cliente }}</p>
            <div class="row between">
              <b>{{ pesos(c.precio) }}</b>
              <span v-if="esClienta && pagoDe(c.id)" :class="['badge', claseEstado(pagoDe(c.id)!.estado)]">
                Pago: {{ pagoDe(c.id)!.estado }}
              </span>
              <span v-else-if="esClienta && c.estado !== 'Cancelada'" class="badge gris">Sin pagar</span>
            </div>
            <p v-if="c.calificacion" class="small" style="margin:6px 0 0;">Tu calificación: {{ '★'.repeat(c.calificacion) }}</p>

            <!-- Acciones de la clienta -->
            <div v-if="esClienta" class="row" style="margin-top:10px;">
              <button v-if="!pagoDe(c.id) && c.estado !== 'Cancelada'" class="button primary" @click="pagando = pagando === c.id ? 0 : c.id; calificando = 0">Pagar</button>
              <button v-if="c.estado === 'Finalizada' && !c.calificacion" class="button primary" @click="calificando = calificando === c.id ? 0 : c.id; pagando = 0">Calificar</button>
              <button v-if="c.estado === 'Pendiente' || c.estado === 'Confirmada'" class="button secondary" :disabled="ocupado" @click="cancelar(c)">Cancelar cita</button>
            </div>

            <!-- Pago: QR Bre-B del salón o pago en el salón -->
            <div v-if="pagando === c.id" style="margin-top:12px;">
              <hr class="sep" />
              <p class="eyebrow">Pagar con Bre-B</p>
              <template v-if="cobro && (cobro.tieneQr || cobro.llave)">
                <img v-if="cobro.qr" class="qr" :src="app.imagen(cobro.qr)" alt="QR Bre-B del salón" />
                <p class="muted small" style="text-align:center;">
                  Escanéalo desde la app de tu banco.<br />
                  <span v-if="cobro.llave">Llave: <b>{{ cobro.llave }}</b></span>
                  <span v-if="cobro.titular"> · {{ cobro.titular }}</span>
                </p>
                <div class="campo" style="margin-top:8px;">
                  <label :for="`comp${c.id}`">Número del comprobante</label>
                  <input :id="`comp${c.id}`" v-model="comprobante" maxlength="40" placeholder="Ej.: M123456" />
                </div>
                <button class="button primary full" style="margin-top:8px;" :disabled="ocupado || comprobante.trim().length < 4" @click="pagarBreB(c)">
                  Enviar comprobante
                </button>
                <p class="muted small" style="margin-top:6px;">El pago queda “Por verificar” hasta que el salón confirme la transferencia.</p>
              </template>
              <p v-else class="muted small">El salón aún no configuró su QR. Puedes pagar en el salón.</p>
              <button class="button secondary full" style="margin-top:8px;" :disabled="ocupado" @click="pagarEnSalon(c)">Pagaré en el salón</button>
            </div>

            <!-- Calificación -->
            <div v-if="calificando === c.id" style="margin-top:12px;">
              <hr class="sep" />
              <p class="eyebrow">¿Cómo te fue?</p>
              <div class="estrellas" role="radiogroup" aria-label="Estrellas">
                <button v-for="n in 5" :key="n" type="button" :class="['estrella', { on: n <= estrellas }]" :aria-label="`${n} estrellas`" @click="estrellas = n">★</button>
              </div>
              <div class="campo" style="margin-top:8px;">
                <label :for="`com${c.id}`">Comentario (opcional)</label>
                <input :id="`com${c.id}`" v-model="comentario" maxlength="300" />
              </div>
              <button class="button primary full" style="margin-top:8px;" :disabled="ocupado" @click="calificar(c)">Enviar calificación</button>
            </div>
          </article>
        </template>

        <template v-else>
          <p v-if="!cargando && pedidos.length === 0" class="muted">Aún no tienes pedidos.</p>
          <article v-for="p in pedidos" :key="p.id_pedido" class="panel">
            <div class="row between">
              <h3>Pedido #{{ p.id_pedido }}</h3>
              <span :class="['badge', claseEstado(p.estado)]">{{ p.estado }}</span>
            </div>
            <p class="muted">{{ p.detalle }}</p>
            <div class="row between"><span class="muted small">{{ p.fecha }}</span><b>{{ pesos(p.total) }}</b></div>
          </article>
        </template>
      </main>
    </IonContent>
  </IonPage>
</template>
