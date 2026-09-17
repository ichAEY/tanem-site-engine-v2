import { z } from "zod";

const nonEmpty = z.string().trim().min(1);
const optionalUrl = z.string().url().optional();
const localAssetPath = nonEmpty.refine(
  (value) => value.startsWith("assets/") && !value.includes("../") && /\.(?:avif|svg|webp)$/i.test(value),
  "Используйте файл из assets/ в формате WebP, AVIF или SVG",
);

const assetSchema = z.object({
  src: localAssetPath,
  alt: z.string().trim(),
});

const priceSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("fixed"), value: nonEmpty }),
  z.object({ type: z.literal("from"), value: nonEmpty }),
  z.object({ type: z.literal("text"), value: nonEmpty }),
  z.object({
    type: z.literal("variants"),
    variants: z.array(z.object({
      label: nonEmpty,
      value: nonEmpty,
      duration: z.string().trim().optional(),
    })).min(1),
  }),
]);

const serviceSchema = z.object({
  name: nonEmpty,
  description: z.string().trim().optional(),
  duration: z.string().trim().optional(),
  price: priceSchema,
  bookingUrl: optionalUrl,
});

const categorySchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  label: nonEmpty,
  services: z.array(serviceSchema).min(1),
});

const contactSchema = z.object({
  type: z.enum(["phone", "booking", "whatsapp", "telegram", "vk", "max", "map", "custom"]),
  label: nonEmpty,
  value: z.string().trim().optional(),
  url: z.string().url(),
  primary: z.boolean().optional(),
});

const dayHoursSchema = z.object({
  day: z.number().int().min(0).max(6),
  open: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  close: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  closed: z.boolean().optional(),
});

export const siteSchema = z.object({
  $schema: z.string().url().optional(),
  version: z.literal(2),
  layout: z.literal("master"),
  specialty: z.enum(["nails", "hair", "brows", "lashes", "cosmetology", "universal"]),
  brand: z.object({
    name: nonEmpty,
    subtitle: z.string().trim().optional(),
    monogram: nonEmpty,
    logo: assetSchema.optional(),
    favicon: assetSchema.optional(),
  }),
  master: z.object({
    name: nonEmpty,
    profession: nonEmpty,
    locationLabel: nonEmpty,
    heroTitle: nonEmpty,
    heroAccent: nonEmpty,
    heroCopy: nonEmpty,
    experience: nonEmpty,
    experienceLabel: nonEmpty.default("лет опыта"),
    aboutTitle: nonEmpty,
    aboutLead: nonEmpty,
    aboutParagraphs: z.array(nonEmpty).min(1),
    skills: z.array(nonEmpty).default([]),
  }),
  location: z.object({
    city: nonEmpty,
    address: nonEmpty,
    mapCardAddress: nonEmpty,
    scheduleLabel: nonEmpty,
    timezone: nonEmpty.default("Europe/Moscow"),
    weeklyHours: z.array(dayHoursSchema).max(7).default([]),
    mapEmbedUrl: optionalUrl,
  }),
  contacts: z.array(contactSchema).min(1),
  bookingUrl: optionalUrl,
  reputation: z.object({
    rating: nonEmpty,
    reviewCount: nonEmpty,
    reviewsUrl: optionalUrl,
  }).optional(),
  hero: z.object({
    portrait: assetSchema,
    aboutPhoto: assetSchema.optional(),
    mobileVisual: assetSchema.optional(),
    thirdStat: z.enum(["reviews", "services"]).default("services"),
  }),
  portfolio: z.object({
    title: nonEmpty.default("Работы"),
    lead: z.string().trim().optional(),
    gallery: z.array(assetSchema).min(1),
    beforeAfter: z.array(z.object({
      before: assetSchema,
      after: assetSchema,
    })).default([]),
  }),
  services: z.object({
    intro: nonEmpty,
    categories: z.array(categorySchema).min(1),
  }),
  promotions: z.array(z.object({
    title: nonEmpty,
    highlight: z.string().trim().optional(),
    description: nonEmpty,
    period: z.string().trim().optional(),
    image: assetSchema.optional(),
    url: optionalUrl,
  })).default([]),
  reviews: z.array(z.object({
    author: nonEmpty,
    text: nonEmpty,
  })).default([]),
  amenities: z.array(z.object({
    title: nonEmpty,
    text: nonEmpty,
  })).default([]),
  seo: z.object({
    title: nonEmpty,
    description: nonEmpty,
    keywords: z.array(nonEmpty).default([]),
    locale: nonEmpty.default("ru_RU"),
  }),
  analytics: z.object({
    yandexMetrikaId: z.string().regex(/^\d+$/).optional(),
  }).default({}),
  deployment: z.object({
    customDomain: z.string().trim().regex(
      /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i,
      "Укажите домен без https:// и без пути",
    ).optional(),
  }).default({}),
});

export function validateSite(input) {
  const site = siteSchema.parse(input);

  const categoryIds = new Set();
  for (const category of site.services.categories) {
    if (categoryIds.has(category.id)) {
      throw new Error(`Повторяется id категории: ${category.id}`);
    }
    categoryIds.add(category.id);
  }

  const primaryContacts = site.contacts.filter((contact) => contact.primary);
  if (primaryContacts.length > 1) {
    throw new Error("Основным может быть только один контакт");
  }

  const scheduleDays = new Set();
  for (const hours of site.location.weeklyHours) {
    if (scheduleDays.has(hours.day)) throw new Error(`День ${hours.day} повторяется в расписании`);
    scheduleDays.add(hours.day);
    if (!hours.closed && (!hours.open || !hours.close)) {
      throw new Error(`Для дня ${hours.day} укажите open и close либо closed: true`);
    }
  }

  return site;
}
