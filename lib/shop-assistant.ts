export type ChatMessage = { role: "user" | "assistant"; content: string };

export type ChatRequest = {
  message: string;
  history?: ChatMessage[];
  productId?: number;
};

export type ChatProduct = {
  id: number;
  name: string;
  price: number;
  stock: number;
  colors: string[];
  types: string[];
  image: string | null;
  href: string;
};

export type ChatReply = {
  reply: string;
  products: ChatProduct[];
  actions: { label: string; href: string }[];
  suggestions: string[];
};

export type CatalogProduct = Omit<ChatProduct, "image" | "href"> & {
  description: string;
  images: string[];
};

type Budget = { min?: number; max?: number; strictMin?: boolean; strictMax?: boolean };
type Search = { terms: string[]; colors: string[]; budget: Budget; cheapest: boolean };

export const MAX_MESSAGE_LENGTH = 600;
const support = { label: "Email support", href: "mailto:randompicksng@gmail.com" };
const browse = { label: "Browse products", href: "/#products" };
const tracking = { label: "Track my order", href: "/track-order" };
const suggestions = ["Show me your products", "Find something under ₦25,000", "How do I track my order?"];

function answer(reply: string, actions = [browse, support]): ChatReply {
  return { reply, products: [], actions, suggestions };
}

export function validateChatRequest(value: unknown):
  | { success: true; data: ChatRequest }
  | { success: false; error: string } {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { success: false, error: "Please send a message." };
  }
  const input = value as Record<string, unknown>;
  if (typeof input.message !== "string" || !input.message.trim() || input.message.length > MAX_MESSAGE_LENGTH) {
    return { success: false, error: `Please enter a message of 1–${MAX_MESSAGE_LENGTH} characters.` };
  }
  if (input.history !== undefined && (!Array.isArray(input.history) || input.history.length > 8)) {
    return { success: false, error: "Please send no more than 8 recent messages." };
  }
  const history: ChatMessage[] = [];
  for (const item of (input.history ?? []) as unknown[]) {
    if (!item || typeof item !== "object") return { success: false, error: "Invalid conversation history." };
    const entry = item as Record<string, unknown>;
    if ((entry.role !== "user" && entry.role !== "assistant") || typeof entry.content !== "string" ||
      entry.content.length > (entry.role === "user" ? MAX_MESSAGE_LENGTH : 3000)) {
      return { success: false, error: "Invalid conversation history." };
    }
    history.push({ role: entry.role, content: entry.content.trim() });
  }
  if (input.productId !== undefined && (typeof input.productId !== "number" || !Number.isSafeInteger(input.productId) || input.productId < 1)) {
    return { success: false, error: "Invalid product." };
  }
  return { success: true, data: { message: input.message.trim(), history, productId: input.productId as number | undefined } };
}

function strings(value: unknown, length = 200): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string")
    .map((item) => item.trim().slice(0, length)).filter(Boolean).slice(0, 20) : [];
}

function safeImage(value: string): boolean {
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try { return ["https:", "http:"].includes(new URL(value).protocol); } catch { return false; }
}

export function normalizeCatalog(value: unknown): CatalogProduct[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((row: unknown): CatalogProduct[] => {
    if (!row || typeof row !== "object") return [];
    const item = row as Record<string, unknown>;
    const id = Number(item.id);
    const price = Number(item.price);
    const stock = Number(item.stock);
    if (!Number.isSafeInteger(id) || id < 1 || typeof item.name !== "string" || !item.name.trim() ||
      item.price === null || item.price === "" || !Number.isFinite(price) || price < 0) return [];
    return [{ id, name: item.name.trim().slice(0, 200), price,
      stock: Number.isFinite(stock) ? Math.max(0, Math.floor(stock)) : 0,
      description: typeof item.description === "string" ? item.description.trim().slice(0, 1500) : "",
      types: strings(item.types), colors: strings(item.colors),
      images: strings(item.images, 2000).filter(safeImage) }];
  });
}

export function getStoreReply(message: string): ChatReply | null {
  const text = message.toLowerCase();
  if (/\b(track(?:ing)?|order status|my order|my package|order number)\b/.test(text)) {
    return answer("Use the tracking page to check your order with your order number and the phone number used at checkout. Enter those details on that page.", [tracking, support]);
  }
  if (/\b(refunds?|returns?|exchange|warranty|guarantee|delivery|deliver|shipping|pickup|pick up|payments?|cash on delivery|discount|coupons?)\b/.test(text)) {
    return answer("I don’t have confirmed delivery, payment, return or warranty policies to quote. Please email Random Picks NG for the details before ordering.", [support, browse]);
  }
  if (/\b(contact|support|human|email|customer service|speak to|talk to)\b/.test(text)) {
    return answer("You can reach Random Picks NG at randompicksng@gmail.com. Include the product name or order number so the team can help.", [support, tracking]);
  }
  if (/\bhow (?:do|can|to) (?:i )?(?:place an? |make an? )?(?:order|buy|purchase)\b/.test(text)) {
    return answer("Open a product to see its details. If it is available, choose Order Now and complete the order form. You can check an existing order on the tracking page.", [browse, tracking]);
  }
  if (/^(?:hi|hey|hello|help|thanks|thank you|good morning|good afternoon|good evening)[!?.\s]*$/i.test(text) || /what can you do/.test(text)) {
    return answer("Hi! I’m your Random Picks NG shopping assistant. Tell me what you’re looking for and your budget in naira. I can help with product details and point you to order tracking.", [browse, tracking]);
  }
  return null;
}

export function catalogUnavailableReply(): ChatReply {
  return answer("I can’t check the product catalog right now. You can browse the store or email Random Picks NG for help with a product.", [browse, support, tracking]);
}

const money = "(?:(?:₦|ngn|n)\\s*)?\\d[\\d,]*(?:\\.\\d+)?\\s*(?:thousand|million|k|m)?(?:\\s*(?:naira|ngn))?";
function amount(text: string): number {
  const number = Number(text.replace(/,/g, "").match(/\d+(?:\.\d+)?/)?.[0]);
  return number * (/\b(?:million|m)\b/i.test(text) || /\dm\b/i.test(text) ? 1e6 : /\b(?:thousand|k)\b|\dk\b/i.test(text) ? 1000 : 1);
}

export function parseBudget(text: string): Budget {
  const range = text.match(new RegExp(`(?:between|from)\\s+(${money})\\s*(?:and|to|[-–])\\s*(${money})`, "i")) ??
    (/₦|\b(?:ngn|naira)\b|\d\s*(?:k|thousand|million)\b/i.test(text) ? text.match(new RegExp(`(${money})\\s*[-–]\\s*(${money})`, "i")) : null);
  if (range) return { min: Math.min(amount(range[1]), amount(range[2])), max: Math.max(amount(range[1]), amount(range[2])) };
  const lower = text.match(new RegExp(`(over|above|more than|at least|minimum|min)\\s*(${money})`, "i"));
  const upper = text.match(new RegExp(`(under|below|less than|up to|at most|maximum|max|budget(?: is| of)?|within)\\s*(${money})`, "i"));
  if (lower || upper) return {
    ...(lower ? { min: amount(lower[2]), strictMin: /^(over|above|more than)$/i.test(lower[1]) } : {}),
    ...(upper ? { max: amount(upper[2]), strictMax: /^(under|below|less than)$/i.test(upper[1]) } : {}),
  };
  if (/₦|\b(?:ngn|naira|budget)\b|\bn\s*\d|\b\d[\d,.]*\s*(?:k|thousand|million)\b/i.test(text)) {
    const amounts = [...text.matchAll(new RegExp(`\\b${money}`, "gi"))];
    if (amounts.length) return { max: amount(amounts[amounts.length - 1][0]) };
  }
  return {};
}

const stop = new Set(("i am we you your me my our us the a an and or some any something one ones this that these those they them it is are was be do does can could would will what which how much many for with without in on of at to from under below less than over above between around about budget price prices priced naira ngn cheap cheaper cheapest affordable lowest expensive cost costs available availability stock color colors colour colours type types detail details tell more another different instead within up no only not option options there all now today thanks thank size sizes limit maximum minimum max min good nice best great recommend recommended recommendation recommendations looking show find want need buy shop shopping product products item items have got offer please see give get also k m thousand million smart" ).split(" "));
for (const word of ["help", "choose", "browse", "sell", "selling", "purchase", "purchasing", "selection", "catalog", "catalogue", "pair", "pairs", "new", "out"]) stop.add(word);
const colors = ["black", "white", "red", "blue", "green", "pink", "purple", "yellow", "orange", "brown", "grey", "gray", "silver", "gold", "beige"];
function words(text: string): string[] {
  return (text.toLowerCase().replace(/smart\s*watches?/g, " watch ").match(/[a-z][a-z0-9]*/g) ?? []).map((word) => {
    if (/^(sneakers?|trainers?|shoes?|footwear)$/.test(word)) return "shoe";
    if (/^(watches|watch|smartwatch|smartwatches)$/.test(word)) return "watch";
    return word === "grey" ? "gray" : word;
  });
}
function updateSearch(previous: Search, message: string, catalog: CatalogProduct[]): Search {
  if (/\b(show|browse|see)\s+(?:me\s+)?(?:all|your)\s+(?:the\s+)?(?:products|items)\b/i.test(message)) {
    previous = { terms: [], colors: [], budget: {}, cheapest: false };
  }
  const allColors = [...colors, ...catalog.flatMap((product) => product.colors)].flatMap(words);
  const tokens = words(message.replace(new RegExp(`\\b${money}`, "gi"), " "));
  const selectedColors = [...new Set(tokens.filter((token) => allColors.includes(token)))];
  const terms = [...new Set(tokens.filter((token) => !stop.has(token) && !allColors.includes(token)))];
  const budget = parseBudget(message);
  return {
    terms: terms.length ? terms : previous.terms,
    colors: /\b(?:any|all) colou?rs?\b/i.test(message) ? [] : selectedColors.length ? selectedColors : previous.colors,
    budget: Object.keys(budget).length ? budget : previous.budget,
    cheapest: /\b(cheap|cheaper|cheapest|affordable|lowest)\b/i.test(message) || previous.cheapest,
  };
}
function matches(catalog: CatalogProduct[], search: Search): CatalogProduct[] {
  return catalog.filter((product) => {
    const tokens = words([product.name, product.description, ...product.types].join(" "));
    return search.terms.every((term) => tokens.some((token) => token === term || (term.length >= 4 && token.startsWith(term)))) &&
      search.colors.every((color) => words(product.colors.join(" ")).includes(color)) &&
      (search.budget.min === undefined || (search.budget.strictMin ? product.price > search.budget.min : product.price >= search.budget.min)) &&
      (search.budget.max === undefined || (search.budget.strictMax ? product.price < search.budget.max : product.price <= search.budget.max));
  }).sort((a, b) => Number(b.stock > 0) - Number(a.stock > 0) || (search.cheapest ? a.price - b.price : 0));
}

function naira(value: number): string { return `₦${value.toLocaleString("en-NG", { maximumFractionDigits: 2 })}`; }

function categoryTerms(product: CatalogProduct): string[] {
  const categories = new Set(["watch", "shoe", "headphone", "earphone", "earbud", "speaker", "phone", "laptop", "charger", "bag", "shirt", "dress"]);
  return [...new Set(words([product.name, ...product.types].join(" "))
    .map((word) => categories.has(word) ? word : word.replace(/s$/, "")).filter((word) => categories.has(word)))];
}

export function createShopReply(request: ChatRequest, catalog: CatalogProduct[]): ChatReply {
  const instant = getStoreReply(request.message);
  if (instant) return instant;
  let search: Search = { terms: [], colors: [], budget: {}, cheapest: false };
  for (const message of request.history ?? []) {
    if (message.role === "user" && !getStoreReply(message.content)) search = updateSearch(search, message.content, catalog);
  }
  const contextual = catalog.find((product) => product.id === request.productId);
  const cheaper = /\bcheaper\b/i.test(request.message);
  const contextualAnchor = contextual && !search.terms.length;
  const previous = contextualAnchor ? contextual : matches(catalog, search)[0];
  search = updateSearch(search, request.message, catalog);
  if (cheaper && contextualAnchor && !search.terms.length) search.terms = categoryTerms(contextual);
  const explicitBrowse = /\b(show|browse|see)\s+(?:me\s+)?(?:all|your)\s+(?:the\s+)?(?:products|items)\b/i.test(request.message);
  let candidates = matches(catalog, search);
  if (contextual && !cheaper && !search.terms.length && !Object.keys(search.budget).length && !explicitBrowse) {
    candidates = candidates.filter((product) => product.id === contextual.id);
  }
  if (cheaper && previous && (contextual || (request.history ?? []).some((message) => message.role === "user"))) {
    candidates = candidates.filter((product) => product.price < previous.price);
  }
  if (!candidates.length) {
    return answer("I couldn’t find a product matching those details and budget in the current catalog. Try another product name, colour or budget, or browse the store.");
  }
  const available = candidates.filter((product) => product.stock > 0);
  const selected = (available.length ? available : candidates).slice(0, 4);
  const products = selected.map(({ id, name, price, stock, colors, types, images }) => ({
    id, name, price, stock, colors, types, image: images[0] ?? null, href: `/product/${id}`,
  }));
  let reply = available.length ?
    `${search.cheapest ? "Here are the lowest-priced matching" : "Here are matching"} products from the current catalog. Open a product for its details and ordering options.` :
    "These matching products are currently marked out of stock. Please email the team to ask about availability.";
  if (selected.length === 1 || /\b(colou?rs?|types?|details?|description|stock|available|availability|how much)\b/i.test(request.message)) {
    const product = selected[0];
    reply = `${product.name} costs ${naira(product.price)} and is ${product.stock > 0 ? `currently listed with ${product.stock} available` : "currently marked out of stock"}.`;
    if (/\b(colou?rs?)\b/i.test(request.message)) reply += product.colors.length ? ` Listed colours: ${product.colors.join(", ")}.` : " No colours are listed for this product.";
    if (/\btypes?\b/i.test(request.message)) reply += product.types.length ? ` Listed types: ${product.types.join(", ")}.` : " No types are listed for this product.";
    if (/\b(details?|description|more)\b/i.test(request.message)) reply += product.description ? ` ${product.description.slice(0, 500)}` : " No description is listed for this product.";
    if (selected.length > 1) reply += " You can also compare the other matches below.";
  }
  return { reply: reply.slice(0, 1800), products, actions: available.length ? [browse] : [support, browse],
    suggestions: ["Show me something cheaper", "What colours are available?", "How do I order?"] };
}
