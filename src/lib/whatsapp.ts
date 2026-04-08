const DEFAULT_MESSAGE =
  "¡Hola KarúBox! Vi la página y quiero ver una demo para mi negocio. Mi nombre es [Nombre] y mi local se llama [Nombre del Local]";

/** Número en formato internacional sin + (ej. 595981234567). Configurar NEXT_PUBLIC_WHATSAPP_NUMBER en .env.local */
export function getWhatsAppHref(): string {
  const raw = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "595982906021";
  const n = raw.replace(/\D/g, "");
  const text = encodeURIComponent(DEFAULT_MESSAGE);
  return `https://wa.me/${n}?text=${text}`;
}
