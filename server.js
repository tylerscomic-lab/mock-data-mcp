import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import { faker } from '@faker-js/faker';
import http from 'http';

const server = new McpServer({ name: 'mock-data', version: '1.0.0' });

const LocaleSchema = z.enum(['en', 'en_US', 'en_GB', 'de', 'fr', 'es', 'pt_BR', 'ja', 'zh_CN']).optional().default('en_US');

function getFaker(locale) {
  if (locale && locale !== 'en' && locale !== 'en_US') {
    try { return new faker.constructor({ locale: [locale, 'en'] }); } catch { return faker; }
  }
  return faker;
}

server.registerTool('generate_user', {
  description: 'Generate a realistic fake user with name, email, address, phone, avatar, job, and more.',
  inputSchema: z.object({
    count: z.number().int().min(1).max(100).optional().default(1).describe('Number of users to generate (1–100)'),
    locale: LocaleSchema.describe('Locale for names/addresses: en_US, en_GB, de, fr, es, pt_BR, ja, zh_CN'),
    include_password: z.boolean().optional().default(false).describe('Include a hashed password field'),
    include_credit_card: z.boolean().optional().default(false).describe('Include fake payment info'),
  }),
}, async ({ count, locale, include_password, include_credit_card }) => {
  const fk = getFaker(locale);
  const users = Array.from({ length: count }, () => {
    const sex = fk.person.sexType();
    const firstName = fk.person.firstName(sex);
    const lastName = fk.person.lastName();
    const user = {
      id: fk.string.uuid(),
      first_name: firstName,
      last_name: lastName,
      full_name: `${firstName} ${lastName}`,
      email: fk.internet.email({ firstName, lastName }).toLowerCase(),
      username: fk.internet.username({ firstName, lastName }).toLowerCase(),
      phone: fk.phone.number(),
      date_of_birth: fk.date.birthdate({ min: 18, max: 75, mode: 'age' }).toISOString().split('T')[0],
      gender: sex,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(firstName + lastName)}`,
      address: {
        street: fk.location.streetAddress(),
        city: fk.location.city(),
        state: fk.location.state(),
        zip: fk.location.zipCode(),
        country: fk.location.country(),
        latitude: fk.location.latitude(),
        longitude: fk.location.longitude(),
      },
      job: {
        title: fk.person.jobTitle(),
        company: fk.company.name(),
        department: fk.commerce.department(),
      },
      created_at: fk.date.past({ years: 3 }).toISOString(),
    };
    if (include_password) user.password_hash = fk.internet.password({ length: 16, memorable: false });
    if (include_credit_card) user.payment = {
      card_number: fk.finance.creditCardNumber(),
      card_type: fk.finance.creditCardIssuer(),
      expiry: fk.date.future({ years: 4 }).toLocaleDateString('en-US', { month: '2-digit', year: '2-digit' }).replace('/', '/'),
      cvv: fk.finance.creditCardCVV(),
    };
    return user;
  });
  const result = count === 1 ? users[0] : users;
  return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
});

server.registerTool('generate_company', {
  description: 'Generate fake company data including name, industry, address, contacts, and financials.',
  inputSchema: z.object({
    count: z.number().int().min(1).max(50).optional().default(1).describe('Number of companies to generate'),
  }),
}, async ({ count }) => {
  const companies = Array.from({ length: count }, () => ({
    id: faker.string.uuid(),
    name: faker.company.name(),
    tagline: faker.company.catchPhrase(),
    industry: faker.commerce.department(),
    email: faker.internet.email({ firstName: faker.company.name().split(' ')[0] }).toLowerCase(),
    phone: faker.phone.number(),
    website: `https://www.${faker.internet.domainName()}`,
    founded: faker.date.past({ years: 30 }).getFullYear(),
    employees: faker.number.int({ min: 2, max: 50000 }),
    revenue: `$${faker.finance.amount({ min: 100000, max: 100000000, dec: 0 })}`,
    address: {
      street: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state(),
      zip: faker.location.zipCode(),
      country: faker.location.country(),
    },
    ceo: faker.person.fullName(),
    ticker: faker.string.alpha({ length: { min: 3, max: 5 }, casing: 'upper' }),
  }));
  const result = count === 1 ? companies[0] : companies;
  return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
});

server.registerTool('generate_product', {
  description: 'Generate fake e-commerce products with name, price, SKU, description, categories, and inventory.',
  inputSchema: z.object({
    count: z.number().int().min(1).max(100).optional().default(1).describe('Number of products to generate'),
    category: z.string().optional().describe('Force a specific category (e.g. Electronics, Clothing)'),
  }),
}, async ({ count, category }) => {
  const products = Array.from({ length: count }, () => {
    const dept = category || faker.commerce.department();
    const name = faker.commerce.productName();
    const price = parseFloat(faker.commerce.price({ min: 4.99, max: 999.99 }));
    return {
      id: faker.string.uuid(),
      sku: faker.string.alphanumeric({ length: 8, casing: 'upper' }),
      name,
      description: faker.commerce.productDescription(),
      category: dept,
      price,
      sale_price: faker.datatype.boolean(0.3) ? parseFloat((price * faker.number.float({ min: 0.6, max: 0.9 })).toFixed(2)) : null,
      currency: 'USD',
      stock: faker.number.int({ min: 0, max: 500 }),
      rating: parseFloat(faker.number.float({ min: 1, max: 5, fractionDigits: 1 }).toFixed(1)),
      review_count: faker.number.int({ min: 0, max: 2000 }),
      tags: Array.from({ length: faker.number.int({ min: 2, max: 5 }) }, () => faker.commerce.productAdjective().toLowerCase()),
      image: `https://picsum.photos/seed/${faker.string.alphanumeric(8)}/400/400`,
      weight_kg: parseFloat(faker.number.float({ min: 0.1, max: 20, fractionDigits: 2 }).toFixed(2)),
      created_at: faker.date.past({ years: 2 }).toISOString(),
    };
  });
  const result = count === 1 ? products[0] : products;
  return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
});

server.registerTool('generate_post', {
  description: 'Generate fake blog posts, comments, or social media content for CMS and feed testing.',
  inputSchema: z.object({
    count: z.number().int().min(1).max(50).optional().default(1).describe('Number of posts to generate'),
    type: z.enum(['blog', 'comment', 'tweet', 'review']).optional().default('blog').describe('Type of content'),
    include_author: z.boolean().optional().default(true).describe('Include embedded author object'),
  }),
}, async ({ count, type, include_author }) => {
  const posts = Array.from({ length: count }, () => {
    const author = include_author ? {
      id: faker.string.uuid(),
      name: faker.person.fullName(),
      username: faker.internet.username().toLowerCase(),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${faker.string.alphanumeric(8)}`,
    } : undefined;

    if (type === 'blog') {
      const title = faker.lorem.sentence({ min: 4, max: 10 }).replace(/\.$/, '');
      return {
        id: faker.string.uuid(),
        title,
        slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        excerpt: faker.lorem.sentences(2),
        body: Array.from({ length: faker.number.int({ min: 3, max: 6 }) }, () => faker.lorem.paragraph()).join('\n\n'),
        tags: Array.from({ length: faker.number.int({ min: 1, max: 4 }) }, () => faker.word.noun()),
        category: faker.helpers.arrayElement(['Tech', 'Business', 'Health', 'Travel', 'Food', 'Science', 'Culture']),
        cover_image: `https://picsum.photos/seed/${faker.string.alphanumeric(8)}/1200/630`,
        author,
        published_at: faker.date.past({ years: 2 }).toISOString(),
        read_time_minutes: faker.number.int({ min: 2, max: 15 }),
        likes: faker.number.int({ min: 0, max: 5000 }),
        comments: faker.number.int({ min: 0, max: 200 }),
      };
    }
    if (type === 'comment') {
      return { id: faker.string.uuid(), body: faker.lorem.sentences(faker.number.int({ min: 1, max: 3 })), author, likes: faker.number.int({ min: 0, max: 100 }), created_at: faker.date.recent({ days: 90 }).toISOString() };
    }
    if (type === 'tweet') {
      return { id: faker.string.uuid(), text: faker.lorem.sentence({ min: 5, max: 20 }).slice(0, 280), author, likes: faker.number.int({ min: 0, max: 50000 }), retweets: faker.number.int({ min: 0, max: 10000 }), created_at: faker.date.recent({ days: 30 }).toISOString() };
    }
    return { id: faker.string.uuid(), title: faker.commerce.productName(), rating: faker.number.int({ min: 1, max: 5 }), body: faker.lorem.sentences(3), author, helpful_votes: faker.number.int({ min: 0, max: 200 }), verified_purchase: faker.datatype.boolean(0.7), created_at: faker.date.past({ years: 1 }).toISOString() };
  });
  const result = count === 1 ? posts[0] : posts;
  return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
});

server.registerTool('generate_dataset', {
  description: 'Generate a complete relational dataset: users, their orders, and order items — ready to seed a database.',
  inputSchema: z.object({
    user_count: z.number().int().min(1).max(50).optional().default(5).describe('Number of users'),
    orders_per_user: z.number().int().min(0).max(20).optional().default(3).describe('Average orders per user'),
  }),
}, async ({ user_count, orders_per_user }) => {
  const users = Array.from({ length: user_count }, () => ({
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    email: faker.internet.email().toLowerCase(),
    created_at: faker.date.past({ years: 2 }).toISOString(),
  }));

  const orders = users.flatMap(u =>
    Array.from({ length: faker.number.int({ min: 0, max: orders_per_user * 2 }) }, () => ({
      id: faker.string.uuid(),
      user_id: u.id,
      status: faker.helpers.arrayElement(['pending', 'processing', 'shipped', 'delivered', 'cancelled']),
      total: parseFloat(faker.commerce.price({ min: 10, max: 500 })),
      currency: 'USD',
      created_at: faker.date.past({ years: 1 }).toISOString(),
    }))
  );

  const order_items = orders.flatMap(o =>
    Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => ({
      id: faker.string.uuid(),
      order_id: o.id,
      product_name: faker.commerce.productName(),
      sku: faker.string.alphanumeric({ length: 8, casing: 'upper' }),
      quantity: faker.number.int({ min: 1, max: 5 }),
      unit_price: parseFloat(faker.commerce.price({ min: 5, max: 200 })),
    }))
  );

  return { content: [{ type: 'text', text: JSON.stringify({ users, orders, order_items, _meta: { users: users.length, orders: orders.length, order_items: order_items.length } }, null, 2) }] };
});

server.registerTool('generate_misc', {
  description: 'Generate miscellaneous test data: UUIDs, passwords, lorem ipsum, color palettes, or payment cards.',
  inputSchema: z.object({
    type: z.enum(['uuid', 'password', 'lorem', 'colors', 'credit_card', 'ip_address', 'url', 'jwt_token']).describe('What to generate'),
    count: z.number().int().min(1).max(100).optional().default(1),
    options: z.object({
      length: z.number().optional().describe('For password: length (default 16)'),
      memorable: z.boolean().optional().describe('For password: use memorable words'),
      paragraphs: z.number().optional().describe('For lorem: number of paragraphs'),
      palette_size: z.number().optional().describe('For colors: number of colors (default 5)'),
    }).optional().default({}),
  }),
}, async ({ type, count, options }) => {
  const results = Array.from({ length: count }, () => {
    switch (type) {
      case 'uuid': return faker.string.uuid();
      case 'password': return faker.internet.password({ length: options.length || 16, memorable: options.memorable || false });
      case 'lorem': return Array.from({ length: options.paragraphs || 1 }, () => faker.lorem.paragraph()).join('\n\n');
      case 'colors': return Array.from({ length: options.palette_size || 5 }, () => ({ hex: faker.color.rgb({ format: 'hex' }), name: faker.color.human() }));
      case 'credit_card': return { number: faker.finance.creditCardNumber(), type: faker.finance.creditCardIssuer(), cvv: faker.finance.creditCardCVV(), expiry: `${String(faker.number.int({ min: 1, max: 12 })).padStart(2, '0')}/${faker.number.int({ min: 25, max: 30 })}` };
      case 'ip_address': return { ipv4: faker.internet.ipv4(), ipv6: faker.internet.ipv6() };
      case 'url': return faker.internet.url();
      case 'jwt_token': return `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${Buffer.from(JSON.stringify({ sub: faker.string.uuid(), name: faker.person.fullName(), iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url')}.${faker.string.alphanumeric(43)}`;
      default: return null;
    }
  });
  const result = count === 1 ? results[0] : results;
  return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
});

const PORT = process.env.PORT || 8080;
const httpServer = http.createServer(async (req, res) => {
  if (req.url === '/health') { res.writeHead(200); res.end('ok'); return; }
  if (req.url === '/' || req.url?.startsWith('/mcp')) {
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    res.on('close', () => transport.close());
    await server.connect(transport);
    await transport.handleRequest(req, res);
    return;
  }
  res.writeHead(404); res.end();
});

httpServer.listen(PORT, () => console.log(`Mock Data MCP running on port ${PORT}`));
