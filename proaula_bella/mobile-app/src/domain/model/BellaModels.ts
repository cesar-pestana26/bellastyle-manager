export type BellaRole = 'Clienta' | 'Estilista' | 'Administradora';
export type PortalRol = 'cliente' | 'estilista' | 'admin';

export interface BellaSession {
  id: number;
  nombre: string;
  username: string;
  rol: BellaRole;
  foto?: string;
  token: string;
}

export interface ServicioBella {
  id_servicio: number;
  nombre: string;
  precio: number | string;
  duracion_min: number;
  publico: 'Mujer' | 'Hombre' | 'Unisex';
  estado: string;
}

export interface FotoServicio {
  id_foto: number;
  id_servicio: number;
  url: string;
}

export interface EstilistaBella {
  id_estilista: number;
  id_usuario: number;
  nombres: string;
  apellidos: string;
  especialidad: string;
  estado: string;
  servicios?: string;
  ids_servicios?: string;
  promedio?: string | null;
}

export interface ProductoBella {
  id_producto: number;
  nombre: string;
  precio: number | string;
  stock: number;
  estado: string;
  tiene_foto: number;
}

export type EstadoCita = 'Pendiente' | 'Confirmada' | 'Finalizada' | 'Cancelada';

export interface CitaBella {
  id: number;
  id_estilista: number;
  id_usuario: number;
  id_servicio: number;
  cliente: string;
  estilista: string;
  servicio: string;
  precio: number | string;
  fecha: string;
  hora: string;
  estado: EstadoCita;
  observaciones?: string | null;
  calificacion?: number | null;
}

export interface PagoBella {
  id_pago: number;
  id_cita: number;
  referencia: string;
  metodo: 'Bre-B' | 'Efectivo / Salón' | string;
  monto: number | string;
  estado: 'Pagado' | 'Por verificar' | 'Pendiente en Salón' | 'Rechazado' | 'Reembolsado';
  comprobante?: string | null;
}

export interface DatosCobroSalon {
  llave: string | null;
  titular: string | null;
  tieneQr: boolean;
  qr: string | null;
}

export interface PedidoBella {
  id_pedido: number;
  total: number | string;
  estado: 'Pendiente' | 'Listo para recoger' | 'Entregado' | 'Cancelado';
  fecha: string;
  detalle: string;
  unidades: number;
}

export interface FotoVitrina {
  id_foto: number;
  autor?: string;
  url: string;
  descripcion?: string | null;
}

export interface ItemCarritoBella {
  id_producto: number;
  cantidad: number;
}
