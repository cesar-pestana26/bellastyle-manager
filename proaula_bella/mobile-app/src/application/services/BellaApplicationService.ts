import type {
  BellaSession, PortalRol, ServicioBella, FotoServicio, EstilistaBella, ProductoBella,
  CitaBella, PagoBella, DatosCobroSalon, PedidoBella, ItemCarritoBella, FotoVitrina,
} from '../../domain/model/BellaModels';
import type { SessionStore } from '../../domain/ports/out/SessionStore';
import { DomainError } from '../../domain/exceptions/errors';
import { HttpClient } from '../../adapters/http/HttpClient';

interface Respuesta<T> {
  success: boolean;
  message?: string;
  data: T;
}

// Servicio de aplicación: los casos de uso de BellaStyle Mobile.
// Usa las MISMAS rutas de la API que la página web (backend Node.js + Express + MySQL).
export class BellaApplicationService {
  constructor(
    private readonly http: HttpClient,
    private readonly sessions: SessionStore,
    private readonly origen: string   // '' en el navegador, 'https://bellastyle.onrender.com' en el celular
  ) {}

  apiBaseUrl(): string {
    return this.http.getBaseUrl();
  }

  // Las fotos vienen como rutas relativas (/api/fotos/3); en el celular se completan con el servidor
  imagen(ruta: string): string {
    return `${this.origen}${ruta}`;
  }

  currentSession(): BellaSession | null {
    return this.sessions.get();
  }

  esClienta(): boolean {
    return this.currentSession()?.rol === 'Clienta';
  }

  logout(): void {
    this.sessions.clear();
  }

  // ---------- Cuenta ----------
  // POST /api/login -> { token, user }
  async login(params: { username: string; password: string; rol: PortalRol }): Promise<BellaSession> {
    const res = await this.http.request<{ token: string; user: Omit<BellaSession, 'token'>; message?: string }>(
      '/login', 'POST', params, false);
    if (!res.token || !res.user) throw new DomainError(res.message || 'No se pudo iniciar sesión.');
    const sesion: BellaSession = { ...res.user, token: res.token };
    this.sessions.save(sesion);
    return sesion;
  }

  // POST /api/register (solo clientas desde la app)
  async registrarClienta(params: { nombre: string; username: string; password: string; telefono: string; email: string }): Promise<string> {
    const res = await this.http.request<Respuesta<never>>('/register', 'POST', { ...params, rol: 'cliente' }, false);
    return res.message || 'Cuenta creada.';
  }

  // PUT /api/mi-cuenta/password
  async cambiarPassword(actual: string, nueva: string): Promise<string> {
    const res = await this.http.request<Respuesta<never>>('/mi-cuenta/password', 'PUT', { actual, nueva });
    return res.message || 'Contraseña actualizada.';
  }

  // ---------- Catálogo (público) ----------
  async listarServicios(): Promise<ServicioBella[]> {
    return (await this.http.request<Respuesta<ServicioBella[]>>('/servicios', 'GET', undefined, false)).data || [];
  }

  async listarFotosServicios(): Promise<FotoServicio[]> {
    return (await this.http.request<Respuesta<FotoServicio[]>>('/fotos-servicios', 'GET', undefined, false)).data || [];
  }

  async listarEstilistas(): Promise<EstilistaBella[]> {
    return (await this.http.request<Respuesta<EstilistaBella[]>>('/estilistas', 'GET', undefined, false)).data || [];
  }

  async listarProductos(): Promise<ProductoBella[]> {
    return (await this.http.request<Respuesta<ProductoBella[]>>('/productos', 'GET', undefined, false)).data || [];
  }

  // GET /api/vitrina: fotos de trabajos reales del salón
  async listarVitrina(): Promise<FotoVitrina[]> {
    return (await this.http.request<Respuesta<FotoVitrina[]>>('/vitrina', 'GET', undefined, false)).data || [];
  }

  // ---------- Agenda ----------
  // GET /api/disponibilidad: horas libres reales (cada 30 min) según estilistas, citas y horario del salón
  async horasLibres(idServicio: number, fecha: string, idEstilista?: number): Promise<string[]> {
    const q = new URLSearchParams({ idServicio: String(idServicio), fecha });
    if (idEstilista) q.set('idEstilista', String(idEstilista));
    const sesion = this.currentSession();
    if (sesion) q.set('idUsuario', String(sesion.id));
    const res = await this.http.request<Respuesta<{ horas: string[] }>>(`/disponibilidad?${q}`, 'GET', undefined, false);
    return res.data?.horas || [];
  }

  // POST /api/citas (idEstilista vacío = "Cualquiera disponible")
  async crearCita(params: { idServicio: number; fecha: string; hora: string; idEstilista?: number; observaciones?: string }): Promise<string> {
    const sesion = this.currentSession();
    if (!sesion) throw new DomainError('Inicia sesión para agendar tu cita.');
    const res = await this.http.request<Respuesta<never>>('/citas', 'POST', { idUsuario: sesion.id, ...params });
    return res.message || 'Cita agendada.';
  }

  // GET /api/citas: el servidor filtra por el token (cada quien ve solo las suyas)
  async listarCitas(): Promise<CitaBella[]> {
    return (await this.http.request<Respuesta<CitaBella[]>>('/citas')).data || [];
  }

  async cancelarCita(idCita: number): Promise<string> {
    const res = await this.http.request<Respuesta<never>>(`/citas/${idCita}/estado`, 'PUT', { estado: 'Cancelada' });
    return res.message || 'Cita cancelada.';
  }

  // POST /api/citas/:id/calificacion
  async calificarCita(idCita: number, estrellas: number, comentario: string): Promise<string> {
    const res = await this.http.request<Respuesta<never>>(`/citas/${idCita}/calificacion`, 'POST', { estrellas, comentario });
    return res.message || '¡Gracias por tu calificación!';
  }

  // ---------- Pagos (Bre-B con QR o en el salón) ----------
  async listarPagos(): Promise<PagoBella[]> {
    return (await this.http.request<Respuesta<PagoBella[]>>('/pagos')).data || [];
  }

  async datosCobroSalon(): Promise<DatosCobroSalon | null> {
    return (await this.http.request<Respuesta<DatosCobroSalon | null>>('/pago-salon', 'GET', undefined, false)).data;
  }

  // POST /api/pagos: el monto lo toma el servidor de la cita (nunca lo envía la app)
  async pagarCita(idCita: number, metodo: 'Bre-B' | 'Efectivo / Salón', comprobante?: string): Promise<string> {
    const res = await this.http.request<Respuesta<PagoBella>>('/pagos', 'POST', { idCita, metodo, comprobante });
    return res.message || 'Pago registrado.';
  }

  // ---------- Tienda ----------
  obtenerCarrito(): ItemCarritoBella[] {
    return this.sessions.getCart();
  }

  private guardarCarrito(items: ItemCarritoBella[]): void {
    this.sessions.saveCart(items);
    window.dispatchEvent(new Event('cart-changed'));
  }

  agregarAlCarrito(producto: ProductoBella): void {
    const carrito = this.obtenerCarrito();
    const item = carrito.find((it) => it.id_producto === producto.id_producto);
    if (item) {
      if (item.cantidad < Math.min(producto.stock, 20)) item.cantidad += 1;
    } else if (producto.stock > 0) {
      carrito.push({ id_producto: producto.id_producto, cantidad: 1 });
    }
    this.guardarCarrito(carrito);
  }

  cambiarCantidad(idProducto: number, delta: number, stock: number): void {
    let carrito = this.obtenerCarrito();
    const item = carrito.find((it) => it.id_producto === idProducto);
    if (!item) return;
    const nueva = item.cantidad + delta;
    if (nueva <= 0) carrito = carrito.filter((it) => it.id_producto !== idProducto);
    else if (nueva <= Math.min(stock, 20)) item.cantidad = nueva;
    this.guardarCarrito(carrito);
  }

  vaciarCarrito(): void {
    this.guardarCarrito([]);
  }

  // POST /api/pedidos: el servidor relee precios y stock en una transacción
  async hacerPedido(): Promise<string> {
    const items = this.obtenerCarrito();
    if (items.length === 0) throw new DomainError('Tu carrito está vacío.');
    const res = await this.http.request<Respuesta<{ id: number; total: number }>>('/pedidos', 'POST', {
      items: items.map((it) => ({ id: it.id_producto, cantidad: it.cantidad })),
    });
    this.vaciarCarrito();
    return res.message || 'Pedido recibido.';
  }

  async listarPedidos(): Promise<PedidoBella[]> {
    return (await this.http.request<Respuesta<PedidoBella[]>>('/pedidos')).data || [];
  }
}
